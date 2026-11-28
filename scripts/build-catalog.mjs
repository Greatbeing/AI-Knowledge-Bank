#!/usr/bin/env node
/**
 * 只读能力目录导入器（零依赖、离线）。
 *
 * 把本地真实知识节点（data/db.json）压缩成「能力目录」表示：标准字段 + 来源溯源（provenance）。
 * 不访问网络、不执行任何资产、不写数据库；产物 data/catalog.local.json 供检索基准消费。
 *
 * 用法：
 *   node scripts/build-catalog.mjs             # 生成 data/catalog.local.json
 *   node scripts/build-catalog.mjs --check     # 校验产物是否最新（CI 用）
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCHEMA_VERSION = '1.0';

export function buildCatalog(db) {
  const seen = new Set();
  const records = (db.nodes || [])
    .filter((node) => node.status !== 'draft' && node.status !== 'rejected')
    .map((node) => {
      if (!node.id || !node.title || !node.summary) {
        throw new Error(`节点缺少 id/title/summary：${JSON.stringify(node.id || node)}`);
      }
      if (seen.has(node.id)) throw new Error(`重复的节点 id：${node.id}`);
      seen.add(node.id);
      return {
        asset_id: node.id,
        kind: node.vault_type || 'knowledge',
        name: node.title,
        description: node.recommendation_reason || '',
        summary: node.summary,
        tags: [...(node.scenario_tags || [])].sort(),
        provenance: {
          vault: node.vault_type || 'knowledge',
          status: node.status || 'validated',
          source_refs: [...(node.source_refs || [])],
          language: node.language || 'zh',
          created_at: node.created_at || null
        }
      };
    })
    .sort((a, b) => a.asset_id.localeCompare(b.asset_id));

  return {
    schema_version: SCHEMA_VERSION,
    purpose: 'Read-only capability catalog compressed from local knowledge nodes; safe to regenerate from data/db.json.',
    record_count: records.length,
    records
  };
}

function parseArgs(argv) {
  const args = { input: 'data/db.json', output: 'data/catalog.local.json', check: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--input') { args.input = argv[i + 1]; i += 1; }
    else if (argv[i] === '--output') { args.output = argv[i + 1]; i += 1; }
    else if (argv[i] === '--check') args.check = true;
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = resolve(ROOT, args.input);
  const outputPath = resolve(ROOT, args.output);
  const catalog = buildCatalog(JSON.parse(readFileSync(inputPath, 'utf8')));
  const serialized = JSON.stringify(catalog, null, 2) + '\n';

  if (args.check) {
    const current = existsSync(outputPath) ? readFileSync(outputPath, 'utf8') : '';
    if (current !== serialized) {
      process.stderr.write(`catalog 不是最新：请运行 node scripts/build-catalog.mjs（${args.output}）\n`);
      process.exitCode = 1;
      return;
    }
    process.stdout.write(`catalog 已最新：${catalog.record_count} 条\n`);
    return;
  }

  writeFileSync(outputPath, serialized, 'utf8');
  process.stdout.write(`catalog 已生成：${args.output}（${catalog.record_count} 条）\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`catalog build failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}