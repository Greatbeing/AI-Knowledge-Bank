#!/usr/bin/env node
/**
 * local-server.mjs — 零依赖本地预览（AI Knowledge Bank P0 切片）
 *
 * 目的：在「没有 Supabase、也不 npm install」的情况下，用真实种子库把站点跑起来，
 *      证明「杀掉 demo、用真实内容运行」可行。生产环境仍走 functions/api/[[path]].js。
 *
 * 提供：
 *   GET /api/health            → 健康状态（source=seed）
 *   GET /api/vaults?locale=    → 三库真实节点 + 真实计数（source=seed）
 *   GET /api/search?q=&limit=  → 在三库中检索（返回 knowledge/tools/cases 分组）
 *   GET /*                     → 静态文件（index.html、assets、其他 html）
 *
 * 用法：node scripts/local-server.mjs   （默认 http://127.0.0.1:4318）
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, extname, normalize } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const nodes = JSON.parse(readFileSync(join(repoRoot, 'data', 'seed_nodes.json'), 'utf8'));
const PORT = process.env.PORT ? Number(process.env.PORT) : 4318;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json'
};

function decorate(n) {
  // 种子条目没有经过任何评测，不给分。null 表示「未评测」，前端应如实显示而不是补一个默认数字。
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  return {
    id: n.id, vault_type: n.vault_type, title: n.title, summary: n.summary,
    recommendation_reason: n.recommendation_reason || '',
    trust_score: num(n.trust_score), emergence_level: num(n.emergence_level),
    confidence: num(n.confidence),
    evidence: n.evidence || null,
    source_refs: n.source_refs || [], scenario_tags: n.scenario_tags || [],
    language: n.language || 'zh',
    validation_count: n.validation_count ?? 0, fork_count: 0, merge_count: 0,
    created_at: n.created_at || new Date().toISOString()
  };
}

function vaultPayload(locale = 'zh') {
  const buckets = { knowledge: [], tools: [], cases: [] };
  const key = { knowledge: 'knowledge', tool: 'tools', case: 'cases' };
  for (const n of nodes) buckets[key[n.vault_type]].push(decorate(n));
  return {
    ok: true, source: 'seed', locale,
    vaults: buckets,
    stats: { knowledge: buckets.knowledge.length, tools: buckets.tools.length, cases: buckets.cases.length, total: nodes.length },
    seed: { path: 'data/seed_nodes.json', note: '本地真实种子库（非 Supabase，非 demo）' },
    generatedAt: new Date().toISOString()
  };
}

function searchPayload(q, locale = 'zh', limit = 6) {
  const query = (q || '').toLowerCase().trim();
  const hit = (n) => {
    if (!query) return true;
    const hay = [n.title, n.summary, n.recommendation_reason, ...(n.scenario_tags || []), ...(n.source_refs || [])].join(' ').toLowerCase();
    return hay.includes(query);
  };
  const groups = { knowledge: [], tools: [], cases: [] };
  const key = { knowledge: 'knowledge', tool: 'tools', case: 'cases' };
  for (const n of nodes) if (hit(n)) groups[key[n.vault_type]].push(decorate(n));
  for (const k of Object.keys(groups)) groups[k] = groups[k].slice(0, limit);
  return { ok: true, source: 'seed', query: q || '', locale, ...groups, generatedAt: new Date().toISOString() };
}

function json(res, obj, code = 200) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(body);
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  if (url.pathname === '/api/health') {
    return json(res, { ok: true, service: 'AI Knowledge Bank API (local seed)', source: 'seed',
      supabase: { configured: false, reachable: false, note: '本地预览不依赖 Supabase' },
      seed: { nodes: nodes.length } });
  }
  if (url.pathname === '/api/vaults') return json(res, vaultPayload(url.searchParams.get('locale') || 'zh'));
  if (url.pathname.startsWith('/api/vaults/')) {
    const id = decodeURIComponent(url.pathname.slice('/api/vaults/'.length));
    const n = nodes.find((x) => x.id === id);
    return n ? json(res, { ok: true, source: 'seed', node: decorate(n) }) : json(res, { ok: false, error: 'not found' }, 404);
  }
  if (url.pathname === '/api/search') {
    return json(res, searchPayload(url.searchParams.get('q'), url.searchParams.get('locale') || 'zh', Number(url.searchParams.get('limit') || 6)));
  }
  // 静态文件
  let rel = decodeURIComponent(url.pathname);
  // 根路径直接给作品集入口页（与线上 _redirects 的行为一致）；旧首页仍在 /index.html。
  if (rel === '/' || rel === '') rel = '/portfolio.html';
  const filePath = normalize(join(repoRoot, rel));
  if (!filePath.startsWith(repoRoot)) { res.writeHead(403); return res.end('forbidden'); }
  if (existsSync(filePath) && statSync(filePath).isFile()) {
    res.writeHead(200, { 'content-type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream' });
    return res.end(readFileSync(filePath));
  }
  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('404 ' + rel);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[seed] AI Knowledge Bank local server → http://127.0.0.1:${PORT}`);
  console.log(`[seed] ${nodes.length} 条出处样例（仅证明出处文件存在，内容未验证，无分数）`);
});
