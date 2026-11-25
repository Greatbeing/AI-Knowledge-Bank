#!/usr/bin/env node
/**
 * validate_seed.mjs — 种子库「出处存在性」校验器（AI Knowledge Bank）
 *
 * 它只做一件事，别把它当成更多：
 *  - 每条节点必须有非空 source_refs；
 *  - 每个 source_ref 必须能在工作区里找到对应文件（工作区根 = 本仓库上一级）；
 *  - vault_type 必须是 knowledge | tool | case，且 title/summary 非空；
 *  - 不允许手填 trust_score / emergence_level / confidence（没有评测就没有分数）。
 * 「文件存在」不等于「主张为真」。本脚本不验证内容正确性，也不产生任何可信度分数。
 * 任何一条不满足 → 该节点记为无效，并让进程以非零退出。
 *
 * 用法：node scripts/validate_seed.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const workspaceRoot = resolve(repoRoot, '..');
const seedPath = join(repoRoot, 'data', 'seed_nodes.json');

const VAULTS = ['knowledge', 'tool', 'case'];
const nodes = JSON.parse(readFileSync(seedPath, 'utf8'));

function refExists(ref) {
  // 支持：工作区相对路径（如 stockintel/README.md、AI-Knowledge-Bank/README.md）与仓库内相对路径
  return existsSync(join(workspaceRoot, ref)) || existsSync(join(repoRoot, ref));
}

const valid = [];
const invalid = [];
const seen = new Set();

for (const n of nodes) {
  const problems = [];
  if (!n.id) problems.push('缺 id');
  if (seen.has(n.id)) problems.push(`id 重复: ${n.id}`);
  seen.add(n.id);
  if (!VAULTS.includes(n.vault_type)) problems.push(`非法 vault_type: ${n.vault_type}`);
  if (!n.title) problems.push('缺 title');
  if (!n.summary) problems.push('缺 summary');
  for (const f of ['trust_score', 'emergence_level', 'confidence']) {
    if (n[f] !== undefined) problems.push(`不允许手填 ${f}（未经评测不得给分）`);
  }
  if (!Array.isArray(n.source_refs) || n.source_refs.length === 0) {
    problems.push('source_refs 为空（不允许无出处节点）');
  } else {
    for (const ref of n.source_refs) {
      if (!refExists(ref)) problems.push(`source_ref 不存在: ${ref}`);
    }
  }
  if (problems.length) invalid.push({ id: n.id || '(无)', problems });
  else valid.push(n);
}

const counts = { knowledge: 0, tool: 0, case: 0 };
for (const n of valid) counts[n.vault_type]++;

console.log('=== AI Knowledge Bank · 种子库出处存在性校验 ===');
console.log('注意: 本检查只证明「出处文件存在」，不证明节点内容正确，不产生可信度分数。');
console.log(`文件: ${seedPath}`);
console.log(`工作区根: ${workspaceRoot}`);
console.log('');
console.log(`总节点: ${nodes.length}  有效: ${valid.length}  无效: ${invalid.length}`);
console.log(`按库统计: knowledge=${counts.knowledge}  tool=${counts.tool}  case=${counts.case}`);
console.log('');
if (invalid.length) {
  console.log('--- 无效节点（会被拒收）---');
  for (const { id, problems } of invalid) {
    console.log(`✗ ${id}`);
    for (const p of problems) console.log(`    - ${p}`);
  }
  process.exit(1);
} else {
  console.log(`source_refs 均指向真实文件的节点: ${valid.length} / ${nodes.length}（仅存在性，内容未验证）。`);
}
