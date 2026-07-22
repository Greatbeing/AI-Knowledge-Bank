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
const typographySource = readSource('assets/typography.css');
const typographyControlSources = {
  'index.html': homepageSource,
  'dashboard.html': dashboardSource,
  'assets/vault-page.css': readSource('assets/vault-page.css'),
  'assets/typography.css': typographySource
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function localeBlock(source, declaration, locale) {
  const declarationStart = source.indexOf(declaration);
  const localeStart = source.search(new RegExp(`^[ \\t]*${locale}: \\{`, 'm'));
  const localeEnd = locale === 'zh'
    ? source.search(/^\s*en: \{/m)
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

  it('uses only the approved loaded weights and zero letter spacing', () => {
    for (const [sourceName, source] of Object.entries(typographyControlSources)) {
      const declaredWeights = [...source.matchAll(/font-weight\s*:\s*(\d+)/gi)].map((match) => Number(match[1]));
      expect(declaredWeights, sourceName).toEqual(expect.arrayContaining([]));
      expect(declaredWeights.every((weight) => [400, 500, 600, 700].includes(weight)), sourceName).toBe(true);
      expect(source, sourceName).not.toMatch(/letter-spacing\s*:\s*-(?:\d|\.)/i);
    }

    for (const source of Object.values(pageSources)) {
      expect(source).toMatch(/Noto\+Sans\+SC:wght@400;500;600;700/);
      expect(source).toMatch(/Noto\+Serif\+SC:wght@600;700/);
      expect(source).toMatch(/JetBrains\+Mono:wght@500;600/);
    }
  });

  it('does not use viewport-relative font sizing', () => {
    for (const [sourceName, source] of Object.entries(typographyControlSources)) {
      expect(source, sourceName).not.toMatch(/font-size\s*:[^;}]*(?:vw|cqw)/i);
    }
  });

  it('defines the fixed responsive hierarchy at the shared breakpoints', () => {
    expect(typographySource).toMatch(/\.home-hero-intro \.hero-title\s*{[^}]*font-size:\s*56px;[^}]*line-height:\s*1\.18/s);
    expect(typographySource).toMatch(/\.page-hero \.hero-title\s*{[^}]*font-size:\s*52px;[^}]*line-height:\s*1\.18/s);
    expect(typographySource).toMatch(/\.section-title,[\s\S]*?font-size:\s*40px;[\s\S]*?line-height:\s*1\.24/s);
    expect(typographySource).toMatch(/\.hero-copy,[\s\S]*font-size:\s*19px;[\s\S]*line-height:\s*1\.75/);
    expect(typographySource).toMatch(/\.dashboard-state-title\s*{[^}]*font-size:\s*24px;[^}]*line-height:\s*1\.35/s);
    expect(typographySource).toMatch(/@media \(max-width:\s*1100px\) and \(min-width:\s*861px\)[\s\S]*\.home-hero-intro \.hero-title\s*{[^}]*font-size:\s*48px/s);
    expect(typographySource).toMatch(/@media \(max-width:\s*1100px\) and \(min-width:\s*861px\)[\s\S]*\.home-hero-panel \.hero-quick\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
    expect(typographySource).toMatch(/@media \(max-width:\s*860px\)[\s\S]*\.home-hero-intro \.hero-title\s*{[^}]*font-size:\s*48px/s);
    expect(typographySource).toMatch(/@media \(max-width:\s*860px\)[\s\S]*\.page-hero \.hero-title\s*{[^}]*font-size:\s*44px/s);
    expect(typographySource).toMatch(/@media \(max-width:\s*860px\)[\s\S]*\.dashboard-state-title\s*{[^}]*font-size:\s*22px/s);
    expect(typographySource).toMatch(/@media \(max-width:\s*560px\)[\s\S]*\.home-hero-intro \.hero-title\s*{[^}]*font-size:\s*38px/s);
    expect(typographySource).toMatch(/@media \(max-width:\s*560px\)[\s\S]*\.page-hero \.hero-title\s*{[^}]*font-size:\s*36px/s);
    expect(typographySource).toMatch(/@media \(max-width:\s*560px\)[\s\S]*\.metric-grid\s*{[^}]*grid-template-columns:\s*repeat\(3,/s);
  });
});

