import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import viteConfig from '../vite.config.js';
import packageJson from '../package.json';

const dashboardSource = readFileSync(fileURLToPath(new URL('../dashboard.html', import.meta.url)), 'utf8');
const vaultPageSource = readFileSync(fileURLToPath(new URL('../assets/vault-page.js', import.meta.url)), 'utf8');

describe('Vite production pages', () => {
  it('builds the authenticated dashboard as a first-class page', () => {
    expect(viteConfig.build.rollupOptions.input.dashboard).toMatch(/[\\/]dashboard\.html$/);
  });

  it('exposes a repeatable build-output verification command', () => {
    expect(packageJson.scripts['check:dist']).toBe('node scripts/check-build-output.mjs');
  });

  it('ships the project favicon on the dashboard', () => {
    expect(dashboardSource).toContain('href="./assets/brand/akb-love-logo.svg"');
  });

  it('keeps the sign-out action hidden until a user session is visible', () => {
    expect(dashboardSource).toContain('id="logout-btn" class="hidden ');
  });

  it('loads runtime Supabase configuration before importing dashboard auth', () => {
    const configLoad = dashboardSource.indexOf('await loadSupabaseConfig(');
    const authImport = dashboardSource.indexOf("await import('./lib/auth.ts')");

    expect(configLoad).toBeGreaterThan(-1);
    expect(authImport).toBeGreaterThan(configLoad);
    expect(dashboardSource).toContain('window.__ENV = mergeSupabaseRuntimeEnv(');
  });

  it('loads runtime Supabase configuration before reading a community session', () => {
    const configLoad = vaultPageSource.indexOf('await loadSupabaseConfig(');
    const authImport = vaultPageSource.indexOf("await import('../lib/auth.ts')");

    expect(configLoad).toBeGreaterThan(-1);
    expect(authImport).toBeGreaterThan(configLoad);
    expect(vaultPageSource).toContain('window.__ENV = mergeSupabaseRuntimeEnv(');
  });
});
