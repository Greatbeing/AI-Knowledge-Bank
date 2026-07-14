import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const requiredPages = [
  'index.html',
  'knowledge.html',
  'tools.html',
  'cases.html',
  'community.html',
  'dashboard.html'
];
const distDirectory = resolve(process.cwd(), 'dist');
const missingPages = requiredPages.filter((page) => !existsSync(resolve(distDirectory, page)));

if (missingPages.length > 0) {
  console.error(`Build output check failed. Missing: ${missingPages.join(', ')}`);
  process.exit(1);
}

console.log(`Build output check passed: ${requiredPages.length} required pages found.`);
