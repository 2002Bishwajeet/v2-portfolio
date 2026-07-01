#!/usr/bin/env node
/**
 * Convert a Medium export into blog posts for this site.
 *
 * Medium → Settings → "Download your information" emails you a ZIP. Unzip it and
 * point this script at the `posts/` folder inside:
 *
 *   node scripts/import-medium.mjs ~/Downloads/medium-export/posts
 *
 * It writes one Markdown file per story into src/content/blog/ with frontmatter
 * (title, description, pubDate, tags, canonicalURL) already filled in. Code from
 * GitHub Gist embeds and Medium's link-preview cards are recovered too — gist
 * fetching uses the authenticated `gh` CLI.
 *
 * Flags:
 *   --drafts         also import Medium drafts (files named draft_*.html)
 *   --out <dir>      output directory (default: src/content/blog)
 *   --no-canonical   don't add a canonicalURL pointing back to Medium
 *   --min-words <n>  skip posts shorter than n words (default 100). Medium's
 *                    export includes your short replies/comments as "posts";
 *                    this filters them out. Set 0 to import everything.
 *
 * Pure conversion logic lives in ./lib/medium.mjs (unit tested).
 */
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { convertHtml } from './lib/medium.mjs';

const args = process.argv.slice(2);
const inputPath = args.find((a) => !a.startsWith('--'));
const includeDrafts = args.includes('--drafts');
const addCanonical = !args.includes('--no-canonical');
const outIdx = args.indexOf('--out');
const outDir = outIdx !== -1 ? args[outIdx + 1] : 'src/content/blog';
const minWordsIdx = args.indexOf('--min-words');
const minWords = minWordsIdx !== -1 ? Number(args[minWordsIdx + 1]) : 100;

if (!inputPath) {
  console.error('Usage: node scripts/import-medium.mjs <medium-export/posts> [--drafts] [--out dir] [--no-canonical] [--min-words n]');
  process.exit(1);
}

// Fetch a gist's files (content + language) via the authenticated `gh` CLI. Cached.
const gistCache = new Map();
function fetchGist(hash) {
  if (gistCache.has(hash)) return gistCache.get(hash);
  let files = null;
  try {
    const json = execSync(`gh api gists/${hash}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 20 * 1024 * 1024 });
    const data = JSON.parse(json);
    files = Object.values(data.files || {}).map((f) => ({ language: f.language, content: f.content }));
  } catch {
    console.warn(`    ⚠ could not fetch gist ${hash} (deleted, private, or gh not authed)`);
  }
  gistCache.set(hash, files);
  return files;
}

// --- run ---
const target = resolve(inputPath);
const files = statSync(target).isDirectory()
  ? readdirSync(target).filter((f) => f.endsWith('.html'))
  : [basename(target)];
const baseDir = statSync(target).isDirectory() ? target : resolve(inputPath, '..');

mkdirSync(outDir, { recursive: true });

let written = 0;
let gistsInlined = 0;
let linkCards = 0;
for (const file of files) {
  if (file.startsWith('draft_') && !includeDrafts) continue;
  const filePath = join(baseDir, file);
  const html = readFileSync(filePath, 'utf8');
  // Drafts have no publish date in Medium's export; fall back to the file's date.
  const fallbackDate = statSync(filePath).mtime.toISOString().slice(0, 10);

  const result = convertHtml(html, { file, fallbackDate, minWords, addCanonical, fetchGist });
  if (result.skipped === 'too-short') {
    console.log(`  – skipped (reply/comment, ${result.wordCount}w < ${minWords}): ${file}`);
    continue;
  }
  if (result.skipped) {
    console.warn(`  ⚠ skipped (${result.skipped}): ${file}`);
    continue;
  }

  const outPath = join(outDir, `${result.slug}.md`);
  writeFileSync(outPath, result.content);
  written++;
  gistsInlined += result.gistsInlined;
  linkCards += result.linkCards;
  console.log(`  ✓ ${file}  →  ${outPath}`);
}

console.log(`\nDone. Imported ${written} post(s) into ${outDir}.`);
console.log(`Inlined ${gistsInlined} code block(s) from GitHub gists.`);
console.log(`Converted ${linkCards} Medium link preview(s) into link cards.`);
console.log('Review each file (esp. images, code blocks, canonicalURL) before committing.');
