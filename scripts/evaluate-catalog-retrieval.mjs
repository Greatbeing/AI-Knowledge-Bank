#!/usr/bin/env node
/**
 * Offline retrieval baseline and benchmark evaluator.
 * It consumes an already generated catalog; it never accesses GitHub or executes assets.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

function normalize(value) {
  return String(value || "").toLocaleLowerCase().normalize("NFKC");
}

export function tokenize(value) {
  const text = normalize(value);
  const tokens = new Set(text.match(/[a-z0-9][a-z0-9._-]*/g) || []);
  const compact = text.replace(/[^\u3400-\u9fff]/g, "");
  for (let i = 0; i < compact.length - 1; i += 1) tokens.add(compact.slice(i, i + 2));
  for (const word of text.match(/[\u3400-\u9fff]{3,}/g) || []) {
    for (let i = 0; i < word.length - 2; i += 1) tokens.add(word.slice(i, i + 3));
  }
  return [...tokens];
}

function searchableFields(record) {
  return {
    name: tokenize(record.name),
    description: tokenize(record.description),
    summary: tokenize(record.summary),
    tags: tokenize((record.tags || []).join(" "))
  };
}

export function rankCapabilities(query, records, limit = 10) {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return [];
  const ranked = records.map((record) => {
    const fields = searchableFields(record);
    const count = (tokens) => {
      const set = new Set(tokens);
      return queryTokens.reduce((sum, token) => sum + (set.has(token) ? 1 : 0), 0);
    };
    const score = count(fields.name) * 4 + count(fields.tags) * 3
      + count(fields.description) * 2 + count(fields.summary) * 2;
    return { asset_id: record.id, score, kind: record.kind, name: record.name };
  });
  return ranked.filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.asset_id.localeCompare(b.asset_id))
    .slice(0, limit);
}

function dcg(relevances) {
  return relevances.reduce((sum, relevance, index) => sum + (Math.pow(2, relevance) - 1) / Math.log2(index + 2), 0);
}

export function evaluateBenchmark(catalog, benchmark) {
  const k = benchmark.k || 5;
  const taskResults = benchmark.tasks.map((task) => {
    const relevant = new Map(task.relevant.map((item) => [item.asset_id, item.relevance]));
    const ranked = rankCapabilities(task.query, catalog.records, Math.max(k, 10));
    const topK = ranked.slice(0, k);
    const found = topK.filter((item) => relevant.has(item.asset_id));
    const firstRelevantRank = ranked.findIndex((item) => relevant.has(item.asset_id));
    const actual = topK.map((item) => relevant.get(item.asset_id) || 0);
    const ideal = [...relevant.values()].sort((a, b) => b - a).slice(0, k);
    return {
      id: task.id,
      query: task.query,
      recall_at_k: relevant.size ? found.length / relevant.size : 1,
      reciprocal_rank: firstRelevantRank < 0 ? 0 : 1 / (firstRelevantRank + 1),
      ndcg_at_k: dcg(ideal) ? dcg(actual) / dcg(ideal) : 1,
      precision_at_1: topK[0] && relevant.has(topK[0].asset_id) ? 1 : 0,\n      precision_at_k: found.length / k,
      relevant_ids: [...relevant.keys()],
      retrieved_ids: topK.map((item) => item.asset_id),
      first_relevant_rank: firstRelevantRank < 0 ? null : firstRelevantRank + 1
    };
  });
  const mean = (key) => taskResults.reduce((sum, task) => sum + task[key], 0) / Math.max(1, taskResults.length);
  return {
    benchmark_version: benchmark.schema_version,
    catalog_record_count: catalog.records.length,
    task_count: taskResults.length,
    k,
    metrics: {
      recall_at_k: Number(mean("recall_at_k").toFixed(4)),
      mrr: Number(mean("reciprocal_rank").toFixed(4)),
      ndcg_at_k: Number(mean("ndcg_at_k").toFixed(4)),
      precision_at_1: Number((taskResults.reduce((sum, task) => sum + task.precision_at_1, 0) / Math.max(1, taskResults.length)).toFixed(4)),\n      precision_at_k: Number((taskResults.reduce((sum, task) => sum + task.precision_at_k, 0) / Math.max(1, taskResults.length)).toFixed(4))
    },
    tasks: taskResults,
    limitations: [
      "Lexical baseline only; no embeddings, reranker, personalization or query expansion.",
      "Judgments are a small manually authored seed set and require independent review.",
      "Scores are relative ranking signals, not capability quality or execution trust."
    ]
  };
}

async function main(argv = process.argv.slice(2)) {
  const catalogPath = argv[0];
  const benchmarkPath = argv[1] || "data/retrieval-benchmark.phase1.json";
  if (!catalogPath || argv.includes("--help")) {
    process.stdout.write("Usage: node scripts/evaluate-catalog-retrieval.mjs <catalog.json> [benchmark.json]\n");
    return;
  }
  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  const benchmark = JSON.parse(await readFile(benchmarkPath, "utf8"));
  const report = evaluateBenchmark(catalog, benchmark);
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`Retrieval evaluation failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}
