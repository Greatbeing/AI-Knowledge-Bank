#!/usr/bin/env node
/**
 * Phase 1 read-only capability importer.
 *
 * Reads immutable, allowlisted GitHub snapshots and emits a deterministic catalog.
 * It never executes source code, capability instructions, or writes to a database.
 */
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG_PATH = resolve(ROOT, "config/capability-sources.phase1.json");
const USER_AGENT = "AI-Knowledge-Bank-Phase1-Importer/0.2.0";
const PARSER_VERSION = "0.2.0";
const MAX_DESCRIPTION = 4000;
const KINDS = new Set(["principle", "framework", "prompt", "script", "tool", "agent", "workflow", "case-study", "dataset", "model-adapter", "engine", "primitive", "knowledge", "case"]);
const VAULTS = new Set(["knowledge", "tools", "cases"]);
const LIFECYCLES = new Set(["discovered", "parsed", "reviewed", "verified", "executable", "deprecated", "rejected"]);
const MATURITIES = new Set(["proposed", "draft", "tested", "validated", "stable", "deprecated", "unknown"]);

export function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function sha256(value) {
  return createHash("sha256").update(typeof value === "string" ? value : stableStringify(value)).digest("hex");
}

export function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
  if (!match) return { metadata: {}, body: markdown };
  const metadata = {};
  const lines = match[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const entry = lines[i].match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!entry) continue;
    const [, key, rawValue] = entry;
    if (rawValue === "|" || rawValue === ">") {
      const block = [];
      while (i + 1 < lines.length && /^\s+/.test(lines[i + 1])) {
        block.push(lines[++i].replace(/^\s+/, ""));
      }
      metadata[key] = block.join(rawValue === ">" ? " " : "\n").trim();
    } else {
      metadata[key] = rawValue.replace(/^(['"])(.*)\1$/, "$2").trim();
    }
  }
  return { metadata, body: markdown.slice(match[0].length) };
}

export function normalizeVault(value) {
  if (value === "knowledge") return "knowledge";
  if (value === "tool" || value === "tools") return "tools";
  if (value === "case" || value === "cases") return "cases";
  return undefined;
}

export function toSafeId(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 96);
}

function normalizeDescription(value, fallback = "") {
  const text = String(value || fallback || "").replace(/\s+/g, " ").trim();
  return text.length >= 20 ? text.slice(0, MAX_DESCRIPTION) : "";
}

function validateRecord(record) {
  const errors = [];
  if (!/^[a-z0-9][a-z0-9._-]{2,95}$/.test(record.id || "")) errors.push("invalid id");
  if (typeof record.name !== "string" || record.name.length < 2 || record.name.length > 120) errors.push("invalid name");
  if (!KINDS.has(record.kind)) errors.push("invalid kind");
  if (record.vault && !VAULTS.has(record.vault)) errors.push("invalid vault");
  if (typeof record.description !== "string" || record.description.length < 20 || record.description.length > MAX_DESCRIPTION) errors.push("invalid description");
  if (!record.source || typeof record.source.repository !== "string" || record.source.repository.split("/").length !== 2 || record.source.repository.split("/").some((part) => !part || /\s/.test(part))) errors.push("invalid source repository");
  if (!record.source?.path) errors.push("missing source path");
  if (!/^[a-f0-9]{40}$/.test(record.source?.commit_sha || "")) errors.push("invalid immutable commit SHA");
  if (!/^[a-f0-9]{40}$/.test(record.source?.blob_sha || "")) errors.push("missing or invalid source blob SHA");
  if (!record.source?.url) errors.push("missing source URL");
  if (!LIFECYCLES.has(record.lifecycle)) errors.push("invalid lifecycle");
  if (!MATURITIES.has(record.maturity)) errors.push("invalid maturity");
  if (!/^[a-f0-9]{64}$/.test(record.content_hash || "")) errors.push("missing content hash");
  if (!record.verification || record.verification.status !== "unverified") errors.push("new imports must remain unverified");
  if (record.relationships?.some((link) => !link.type || !link.target_id)) errors.push("invalid relationship");
  return errors;
}

