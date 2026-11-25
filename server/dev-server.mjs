#!/usr/bin/env node
/**
 * dev-server.mjs — AI Knowledge Bank 本地轻量数据服务（零依赖）
 *
 * 目的：不依赖 Supabase/云账号，先把「三库 + 读写 API」真正跑起来，验证产品可用。
 * 数据落在 data/db.json；接口契约与 functions/api/[[path]].js 对齐，前端无需大改即可接。
 * 生产可把 store 换成 Supabase/D1，接口层不变。
 *
 * 用法：node server/dev-server.mjs   （默认 http://127.0.0.1:4319）
 * 环境：PORT 可改端口。
 */
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, extname, normalize } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const dbPath = join(root, 'data', 'db.json');
const PORT = process.env.PORT ? Number(process.env.PORT) : 4319;
const VAULT_KEY = { knowledge: 'knowledge', tool: 'tools', case: 'cases' };
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };

const load = () => JSON.parse(readFileSync(dbPath, 'utf8'));
const save = (db) => writeFileSync(dbPath, JSON.stringify(db, null, 2) + '\n', 'utf8');
const uid = (p) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

function counts(db, id) {
  const sig = db.signals.filter((s) => s.node_id === id);
  const n = (t) => sig.filter((s) => s.type === t).length;
  return { validated: n('validated'), used: n('used'), forked: n('forked'), disputed: n('disputed') };
}
function decorate(db, n) {
  const c = counts(db, n.id);
  const conf = Math.max(40, Math.min(96, 55 + c.validated * 8 + c.used * 3 - c.disputed * 10));
  return {
    id: n.id, vault_type: n.vault_type, title: n.title, summary: n.summary,
    recommendation_reason: n.recommendation_reason || '',
    trust_score: conf / 100, emergence_level: Math.min(0.95, c.validated / 6), confidence: conf,
    source_refs: n.source_refs || [], scenario_tags: n.scenario_tags || [], language: n.language || 'zh',
    validation_count: c.validated, fork_count: c.forked, merge_count: 0,
    status: n.status || 'validated', created_at: n.created_at, updated_at: n.updated_at || n.created_at
  };
}
function vaultPayload(db, locale) {
  const b = { knowledge: [], tools: [], cases: [] };
  for (const n of db.nodes) if (n.status !== 'draft' && n.status !== 'rejected') b[VAULT_KEY[n.vault_type]].push(decorate(db, n));
  return { ok: true, source: 'local', locale, vaults: b, stats: { knowledge: b.knowledge.length, tools: b.tools.length, cases: b.cases.length, total: db.nodes.length }, generatedAt: new Date().toISOString() };
}
function searchPayload(db, q, locale, limit) {
  const query = (q || '').toLowerCase().trim();
  const hit = (n) => !query || [n.title, n.summary, n.recommendation_reason, ...(n.scenario_tags || []), ...(n.source_refs || [])].join(' ').toLowerCase().includes(query);
  const b = { knowledge: [], tools: [], cases: [] };
  for (const n of db.nodes) if (n.status !== 'draft' && n.status !== 'rejected' && hit(n)) b[VAULT_KEY[n.vault_type]].push(decorate(db, n));
  for (const k of Object.keys(b)) b[k] = b[k].slice(0, limit);
  return { ok: true, source: 'local', query: q || '', locale, ...b, generatedAt: new Date().toISOString() };
}
const json = (res, obj, code = 200) => { res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(obj)); };
function readBody(req) { return new Promise((r) => { let d = ''; req.on('data', (c) => (d += c)); req.on('end', () => { try { r(d ? JSON.parse(d) : {}); } catch { r({}); } }); }); }

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const p = url.pathname;
  const db = load();

  if (p === '/api/health') {
    const valid = db.nodes.filter((n) => n.status === 'validated').length;
    return json(res, { ok: true, service: 'AI Knowledge Bank (local store)', source: 'local', version: 'local-store-1',
      supabase: { configured: false, reachable: false }, local: { reachable: true, nodes: db.nodes.length, validated: valid, signals: db.signals.length }, generatedAt: new Date().toISOString() });
  }
  if (p === '/api/public-config') return json(res, { ok: true, supabase: null, mode: 'local' });
  if (p === '/api/vaults') return json(res, vaultPayload(db, url.searchParams.get('locale') || 'zh'));
  if (p.startsWith('/api/vaults/')) {
    const id = decodeURIComponent(p.slice('/api/vaults/'.length));
    const n = db.nodes.find((x) => x.id === id);
    return n ? json(res, { ok: true, source: 'local', node: decorate(db, n) }) : json(res, { ok: false, error: 'not found' }, 404);
  }
  if (p === '/api/search') return json(res, searchPayload(db, url.searchParams.get('q'), url.searchParams.get('locale') || 'zh', Number(url.searchParams.get('limit') || 6)));
  if (p === '/api/leaderboard') {
    const by = {};
    for (const s of db.signals) { by[s.actor || 'seed'] = (by[s.actor || 'seed'] || 0) + 1; }
    return json(res, { ok: true, source: 'local', leaderboard: Object.entries(by).map(([actor, n]) => ({ actor, contributions: n })).sort((a, b) => b.contributions - a.contributions) });
  }

  // 写入：记录社区信号（validated / used / forked / disputed）
  if (p === '/api/community-signals' && req.method === 'POST') {
    const body = await readBody(req);
    const node = db.nodes.find((x) => x.id === body.nodeId);
    if (!node) return json(res, { ok: false, error: 'node not found' }, 404);
    const type = body.signalType || body.type || 'validated';
    if (!['validated', 'used', 'forked', 'disputed'].includes(type)) return json(res, { ok: false, error: 'bad signalType' }, 400);
    const sig = { id: uid('sig'), node_id: node.id, type, actor: body.actor || 'anonymous', at: new Date().toISOString() };
    db.signals.push(sig); save(db);
    return json(res, { ok: true, source: 'local', recorded: true, signal: sig, node: decorate(db, node) });
  }
  // 写入：提交新知识节点（进入 pending 审核）
  if (p === '/api/nodes' && req.method === 'POST') {
    const b = await readBody(req);
    if (!b.title || !b.summary || !['knowledge', 'tool', 'case'].includes(b.vault_type)) return json(res, { ok: false, error: 'title/summary/vault_type required' }, 400);
    const now = new Date().toISOString();
    const node = { id: uid(b.vault_type), vault_type: b.vault_type, title: String(b.title).slice(0, 160), summary: String(b.summary).slice(0, 1200), recommendation_reason: b.recommendation_reason || '', source_refs: b.source_refs || [], scenario_tags: b.scenario_tags || [], language: b.language || 'zh', status: 'pending', created_at: now, updated_at: now };
    db.nodes.push(node); save(db);
    return json(res, { ok: true, source: 'local', node: decorate(db, node) });
  }
  // 写入：审核节点（approve → validated / reject）
  if (/^\/api\/nodes\/[^/]+\/validate$/.test(p) && req.method === 'POST') {
    const id = decodeURIComponent(p.split('/')[3]);
    const b = await readBody(req);
    const node = db.nodes.find((x) => x.id === id);
    if (!node) return json(res, { ok: false, error: 'node not found' }, 404);
    if (b.decision === 'reject') { node.status = 'rejected'; }
    else { node.status = 'validated'; db.signals.push({ id: uid('sig'), node_id: id, type: 'validated', actor: b.actor || 'reviewer', at: new Date().toISOString() }); }
    node.updated_at = new Date().toISOString(); save(db);
    return json(res, { ok: true, source: 'local', node: decorate(db, node) });
  }

  // 静态文件
  let rel = decodeURIComponent(p);
  if (rel === '/' || rel === '') rel = '/index.html';
  const filePath = normalize(join(root, rel));
  if (!filePath.startsWith(root)) { res.writeHead(403); return res.end('forbidden'); }
  if (existsSync(filePath) && statSync(filePath).isFile()) {
    res.writeHead(200, { 'content-type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream' });
    return res.end(readFileSync(filePath));
  }
  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); res.end('404 ' + rel);
});
server.listen(PORT, '127.0.0.1', () => console.log(`[akb] local data server → http://127.0.0.1:${PORT}  （db: data/db.json）`));
