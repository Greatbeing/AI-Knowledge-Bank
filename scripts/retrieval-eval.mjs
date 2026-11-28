#!/usr/bin/env node
/**
 * 离线检索评测器（零依赖）。
 *
 * 目的：用可复现的数据回答一个问题——把能力/知识条目转成「结构化、压缩后的表示」，
 * 再用加权词元检索，是否比当前的「字面/关键词匹配」更容易找对条目。
 *
 * 它只读本地文件，不访问网络、不执行任何被索引的资产。
 *
 * 用法：
 *   node scripts/retrieval-eval.mjs [--catalog data/db.json] [--benchmark data/retrieval-benchmark.akb.json]
 *
 * 对比三种策略：
 *   literal    —— 复刻当前 /api/search 的行为：整串 query 作为子串在标题/摘要/标签里找。
 *   keyword    —— 朴素关键词：query 按空白/标点切成词，任一子串命中即算，按命中数排序。
 *   structured —— 结构化表示：字段加权 + 中文 bi/tri-gram 词元（参考 ADR-0003 的压缩表示）。
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function normalize(value) {
  return String(value || '').toLocaleLowerCase().normalize('NFKC');
}

export function tokenize(value) {
  const text = normalize(value);
  const tokens = new Set(text.match(/[a-z0-9][a-z0-9._-]*/g) || []);
  const compact = text.replace(/[^\u3400-\u9fff]/g, '');
  for (let i = 0; i < compact.length - 1; i += 1) tokens.add(compact.slice(i, i + 2));
  for (const word of text.match(/[\u3400-\u9fff]{3,}/g) || []) {
    for (let i = 0; i < word.length - 2; i += 1) tokens.add(word.slice(i, i + 3));
  }
  return [...tokens];
}

/** 把知识库节点映射成「能力记录」形状（name/description/summary/tags）。 */
export function toCapabilityRecord(node) {
  return {
    id: node.id,
    kind: node.vault_type || node.kind || 'knowledge',
    name: node.title || node.name || '',
    description: node.recommendation_reason || node.description || '',
    summary: node.summary || '',
    tags: [...(node.scenario_tags || []), ...(node.tags || [])]
  };
}

const fieldText = (record) => normalize([
  record.name,
  record.summary,
  record.description,
  (record.tags || []).join(' ')
].join(' '));

/** 策略一：复刻当前 /api/search —— 整串 query 作为子串。 */
export function literalSearch(query, records, limit = 10) {
  const needle = normalize(query).trim();
  if (!needle) return [];
  return records
    .filter((record) => fieldText(record).includes(needle))
    .slice(0, limit)
    .map((record) => ({ asset_id: record.id, score: 1 }));
}

/** 策略二：朴素词元重叠 —— 不分字段、不加权，命中词元数即分数。 */
export function keywordSearch(query, records, limit = 10) {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return [];
  const ranked = records.map((record) => {
    const set = new Set(tokenize(fieldText(record)));
    const score = queryTokens.reduce((sum, token) => sum + (set.has(token) ? 1 : 0), 0);
    return { asset_id: record.id, score };
  });
  return ranked.filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.asset_id.localeCompare(b.asset_id))
    .slice(0, limit);
}

/** 策略三：结构化表示 —— 字段加权 + bi/tri-gram 词元。 */
export function structuredSearch(query, records, limit = 10) {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return [];
  const ranked = records.map((record) => {
    const fields = {
      name: tokenize(record.name),
      description: tokenize(record.description),
      summary: tokenize(record.summary),
      tags: tokenize((record.tags || []).join(' '))
    };
    const overlap = (tokens) => {
      const set = new Set(tokens);
      return queryTokens.reduce((sum, token) => sum + (set.has(token) ? 1 : 0), 0);
    };
    const score = overlap(fields.name) * 4 + overlap(fields.tags) * 3
      + overlap(fields.description) * 2 + overlap(fields.summary) * 2;
    return { asset_id: record.id, score, name: record.name };
  });
  return ranked.filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.asset_id.localeCompare(b.asset_id))
    .slice(0, limit);
}

export const STRATEGIES = {
  literal: literalSearch,
  keyword: keywordSearch,
  structured: structuredSearch
};