function sourceMetadata(repo, path, config, treeEntry, anchor) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return {
    repository: repo,
    path,
    ref: config.ref,
    commit_sha: config.commit_sha,
    blob_sha: treeEntry?.sha || "",
    anchor: anchor || undefined,
    url: `https://github.com/${repo}/blob/${config.commit_sha}/${encodedPath}`,
    parser: config.parser,
    parser_version: PARSER_VERSION,
    license: "unknown",
    license_status: "review_required"
  };
}

function buildRecord({ id, name, kind, vault, description, summary, tags = [], maturity = "unknown", source, relationships = [], sourceContent }) {
  const cleanDescription = normalizeDescription(description, summary || name);
  if (!cleanDescription) return null;
  const record = {
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
    maturity: MATURITIES.has(maturity) ? maturity : "unknown",
    verification: {
      status: "unverified",
      method: "Read-only source parsing. No capability code or instructions were executed."
    },
    content_hash: sha256(sourceContent ?? cleanDescription)
  };
  return record;
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/vnd.github+json", "User-Agent": USER_AGENT } });
  if (!response.ok) throw new Error(`GitHub API ${response.status} for ${url}`);
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) throw new Error(`Source fetch ${response.status} for ${url}`);
  return response.text();
}

export function matchesAllowlist(path, patterns) {
  return patterns.some((pattern) => {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    return new RegExp(`^${escaped}$`).test(path);
  });
}

function parseAkbNode(node, repo, path, config, treeEntry, origin, sourceContent) {
  const content = node.content && typeof node.content === "object" ? node.content : {};
  const vault = normalizeVault(content.vault || node.vault_type);
  const kind = vault === "knowledge" ? "knowledge" : vault === "tools" ? "tool" : "case";
  const summary = content.summary || node.summary || node.recommendation_reason || node.title;
  const description = [summary, content.when_to_use].filter(Boolean).join(" ");
  return buildRecord({
    id: `akb.${origin}.${node.id}`,
    name: node.title,
    kind,
    vault,
    description,
    summary,
    tags: [...(content.keywords || []), ...(node.scenario_tags || [])],
    maturity: node.status || "unknown",
    source: sourceMetadata(repo, path, config, treeEntry, node.id),
    sourceContent
  });
}

