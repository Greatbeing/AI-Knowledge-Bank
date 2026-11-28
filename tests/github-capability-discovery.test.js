import { afterEach, describe, expect, it, vi } from "vitest";
import { assessRepository, discoverCandidates } from "../scripts/github-capability-discovery.mjs";

describe("GitHub capability candidate assessment", () => {
  afterEach(() => vi.unstubAllGlobals());
  const now = Date.parse("2026-11-28T00:00:00Z");
  const base = {
    full_name: "example/tool",
    description: "A useful tool for a defined engineering task.",
    html_url: "https://github.com/example/tool",
    default_branch: "main",
    language: "TypeScript",
    topics: ["automation", "developer-tools"],
    license: { spdx_id: "MIT" },
    archived: false,
    disabled: false,
    stargazers_count: 1000,
    forks_count: 100,
    open_issues_count: 12,
    pushed_at: "2026-11-20T00:00:00Z",
    score: 0.95
  };

  it("shortlists active repositories only as candidates, not verified capabilities", () => {
    const result = assessRepository(base, now);
    expect(result.decision).toBe("shortlist");
    expect(result.license_status).toBe("identified_not_legal_reviewed");
    expect(result.source_ref_status).toContain("resolve a full commit SHA");
    expect(result.quality_claim).toContain("Not evaluated");
    expect(result.score_components.maintenance).toBe(30);
  });

  it("requires review when license information is missing", () => {
    const result = assessRepository({ ...base, license: null }, now);
    expect(result.decision).toBe("review_required");
    expect(result.risk_flags).toContain("license_unknown_or_unasserted");
  });

  it("rejects archived or disabled repositories", () => {
    expect(assessRepository({ ...base, archived: true }, now).decision).toBe("reject");
    expect(assessRepository({ ...base, disabled: true }, now).decision).toBe("reject");
  });

  it("defers stale repositories and exposes the reason", () => {
    const result = assessRepository({ ...base, pushed_at: "2024-01-01T00:00:00Z" }, now);
    expect(result.decision).toBe("defer");
    expect(result.risk_flags).toContain("no_push_in_over_one_year");
  });

  it("queries GitHub repository search and returns ranked review candidates", async () => {
    const repositories = [
      { full_name: "example/older", description: "Older repository.", html_url: "https://github.com/example/older", default_branch: "main", language: "TypeScript", topics: ["tooling"], license: { spdx_id: "MIT" }, archived: false, disabled: false, stargazers_count: 10, forks_count: 2, pushed_at: "2026-11-20T00:00:00Z", score: 0.6 },
      { full_name: "example/newer", description: "Newer repository.", html_url: "https://github.com/example/newer", default_branch: "main", language: "TypeScript", topics: ["tooling"], license: { spdx_id: "MIT" }, archived: false, disabled: false, stargazers_count: 500, forks_count: 50, pushed_at: "2026-11-26T00:00:00Z", score: 0.9 }
    ];
    const fetchMock = vi.fn(async (input) => {
      const url = new URL(String(input));
      expect(url.hostname).toBe("api.github.com");
      expect(url.pathname).toBe("/search/repositories");
      expect(url.searchParams.get("q")).toBe("json schema validator language:TypeScript");
      return new Response(JSON.stringify({ total_count: 2, items: repositories }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await discoverCandidates("json schema validator language:TypeScript", 5, now);
    expect(result.total_count).toBe(2);
    expect(result.candidates.map((candidate) => candidate.repository)).toEqual(["example/newer", "example/older"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not treat stars as proof of quality", () => {
    const result = assessRepository({ ...base, stargazers_count: 1000000 }, now);
    expect(result.quality_claim).toContain("not proof");
  });
});
