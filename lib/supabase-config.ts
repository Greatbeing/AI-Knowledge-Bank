type RuntimeSupabaseEnv = {
  [key: string]: unknown;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
};

type BuildSupabaseEnv = {
  [key: string]: unknown;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
};

export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

export function resolveSupabaseConfig(
  runtimeEnv: RuntimeSupabaseEnv = {},
  buildEnv: BuildSupabaseEnv = {}
): SupabaseConfig | null {
  const url = runtimeEnv.SUPABASE_URL || buildEnv.VITE_SUPABASE_URL;
  const anonKey = runtimeEnv.SUPABASE_ANON_KEY || buildEnv.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export async function loadSupabaseConfig(
  runtimeEnv: RuntimeSupabaseEnv = {},
  buildEnv: BuildSupabaseEnv = {},
  fetcher: typeof fetch = globalThis.fetch
): Promise<SupabaseConfig | null> {
  const staticConfig = resolveSupabaseConfig(runtimeEnv, buildEnv);
  if (staticConfig) return staticConfig;

  try {
    const response = await fetcher('./api/public-config', {
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) return null;

    const payload = await response.json();
    const url = payload?.supabase?.url;
    const anonKey = payload?.supabase?.anonKey;
    if (typeof url !== 'string' || typeof anonKey !== 'string' || !url || !anonKey) {
      return null;
    }

    return {
      url: url.replace(/\/+$/, ''),
      anonKey
    };
  } catch {
    return null;
  }
}

export function mergeSupabaseRuntimeEnv(
  runtimeEnv: Record<string, unknown> = {},
  config: SupabaseConfig
): RuntimeSupabaseEnv {
  return {
    ...runtimeEnv,
    SUPABASE_URL: config.url,
    SUPABASE_ANON_KEY: config.anonKey
  };
}
