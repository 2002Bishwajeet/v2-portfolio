#!/usr/bin/env node
/**
 * Restore image captions that Medium's export carries as <figcaption> but the
 * HTML→Markdown import dropped. Reads the original export, maps each captioned
 * image to its localized file (same basename derivation as the importer), and
 * writes the caption as the Markdown image title — `![alt](src "caption")` —
 * which the rehype figure plugin renders as a <figcaption>. Idempotent.
 *
 *   node scripts/restore-captions.mjs <path-to-medium-export/posts>
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { sanitizeName } from './lib/images.mjs';

const exportDir = process.argv[2];
if (!exportDir) { console.error('Usage: restore-captions.mjs <medium-export/posts>'); process.exit(1); }

const BLOG_DIR = 'src/content/blog';

// basename (no extension, sanitized) -> caption text, harvested from the export.
const captions = new Map();
for (const f of readdirSync(exportDir).filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(join(exportDir, f), 'utf8');
  for (const m of html.matchAll(/<figure[^>]*>([\s\S]*?)<\/figure>/g)) {
    const fig = m[1];
    const img = fig.match(/<img[^>]+src="([^"]+)"/);
    const cap = fig.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/);
    if (!img || !cap) continue;
    const text = cap[1].replace(/<[^>]+>/g, '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const seg = img[1].split('/').pop().split('?')[0].replace(/\.(png|jpe?g|gif|webp|avif)$/i, '');
    captions.set(sanitizeName(seg), text);
  }
}

let added = 0;
for (const file of readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'))) {
  const path = join(BLOG_DIR, file);
  let md = readFileSync(path, 'utf8');
  // Markdown images WITHOUT an existing title: ![alt](/blog/.../name.ext)
  md = md.replace(/!\[([^\]]*)\]\((\/blog\/[^)"\s]+?)\)/g, (whole, alt, src) => {
    const base = sanitizeName(src.split('/').pop().replace(/\.[a-z0-9]+$/i, ''));
    const cap = captions.get(base);
    if (!cap) return whole;
    added++;
    return `![${alt}](${src} "${cap.replace(/"/g, "'")}")`;
  });
  writeFileSync(path, md);
}

console.log(`Harvested ${captions.size} caption(s) from the export; applied ${added} to posts.`);