function dcg(relevances) {
  return relevances.reduce((sum, relevance, index) => sum + (Math.pow(2, relevance) - 1) / Math.log2(index + 2), 0);
}

export function evaluateStrategy(strategy, records, benchmark) {
  const k = benchmark.k || 5;
  const tasks = benchmark.tasks.map((task) => {
    const relevant = new Map(task.relevant.map((item) => [item.asset_id, item.relevance]));
    const ranked = strategy(task.query, records, Math.max(k, 10));
    const topK = ranked.slice(0, k);
    const found = topK.filter((item) => relevant.has(item.asset_id));
    const firstRelevantRank = ranked.findIndex((item) => relevant.has(item.asset_id));
    const actual = topK.map((item) => relevant.get(item.asset_id) || 0);
    const ideal = [...relevant.values()].sort((a, b) => b - a).slice(0, k);
    return {
      id: task.id,
      recall_at_k: relevant.size ? found.length / relevant.size : 1,
      reciprocal_rank: firstRelevantRank < 0 ? 0 : 1 / (firstRelevantRank + 1),
      ndcg_at_k: dcg(ideal) ? dcg(actual) / dcg(ideal) : 1,
      precision_at_1: topK[0] && relevant.has(topK[0].asset_id) ? 1 : 0,
      precision_at_k: found.length / k,
      first_relevant_rank: firstRelevantRank < 0 ? null : firstRelevantRank + 1,
      retrieved_ids: topK.map((item) => item.asset_id)
    };
  });
  const mean = (key) => tasks.reduce((sum, task) => sum + task[key], 0) / Math.max(1, tasks.length);
  const round = (value) => Number(value.toFixed(4));
  return {
    k,
    task_count: tasks.length,
    metrics: {
      recall_at_k: round(mean('recall_at_k')),
      mrr: round(mean('reciprocal_rank')),
      ndcg_at_k: round(mean('ndcg_at_k')),
      precision_at_1: round(mean('precision_at_1')),
      precision_at_k: round(mean('precision_at_k'))
    },
    tasks
  };
}

export function runComparison(catalog, benchmark) {
  const records = catalog.nodes ? catalog.nodes.map(toCapabilityRecord) : catalog.records;
  const results = Object.fromEntries(
    Object.entries(STRATEGIES).map(([name, strategy]) => [name, evaluateStrategy(strategy, records, benchmark)])
  );
  const base = results.literal.metrics;
  return {
    catalog_record_count: records.length,
    task_count: benchmark.tasks.length,
    k: benchmark.k,
    strategies: Object.fromEntries(
      Object.entries(results).map(([name, result]) => [name, result.metrics])
    ),
    delta_vs_literal: Object.fromEntries(
      Object.entries(results).map(([name, result]) => [name, {
        recall_at_k: Number((result.metrics.recall_at_k - base.recall_at_k).toFixed(4)),
        mrr: Number((result.metrics.mrr - base.mrr).toFixed(4)),
        ndcg_at_k: Number((result.metrics.ndcg_at_k - base.ndcg_at_k).toFixed(4)),
        precision_at_1: Number((result.metrics.precision_at_1 - base.precision_at_1).toFixed(4))
      }])
    ),
    tasks: { literal: results.literal.tasks, keyword: results.keyword.tasks, structured: results.structured.tasks },
    limitations: [
      '小型人工标注集，仅 9 条真实条目；结论是相对排序信号，不代表能力质量。',
      '只用词法匹配，未使用向量检索/重排/个性化。',
      'structured 的字段权重是启发式设定，未做调参。'
    ]
  };
}

function parseArgs(argv) {
  const args = { catalog: 'data/db.json', benchmark: 'data/retrieval-benchmark.akb.json' };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--catalog') args.catalog = argv[i += 1];
    else if (argv[i] === '--benchmark') args.benchmark = argv[i += 1];
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const catalog = JSON.parse(readFileSync(resolve(ROOT, args.catalog), 'utf8'));
  const benchmark = JSON.parse(readFileSync(resolve(ROOT, args.benchmark), 'utf8'));
  process.stdout.write(JSON.stringify(runComparison(catalog, benchmark), null, 2) + '\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`retrieval eval failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}
