import { afterEach, describe, expect, it, vi } from "vitest";
import {
  extractAtomDescription,
  importSources,
  matchesAllowlist,
  parseFrontmatter,
  sha256,
  stableStringify,
  toSafeId
} from "../scripts/phase1-import.mjs";

describe("Phase 1 importer primitives", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("parses block frontmatter without executing the body", () => {
    const source = ["---", "name: test-engine", "description: |", "  A sufficiently detailed capability description.", "  A second line.", "---", "# Body"].join("\n");
    const parsed = parseFrontmatter(source);
    expect(parsed.metadata.name).toBe("test-engine");
    expect(parsed.metadata.description).toBe("A sufficiently detailed capability description.\nA second line.");
    expect(parsed.body).toContain("# Body");
  });

  it("extracts atom definitions from both tables and headed sections", () => {
    const table = "| 1 | 共识假装 | 把个人判断包装成共识，再拆穿它 | 例句 | 族 |";
    expect(extractAtomDescription(table, { heading: "#1 共识假装" })).toBe("把个人判断包装成共识，再拆穿它");
    const section = "## 2. 题记装置\n\n**族**：独有\n**定义**：正文前放一句文学引语定调，再转入人物。\n\n## 3. 下一节";
    expect(extractAtomDescription(section, { heading: "## 2. 题记装置" })).toBe("正文前放一句文学引语定调，再转入人物。");
  });

  it("matches explicit allowlist patterns only", () => {
    expect(matchesAllowlist("feature-writing/SKILL.md", ["*-writing/SKILL.md"])).toBe(true);
    expect(matchesAllowlist("cangjie/SKILL.md", ["*-writing/SKILL.md"])).toBe(false);
    expect(matchesAllowlist("private/.env", ["*-writing/SKILL.md"])).toBe(false);
  });

  it("creates stable hashes independent of object key order", () => {
    expect(stableStringify({ b: 2, a: 1 })).toBe(stableStringify({ a: 1, b: 2 }));
    expect(sha256({ b: 2, a: 1 })).toBe(sha256({ a: 1, b: 2 }));
    expect(toSafeId("Example / Capability")).toBe("example-capability");
  });
});

describe("Phase 1 importer integration", () => {
  it("normalizes pinned snapshots and preserves immutable provenance", async () => {
    const commit = "a".repeat(40);
    const blob = "b".repeat(40);
    const sourceFiles = {
      "Greatbeing/AI-Knowledge-Bank": {
        "data/akb_seed_nodes.json": JSON.stringify([{ id: "seed-1", title: "Seed knowledge asset", content: { vault: "knowledge", summary: "A sufficiently detailed seed knowledge description for this fixture." } }]),
        "data/db.json": JSON.stringify({ nodes: [{ id: "db-1", title: "DB knowledge asset", vault_type: "knowledge", summary: "A sufficiently detailed local seed database description." }], signals: [{ id: "not-imported" }] })
      },
      "Greatbeing/cognitive-engine": {
        "registry/writing-engines.json": JSON.stringify({ primitives: [{ id: "we.test-writing.a1", name: "Test atom", purpose: "A sufficiently detailed primitive description for this fixture.", kind: "domain", family: "test", tags: ["test"], lifecycle: "draft" }] }),
        "registry/general.json": JSON.stringify({ primitives: [{ id: "ce.general.test", name: "General check", purpose: "A sufficiently detailed general primitive description for this fixture.", kind: "general", lifecycle: "draft" }] })
      },
      "Greatbeing/writing-engines": {
        "atoms/index.json": JSON.stringify([{ id: "test-writing.1", name: "Test atom", engine: "test-writing", family: "test", file: "test-writing/references/atom-ops.md", heading: "## 1. Test atom" }]),
        "test-writing/SKILL.md": ["---", "name: test-writing", "description: |", "  A sufficiently detailed engine description for this fixture.", "---", "# Instructions (not executed)"].join("\n"),
        "test-writing/references/atom-ops.md": "## 1. Test atom\nDescription only.",
        "cangjie/SKILL.md": ["---", "name: cangjie", "description: A sufficiently detailed engine authoring workflow description for this fixture.", "---", "# Workflow"].join("\n")
      }
    };
    const config = {
      policy: { immutable_refs_required: true },
      sources: [
        { repository: "Greatbeing/AI-Knowledge-Bank", ref: "main", commit_sha: commit, parser: "akb-seed", allowlist: ["data/akb_seed_nodes.json", "data/db.json"] },
        { repository: "Greatbeing/cognitive-engine", ref: "main", commit_sha: commit, parser: "cognitive-registry", allowlist: ["registry/writing-engines.json", "registry/general.json"] },
        { repository: "Greatbeing/writing-engines", ref: "main", commit_sha: commit, parser: "writing-engines", allowlist: ["atoms/index.json", "*-writing/SKILL.md", "cangjie/SKILL.md", "*-writing/references/atom-ops.md"] }
      ]
    };
    vi.stubGlobal("fetch", vi.fn(async (input) => {
      const url = String(input);
      if (url.includes("/git/trees/")) {
        const repository = url.split("/repos/")[1].split("/git/trees/")[0];
        const tree = Object.keys(sourceFiles[repository]).map((path) => ({ path, type: "blob", sha: blob }));
        return new Response(JSON.stringify({ sha: commit, truncated: false, tree }), { status: 200 });
      }
      const match = url.match(/raw\.githubusercontent\.com\/([^/]+\/[^/]+)\/[^/]+\/(.+)$/);
      const repository = match?.[1];
      const path = match?.[2] ? decodeURIComponent(match[2]) : "";
      const content = sourceFiles[repository]?.[path];
      return content === undefined ? new Response("not found", { status: 404 }) : new Response(content, { status: 200 });
    }));

    const first = await importSources(config);
    const second = await importSources(config);
    expect(first).toEqual(second);
    expect(first.report.record_count).toBe(6);
    expect(first.report.engine_count).toBe(1);
    expect(first.report.workflow_count).toBe(1);
    expect(first.records.find((record) => record.id === "we.workflow.cangjie-authoring").kind).toBe("workflow");
    expect(first.report.atom_index_count).toBe(1);
    expect(first.report.imported_domain_primitive_count).toBe(1);
    expect(first.report.imported_general_primitive_count).toBe(1);
    expect(first.report.validation_errors).toEqual([]);
    expect(first.report.missing_registry_ids).toEqual([]);
    expect(first.report.orphan_registry_ids).toEqual([]);
    expect(first.report.safety.code_executed).toBe(false);
    expect(first.records.find((record) => record.id === "we.test-writing.a1").source.blob_sha).toBe(blob);
    expect(first.records.find((record) => record.id === "we.test-writing.a1").relationships).toContainEqual({ type: "belongs_to", target_id: "we.engine.test-writing" });
    expect(first.records.find((record) => record.id === "we.engine.test-writing").relationships).toContainEqual({ type: "contains", target_id: "we.test-writing.a1" });
    expect(first.records.some((record) => record.id.includes("not-imported"))).toBe(false);
  });

  it("rejects mutable source refs", async () => {
    await expect(importSources({ policy: { immutable_refs_required: true }, sources: [{ repository: "x/y", ref: "main", commit_sha: "main", parser: "x", allowlist: [] }] }))
      .rejects.toThrow("not pinned to a full commit SHA");
  });
});
