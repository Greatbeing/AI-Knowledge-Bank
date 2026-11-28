import { describe, expect, it } from 'vitest';
import { buildCatalog } from '../scripts/build-catalog.mjs';

const node = (overrides = {}) => ({
  id: 'kb-a',
  vault_type: 'knowledge',
  title: '先定验收标准',
  summary: '开工前定义对的标准',
  recommendation_reason: '验收没定之前不选工具',
  scenario_tags: ['验收', '方法'],
  source_refs: ['docs/x.md'],
  language: 'zh',
  status: 'validated',
  created_at: '2026-11-20T00:00:00.000Z',
  ...overrides
});

describe('read-only capability catalog builder', () => {
  it('maps a knowledge node into a capability record with provenance', () => {
    const catalog = buildCatalog({ nodes: [node()] });
    expect(catalog.record_count).toBe(1);
    const record = catalog.records[0];
    expect(record).toMatchObject({
      asset_id: 'kb-a',
      kind: 'knowledge',
      name: '先定验收标准',
      summary: '开工前定义对的标准',
      description: '验收没定之前不选工具'
    });
    expect(record.tags).toEqual(['方法', '验收']);
    expect(record.provenance).toMatchObject({ vault: 'knowledge', status: 'validated', source_refs: ['docs/x.md'], language: 'zh' });
  });

  it('sorts records by asset_id and excludes drafts/rejected', () => {
    const catalog = buildCatalog({
      nodes: [
        node({ id: 'kb-z', title: 'Z', summary: 's' }),
        node({ id: 'kb-a' }),
        node({ id: 'kb-b', status: 'draft', title: 'B', summary: 's' }),
        node({ id: 'kb-c', status: 'rejected', title: 'C', summary: 's' })
      ]
    });
    expect(catalog.records.map((record) => record.asset_id)).toEqual(['kb-a', 'kb-z']);
  });

  it('rejects duplicate ids and incomplete nodes', () => {
    expect(() => buildCatalog({ nodes: [node(), node()] })).toThrow(/重复/);
    expect(() => buildCatalog({ nodes: [node({ summary: '' })] })).toThrow(/缺少/);
  });
});