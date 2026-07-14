import { describe, expect, it } from 'vitest';
import { resolveSupabaseConfig } from '../lib/supabase-config';

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
});
