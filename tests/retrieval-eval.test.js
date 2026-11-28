import { describe, expect, it } from 'vitest';
import {
  keywordSearch,
  literalSearch,
  runComparison,
  structuredSearch,
  evaluateStrategy,
  toCapabilityRecord,
  tokenize
} from '../scripts/retrieval-eval.mjs';

const records = [
  {
    id: 'a',
    kind: 'knowledge',
    name: '先定验收标准',
    description: '开工前先定义做到什么程度算对',
    summary: '模糊需求先写清可核的验收指标',
    tags: ['方法', '验收']
  },
  {
    id: 'b',
    kind: 'tool',
    name: '模型实测打分脚本',
    description: '对同一批请求实测成功率与延迟',
    summary: '按测出来的分数做模型路由',
    tags: ['工具', '评测']
  }
];

describe('retrieval evaluation pilot', () => {
  it('tokenizes Chinese bigrams and Latin words', () => {
    const tokens = tokenize('机关公文 AI tool');
    expect(tokens).toContain('机关');
    expect(tokens).toContain('公文');
    expect(tokens).toContain('ai');
    expect(tokens).toContain('tool');
  });

  it('documents the literal whole-query substring baseline', () => {
    expect(literalSearch('需求还说不清怎么定验收', records)).toHaveLength(0);
    expect(literalSearch('先定验收标准', records)[0].asset_id).toBe('a');
  });

  it('ranks the right record first with token overlap', () => {
    expect(keywordSearch('模型实测成功率', records)[0].asset_id).toBe('b');
    expect(structuredSearch('怎么定验收指标', records)[0].asset_id).toBe('a');
  });

  it('computes ranking metrics against explicit judgments', () => {
    const report = evaluateStrategy(keywordSearch, records, {
      k: 2,
      tasks: [
        { id: 't1', query: '怎么定验收指标', relevant: [{ asset_id: 'a', relevance: 3 }] },
        { id: 't2', query: '模型实测成功率', relevant: [{ asset_id: 'b', relevance: 3 }] }
      ]
    });
    expect(report.metrics.recall_at_k).toBe(1);
    expect(report.metrics.precision_at_1).toBe(1);
    expect(report.metrics.mrr).toBeGreaterThan(0);
    expect(report.metrics.ndcg_at_k).toBeLessThanOrEqual(1);
  });

  it('compares all three strategies on a catalog-shaped input', () => {
    const catalog = { nodes: records.map((record) => ({ id: record.id, vault_type: record.kind, title: record.name, summary: record.summary, recommendation_reason: record.description, scenario_tags: record.tags })) };
    const report = runComparison(catalog, {
      k: 2,
      tasks: [{ id: 't1', query: '模型实测成功率', relevant: [{ asset_id: 'b', relevance: 3 }] }]
    });
    expect(report.catalog_record_count).toBe(2);
    expect(Object.keys(report.strategies).sort()).toEqual(['keyword', 'literal', 'structured']);
    expect(report.strategies.structured.recall_at_k).toBe(1);
  });

  it('maps knowledge nodes to capability records', () => {
    const mapped = toCapabilityRecord({ id: 'x', vault_type: 'tool', title: 'T', summary: 'S', recommendation_reason: 'R', scenario_tags: ['tag'] });
    expect(mapped).toMatchObject({ id: 'x', kind: 'tool', name: 'T', summary: 'S', description: 'R', tags: ['tag'] });
  });
});