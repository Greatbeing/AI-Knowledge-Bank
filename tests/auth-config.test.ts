import { describe, expect, it, vi } from 'vitest';
import {
  loadSupabaseConfig,
  mergeSupabaseRuntimeEnv,
  resolveSupabaseConfig
} from '../lib/supabase-config';

describe('resolveSupabaseConfig', () => {
  it('returns null when public Supabase configuration is missing', () => {
    expect(resolveSupabaseConfig({}, {})).toBeNull();
  });

  it('prefers runtime configuration over build-time configuration', () => {
    expect(resolveSupabaseConfig(
      { SUPABASE_URL: 'https://runtime.supabase.co', SUPABASE_ANON_KEY: 'runtime-key' },
      { VITE_SUPABASE_URL: 'https://build.supabase.co', VITE_SUPABASE_ANON_KEY: 'build-key' }
    )).toEqual({
      url: 'https://runtime.supabase.co',
      anonKey: 'runtime-key'
    });
  });

  it('uses build-time configuration when runtime values are absent', () => {
    expect(resolveSupabaseConfig({}, {
      VITE_SUPABASE_URL: 'https://build.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'build-key'
    })).toEqual({
      url: 'https://build.supabase.co',
      anonKey: 'build-key'
    });
  });

  it('loads public runtime configuration when static values are absent', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      ok: true,
      supabase: {
        url: 'https://runtime.supabase.co/',
        anonKey: 'runtime-key'
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }));

    await expect(loadSupabaseConfig({}, {}, fetcher)).resolves.toEqual({
      url: 'https://runtime.supabase.co',
      anonKey: 'runtime-key'
    });
    expect(fetcher).toHaveBeenCalledWith('./api/public-config', {
      headers: { Accept: 'application/json' }
    });
  });

  it('keeps runtime configuration unavailable when the endpoint fails', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('network detail'));

    await expect(loadSupabaseConfig({}, {}, fetcher)).resolves.toBeNull();
  });

  it('merges loaded public values into the runtime environment used by auth', () => {
    expect(mergeSupabaseRuntimeEnv({ featureFlag: true }, {
      url: 'https://runtime.supabase.co',
      anonKey: 'runtime-key'
    })).toEqual({
      featureFlag: true,
      SUPABASE_URL: 'https://runtime.supabase.co',
      SUPABASE_ANON_KEY: 'runtime-key'
    });
  });
});
