#!/usr/bin/env node
/**
 * Size link-card thumbnails at build time. For every `.link-card` in the blog
 * posts this stamps the thumbnail's measured `width`/`height` (so the browser
 * reserves space — zero layout shift) and tags large landscape thumbnails as
 * `link-card--wide` so they render as a full-width hero image (see the CSS in
 * src/styles/global.css). Idempotent — safe to re-run after an import.
 *
 *   node scripts/style-link-cards.mjs            # all posts
 *   node scripts/style-link-cards.mjs <file.md>  # one post
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { imageSize, styleLinkCardLine } from './lib/images.mjs';

const BLOG_DIR = 'src/content/blog';
const PUBLIC_DIR = 'public';

const cache = new Map();
function measure(src) {
  if (cache.has(src)) return cache.get(src);
  let size = null;
  try {
    const fp = join(PUBLIC_DIR, src.replace(/^\//, ''));
    if (existsSync(fp)) size = imageSize(readFileSync(fp));
  } catch { /* unreadable → leave unsized */ }
  cache.set(src, size);
  return size;
}

const arg = process.argv[2];
const files = arg
  ? [arg]
  : readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md')).map((f) => join(BLOG_DIR, f));

let cards = 0;
let wide = 0;
let posts = 0;

for (const file of files) {
  const before = readFileSync(file, 'utf8');
  const after = before
    .split('\n')
    .map((line) => {
      if (!line.includes('class="link-card')) return line;
      cards++;
      const styled = styleLinkCardLine(line, measure);
      if (styled.includes('link-card--wide')) wide++;
      return styled;
    })
    .join('\n');

  if (after !== before) {
    writeFileSync(file, after);
    posts++;
  }
}

console.log(`Styled ${cards} link card(s) — ${wide} wide, ${cards - wide} standard — across ${posts} post(s).`);
