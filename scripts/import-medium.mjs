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
 * (title, description, pubDate, tags, canonicalURL) already filled in.
 *
 * Flags:
 *   --drafts     also import Medium drafts (files named draft_*.html)
 *   --out <dir>  output directory (default: src/content/blog)
 *   --no-canonical   don't add a canonicalURL pointing back to Medium
 *
 * Review each generated file before committing — Medium's HTML is messy and the
 * conversion is a strong starting point, not a guarantee.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';
import { parse } from 'node-html-parser';
import TurndownService from 'turndown';

const args = process.argv.slice(2);
const inputPath = args.find((a) => !a.startsWith('--'));
const includeDrafts = args.includes('--drafts');
const addCanonical = !args.includes('--no-canonical');
const outIdx = args.indexOf('--out');
const outDir = outIdx !== -1 ? args[outIdx + 1] : 'src/content/blog';

if (!inputPath) {
  console.error('Usage: node scripts/import-medium.mjs <medium-export/posts> [--drafts] [--out dir] [--no-canonical]');
  process.exit(1);
}

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
});
// Medium wraps code in <pre>; keep that as fenced blocks (default handles it).

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Derive a clean slug from a Medium export filename. */
function slugFromFilename(file) {
  return file
    .replace(/\.html$/i, '')
    .replace(/^draft_/, '')
    .replace(/^\d{4}-\d{2}-\d{2}_/, '') // strip date prefix
    .replace(/-+[0-9a-f]{6,}$/i, '')    // strip trailing --hash
    .toLowerCase();
}

function yamlEscape(str) {
  return String(str).replace(/"/g, '\\"').trim();
}

function convertFile(file, filePath) {
  const html = readFileSync(filePath, 'utf8');
  const root = parse(html);

  const title =
    root.querySelector('.p-name')?.text?.trim() ||
    root.querySelector('title')?.text?.replace(/\s*[–-]\s*Medium\s*$/i, '').trim() ||
    slugFromFilename(file);

  const subtitle =
    root.querySelector('.p-summary')?.text?.trim() ||
    root.querySelector('section[data-field="description"]')?.text?.trim() ||
    '';

  const datetime = root.querySelector('time.dt-published')?.getAttribute('datetime');
  const dateMatch = file.match(/^(?:draft_)?(\d{4}-\d{2}-\d{2})_/);
  const pubDate = (datetime ? datetime.slice(0, 10) : dateMatch?.[1]) || '';

  const canonicalHref = root.querySelector('.p-canonical')?.getAttribute('href') || '';
  const tags = root.querySelectorAll('.p-tags a, ul.tags > li').map((el) => el.text.trim()).filter(Boolean);

  const body = root.querySelector('.e-content') || root.querySelector('section[data-field="body"]');
  if (!body) {
    console.warn(`  ⚠ no body found in ${file}, skipping`);
    return null;
  }

  // Drop the repeated title (h3.graf--title) and subtitle (h4) Medium injects.
  body.querySelector('.graf--title')?.remove();
  body.querySelector('.graf--subtitle')?.remove();

  const markdown = turndown.turndown(body.innerHTML).trim();

  const isDraft = file.startsWith('draft_');
  const slug = slugFromFilename(file) || slugify(title);

  const frontmatter = [
    '---',
    `title: "${yamlEscape(title)}"`,
    `description: "${yamlEscape(subtitle || title)}"`,
    pubDate ? `pubDate: ${pubDate}` : `# pubDate: FILL_ME_IN  (couldn't detect a date)`,
    tags.length ? `tags: [${tags.map((t) => `"${yamlEscape(t)}"`).join(', ')}]` : 'tags: []',
    ...(addCanonical && canonicalHref ? [`canonicalURL: "${canonicalHref}"`] : []),
    ...(isDraft ? ['draft: true'] : []),
    '---',
    '',
  ].join('\n');

  return { slug, content: frontmatter + markdown + '\n', title, hasDate: !!pubDate };
}

// --- run ---
const target = resolve(inputPath);
const files = statSync(target).isDirectory()
  ? readdirSync(target).filter((f) => f.endsWith('.html'))
  : [basename(target)];
const baseDir = statSync(target).isDirectory() ? target : resolve(inputPath, '..');

mkdirSync(outDir, { recursive: true });

let written = 0;
let needsDate = 0;
for (const file of files) {
  if (file.startsWith('draft_') && !includeDrafts) continue;
  const result = convertFile(file, join(baseDir, file));
  if (!result) continue;
  const outPath = join(outDir, `${result.slug}.md`);
  writeFileSync(outPath, result.content);
  written++;
  if (!result.hasDate) needsDate++;
  console.log(`  ✓ ${file}  →  ${outPath}`);
}

console.log(`\nDone. Imported ${written} post(s) into ${outDir}.`);
if (needsDate) console.log(`⚠ ${needsDate} post(s) need a pubDate filled in manually.`);
console.log('Review each file (esp. images, code blocks, canonicalURL) before committing.');
