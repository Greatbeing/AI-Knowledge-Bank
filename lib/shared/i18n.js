/**
 * AI Knowledge Bank - Shared i18n Module
 * 统一的中英文翻译字典，消除 index.html 和 vault-page.js 中的重复
 */

export const translations = {
  zh: {
    // Navigation
    'nav.home': '首页',
    'nav.knowledge': '知识库',
    'nav.tools': '工具库',
    'nav.cases': '案例库',
    'nav.community': '社区',
    'nav.dashboard': '控制台',

    // Hero
    'hero.title': 'AI 知识银行',
    'hero.subtitle': '面向 AI 时代的人类知识协作、验证与涌现网络',
    'hero.cta': '开始探索',
    'hero.secondary': '了解愿景',

    // Vaults
    'vault.knowledge.title': '知识库',
    'vault.knowledge.desc': '原理、认知模型、解释器和判断框架',
    'vault.tools.title': '工具库',
    'vault.tools.desc': 'Agent、Prompt、工作流、自动化路径和沙盒配方',
    'vault.cases.title': '案例库',
    'vault.cases.desc': 'Before/After、SOP 复盘、验证证据和版本树',

    // Dispatch
    'dispatch.title': '跨库调度',
    'dispatch.placeholder': '描述你的场景或问题...',
    'dispatch.button': '调度',
    'dispatch.loading': '正在调度...',

    // Community
    'community.validated': '已验证',
    'community.used': '已使用',
    'community.forked': '已分叉',
    'community.merged': '已合并',
    'community.disputed': '有争议',

    // Common
    'common.trust_score': '可信度',
    'common.emergence': '涌现度',
    'common.search': '搜索',
    'common.loading': '加载中...',
    'common.error': '出错了',
    'common.retry': '重试',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.knowledge': 'Knowledge',
    'nav.tools': 'Tools',
    'nav.cases': 'Cases',
    'nav.community': 'Community',
    'nav.dashboard': 'Dashboard',

    // Hero
    'hero.title': 'AI Knowledge Bank',
    'hero.subtitle': 'Knowledge collaboration, validation, and emergence for the AI era',
    'hero.cta': 'Start Exploring',
    'hero.secondary': 'Learn the Vision',

    // Vaults
    'vault.knowledge.title': 'Knowledge Vault',
    'vault.knowledge.desc': 'Principles, cognitive models, explainers, and decision frames',
    'vault.tools.title': 'Tools Vault',
    'vault.tools.desc': 'Agents, prompts, workflows, automation routes, and sandbox recipes',
    'vault.cases.title': 'Cases Vault',
    'vault.cases.desc': 'Before/After records, SOP reviews, validation evidence, and version trees',

    // Dispatch
    'dispatch.title': 'Cross-Vault Dispatch',
    'dispatch.placeholder': 'Describe your scenario or question...',
    'dispatch.button': 'Dispatch',
    'dispatch.loading': 'Dispatching...',

    // Community
    'community.validated': 'Validated',
    'community.used': 'Used',
    'community.forked': 'Forked',
    'community.merged': 'Merged',
    'community.disputed': 'Disputed',

    // Common
    'common.trust_score': 'Trust Score',
    'common.emergence': 'Emergence',
    'common.search': 'Search',
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong',
    'common.retry': 'Retry',
  },
};

/**
 * 获取当前语言
 */
export function getCurrentLang() {
  try {
    const stored = localStorage.getItem('akb-lang');
    if (stored === 'zh' || stored === 'en') return stored;
  } catch {
    // localStorage 不可用
  }

  if (typeof navigator !== 'undefined') {
    return navigator.language?.startsWith('zh') ? 'zh' : 'en';
  }
  return 'zh';
}

/**
 * 设置当前语言
 */
export function setLanguage(lang) {
  try {
    localStorage.setItem('akb-lang', lang);
  } catch {
    // localStorage 不可用
  }
  applyTranslations(lang);
}

/**
 * 翻译函数
 */
export function t(key, lang = getCurrentLang()) {
  const dict = translations[lang] || translations.zh;
  return dict[key] || translations.zh[key] || key;
}

/**
 * 应用翻译到 DOM
 * 遍历所有带 data-i18n 属性的元素并设置文本
 */
export function applyTranslations(lang = getCurrentLang()) {
  if (typeof document === 'undefined') return;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const text = t(key, lang);
    if (text) el.textContent = text;
  });

  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
}

export default {
  translations,
  getCurrentLang,
  setLanguage,
  t,
  applyTranslations,
};
