import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCurrentLang, setLanguage, translations } from '../lib/shared/i18n.js';

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: vi.fn((key) => values.get(key) ?? null),
    setItem: vi.fn((key, value) => values.set(key, String(value)))
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('shared language preference', () => {
  it('prefers the cross-page language key', () => {
    vi.stubGlobal('localStorage', createStorage({ language: 'en', 'akb-lang': 'zh' }));

    expect(getCurrentLang()).toBe('en');
  });

  it('keeps the legacy language key as a fallback', () => {
    vi.stubGlobal('localStorage', createStorage({ 'akb-lang': 'en' }));

    expect(getCurrentLang()).toBe('en');
  });

  it('writes both keys so every page observes the same choice', () => {
    const storage = createStorage();
    vi.stubGlobal('localStorage', storage);

    setLanguage('en');

    expect(storage.setItem).toHaveBeenCalledWith('language', 'en');
    expect(storage.setItem).toHaveBeenCalledWith('akb-lang', 'en');
  });

  it('defines Dashboard auth states in both locales', () => {
    expect(translations.zh).toMatchObject({
      'dashboard.authRequired.title': '登录后继续验证与贡献',
      'dashboard.authUnavailable.title': '此部署未启用用户登录'
    });
    expect(translations.en).toMatchObject({
      'dashboard.authRequired.title': 'Sign in to keep validating and contributing.',
      'dashboard.authUnavailable.title': 'Sign-in is unavailable on this deployment'
    });
  });
});
