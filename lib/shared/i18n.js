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

    // Dashboard
    'dashboard.pageTitle': '贡献控制台 | AI Knowledge Bank',
    'dashboard.description': '查看你的验证、信誉、徽章和通知，并继续为公共知识贡献证据。',
    'dashboard.languageLabel': '切换语言',
    'dashboard.loading': '正在读取贡献记录...',
    'dashboard.authRequired.title': '登录后，继续你的贡献记录',
    'dashboard.authRequired.copy': '使用 GitHub 登录，验证真实节点并查看信誉、徽章和通知。',
    'dashboard.authRequired.button': '使用 GitHub 登录',
    'dashboard.authUnavailable.title': '此部署未启用用户登录',
    'dashboard.authUnavailable.copy': '当前部署缺少浏览器登录所需的公开 Supabase 配置。你仍可浏览三库和演示内容。',
    'dashboard.authUnavailable.link': '返回公共知识库',
    'dashboard.logout': '退出登录',
    'dashboard.overview': '贡献者概览',
    'dashboard.reputation': '信誉',
    'dashboard.memberSince': '加入于',
    'dashboard.stat.validations': '验证',
    'dashboard.stat.forks': '分叉',
    'dashboard.stat.merges': '合并',
    'dashboard.stat.badges': '徽章',
    'dashboard.badges.title': '获得的徽章',
    'dashboard.activity.title': '最近贡献',
    'dashboard.notifications.title': '通知',
    'dashboard.notifications.markRead': '全部标为已读',
    'dashboard.badges.empty': '还没有徽章。完成一次有效验证后，这里会记录你的贡献。',
    'dashboard.activity.empty': '还没有贡献记录。先从验证一个真实节点开始。',
    'dashboard.notifications.empty': '暂无新通知',
    'dashboard.userFallback': '贡献者',
    'dashboard.badgeFallback': '徽章',
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

    // Dashboard
    'dashboard.pageTitle': 'Contributor dashboard | AI Knowledge Bank',
    'dashboard.description': 'Review your validations, reputation, badges, and notifications, then continue contributing evidence to public knowledge.',
    'dashboard.languageLabel': 'Switch language',
    'dashboard.loading': 'Loading your contribution record...',
    'dashboard.authRequired.title': 'Sign in to continue your contribution history',
    'dashboard.authRequired.copy': 'Sign in with GitHub to validate real nodes and review your reputation, badges, and notifications.',
    'dashboard.authRequired.button': 'Sign in with GitHub',
    'dashboard.authUnavailable.title': 'Sign-in is unavailable on this deployment',
    'dashboard.authUnavailable.copy': 'This deployment is missing the public Supabase configuration required for browser sign-in. You can still browse the vaults and demo content.',
    'dashboard.authUnavailable.link': 'Return to the public knowledge bank',
    'dashboard.logout': 'Sign out',
    'dashboard.overview': 'Contributor overview',
    'dashboard.reputation': 'Reputation',
    'dashboard.memberSince': 'Member since',
    'dashboard.stat.validations': 'Validations',
    'dashboard.stat.forks': 'Forks',
    'dashboard.stat.merges': 'Merges',
    'dashboard.stat.badges': 'Badges',
    'dashboard.badges.title': 'Badges earned',
    'dashboard.activity.title': 'Recent contributions',
    'dashboard.notifications.title': 'Notifications',
    'dashboard.notifications.markRead': 'Mark all as read',
    'dashboard.badges.empty': 'No badges yet. Complete a useful validation and your contribution will appear here.',
    'dashboard.activity.empty': 'No contribution history yet. Start by validating a real node.',
    'dashboard.notifications.empty': 'No new notifications',
    'dashboard.userFallback': 'Contributor',
    'dashboard.badgeFallback': 'Badge',
  },
};

/**
 * 获取当前语言
 */
export function getCurrentLang() {
  try {
    const stored = localStorage.getItem('language') || localStorage.getItem('akb-lang');
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
    localStorage.setItem('language', lang);
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
