import { describe, expect, it } from "vitest";
import { normalizeVault, parseFrontmatter, toSafeId } from "../scripts/phase1-import.mjs";

describe("Phase 1 importer parsing primitives", () => {
  it("normalizes the legacy three-vault values", () => {
    expect(normalizeVault("knowledge")).toBe("knowledge");
    expect(normalizeVault("tool")).toBe("tools");
    expect(normalizeVault("tools")).toBe("tools");
    expect(normalizeVault("case")).toBe("cases");
    expect(normalizeVault("unknown")).toBeUndefined();
  });

  it("parses SKILL.md frontmatter with a multiline description", () => {
    const source = [
      "---",
      "name: example-writing",
      "description: |",
      "  First trigger.",
      "  Second trigger.",
      "---",
      "# Engine",
      "Body text."
    ].join("\n");
    const parsed = parseFrontmatter(source);
    expect(parsed.metadata.name).toBe("example-writing");
    expect(parsed.metadata.description).toBe("First trigger.\nSecond trigger.");
    expect(parsed.body).toContain("# Engine");
  });

  it("preserves namespaced source identifiers without adding a second prefix", () => {
    expect(toSafeId("we.zhexuan.a1")).toBe("we.zhexuan.a1");
    expect(toSafeId("ce.general.claim_decomposition")).toBe("ce.general.claim_decomposition");
    expect(toSafeId("akb.seed.00000000-0000-0000-0000-000000000101")).toBe("akb.seed.00000000-0000-0000-0000-000000000101");
  });

  it("returns the original markdown when frontmatter is absent", () => {
    const markdown = "# No frontmatter\n\nContent.";
    const parsed = parseFrontmatter(markdown);
    expect(parsed.metadata).toEqual({});
    expect(parsed.body).toBe(markdown);
  });
});
