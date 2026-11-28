#!/usr/bin/env node
/**
 * GitHub repository candidate discovery.
 *
 * This is a read-only triage tool: it searches repository metadata, scores
 * transparent signals, and emits candidates for human review. It never clones,
 * installs, executes, or grants trust to discovered repositories.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const USER_AGENT = "AI-Knowledge-Bank-GitHub-Discovery/0.1.0";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function assessRepository(repository, now = Date.now()) {
  const pushedAt = Date.parse(repository.pushed_at || repository.updated_at || "");
  const daysSincePush = Number.isFinite(pushedAt) ? Math.max(0, Math.floor((now - pushedAt) / 86400000)) : null;
  const archived = Boolean(repository.archived);
  const disabled = Boolean(repository.disabled);
  const spdx = repository.license?.spdx_id || "";
  const licenseKnown = Boolean(spdx && spdx !== "NOASSERTION");
  const topics = Array.isArray(repository.topics) ? repository.topics : [];
  const descriptionPresent = Boolean(String(repository.description || "").trim());
  const stars = Math.max(0, Number(repository.stargazers_count || 0));
  const forks = Math.max(0, Number(repository.forks_count || 0));
  const searchScore = clamp(Number(repository.score || 0), 0, 1);

  const components = {
    search_relevance: Math.round(searchScore * 20),
    maintenance: daysSincePush === null ? 0 : daysSincePush <= 30 ? 30 : daysSincePush <= 90 ? 24 : daysSincePush <= 180 ? 18 : daysSincePush <= 365 ? 10 : 0,
    license_clarity: licenseKnown ? 20 : 0,
    documentation_signals: (descriptionPresent ? 5 : 0) + (topics.length > 0 ? 5 : 0),
    ecosystem_signals: clamp(Math.round(Math.log10(stars + 1) * 2 + Math.log10(forks + 1)), 0, 10)
  };
  let score = Object.values(components).reduce((sum, value) => sum + value, 0);
  if (archived) score = Math.max(0, score - 35);
  if (disabled) score = Math.max(0, score - 50);

  const riskFlags = [];
  if (archived) riskFlags.push("archived_repository");
  if (disabled) riskFlags.push("disabled_repository");
  if (!licenseKnown) riskFlags.push("license_unknown_or_unasserted");
  if (!descriptionPresent) riskFlags.push("missing_description");
  if (daysSincePush === null) riskFlags.push("missing_push_timestamp");
  else if (daysSincePush > 365) riskFlags.push("no_push_in_over_one_year");
  if (!repository.default_branch) riskFlags.push("missing_default_branch");

  let decision = "review_required";
  if (archived || disabled) decision = "reject";
  else if (daysSincePush !== null && daysSincePush > 365) decision = "defer";
  else if (licenseKnown && score >= 55) decision = "shortlist";

  return {
    repository: repository.full_name,
    description: repository.description || "",
    url: repository.html_url,
    default_branch: repository.default_branch || null,
    source_ref_status: "mutable_candidate_ref; resolve a full commit SHA before ingestion",
    language: repository.language || null,
    topics,
    license: spdx || null,
    license_status: licenseKnown ? "identified_not_legal_reviewed" : "review_required",
    archived,
    disabled,
    stars,
    forks,
    open_issues: Number(repository.open_issues_count || 0),
    pushed_at: repository.pushed_at || null,
    days_since_push: daysSincePush,
    github_search_score: searchScore,
    score,
    score_components: components,
    decision,
    risk_flags: riskFlags,
    quality_claim: "Not evaluated. This score is a discovery triage signal, not proof of functionality, security, license compatibility, or task success."
  };
}

async function searchRepositories(query, limit) {
  const url = new URL("https://api.github.com/search/repositories");
  url.searchParams.set("q", query);
  url.searchParams.set("per_page", String(limit));
  url.searchParams.set("order", "desc");
  const headers = { Accept: "application/vnd.github+json", "User-Agent": USER_AGENT };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GitHub repository search failed (${response.status}): ${detail.slice(0, 500)}`);
  }
  return response.json();
}

function parseArgs(argv) {
  const queryIndex = argv.indexOf("--query");
  const limitIndex = argv.indexOf("--limit");
  const outIndex = argv.indexOf("--out");
  const query = queryIndex >= 0 ? argv[queryIndex + 1] : "";
  const limit = limitIndex >= 0 ? Number(argv[limitIndex + 1]) : 10;
  const out = outIndex >= 0 ? argv[outIndex + 1] : "";
  return { query, limit, out, help: argv.includes("--help") };
}

async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help || !args.query) {
    process.stdout.write("Usage: node scripts/github-capability-discovery.mjs --query \"json schema validator language:TypeScript\" [--limit 10] [--out candidates.json]\n");
    return;
  }
  if (!Number.isInteger(args.limit) || args.limit < 1 || args.limit > 30) {
    throw new Error("--limit must be an integer from 1 to 30.");
  }
  const response = await searchRepositories(args.query, args.limit);
  const candidates = (response.items || []).map((repository) => assessRepository(repository)).sort((a, b) => b.score - a.score || a.repository.localeCompare(b.repository));
  const report = {
    query: args.query,
    total_count: response.total_count || 0,
    returned_count: candidates.length,
    discovered_at: new Date().toISOString(),
    discovery_only: true,
    code_executed: false,
    candidates
  };
  const output = JSON.stringify(report, null, 2) + "\n";
  if (args.out) {
    const path = resolve(process.cwd(), args.out);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, output, "utf8");
    process.stdout.write(JSON.stringify({ query: report.query, returned_count: report.returned_count, out: path }, null, 2) + "\n");
  } else {
    process.stdout.write(output);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`GitHub discovery failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}
