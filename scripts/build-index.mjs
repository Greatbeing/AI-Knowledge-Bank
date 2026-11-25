#!/usr/bin/env node
/**
 * build-index.mjs — 从 GitHub 自动生成 Greatbeing 作品集目录（零手写条目）
 *
 * 规则：这里不写任何一句介绍。每个仓库一行，字段全部取自 GitHub API 与仓库已有文件：
 *   讲什么   ← 仓库 description，缺则取 README 第一段
 *   怎么用   ← README 里对应小节原文（付费项目优先取「托管 / 付费」小节，其余取「安装 / 快速开始 / Usage」）
 *   凭什么信 ← 有没有 tests 目录、有没有 eval 结果文件及其是否已填、最近一次 CI 结论
 * 分组与标签也是规则判定，不是人工评级：
 *   分组：awesome-* / plugins → 清单；60 天内有推送 → 在更新；否则 → 早期
 *   标签：README 有明确收费信号 → 可付费使用；仓库含 SKILL.md → 可安装 skill；否则 → 开源
 *
 * 用法：
 *   node scripts/build-index.mjs              全量：GitHub API + README
 *   node scripts/build-index.mjs --readme     只重读 README 并重算「讲什么 / 怎么用 / 标签」，不调 GitHub API
 * 环境：GITHUB_TOKEN 可选（GitHub Actions 里自动提供，可避开匿名限流 60 次/小时）
 * 产出：data/portfolio_index.json、llms.txt
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const OWNER = 'Greatbeing';
const ACTIVE_DAYS = 60;
const RETRIES = 4;
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const outPath = join(repoRoot, 'data', 'portfolio_index.json');
const token = process.env.GITHUB_TOKEN;
const headers = { 'user-agent': 'akb-portfolio-index', accept: 'application/vnd.github+json' };
if (token) headers.authorization = `Bearer ${token}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// 代理或弱网下 TLS 握手会偶发断开，失败就退避重试；仍失败则返回 null，由调用方记为「未知」。
async function withRetry(fn) {
  let lastErr;
  for (let i = 0; i < RETRIES; i += 1) {
    try { return await fn(); } catch (err) { lastErr = err; await sleep(600 * (i + 1)); }
  }
  console.error(`giving up: ${lastErr?.message}`);
  return null;
}
let apiCalls = 0;
async function api(path) {
  apiCalls += 1;
  return withRetry(async () => {
    const res = await fetch(`https://api.github.com${path}`, { headers });
    if (res.status === 403 || res.status === 429) return { __rate: true };
    if (!res.ok) return { __error: res.status };
    return res.json();
  });
}
async function raw(repo, branch, path) {
  const url = `https://raw.githubusercontent.com/${OWNER}/${repo}/${branch}/${path}`;
  return withRetry(async () => {
    const res = await fetch(url, { headers: { 'user-agent': 'akb-portfolio-index' } });
    return res.ok ? res.text() : null;
  });
}

// ---------- 纯规则：输入 README 文本，输出条目里的文字字段 ----------

function pickWhat(desc, readme) {
  if (desc && desc.trim()) return desc.trim();
  if (!readme) return '';
  for (const line of readme.split('\n').map((s) => s.trim()).slice(0, 40)) {
    if (line && !/^#|<|!|\|/.test(line)) return line.replace(/\*+/g, '').slice(0, 200);
  }
  return '';
}

const USE_HEADING = /安装|install|快速开始|quick ?start|使用方法|usage|getting started|开始使用|how to (use|run|start)/i;
const PAID_HEADING = /hosted|paid|付费|托管|pricing|x402|price/i;
const PAID_SIGNAL = /x402|按次计费|usdc|付费使用/;

// README 摘录要当纯文本显示，这里把常见 Markdown 标记抹平；链接保留网址，因为付费端点本身就是网址。
function plainMarkdown(src) {
  return src
    .replace(/<[^>]+>/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1（$2）')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/\*{1,3}([^*\n]+)\*{1,3}/g, '$1')
    .replace(/<br\s*\/?>/gi, '\n');
}

function pickUse(readme, preferPaid) {
  if (!readme) return null;
  const lines = readme.split('\n');
  const find = (re) => {
    for (let i = 0; i < lines.length; i += 1) {
      const m = lines[i].match(/^(#{1,4})\s+(.+)$/);
      if (m && re.test(m[2])) return { start: i, level: m[1].length, title: m[2].trim() };
    }
    return null;
  };
  let hit = preferPaid ? find(PAID_HEADING) : null;
  if (!hit) hit = find(USE_HEADING);
  if (!hit) return null;

  const out = [];
  for (let i = hit.start + 1; i < lines.length && out.join('\n').length < 1400; i += 1) {
    const m = lines[i].match(/^(#{1,4})\s+(.+)$/);
    if (m && m[1].length <= hit.level) break;
    out.push(lines[i]);
  }
  // 截断若落在代码块中间，继续读到收尾的 ``` 为止，免得代码块残缺取不出来。
  if ((out.join('\n').match(/^```/gm) || []).length % 2 === 1) {
    for (let i = hit.start + 1 + out.length; i < Math.min(lines.length, hit.start + 1 + out.length + 120); i += 1) {
      out.push(lines[i]);
      if (/^```/.test(lines[i])) break;
    }
  }
  const body = out.join('\n');
  let text = body.replace(/```[\s\S]*?```/g, '').replace(/```[\s\S]*$/, '').replace(/^\|.*$/gm, '');
  text = plainMarkdown(text).replace(/([^\n])\n(?!\s*[-*+]\s|\s*\d+[.、)]\s|\s*\n)/g, '$1 ').replace(/\n{2,}/g, '\n').trim();
  // 说明文字按整行截到 500 字以内，不在一句话中间断开。
  if (text.length > 500) {
    const cut = text.lastIndexOf('\n', 500);
    text = (cut > 200 ? text.slice(0, cut) : text.slice(0, 500)) + '\n…完整说明见仓库 README';
  }
  const code = body.match(/```[\w-]*\n([\s\S]*?)```/);
  let snippet = code ? code[1].trim() : '';
  if (snippet) {
    // 按整行截断，最多 10 行、600 字，不在一条命令中间断开。
    const full = snippet;
    const rows = snippet.split('\n').slice(0, 10);
    snippet = rows.join('\n');
    while (snippet.length > 600 && rows.length > 1) { rows.pop(); snippet = rows.join('\n'); }
    if (snippet.length < full.length) snippet += '\n# …完整步骤见仓库 README';
  }
  return { heading: hit.title, text, code: snippet };
}

function deriveFromReadme(entry, readme) {
  const isPaid = PAID_SIGNAL.test(readme || '');
  const tags = [];
  if (isPaid) tags.push('paid');
  if (entry.tags.includes('skill')) tags.push('skill');
  if (tags.length === 0) tags.push('open');
  entry.tags = tags;
  entry.what = pickWhat(entry.__desc ?? entry.what, readme) || entry.what;
  entry.use = pickUse(readme, isPaid);
  return entry;
}

function toText(out) {
  const lines = ['# Greatbeing: portfolio index', '', `> Generated ${out.generatedAt} from the GitHub API. No hand-written entries.`, ''];
  for (const e of out.repos) {
    const ev = e.evidence;
    lines.push(`## ${e.name}`, e.what || '(no description)', `URL: ${e.url}`, `Tags: ${e.tags.join(', ')}`, `Last push: ${e.pushed_at.slice(0, 10)}`,
      `Evidence: ${ev.tests ? `${ev.tests} test files` : 'no test files'}, ${ev.eval ? `eval results ${ev.eval.ran}` : 'no eval results file'}, last CI ${ev.ci}`);
    if (e.use) {
      lines.push(`How to get it (${e.use.heading}): ${e.use.text.slice(0, 300)}`);
      if (e.use.code) lines.push('```', e.use.code, '```');
    }
    lines.push('');
  }
  return lines.join('\n') + '\n';
}

// ---------- 两条路径 ----------

const readmeOnly = process.argv.includes('--readme');
let out;

if (readmeOnly) {
  out = JSON.parse(readFileSync(outPath, 'utf8'));
  let missed = 0;
  for (const entry of out.repos) {
    // 全量路径会把默认分支记在 __branch；旧数据没有这个字段时依次试 main、master。
    let readme = null;
    for (const branch of [...new Set([entry.__branch, 'main', 'master'].filter(Boolean))]) {
      readme = await raw(entry.name, branch, 'README.md');
      if (readme != null) break;
    }
    if (readme == null) { missed += 1; console.error(`README 未取到，保留原字段: ${entry.name}`); continue; }
    deriveFromReadme(entry, readme);
  }
  out.readme_refreshed_at = new Date().toISOString();
  console.log(`readme refresh: ${out.repos.length - missed}/${out.repos.length}`);
} else {
  const repos = await api(`/users/${OWNER}/repos?per_page=100&sort=pushed`);
  if (!Array.isArray(repos)) { console.error('取仓库列表失败', JSON.stringify(repos).slice(0, 200)); process.exit(1); }
  const own = repos.filter((r) => !r.fork);
  const entries = [];
  const now = Date.now();

  for (const r of own) {
    const branch = r.default_branch || 'main';
    const tree = await api(`/repos/${OWNER}/${r.name}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
    const paths = Array.isArray(tree?.tree) ? tree.tree.filter((t) => t.type === 'blob').map((t) => t.path) : [];
    const readme = await raw(r.name, branch, 'README.md');
    const runs = await api(`/repos/${OWNER}/${r.name}/actions/runs?branch=${encodeURIComponent(branch)}&per_page=1`);
    const lastRun = Array.isArray(runs?.workflow_runs) && runs.workflow_runs[0] ? runs.workflow_runs[0] : null;

    const testPaths = paths.filter((p) => /(^|\/)(tests?|__tests__|spec)(\/|$)/.test(p) || /\.test\.[jt]sx?$/.test(p));
    let evalInfo = null;
    const evalFile = paths.find((p) => /(^|\/)eval\/RESULTS?\.md$/i.test(p));
    if (evalFile) {
      const txt = await raw(r.name, branch, evalFile);
      const tbd = (txt?.match(/TBD/g) || []).length;
      evalInfo = { path: evalFile, url: `https://github.com/${OWNER}/${r.name}/blob/${branch}/${evalFile}`, ran: txt == null ? 'unknown' : (tbd >= 3 ? 'unfilled' : 'filled') };
    }

    const ageDays = Math.round((now - new Date(r.pushed_at).getTime()) / 86400000);
    const entry = {
      slug: r.name.toLowerCase(), name: r.name, url: r.html_url, homepage: r.homepage || '',
      group: /^(awesome-|plugins$)/.test(r.name) ? 'list' : (ageDays <= ACTIVE_DAYS ? 'active' : 'early'),
      tags: paths.some((p) => /(^|\/)SKILL\.md$/i.test(p)) ? ['skill'] : ['open'],
      what: '', use: null,
      evidence: { tests: testPaths.length, eval: evalInfo, ci: lastRun ? (lastRun.conclusion || 'unknown') : 'none', ci_url: lastRun ? lastRun.html_url : '', tree_ok: paths.length > 0 },
      stars: r.stargazers_count, pushed_at: r.pushed_at, created_at: r.created_at,
      __branch: branch, __desc: r.description || ''
    };
    entries.push(deriveFromReadme(entry, readme));
  }

  const order = { active: 0, list: 1, early: 2 };
  entries.sort((a, b) => order[a.group] - order[b.group] || b.stars - a.stars || (a.pushed_at < b.pushed_at ? 1 : -1));
  for (const e of entries) delete e.__desc;
  out = { generatedAt: new Date().toISOString(), owner: OWNER, api_calls: apiCalls, repos: entries };
}

mkdirSync(join(repoRoot, 'data'), { recursive: true });
writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
writeFileSync(join(repoRoot, 'llms.txt'), toText(out), 'utf8');

// 生成自包含的入口页：把数据内联进 HTML，任何静态托管（Cloudflare / GitHub Pages / 双击本地文件）都能直接打开，
// 不再依赖运行时去取 data/*.json，也就不必让打包流程额外搬运数据文件。
const tplPath = join(repoRoot, 'scripts', 'portfolio.template.html');
let config = { title: 'Greatbeing 做的东西', tagline: '', contact: '' };
try { config = { ...config, ...JSON.parse(readFileSync(join(repoRoot, 'data', 'portfolio.config.json'), 'utf8')) }; } catch { /* 没有配置文件时用默认标题 */ }
const payload = JSON.stringify({ config, data: { generatedAt: out.generatedAt, repos: out.repos } }).replace(/</g, '\\u003c');
const tpl = readFileSync(tplPath, 'utf8');
writeFileSync(join(repoRoot, 'portfolio.html'), tpl.replace('<!--INJECT_PF_DATA-->', `<script>window.__PF__=${payload};</script>`), 'utf8');

const tally = (key) => out.repos.reduce((m, e) => ((m[key(e)] = (m[key(e)] || 0) + 1), m), {});
console.log(`repos ${out.repos.length}; api calls ${apiCalls}`);
console.log('groups', JSON.stringify(tally((e) => e.group)), 'tags', JSON.stringify(tally((e) => e.tags.join('+'))));
console.log('ci', JSON.stringify(tally((e) => e.evidence.ci)), 'use missing', out.repos.filter((e) => !e.use).map((e) => e.name).join(', ') || 'none');
