import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const root = process.cwd();
const allowedExtensions = new Set(['.css', '.html', '.js', '.json', '.md', '.mjs', '.sql', '.ts', '.tsx']);
const ignoredDirectories = new Set([
  '.git',
  '.vite',
  '.worktrees',
  'dist',
  'docs/superpowers',
  'node_modules'
]);
const ignoredFiles = new Set([
  'scripts/check-text-health.mjs'
]);

const mojibakeFragments = [
  '�',
  '鉁',
  '馃',
  '鈹',
  '鈥',
  '鈮',
  '鐭',
  '鐢',
  '杈',
  '渚',
  '鍑',
  '闈',
  '椤',
  '浣',
  '鍔',
  '璺',
  '寮€',
  '鏋',
  '搴',
  '绯',
  '缁',
  '褰',
  '悇',
  '锛',
  '銆',
  '俙',
  '鏈',
  '鍦',
  '鍙',
  '閫',
  '鎴',
  '鎶',
  '鏁',
  '鏃',
  '妗',
  '璇',
  '绋',
  '楠',
  '绉'
];

function shouldIgnoreDirectory(path) {
  const normalized = relative(root, path).replaceAll('\\', '/');
  return ignoredDirectories.has(normalized) || normalized.startsWith('docs/superpowers/');
}

function collectFiles(directory, files = []) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    const stats = statSync(path);
    const normalized = relative(root, path).replaceAll('\\', '/');

    if (stats.isDirectory()) {
      if (!shouldIgnoreDirectory(path)) collectFiles(path, files);
      continue;
    }

    if (allowedExtensions.has(extname(path)) && !ignoredFiles.has(normalized)) files.push(path);
  }

  return files;
}

function findMatches(file) {
  const content = readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  const matches = [];

  lines.forEach((line, index) => {
    const fragment = mojibakeFragments.find((item) => line.includes(item));
    if (fragment) {
      matches.push({
        file: relative(root, file).replaceAll('\\', '/'),
        line: index + 1,
        fragment,
        text: line.trim().slice(0, 180)
      });
    }
  });

  return matches;
}

const matches = collectFiles(root).flatMap(findMatches);

if (matches.length > 0) {
  console.error(`Text health check failed: ${matches.length} suspicious mojibake line(s) found.`);
  matches.slice(0, 120).forEach((match) => {
    console.error(`${match.file}:${match.line}: ${match.text}`);
  });
  if (matches.length > 120) {
    console.error(`...and ${matches.length - 120} more.`);
  }
  process.exit(1);
}

console.log('Text health check passed: no mojibake signatures found.');
