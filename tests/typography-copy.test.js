import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

const pageNames = [
  'index.html',
  'knowledge.html',
  'tools.html',
  'cases.html',
  'community.html',
  'dashboard.html'
];

function readSource(relativePath) {
  return readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url)), 'utf8');
}

const pageSources = Object.fromEntries(pageNames.map((pageName) => [pageName, readSource(pageName)]));
const homepageSource = pageSources['index.html'];
const dashboardSource = pageSources['dashboard.html'];
const vaultPageSource = readSource('assets/vault-page.js');
const sharedI18nSource = readSource('lib/shared/i18n.js');

describe('shared typography', () => {
  it.each(pageNames)('%s loads the shared type system and Chinese font pair', (pageName) => {
    const source = pageSources[pageName];

    expect(source).toMatch(
      /<link\b(?=[^>]*\brel=["']stylesheet["'])(?=[^>]*\bhref=["']\.\/assets\/typography\.css["'])[^>]*>/i
    );
    expect(source).toMatch(/Noto(?:\+|%20|\s)Serif(?:\+|%20|\s)SC/i);
    expect(source).toMatch(/Noto(?:\+|%20|\s)Sans(?:\+|%20|\s)SC/i);
  });
});

describe('approved Chinese content', () => {
  it('uses the public-knowledge homepage promise', () => {
    expect(homepageSource).toContain('把分散的 AI 实践，变成可验证、可复用、持续演化的公共知识。');
  });

  it('offers equal entry points for finding and contributing evidence', () => {
    expect(homepageSource).toContain('查找已验证的方法');
    expect(homepageSource).toContain('贡献一次真实验证');
  });

  it('gives each vault page its approved promise', () => {
    const pagePromises = [
      '先理解为什么，再决定用什么。',
      '把有效方法，变成可以重复执行的路径。',
      '用真实结果，判断一种方法能否迁移。',
      '知识的可信度，来自一次次真实使用。'
    ];

    for (const promise of pagePromises) {
      expect(vaultPageSource).toContain(promise);
    }
  });
});

describe('truthful and concise homepage content', () => {
  it('starts live metrics with neutral placeholders instead of invented counts', () => {
    const metricIds = ['metric-nodes-value', 'metric-routes-value', 'metric-signals-value'];

    for (const metricId of metricIds) {
      expect(homepageSource).toMatch(
        new RegExp(`\\bid=["']${metricId}["'][^>]*>\\s*—\\s*<`, 'i')
      );
    }

    for (const inventedCount of ['2,847', '15,234', '42,891']) {
      expect(homepageSource).not.toContain(inventedCount);
    }
  });

  it('removes the superseded slogan and redundant static sections', () => {
    expect(homepageSource).not.toContain('别再一个人摸索 AI');

    for (const sectionId of ['vision-mission', 'engines', 'experience-map', 'ecosystem']) {
      expect(homepageSource).not.toMatch(new RegExp(`\\bid=["']${sectionId}["']`, 'i'));
    }
  });
});

describe('Dashboard bilingual authentication', () => {
  it('exposes one language toggle and translation hooks for the auth-required state', () => {
    expect(dashboardSource.match(/\bid=["']language-toggle["']/gi) ?? []).toHaveLength(1);
    expect(dashboardSource).toMatch(
      /\bdata-i18n=["']dashboard\.authRequired\.title["']/i
    );
    expect(dashboardSource).toMatch(
      /\bdata-i18n=["']dashboard\.authRequired\.copy["']/i
    );
  });

  it('defines the approved auth-required copy in Chinese and English', () => {
    const approvedAuthCopy = [
      ['dashboard.authRequired.title', '登录后，继续你的贡献记录'],
      ['dashboard.authRequired.copy', '使用 GitHub 登录，验证真实节点并查看信誉、徽章和通知。'],
      ['dashboard.authRequired.title', 'Sign in to continue your contribution history'],
      ['dashboard.authRequired.copy', 'Sign in with GitHub to validate real nodes and review your reputation, badges, and notifications.']
    ];

    for (const [key, copy] of approvedAuthCopy) {
      expect(sharedI18nSource).toMatch(
        new RegExp(`["']${key.replaceAll('.', '\\.')}["']\\s*:\\s*["']${copy}["']`)
      );
    }
  });
});
