#!/usr/bin/env node
/**
 * Phase 1 read-only capability catalog importer.
 *
 * - Reads pinned public GitHub repository snapshots.
 * - Parses allowlisted JSON and Markdown only.
 * - Never imports credentials/private runtime data.
 * - Never executes repository code or capability instructions.
 * - Emits a deterministic catalog artifact; it does not write to a database.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG_PATH = resolve(ROOT, "config/capability-sources.phase1.json");
const USER_AGENT = "AI-Knowledge-Bank-Phase1-Importer/0.1.0";
const MAX_DESCRIPTION = 4000;

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
  if (!match) return { metadata: {}, body: markdown };
  const raw = match[1];
  const metadata = {};
  const lines = raw.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const keyMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!keyMatch) continue;
    const [, key, value] = keyMatch;
    if (value === "|" || value === ">") {
      const block = [];
      while (i + 1 < lines.length && /^\s+/.test(lines[i + 1])) {
        block.push(lines[i + 1].replace(/^\s+/, ""));
        i += 1;
      }
      metadata[key] = block.join(value === ">" ? " " : "\n").trim();
    } else {
      metadata[key] = value.replace(/^(['"])(.*)\1$/, "$2").trim();
    }
  }
  return { metadata, body: markdown.slice(match[0].length) };
}

function normalizeVault(value) {
  if (value === "knowledge") return "knowledge";
  if (value === "tool" || value === "tools") return "tools";
  if (value === "case" || value === "cases") return "cases";
  return undefined;
}

function normalizeDescription(value, fallback = "") {
  const text = String(value || fallback || "").replace(/\s+/g, " ").trim();
  if (text.length < 20) return "";
  return text.slice(0, MAX_DESCRIPTION);
}

function toSafeId(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 96);
}


function validateRecord(record) {
  const errors = [];
  const kinds = ["principle", "framework", "prompt", "script", "tool", "agent", "workflow", "case-study", "dataset", "model-adapter", "engine", "primitive", "knowledge", "case"];
  if (!/^[a-z0-9][a-z0-9._-]{2,95}$/.test(record.id || "")) errors.push("invalid id");
  if (!record.name || record.name.length < 2 || record.name.length > 120) errors.push("invalid name");
  if (!kinds.includes(record.kind)) errors.push("invalid kind");
  if (record.vault && !["knowledge", "tools", "cases"].includes(record.vault)) errors.push("invalid vault");
  if (!record.description || record.description.length < 20 || record.description.length > MAX_DESCRIPTION) errors.push("invalid description");
  if (!record.source || typeof record.source.repository !== "string" || record.source.repository.split("/").length !== 2 || /\s/.test(record.source.repository)) errors.push("invalid source repository");
  if (!record.source?.path) errors.push("missing source path");
  if (!/^[a-f0-9]{7,40}$/.test(record.source?.commit_sha || "")) errors.push("invalid source commit SHA");
  if (!["discovered", "parsed", "reviewed", "verified", "executable", "deprecated", "rejected"].includes(record.lifecycle)) errors.push("invalid lifecycle");
  if (record.relationships?.some((link) => !link.type || !link.target_id)) errors.push("invalid relationship");
  return errors;
}

function sourceMetadata(repo, path, config, treeEntry, anchor = "") {
  return {
    repository: repo,
    path,
    ref: config.ref,
    commit_sha: config.commit_sha,
    blob_sha: treeEntry?.sha || "",
    anchor: anchor || undefined,
    parser: config.parser,
    parser_version: "0.1.0",
    license: "review_required",
    license_status: "review_required"
  };
}

function baseRecord({ id, name, kind, vault, description, summary, tags = [], maturity = "unknown", source, relationships = [] }) {
  const cleanDescription = normalizeDescription(description, summary || name);
  if (!cleanDescription) return null;
  return {
    schema_version: "1.0",
    id: toSafeId(id),
    name: String(name || id).slice(0, 120),
    kind,
    ...(vault ? { vault } : {}),
    description: cleanDescription,
    summary: String(summary || cleanDescription).slice(0, 500),
    tags: [...new Set(tags.filter(Boolean).map(String))].slice(0, 50),
    languages: ["zh", "en"],
    relationships,
    source,
    lifecycle: "parsed",
    maturity: ["proposed", "draft", "tested", "validated", "stable", "deprecated"].includes(maturity) ? maturity : "unknown",
    verification: {
      status: "unverified",
      method: "Read-only source parsing; no execution or independent quality evaluation."
    }
  };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": USER_AGENT }
  });
  if (!response.ok) throw new Error(`GitHub API ${response.status} for ${url}`);
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) throw new Error(`Source fetch ${response.status} for ${url}`);
  return response.text();
}

function matchesAllowlist(path, patterns) {
  return patterns.some((pattern) => {
    if (pattern === path) return true;
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    return new RegExp(`^${escaped}$`).test(path);
  });
}

function parseSeedNode(node, repo, path, config, treeEntry, origin) {
  const content = node.content && typeof node.content === "object" ? node.content : {};
  const vault = normalizeVault(content.vault || node.vault_type);
  const kind = vault === "knowledge" ? "knowledge" : vault === "tools" ? "tool" : "case";
  const summary = content.summary || node.summary || node.recommendation_reason || node.title;
  const description = [summary, content.when_to_use].filter(Boolean).join(" ");
  return baseRecord({
    id: `akb.${origin}.${node.id}`,
    name: node.title,
    kind,
    vault,
    description,
    summary,
    tags: [...(content.keywords || []), ...(node.scenario_tags || [])],
    maturity: node.status || "unknown",
    source: sourceMetadata(repo, path, config, treeEntry, node.id)
  });
}

function parsePrimitive(primitive, repo, path, config, treeEntry, originConfig, originTree) {
  const isDomain = primitive.kind === "domain";
  const provenanceRef = primitive.provenance?.source_ref || "";
  let sourceRepo = repo;
  let sourcePath = path;
  let sourceEntry = treeEntry;
  let anchor = provenanceRef;
  let sourceConfig = config;

  // Domain primitives are distilled from writing-engines. Point to the original
  // atom source while retaining the generated registry as a normalization layer tag.
  if (isDomain && provenanceRef) {
    const split = provenanceRef.split("#");
    sourceRepo = originConfig.repository;
    sourcePath = split[0];
    sourceEntry = originTree.get(sourcePath);
    sourceConfig = originConfig;
    anchor = split.slice(1).join("#");
  }

  return baseRecord({
    id: primitive.id,
    name: primitive.name,
    kind: "primitive",
    vault: "tools",
    description: primitive.purpose,
    summary: primitive.purpose,
    tags: [...(primitive.tags || []), `primitive-family:${primitive.family || "unclassified"}`, `normalized-via:${repo}/${path}`],
    maturity: primitive.lifecycle || "unknown",
    source: sourceMetadata(sourceRepo, sourcePath, sourceConfig, sourceEntry, anchor)
  });
}

async function importSources(config) {
  const snapshots = new Map();
  const trees = new Map();
  const filesByRepo = new Map();

  for (const source of config.sources) {
    const url = `https://api.github.com/repos/${source.repository}/git/trees/${source.commit_sha}?recursive=1`;
    const tree = await fetchJson(url);
    const map = new Map((tree.tree || []).filter((entry) => entry.type === "blob").map((entry) => [entry.path, entry]));
    snapshots.set(source.repository, { ref: source.ref, commit_sha: source.commit_sha, tree_sha: tree.sha, truncated: Boolean(tree.truncated) });
    trees.set(source.repository, map);
    const selected = [...map.keys()].filter((path) => matchesAllowlist(path, source.allowlist));
    if (tree.truncated) throw new Error(`Repository tree is truncated: ${source.repository}`);
    filesByRepo.set(source.repository, new Map());
    for (const path of selected) {
      const rawUrl = `https://raw.githubusercontent.com/${source.repository}/${source.commit_sha}/${path}`;
      filesByRepo.get(source.repository).set(path, await fetchText(rawUrl));
    }
  }

  const records = [];
  const issues = [];
  const add = (record, context) => {
    if (!record) {
      issues.push({ type: "skipped_short_description", context });
      return;
    }
    records.push(record);
  };

  const akb = config.sources.find((s) => s.parser === "akb-seed");
  const akbFiles = filesByRepo.get(akb.repository);
  for (const path of akb.allowlist) {
    const text = akbFiles.get(path);
    if (!text) continue;
    const parsed = JSON.parse(text);
    const nodes = Array.isArray(parsed) ? parsed : Array.isArray(parsed.nodes) ? parsed.nodes : [];
    for (const node of nodes) add(
      parseSeedNode(node, akb.repository, path, akb, trees.get(akb.repository).get(path), path.includes("db.json") ? "db" : "seed"),
      `${akb.repository}/${path}#${node.id}`
    );
  }

  const cognitive = config.sources.find((s) => s.parser === "cognitive-registry");
  const cognitiveFiles = filesByRepo.get(cognitive.repository);
  const writing = config.sources.find((s) => s.parser === "writing-engines");
  const writingFiles = filesByRepo.get(writing.repository);
  const atomIndex = JSON.parse(writingFiles.get("atoms/index.json") || "[]");

  const engineFiles = [...writingFiles.keys()].filter((path) => /-writing\/SKILL\.md$/.test(path)).sort();
  const engineRecords = new Map();
  for (const path of engineFiles) {
    const { metadata, body } = parseFrontmatter(writingFiles.get(path));
    const engineSlug = path.split("/")[0];
    const description = metadata.description || body.slice(0, 800);
    const atomIds = atomIndex.filter((atom) => atom.engine === engineSlug).map((atom) => {
      const [slug, number] = atom.id.split(".");
      return `we.${slug}.a${number}`;
    });
    const record = baseRecord({
      id: `we.engine.${engineSlug}`,
      name: metadata.name || engineSlug,
      kind: "engine",
      vault: "tools",
      description,
      summary: description,
      tags: ["writing", "skill", engineSlug],
      maturity: "unknown",
      source: sourceMetadata(writing.repository, path, writing, trees.get(writing.repository).get(path))
    });
    if (record) record.relationships = atomIds.map((target_id) => ({ type: "contains", target_id }));
    add(record, `${writing.repository}/${path}`);
    if (record) engineRecords.set(engineSlug, record.id);
  }

  const primitiveFiles = ["registry/writing-engines.json", "registry/general.json"];
  for (const path of primitiveFiles) {
    const text = cognitiveFiles.get(path);
    if (!text) continue;
    const parsed = JSON.parse(text);
    const primitives = Array.isArray(parsed) ? parsed : parsed.primitives || [];
    for (const primitive of primitives) {
      const isDomain = primitive.kind === "domain";
      add(
        parsePrimitive(
          primitive,
          cognitive.repository,
          path,
          cognitive,
          trees.get(cognitive.repository).get(path),
          writing,
          trees.get(writing.repository)
        ),
        `${cognitive.repository}/${path}#${primitive.id}`
      );
      if (isDomain && primitive.id) {
        const match = primitive.id.match(/^we\.([a-z0-9_-]+)\.a(\d+)$/);
        if (match) {
          const engineName = atomIndex.find((a) => a.id === `${match[1]}.${match[2]}`)?.engine;
          const engineId = engineName ? engineRecords.get(engineName) : null;
          if (engineId) {
            const record = records.find((r) => r.id === primitive.id);
            if (record) record.relationships.push({ type: "belongs_to", target_id: engineId });
          }
        }
      }
    }
  }

  const duplicateIds = records.map((r) => r.id).filter((id, index, all) => all.indexOf(id) !== index);
  const validationErrors = records.flatMap((record) => validateRecord(record).map((error) => ({ id: record.id, error })));
  const uniqueRecords = [...new Map(records.map((r) => [r.id, r])).values()].sort((a, b) => a.id.localeCompare(b.id));
  const domainPrimitives = uniqueRecords.filter((r) => r.kind === "primitive" && r.id.startsWith("we.")).length;
  const generalPrimitives = uniqueRecords.filter((r) => r.kind === "primitive" && r.id.startsWith("ce.")).length;
  const report = {
    record_count: uniqueRecords.length,
    by_kind: uniqueRecords.reduce((acc, record) => {
      acc[record.kind] = (acc[record.kind] || 0) + 1;
      return acc;
    }, {}),
    engine_count: engineRecords.size,
    atom_index_count: atomIndex.length,
    imported_domain_primitive_count: domainPrimitives,
    imported_general_primitive_count: generalPrimitives,
    duplicate_ids: [...new Set(duplicateIds)],
    issues,
    safety: { code_executed: false, private_data_accessed: false, database_written: false, deployment_performed: false }
  };

  return {
    schema_version: "1.0",
    generated_at: new Date().toISOString(),
    source_snapshots: Object.fromEntries(snapshots),
    report,
    records: uniqueRecords
  };
}

async function main(argv = process.argv.slice(2)) {
  if (argv.includes("--help")) {
    process.stdout.write("Usage: node scripts/phase1-import.mjs [--out <path>]\nDefault mode is read-only and prints the catalog JSON to stdout.\n");
    return;
  }
  const config = JSON.parse(await readFile(CONFIG_PATH, "utf8"));
  const catalog = await importSources(config);
  if (catalog.report.duplicate_ids.length) throw new Error(`Duplicate catalog IDs: ${catalog.report.duplicate_ids.join(", ")}`);
  if (catalog.report.validation_errors.length) throw new Error(`Manifest validation failed: ${JSON.stringify(catalog.report.validation_errors.slice(0, 20))}`);
  const outputIndex = argv.indexOf("--out");
  const output = JSON.stringify(catalog, null, 2) + "\n";
  if (outputIndex >= 0 && argv[outputIndex + 1]) {
    const path = resolve(process.cwd(), argv[outputIndex + 1]);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, output, "utf8");
    process.stdout.write(JSON.stringify(catalog.report, null, 2) + "\n");
  } else {
    process.stdout.write(output);
  }
}

export { importSources, normalizeVault, parseFrontmatter, toSafeId, validateRecord };

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`Phase 1 import failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}
