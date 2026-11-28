import { describe, expect, it } from "vitest";
import { evaluateBenchmark, rankCapabilities, tokenize } from "../scripts/evaluate-catalog-retrieval.mjs";

describe("offline catalog retrieval baseline", () => {
  const records = [
    { id: "we.engine.gongwen-writing", kind: "engine", name: "机关公文写作", description: "起草通知报告请示和会议纪要，规范公文格式", summary: "机关公文材料", tags: ["gongwen-writing"] },
    { id: "we.engine.feature-writing", kind: "engine", name: "人物特稿", description: "深度报道采访现场人物变化", summary: "人物报道", tags: ["feature-writing"] },
    { id: "ce.general.evidence_grounding", kind: "primitive", name: "证据绑定", description: "把结论绑定到素材中的具体出处", summary: "识别无支撑陈述", tags: ["verification"] }
  ];

  it("tokenizes Chinese bigrams and Latin identifiers", () => {
    const tokens = tokenize("机关公文 AI tool");
    expect(tokens).toContain("机关");
    expect(tokens).toContain("公文");
    expect(tokens).toContain("ai");
    expect(tokens).toContain("tool");
  });

  it("ranks task-matched capabilities ahead of unrelated records", () => {
    const results = rankCapabilities("起草机关公文通知报告", records, 3);
    expect(results[0].asset_id).toBe("we.engine.gongwen-writing");
  });

  it("computes Recall@K, MRR and NDCG@K against explicit judgments", () => {
    const report = evaluateBenchmark({ records }, {
      schema_version: "1.0",
      k: 2,
      tasks: [
        { id: "a", query: "机关公文通知报告", relevant: [{ asset_id: "we.engine.gongwen-writing", relevance: 3 }] },
        { id: "b", query: "证据绑定具体出处", relevant: [{ asset_id: "ce.general.evidence_grounding", relevance: 3 }] }
      ]
    });
    expect(report.metrics.recall_at_k).toBe(1);
    expect(report.metrics.mrr).toBe(1);
    expect(report.metrics.ndcg_at_k).toBe(1);
    expect(report.metrics.precision_at_k).toBe(0.5);
  });
});
