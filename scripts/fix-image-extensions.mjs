#!/usr/bin/env node
/**
 * Rename localized images whose file extension doesn't match their real format
 * (Medium sometimes serves a GIF from a `.png` URL, so it lands as `.png` and is
 * served with the wrong Content-Type) and update the post's references to match.
 * Detects the true format from magic bytes. Idempotent — safe to re-run.
 *
 *   node scripts/fix-image-extensions.mjs
 */
import { readFileSync, writeFileSync, readdirSync, renameSync, existsSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { sniffImageExt } from './lib/images.mjs';

const BLOG_DIR = 'src/content/blog';
const PUBLIC_DIR = 'public/blog';

let fixed = 0;

for (const slug of readdirSync(PUBLIC_DIR)) {
  const dir = join(PUBLIC_DIR, slug);
  if (!statSync(dir).isDirectory()) continue;

  const mdPath = join(BLOG_DIR, `${slug}.md`);
  let md = existsSync(mdPath) ? readFileSync(mdPath, 'utf8') : '';
  let mdChanged = false;

  for (const file of readdirSync(dir)) {
    const fp = join(dir, file);
    if (!statSync(fp).isFile()) continue;

    const real = sniffImageExt(readFileSync(fp));
    if (!real) continue; // not a recognized raster image

    const curExt = extname(file).slice(1).toLowerCase();
    if ((curExt === 'jpeg' ? 'jpg' : curExt) === real) continue; // already correct

    const base = basename(file, extname(file));
    let newName = `${base}.${real}`;
    if (existsSync(join(dir, newName))) newName = `${base}-${real}.${real}`;

    renameSync(fp, join(dir, newName));
    const oldRef = `/blog/${slug}/${file}`;
    const newRef = `/blog/${slug}/${newName}`;
    if (md.includes(oldRef)) { md = md.split(oldRef).join(newRef); mdChanged = true; }

    fixed++;
    console.log(`  ${slug}/${file} → ${newName}`);
  }

  if (mdChanged) writeFileSync(mdPath, md);
}

console.log(`\nFixed ${fixed} mislabeled image(s).`);
