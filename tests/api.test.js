/**
 * tests/api.test.js
 *
 * Unit tests for the pure helper functions used in functions/api/[[path]].js.
 *
 * Because the functions in [[path]].js are not exported, the core logic is
 * replicated here verbatim from the source file so that behaviour can be
 * verified in isolation. If [[path]].js changes, these copies must be kept
 * in sync.
 */

import { describe, it, expect } from 'vitest';

/* -------------------------------------------------------------------------- */
/*  Pure functions copied verbatim from functions/api/[[path]].js             */
/* -------------------------------------------------------------------------- */

function clampNumber(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function normalizeLocale(locale) {
  if (locale === 'zh' || locale === 'en') return locale;
  return 'bilingual';
}

function normalizeVaultType(vaultType, category = '', nodeType = '') {
  if (vaultType === 'tool' || vaultType === 'case' || vaultType === 'knowledge') return vaultType;
  if (nodeType === 'workflow') return 'tool';
  if (nodeType === 'case_study' || nodeType === 'case') return 'case';
  if (nodeType === 'prompt') return 'knowledge';

  const categoryText = String(category || '').toLowerCase();
  if (['tool', 'workflow', 'agent', 'sandbox'].some((term) => categoryText.includes(term))) return 'tool';
  if (['case', 'study', 'sop', 'example'].some((term) => categoryText.includes(term))) return 'case';
  return 'knowledge';
}

function filterNodes(nodes, query, locale) {
  const normalized = query.trim().toLowerCase();
  return nodes.filter((node) => {
    const localeMatch = locale === 'bilingual' || node.language === 'bilingual' || node.language === locale;
    if (!localeMatch) return false;
    if (!normalized) return true;
    const haystack = [
      node.title,
      node.summary,
      node.recommendation_reason,
      ...node.scenario_tags,
      ...node.source_refs
    ].join(' ').toLowerCase();
    return normalized.split(/\s+/).some((term) => haystack.includes(term));
  });
}

function defaultImpact(signalType) {
  const impact = {
    validated: 12,
    used: 6,
    forked: 8,
    commented: 3,
    merged: 24,
    disputed: -10
  };
  return impact[signalType] || 1;
}

function sanitizeError(error) {
  const message = error && error.message ? String(error.message) : 'Unknown backend warning.';
  return message.slice(0, 220);
}

/* -------------------------------------------------------------------------- */
/*  Test fixtures                                                             */
/* -------------------------------------------------------------------------- */

const SAMPLE_NODES = [
  {
    id: 'n1',
    title: '本地化判断框架',
    summary: '拆分语言、文化、渠道和合规四类变量',
    recommendation_reason: '为跨境营销提供认知解释',
    scenario_tags: ['marketing', 'localization'],
    source_refs: ['demo corpus'],
    language: 'bilingual'
  },
  {
    id: 'n2',
    title: 'Translation Review Agent',
    summary: 'Generate, verify, unify style and flag risks',
    recommendation_reason: 'Turn knowledge into executable tool route',
    scenario_tags: ['agent', 'workflow'],
    source_refs: ['demo workflow'],
    language: 'en'
  },
  {
    id: 'n3',
    title: '拉美素材复用案例',
    summary: '复用 37 条广告素材验证 SOP',
    recommendation_reason: '用真实 Before/After 补足证据链',
    scenario_tags: ['case-study', 'before-after'],
    source_refs: ['demo case'],
    language: 'zh'
  }
];

/* -------------------------------------------------------------------------- */
/*  clampNumber                                                               */
/* -------------------------------------------------------------------------- */

describe('clampNumber', () => {
  it('returns the value when it is within the range', () => {
    expect(clampNumber(5, 1, 10)).toBe(5);
    expect(clampNumber(0, -10, 10)).toBe(0);
    expect(clampNumber(3.5, 1, 6)).toBe(3.5);
  });

  it('clamps to min when value is below the range', () => {
    expect(clampNumber(-5, 1, 10)).toBe(1);
    expect(clampNumber(0, 0, 100)).toBe(0);
  });

  it('clamps to max when value is above the range', () => {
    expect(clampNumber(100, 1, 10)).toBe(10);
    expect(clampNumber(999, 0, 50)).toBe(50);
  });

  it('returns min when value is NaN', () => {
    expect(clampNumber(NaN, 5, 10)).toBe(5);
  });

  it('returns min when value is Infinity', () => {
    expect(clampNumber(Infinity, 1, 10)).toBe(1);
    expect(clampNumber(-Infinity, 1, 10)).toBe(1);
  });

  it('handles negative ranges correctly', () => {
    expect(clampNumber(-3, -20, -5)).toBe(-5);
    expect(clampNumber(-50, -20, -5)).toBe(-20);
  });

  it('handles equal min and max', () => {
    expect(clampNumber(100, 7, 7)).toBe(7);
    expect(clampNumber(0, 7, 7)).toBe(7);
  });
});

/* -------------------------------------------------------------------------- */
/*  normalizeLocale                                                           */
/* -------------------------------------------------------------------------- */

describe('normalizeLocale', () => {
  it('returns "zh" for "zh"', () => {
    expect(normalizeLocale('zh')).toBe('zh');
  });

  it('returns "en" for "en"', () => {
    expect(normalizeLocale('en')).toBe('en');
  });

  it('returns "bilingual" for undefined', () => {
    expect(normalizeLocale(undefined)).toBe('bilingual');
  });

  it('returns "bilingual" for null', () => {
    expect(normalizeLocale(null)).toBe('bilingual');
  });

  it('returns "bilingual" for empty string', () => {
    expect(normalizeLocale('')).toBe('bilingual');
  });

  it('returns "bilingual" for unsupported locales', () => {
    expect(normalizeLocale('fr')).toBe('bilingual');
    expect(normalizeLocale('ja')).toBe('bilingual');
    expect(normalizeLocale('ZH')).toBe('bilingual');
    expect(normalizeLocale('english')).toBe('bilingual');
  });
});

/* -------------------------------------------------------------------------- */
/*  normalizeVaultType                                                        */
/* -------------------------------------------------------------------------- */

describe('normalizeVaultType', () => {
  it('returns the vault type directly when it is valid', () => {
    expect(normalizeVaultType('knowledge')).toBe('knowledge');
    expect(normalizeVaultType('tool')).toBe('tool');
    expect(normalizeVaultType('case')).toBe('case');
  });

  it('maps nodeType "workflow" to "tool"', () => {
    expect(normalizeVaultType('', '', 'workflow')).toBe('tool');
  });

  it('maps nodeType "case_study" to "case"', () => {
    expect(normalizeVaultType('', '', 'case_study')).toBe('case');
  });

  it('maps nodeType "case" to "case"', () => {
    expect(normalizeVaultType('', '', 'case')).toBe('case');
  });

  it('maps nodeType "prompt" to "knowledge"', () => {
    expect(normalizeVaultType('', '', 'prompt')).toBe('knowledge');
  });

  it('maps category containing tool-related terms to "tool"', () => {
    expect(normalizeVaultType('', 'tool')).toBe('tool');
    expect(normalizeVaultType('', 'workflow')).toBe('tool');
    expect(normalizeVaultType('', 'agent')).toBe('tool');
    expect(normalizeVaultType('', 'sandbox')).toBe('tool');
  });

  it('maps category containing case-related terms to "case"', () => {
    expect(normalizeVaultType('', 'case')).toBe('case');
    expect(normalizeVaultType('', 'study')).toBe('case');
    expect(normalizeVaultType('', 'sop')).toBe('case');
    expect(normalizeVaultType('', 'example')).toBe('case');
  });

  it('is case-insensitive for category matching', () => {
    expect(normalizeVaultType('', 'TOOL')).toBe('tool');
    expect(normalizeVaultType('', 'CaseStudy')).toBe('case');
  });

  it('returns "knowledge" as the default fallback', () => {
    expect(normalizeVaultType('', '', '')).toBe('knowledge');
    expect(normalizeVaultType('', 'random', 'unknown')).toBe('knowledge');
  });

  it('prioritises explicit vaultType over nodeType and category', () => {
    expect(normalizeVaultType('tool', 'case', 'workflow')).toBe('tool');
    expect(normalizeVaultType('case', 'tool', 'prompt')).toBe('case');
  });
});

/* -------------------------------------------------------------------------- */
/*  filterNodes                                                               */
/* -------------------------------------------------------------------------- */

describe('filterNodes', () => {
  it('returns all locale-matching nodes when query is empty', () => {
    const result = filterNodes(SAMPLE_NODES, '', 'bilingual');
    expect(result).toHaveLength(3);
  });

  it('returns all locale-matching nodes when query is whitespace', () => {
    const result = filterNodes(SAMPLE_NODES, '   ', 'bilingual');
    expect(result).toHaveLength(3);
  });

  it('filters nodes by locale "zh"', () => {
    const result = filterNodes(SAMPLE_NODES, '', 'zh');
    // bilingual nodes and zh nodes match
    expect(result).toHaveLength(2);
    expect(result.map((n) => n.id)).toEqual(expect.arrayContaining(['n1', 'n3']));
  });

  it('filters nodes by locale "en"', () => {
    const result = filterNodes(SAMPLE_NODES, '', 'en');
    expect(result).toHaveLength(2);
    expect(result.map((n) => n.id)).toEqual(expect.arrayContaining(['n1', 'n2']));
  });

  it('excludes nodes that do not match locale', () => {
    const zhOnly = filterNodes(SAMPLE_NODES, '', 'zh');
    expect(zhOnly.find((n) => n.id === 'n2')).toBeUndefined();
  });

  it('matches nodes by title keyword', () => {
    const result = filterNodes(SAMPLE_NODES, '本地化', 'bilingual');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('n1');
  });

  it('matches nodes by summary keyword', () => {
    const result = filterNodes(SAMPLE_NODES, '广告素材', 'bilingual');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('n3');
  });

  it('matches nodes by scenario tag', () => {
    const result = filterNodes(SAMPLE_NODES, 'agent', 'bilingual');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('n2');
  });

  it('matches nodes by source ref', () => {
    const result = filterNodes(SAMPLE_NODES, 'corpus', 'bilingual');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('n1');
  });

  it('returns empty array when no nodes match the query', () => {
    const result = filterNodes(SAMPLE_NODES, 'nonexistentterm', 'bilingual');
    expect(result).toHaveLength(0);
  });

  it('combines locale and query filtering', () => {
    const result = filterNodes(SAMPLE_NODES, 'translation', 'en');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('n2');
  });

  it('returns empty when query matches but locale does not', () => {
    // n2 is language 'en'; searching its content with locale 'zh' excludes it
    // (n1 is bilingual so it matches 'zh', but its content does not contain 'Translation')
    const result = filterNodes(SAMPLE_NODES, 'Translation', 'zh');
    expect(result).toHaveLength(0);
  });

  it('handles multi-word queries with OR semantics', () => {
    const result = filterNodes(SAMPLE_NODES, '本地化 agent', 'bilingual');
    expect(result).toHaveLength(2);
  });
});

/* -------------------------------------------------------------------------- */
/*  defaultImpact                                                             */
/* -------------------------------------------------------------------------- */

describe('defaultImpact', () => {
  it('returns 12 for "validated"', () => {
    expect(defaultImpact('validated')).toBe(12);
  });

  it('returns 6 for "used"', () => {
    expect(defaultImpact('used')).toBe(6);
  });

  it('returns 8 for "forked"', () => {
    expect(defaultImpact('forked')).toBe(8);
  });

  it('returns 3 for "commented"', () => {
    expect(defaultImpact('commented')).toBe(3);
  });

  it('returns 24 for "merged"', () => {
    expect(defaultImpact('merged')).toBe(24);
  });

  it('returns -10 for "disputed"', () => {
    expect(defaultImpact('disputed')).toBe(-10);
  });

  it('returns 1 as fallback for unknown signal types', () => {
    expect(defaultImpact('unknown')).toBe(1);
    expect(defaultImpact('')).toBe(1);
    expect(defaultImpact(undefined)).toBe(1);
    expect(defaultImpact(null)).toBe(1);
  });
});

/* -------------------------------------------------------------------------- */
/*  sanitizeError                                                             */
/* -------------------------------------------------------------------------- */

describe('sanitizeError', () => {
  it('returns the error message for a normal Error object', () => {
    const error = new Error('Something went wrong');
    expect(sanitizeError(error)).toBe('Something went wrong');
  });

  it('truncates messages longer than 220 characters', () => {
    const longMessage = 'x'.repeat(300);
    const error = new Error(longMessage);
    const result = sanitizeError(error);
    expect(result).toHaveLength(220);
    expect(result).toBe('x'.repeat(220));
  });

  it('keeps messages exactly 220 characters unchanged', () => {
    const message = 'y'.repeat(220);
    const error = new Error(message);
    expect(sanitizeError(error)).toHaveLength(220);
    expect(sanitizeError(error)).toBe(message);
  });

  it('keeps messages shorter than 220 characters unchanged', () => {
    const error = new Error('short');
    expect(sanitizeError(error)).toBe('short');
  });

  it('returns default message when error has no message property', () => {
    expect(sanitizeError({})).toBe('Unknown backend warning.');
  });

  it('returns default message when error is null', () => {
    expect(sanitizeError(null)).toBe('Unknown backend warning.');
  });

  it('returns default message when error is undefined', () => {
    expect(sanitizeError(undefined)).toBe('Unknown backend warning.');
  });

  it('coerces non-string message to string', () => {
    const error = { message: 12345 };
    expect(sanitizeError(error)).toBe('12345');
  });
});
