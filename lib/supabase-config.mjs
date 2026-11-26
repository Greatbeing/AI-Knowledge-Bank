// 纯 JS 版（浏览器可直接运行，供零依赖本地数据服务使用）。
// 与 lib/supabase-config.ts 逻辑保持一致；.ts 版本仅供 tsc / 单元测试使用。

export function resolveSupabaseConfig(runtimeEnv = {}, buildEnv = {}) {
  const url = runtimeEnv.SUPABASE_URL || buildEnv.VITE_SUPABASE_URL;
  const anonKey = runtimeEnv.SUPABASE_ANON_KEY || buildEnv.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export async function loadSupabaseConfig(runtimeEnv = {}, buildEnv = {}, fetcher = globalThis.fetch) {
  const staticConfig = resolveSupabaseConfig(runtimeEnv, buildEnv);
  if (staticConfig) return staticConfig;

  try {
    const response = await fetcher('./api/public-config', { headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    const payload = await response.json();
    const url = payload?.supabase?.url;
    const anonKey = payload?.supabase?.anonKey;
    if (typeof url !== 'string' || typeof anonKey !== 'string' || !url || !anonKey) return null;
    return { url: url.replace(/\/+$/, ''), anonKey };
  } catch {
    return null;
  }
}

export function mergeSupabaseRuntimeEnv(runtimeEnv = {}, config) {
  return { ...runtimeEnv, SUPABASE_URL: config.url, SUPABASE_ANON_KEY: config.anonKey };
}