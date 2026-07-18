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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function localeBlock(source, declaration, locale) {
  const declarationStart = source.indexOf(declaration);
  const localeStart = source.indexOf(`  ${locale}: {`, declarationStart);
  const localeEnd = locale === 'zh'
    ? source.indexOf('\n  en: {', localeStart)
    : localeStart + source.slice(localeStart).search(/\r?\n\s*};/);

  expect(declarationStart).toBeGreaterThanOrEqual(0);
  expect(localeStart).toBeGreaterThanOrEqual(0);
  expect(localeEnd).toBeGreaterThan(localeStart);
  return source.slice(localeStart, localeEnd);
}

function expectKeyValue(source, key, value) {
  expect(source).toMatch(
    new RegExp(`(?:["']${escapeRegExp(key)}["']|\\b${escapeRegExp(key)})\\s*:\\s*["']${escapeRegExp(value)}["']`)
  );
}

function expectLinkedI18nCopy(source, key, value) {
  expect(source).toMatch(
    new RegExp(`<a\\b(?=[^>]*\\bdata-i18n=["']${escapeRegExp(key)}["'])[^>]*>\\s*${escapeRegExp(value)}\\s*</a>`, 'i')
  );
}

describe('shared typography', () => {
  it.each(pageNames)('%s loads the shared type system and Chinese font pair', (pageName) => {
    const source = pageSources[pageName];
    const stylesheetTags = [...source.matchAll(/<link\b(?=[^>]*\brel=["']stylesheet["'])[^>]*>/gi)]
      .map(([tag]) => tag);

    expect(stylesheetTags.at(-1)).toMatch(/\bhref=["']\.\/assets\/typography\.css["']/i);
    expect(source).toMatch(/fonts\.googleapis\.com\/css2\?[^"']*Noto(?:\+|%20)Serif(?:\+|%20)SC/i);
    expect(source).toMatch(/fonts\.googleapis\.com\/css2\?[^"']*Noto(?:\+|%20)Sans(?:\+|%20)SC/i);
  });
});

describe('approved bilingual content', () => {
  it('uses the public-knowledge homepage promise and supporting copy', () => {
    expect(homepageSource).toContain('把分散的 AI 实践，变成可验证、可复用、持续演化的公共知识。');
    expect(homepageSource).toContain('在知识框架、执行工具和真实案例之间找到可用方法；也把你的实践结果带回来，帮助下一版本更可靠。');
    expect(homepageSource).toContain('Turn scattered AI practice into public knowledge that can be tested, reused, and improved.');
    expect(homepageSource).toContain('Find useful methods across knowledge frames, executable tools, and real cases—and bring your results back so the next version is more reliable.');
  });

  it('renders equal entry points for finding and contributing evidence', () => {
    expectLinkedI18nCopy(homepageSource, 'primaryCta', '查找已验证的方法');
    expectLinkedI18nCopy(homepageSource, 'secondaryCta', '贡献一次真实验证');

    const englishHomepage = localeBlock(homepageSource, 'const translations = {', 'en');
    expectKeyValue(englishHomepage, 'primaryCta', 'Find verified methods');
    expectKeyValue(englishHomepage, 'secondaryCta', 'Contribute real validation');
  });

  it('maps each vault promise to the correct page and locale', () => {
    const chineseVaultCopy = localeBlock(vaultPageSource, 'const dictionaries = {', 'zh');
    const englishVaultCopy = localeBlock(vaultPageSource, 'const dictionaries = {', 'en');
    const pagePromises = [
      ['pageTitleKnowledge', '先理解为什么，再决定用什么。', 'Understand why before choosing what to use.'],
      ['pageTitleTools', '把有效方法，变成可以重复执行的路径。', 'Turn effective methods into repeatable execution paths.'],
      ['pageTitleCases', '用真实结果，判断一种方法能否迁移。', 'Use real outcomes to decide whether a method can transfer.'],
      ['pageTitleCommunity', '知识的可信度，来自一次次真实使用。', 'Knowledge earns trust through repeated real-world use.']
    ];

    for (const [key, chinese, english] of pagePromises) {
      expectKeyValue(chineseVaultCopy, key, chinese);
      expectKeyValue(englishVaultCopy, key, english);
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

    expect(homepageSource).toMatch(/metricNodesValue\.textContent\s*=\s*Number\(data\.stats\?\.knowledge\s*\|\|\s*0\)/);
    expect(homepageSource).toMatch(/metricRoutesValue\.textContent\s*=\s*Number\(data\.stats\?\.tools\s*\|\|\s*0\)/);
    expect(homepageSource).toMatch(/metricSignalsValue\.textContent\s*=\s*Number\(data\.stats\?\.cases\s*\|\|\s*0\)/);
    expect(homepageSource).not.toMatch(/total\s*\*\s*(?:2|6|8)/);
  });

  it('removes the superseded slogan and redundant static sections', () => {
    expect(homepageSource).not.toContain('别再一个人摸索 AI');

    for (const sectionId of ['vision-mission', 'engines', 'experience-map', 'ecosystem']) {
      expect(homepageSource).not.toMatch(new RegExp(`\\bid=["']${sectionId}["']`, 'i'));
    }

    for (const translationKey of ['missionTitle', 'enginesTitle', 'experienceTitle', 'ecosystemTitle']) {
      expect(homepageSource).not.toMatch(new RegExp(`\\b${translationKey}\\s*:`));
    }

    for (const oldHeading of [
      '让每一次 AI 实践，都成为可验证、可复用、可共创的公共知识资产。',
      '两套引擎，让知识从静态内容变成可生长的能力网络。',
      '从这里进入三库、两引擎和共创流程。',
      '为真实协作准备的基础设施'
    ]) {
      expect(homepageSource).not.toContain(oldHeading);
    }
  });
});

describe('Dashboard bilingual authentication', () => {
  it('exposes one language toggle and state-scoped translation hooks', () => {
    expect(dashboardSource.match(/\bid=["']language-toggle["']/gi) ?? []).toHaveLength(1);

    const requiredStart = dashboardSource.indexOf('id="auth-required"');
    const unavailableStart = dashboardSource.indexOf('id="auth-unavailable"');
    const contentStart = dashboardSource.indexOf('id="dashboard-content"');
    const requiredState = dashboardSource.slice(requiredStart, unavailableStart);
    const unavailableState = dashboardSource.slice(unavailableStart, contentStart);

    expect(requiredStart).toBeGreaterThanOrEqual(0);
    expect(unavailableStart).toBeGreaterThan(requiredStart);
    expect(contentStart).toBeGreaterThan(unavailableStart);
    expect(requiredState).toContain('data-i18n="dashboard.authRequired.title"');
    expect(requiredState).toContain('data-i18n="dashboard.authRequired.copy"');
    expect(unavailableState).toContain('data-i18n="dashboard.authUnavailable.title"');
    expect(unavailableState).toContain('data-i18n="dashboard.authUnavailable.copy"');
  });

  it('defines the approved auth-state copy in the correct locale', () => {
    const chineseDashboardCopy = localeBlock(sharedI18nSource, 'export const translations = {', 'zh');
    const englishDashboardCopy = localeBlock(sharedI18nSource, 'export const translations = {', 'en');
    const approvedAuthCopy = [
      ['dashboard.authRequired.title', '登录后，继续你的贡献记录', 'Sign in to continue your contribution history'],
      ['dashboard.authRequired.copy', '使用 GitHub 登录，验证真实节点并查看信誉、徽章和通知。', 'Sign in with GitHub to validate real nodes and review your reputation, badges, and notifications.'],
      ['dashboard.authUnavailable.title', '此部署未启用用户登录', 'Sign-in is unavailable on this deployment']
    ];

    for (const [key, chinese, english] of approvedAuthCopy) {
      expectKeyValue(chineseDashboardCopy, key, chinese);
      expectKeyValue(englishDashboardCopy, key, english);
    }
  });
});