export function extractAtomDescription(markdown, atom) {
  if (!markdown || !atom) return "";
  const heading = String(atom.heading || "").trim();
  const tableNumber = heading.match(/^#(\d+)\b/);
  if (tableNumber) {
    const row = markdown.split(/\r?\n/).find((line) => {
      const match = line.match(/^\|\s*(\d+)\s*\|/);
      return match && Number(match[1]) === Number(tableNumber[1]);
    });
    if (row) {
      const cells = row.split("|").map((cell) => cell.trim());
      if (cells[2] && cells[2].length >= 8) return cells[2];
    }
  }
  const lines = markdown.split(/\r?\n/);
  const title = heading.replace(/^#+\s*/, "").replace(/\s+$/, "");
  const start = lines.findIndex((line) => line.trim() === heading || (title && line.trim().replace(/^#+\s*/, "") === title));
  if (start < 0) return "";
  const level = (lines[start].match(/^#+/) || ["##"])[0].length;
  const section = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const next = lines[i].match(/^(#+)\s/);
    if (next && next[1].length <= level) break;
    section.push(lines[i]);
  }
  const definition = section.find((line) => /\*\*定义\*\*：/.test(line));
  if (definition) return definition.replace(/^.*?\*\*定义\*\*：/, "").trim();
  return section.map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean).join(" ").slice(0, 600);
}

function parsePrimitive(primitive, repo, path, config, treeEntry, atomByPrimitiveId, writingConfig, writingTree, writingFiles) {
  const isDomain = primitive.kind === "domain";
  const atom = isDomain ? atomByPrimitiveId.get(primitive.id) : null;
  const sourcePath = atom?.file || path;
  const sourceConfig = atom ? writingConfig : config;
  const sourceEntry = atom ? writingTree.get(sourcePath) : treeEntry;
  const anchor = atom?.heading || primitive.id;
  const sourceRepo = atom ? writingConfig.repository : repo;
  const atomSource = atom ? writingFiles.get(sourcePath) : "";
  const extracted = atom ? extractAtomDescription(atomSource, atom) : "";
  const combinedDescription = [primitive.purpose, extracted].filter(Boolean).join("。");
  const description = normalizeDescription(combinedDescription) || `The source does not provide a detailed purpose for ${primitive.name}; inspect the linked source before use.`;
  const completeDescription = description.length < 20 ? `${description}。具体用法与边界请参阅原始来源。` : description;
  return buildRecord({
    id: primitive.id,
    name: primitive.name,
    kind: "primitive",
    vault: "tools",
    description: completeDescription,
    summary: completeDescription,
    tags: [...(primitive.tags || []), `primitive-family:${primitive.family || "unclassified"}`, `normalized-via:${repo}/${path}`, ...(extracted ? ["description:source-extracted"] : ["description:source-incomplete"])],
    maturity: primitive.lifecycle || "unknown",
    source: sourceMetadata(sourceRepo, sourcePath, sourceConfig, sourceEntry, anchor),
    sourceContent: { primitive, extracted }
  });
}

function collectNodes(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.nodes)) return parsed.nodes;
  return [];
}

export async function importSources(config) {
  if (!config?.policy?.immutable_refs_required) throw new Error("Immutable source refs are required.");
  const snapshots = new Map();
  const trees = new Map();
  const filesByRepo = new Map();

  for (const source of config.sources) {
    if (!/^[a-f0-9]{40}$/.test(source.commit_sha || "")) throw new Error(`Source is not pinned to a full commit SHA: ${source.repository}`);
    const url = `https://api.github.com/repos/${source.repository}/git/trees/${source.commit_sha}?recursive=1`;
    const tree = await fetchJson(url);
    if (tree.truncated) throw new Error(`Repository tree is truncated: ${source.repository}`);
    const map = new Map((tree.tree || []).filter((entry) => entry.type === "blob").map((entry) => [entry.path, entry]));
    snapshots.set(source.repository, { ref: source.ref, commit_sha: source.commit_sha, tree_sha: tree.sha });
    trees.set(source.repository, map);
    const selected = [...map.keys()].filter((path) => matchesAllowlist(path, source.allowlist)).sort();
    filesByRepo.set(source.repository, new Map());
    for (const path of selected) {
      const rawUrl = `https://raw.githubusercontent.com/${source.repository}/${source.commit_sha}/${path.split("/").map(encodeURIComponent).join("/")}`;
      filesByRepo.get(source.repository).set(path, await fetchText(rawUrl));
    }
  }

  const records = [];
  const issues = [];
  const add = (record, context) => {
    if (!record) issues.push({ type: "skipped_short_description", context });
    else records.push(record);
  };

  const akb = config.sources.find((source) => source.parser === "akb-seed");
  const akbFiles = filesByRepo.get(akb.repository);
  for (const path of akb.allowlist.filter((item) => item.endsWith(".json"))) {
    const text = akbFiles.get(path);
    if (!text) throw new Error(`Allowlisted AKB file missing from pinned tree: ${path}`);
    const parsed = JSON.parse(text);
    const nodes = collectNodes(parsed);
    for (const node of nodes) {
      // Runtime/community signals in db.json are intentionally not imported.
      add(parseAkbNode(node, akb.repository, path, akb, trees.get(akb.repository).get(path), path.includes("db.json") ? "db" : "seed", node), `${akb.repository}/${path}#${node.id}`);
    }
  }

  const writing = config.sources.find((source) => source.parser === "writing-engines");
  const writingFiles = filesByRepo.get(writing.repository);
  const atomIndexText = writingFiles.get("atoms/index.json");
  if (!atomIndexText) throw new Error("Writing atom index missing from pinned snapshot.");
  const atomIndex = JSON.parse(atomIndexText);
  if (!Array.isArray(atomIndex)) throw new Error("Writing atom index must be an array.");
  const atomByPrimitiveId = new Map(atomIndex.map((atom) => [`we.${atom.id.replace(".", ".a")}`, atom]));

  const engineFiles = [...writingFiles.keys()].filter((path) => /-writing\/SKILL\.md$/.test(path)).sort();
  const engineRecords = new Map();
  for (const path of engineFiles) {
    const { metadata, body } = parseFrontmatter(writingFiles.get(path));
    const engineSlug = path.split("/")[0];
    const description = metadata.description || body.slice(0, 800);
    const relatedAtoms = atomIndex.filter((atom) => atom.engine === engineSlug);
    const record = buildRecord({
      id: `we.engine.${engineSlug}`,
      name: metadata.name || engineSlug,
      kind: "engine",
      vault: "tools",
      description,
      summary: description,
      tags: ["writing", "skill", engineSlug],
      maturity: "unknown",
      source: sourceMetadata(writing.repository, path, writing, trees.get(writing.repository).get(path)),
      relationships: relatedAtoms.map((atom) => ({ type: "contains", target_id: `we.${atom.id.replace(".", ".a")}` })),
      sourceContent: writingFiles.get(path)
    });
    add(record, `${writing.repository}/${path}`);
    if (record) engineRecords.set(engineSlug, record.id);
  }

  // Cangjie is an engine-authoring workflow, not one of the 17 writing engines.
  const cangjiePath = "cangjie/SKILL.md";
  if (writingFiles.has(cangjiePath)) {
    const { metadata, body } = parseFrontmatter(writingFiles.get(cangjiePath));
    const description = metadata.description || body.slice(0, 800);
    add(buildRecord({
      id: "we.workflow.cangjie-authoring",
      name: metadata.name || "cangjie",
      kind: "workflow",
      vault: "tools",
      description,
      summary: description,
      tags: ["writing", "engine-authoring", "meta-workflow"],
      maturity: "unknown",
      source: sourceMetadata(writing.repository, cangjiePath, writing, trees.get(writing.repository).get(cangjiePath)),
      sourceContent: writingFiles.get(cangjiePath)
    }), `${writing.repository}/${cangjiePath}`);
  }

  const cognitive = config.sources.find((source) => source.parser === "cognitive-registry");
  const cognitiveFiles = filesByRepo.get(cognitive.repository);
  const primitivePaths = ["registry/writing-engines.json", "registry/general.json"];
  const importedPrimitiveIds = new Set();
  for (const path of primitivePaths) {
    const raw = cognitiveFiles.get(path);
    if (!raw) throw new Error(`Cognitive registry missing from pinned snapshot: ${path}`);
    const parsed = JSON.parse(raw);
    const primitives = Array.isArray(parsed) ? parsed : parsed.primitives || [];
    for (const primitive of primitives) {
      if (importedPrimitiveIds.has(primitive.id)) throw new Error(`Duplicate primitive ID in source registry: ${primitive.id}`);
      importedPrimitiveIds.add(primitive.id);
      const record = parsePrimitive(
        primitive,
        cognitive.repository,
        path,
        cognitive,
        trees.get(cognitive.repository).get(path),
        atomByPrimitiveId,
        writing,
        trees.get(writing.repository),
        writingFiles
      );
      add(record, `${cognitive.repository}/${path}#${primitive.id}`);
      if (record && primitive.kind === "domain") {
        const atom = atomByPrimitiveId.get(primitive.id);
        const engineId = atom ? engineRecords.get(atom.engine) : null;
        if (engineId) record.relationships.push({ type: "belongs_to", target_id: engineId });
        if (!atom) issues.push({ type: "unmatched_domain_primitive", id: primitive.id, source_ref: primitive.provenance?.source_ref || "" });
      }
    }
  }

  const domainIds = new Set([...importedPrimitiveIds].filter((id) => id.startsWith("we.")));
  const indexIds = new Set([...atomByPrimitiveId.keys()]);
  const missingRegistryIds = [...indexIds].filter((id) => !domainIds.has(id));
  const orphanRegistryIds = [...domainIds].filter((id) => !indexIds.has(id));
  if (missingRegistryIds.length || orphanRegistryIds.length) {
    issues.push({ type: "atom_registry_mismatch", missing_registry_ids: missingRegistryIds, orphan_registry_ids: orphanRegistryIds });
  }

  const duplicateIds = records.map((record) => record.id).filter((id, index, all) => all.indexOf(id) !== index);
  const manifestPrimitiveIds = new Set(records.filter((record) => record.kind === "primitive").map((record) => record.id));
  const missingManifestPrimitiveIds = [...importedPrimitiveIds].filter((id) => (id.startsWith("we.") || id.startsWith("ce.")) && !manifestPrimitiveIds.has(id));
  const uniqueRecords = [...new Map(records.map((record) => [record.id, record])).values()].sort((a, b) => a.id.localeCompare(b.id));
  const validationErrors = uniqueRecords.flatMap((record) => validateRecord(record).map((error) => ({ id: record.id, error })));
  const report = {
    record_count: uniqueRecords.length,
    by_kind: uniqueRecords.reduce((counts, record) => ({ ...counts, [record.kind]: (counts[record.kind] || 0) + 1 }), {}),
    engine_count: engineRecords.size,
    workflow_count: uniqueRecords.filter((record) => record.kind === "workflow").length,
    atom_index_count: atomIndex.length,
    imported_domain_primitive_count: uniqueRecords.filter((record) => record.kind === "primitive" && record.id.startsWith("we.")).length,
    registry_domain_primitive_count: domainIds.size,
    imported_general_primitive_count: uniqueRecords.filter((record) => record.kind === "primitive" && record.id.startsWith("ce.")).length,
    registry_general_primitive_count: [...importedPrimitiveIds].filter((id) => id.startsWith("ce.")).length,
    missing_manifest_primitive_ids: missingManifestPrimitiveIds,
    duplicate_ids: [...new Set(duplicateIds)],
    missing_registry_ids: missingRegistryIds,
    orphan_registry_ids: orphanRegistryIds,
    validation_errors: validationErrors,
    issues,
    safety: { code_executed: false, capability_instructions_executed: false, private_data_accessed: false, database_written: false, production_deployed: false }
  };

  return {
    schema_version: "1.0",
    parser_version: PARSER_VERSION,
    source_snapshots: Object.fromEntries(snapshots),
    report,
    records: uniqueRecords
  };
}

async function main(argv = process.argv.slice(2)) {
  if (argv.includes("--help")) {
    process.stdout.write("Usage: node scripts/phase1-import.mjs [--out <path>] [--check]\nDefault mode is read-only and prints deterministic catalog JSON to stdout.\n");
    return;
  }
  const config = JSON.parse(await readFile(CONFIG_PATH, "utf8"));
  const catalog = await importSources(config);
  if (catalog.report.duplicate_ids.length) throw new Error(`Duplicate catalog IDs: ${catalog.report.duplicate_ids.join(", ")}`);
  if (catalog.report.validation_errors.length) throw new Error(`Manifest validation failed: ${JSON.stringify(catalog.report.validation_errors.slice(0, 20))}`);
  if (catalog.report.missing_registry_ids.length || catalog.report.orphan_registry_ids.length) throw new Error("Writing atom index and cognitive registry are out of sync.");
  if (catalog.report.missing_manifest_primitive_ids.length) throw new Error("One or more source primitives could not be normalized into manifest records.");
  if (argv.includes("--check")) {
    process.stdout.write(JSON.stringify(catalog.report, null, 2) + "\n");
    return;
  }
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

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`Phase 1 import failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}
