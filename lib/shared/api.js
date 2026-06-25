/**
 * AI Knowledge Bank - Shared API Client
 * 统一的 API 请求模块，消除 index.html 和 vault-page.js 中的重复代码
 */

const DEFAULT_API_BASE = 'https://aiknowledgebank.pages.dev/api';
const LOCAL_API_BASE = '/api';
const API_TIMEOUT = 10000; // 10 seconds

/**
 * 解析 API 基础 URL
 * 根据当前页面域名自动选择 API 地址
 */
export function resolveApiBase() {
  if (typeof window === 'undefined') return DEFAULT_API_BASE;

  const { hostname, protocol } = window.location;

  // 本地开发环境
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return LOCAL_API_BASE;
  }

  // Cloudflare Pages 主域名
  if (hostname.includes('pages.dev')) {
    return LOCAL_API_BASE;
  }

  // GitHub Pages 或其他静态托管，回退到 Cloudflare API
  return DEFAULT_API_BASE;
}

/**
 * 带超时的 fetch 请求
 */
export async function fetchWithTimeout(url, options = {}, timeout = API_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * 统一的 API 请求函数
 * @param {string} path - API 路径（如 /vaults, /search?q=xxx）
 * @param {object} options - fetch 选项
 * @returns {Promise<object|null>} - 解析后的 JSON 数据，失败返回 null
 */
export async function fetchApi(path, options = {}) {
  const baseUrl = resolveApiBase();
  const url = `${baseUrl}${path}`;

  try {
    const response = await fetchWithTimeout(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      console.warn(`API request failed: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('API request timed out:', url);
    } else {
      console.warn('API request error:', error);
    }
    return null;
  }
}

/**
 * 安全访问 localStorage
 */
export function safeGetItem(key, fallback = null) {
  try {
    const value = localStorage.getItem(key);
    return value !== null ? value : fallback;
  } catch {
    return fallback;
  }
}

export function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export default {
  resolveApiBase,
  fetchWithTimeout,
  fetchApi,
  safeGetItem,
  safeSetItem,
};