describe('approved bilingual content', () => {
  it('uses the public-knowledge homepage promise and supporting copy', () => {
    const chineseHomepage = localeBlock(homepageSource, 'const translations = {', 'zh');
    const englishHomepage = localeBlock(homepageSource, 'const translations = {', 'en');
    const approvedCopy = [
      ['eyebrow', '经真实使用不断验证的 AI 方法', 'AI methods improved through real use'],
      ['heroTitle', '让有效的 AI 实践，成为可验证、可复用的公共知识。', 'Turn effective AI practice into reusable public knowledge.'],
      ['heroCopy', '从知识框架、执行路径和真实案例中找到答案；用过之后，把结果带回来，让下一版本更可靠。', 'Find the reasoning, workflow, and evidence behind a method. After using it, bring back the result so the next version is more reliable.'],
      ['heroQuickTitle', '先找方法，再选工具', 'Start with the method, not the tool.'],
      ['heroQuickCopy', '描述目标，查看为什么有效、如何执行、在哪些场景验证过。', 'Describe your goal to see why it works, how to run it, and where it has been tested.'],
      ['primaryCta', '开始查找方法', 'Find a method'],
      ['secondaryCta', '提交使用结果', 'Submit a result'],
      ['finalCtaTitle', '找到一个方法，带回一次真实结果。', 'Use one method. Bring back one real result.']
    ];

    for (const [key, chinese, english] of approvedCopy) {
      expectKeyValue(chineseHomepage, key, chinese);
      expectKeyValue(englishHomepage, key, english);
      expect(homepageSource).toContain(`data-i18n="${key}"`);
    }
  });

  it('renders equal entry points for finding and contributing evidence', () => {
    expectLinkedI18nCopy(homepageSource, 'primaryCta', '开始查找方法');
    expectLinkedI18nCopy(homepageSource, 'secondaryCta', '提交使用结果');

    const englishHomepage = localeBlock(homepageSource, 'const translations = {', 'en');
    expectKeyValue(englishHomepage, 'primaryCta', 'Find a method');
    expectKeyValue(englishHomepage, 'secondaryCta', 'Submit a result');
  });

  it('maps each vault promise to the correct page and locale', () => {
    const chineseVaultCopy = localeBlock(vaultPageSource, 'const dictionaries = {', 'zh');
    const englishVaultCopy = localeBlock(vaultPageSource, 'const dictionaries = {', 'en');
    const pagePromises = [
      ['pageTitleKnowledge', '先理解为什么，再决定用什么。', 'Understand why before choosing what to use.'],
      ['pageTitleTools', '把有效方法，变成可以重复执行的路径。', 'Turn effective methods into repeatable execution paths.'],
      ['pageTitleCases', '用真实结果，判断一种方法能否迁移。', 'Use real outcomes to decide whether a method can transfer.'],
      ['pageTitleCommunity', '知识因真实使用而可信。', 'Knowledge earns trust through real use.']
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
      ['dashboard.authRequired.title', '登录后继续验证与贡献', 'Sign in to keep validating and contributing.'],
      ['dashboard.authRequired.copy', '使用 GitHub 登录，提交使用结果并查看信誉、徽章和通知。', 'Sign in with GitHub to submit results and review your reputation, badges, and notifications.'],
      ['dashboard.authUnavailable.title', '此部署未启用用户登录', 'Sign-in is unavailable on this deployment']
    ];

    for (const [key, chinese, english] of approvedAuthCopy) {
      expectKeyValue(chineseDashboardCopy, key, chinese);
      expectKeyValue(englishDashboardCopy, key, english);
    }
  });
});
