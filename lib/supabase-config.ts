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

export function resolveSupabaseConfig(
  runtimeEnv: RuntimeSupabaseEnv = {},
  buildEnv: BuildSupabaseEnv = {}
): { url: string; anonKey: string } | null {
  const url = runtimeEnv.SUPABASE_URL || buildEnv.VITE_SUPABASE_URL;
  const anonKey = runtimeEnv.SUPABASE_ANON_KEY || buildEnv.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}
