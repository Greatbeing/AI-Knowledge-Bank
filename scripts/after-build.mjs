#!/usr/bin/env node
/**
 * after-build.mjs — 构建后把站点首页换成作品集入口页
 *
 * 只在构建产物 dist/ 里操作：用 dist/portfolio.html 覆盖 dist/index.html。
 * 不改源码里的 index.html，所以 typography-copy 等针对旧首页的测试不受影响。
 * npm run build 结束后由 postbuild 自动执行；Cloudflare 与 GitHub Pages 的构建都会走到。
 */
import { existsSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dist = resolve(process.cwd(), 'dist');
const portfolio = resolve(dist, 'portfolio.html');
const index = resolve(dist, 'index.html');

if (!existsSync(portfolio)) {
  console.error('after-build: 找不到 dist/portfolio.html。确认 vite.config.js 里把 portfolio.html 列为构建入口。');
  process.exit(1);
}
copyFileSync(portfolio, index);
console.log('after-build: dist/index.html ← portfolio.html（站点首页 = 作品集入口页）');
