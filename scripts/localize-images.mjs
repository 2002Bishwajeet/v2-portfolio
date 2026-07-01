#!/usr/bin/env node
/**
 * Download remote Medium-hosted images into public/blog/<slug>/ and rewrite the
 * references in each post to local paths. Makes the blog self-contained (no
 * dependency on Medium's CDN) — better for performance, SEO, and longevity.
 *
 *   node scripts/localize-images.mjs            # process all posts
 *   node scripts/localize-images.mjs <file.md>  # process one post
 *
 * Re-runnable: once a URL is localized it's no longer a Medium URL, so a second
 * run is a no-op.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { findMediumImages, deriveFilename, sniffImageExt } from './lib/images.mjs';

const BLOG_DIR = 'src/content/blog';
const PUBLIC_DIR = 'public/blog';
const THROTTLE_MS = 400; // be polite to Medium's CDN to avoid 429s

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A browser-like UA; some CDNs throttle the default fetch agent harder.
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// Fetch with backoff on rate-limits (429) and transient server errors.
async function fetchImage(url, attempt = 0) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Referer': 'https://medium.com/' } });
  if ((res.status === 429 || res.status >= 500) && attempt < 5) {
    const retryAfter = Number(res.headers.get('retry-after'));
    const wait = retryAfter ? retryAfter * 1000 : Math.min(1500 * 2 ** attempt, 20000);
    await sleep(wait);
    return fetchImage(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

const arg = process.argv[2];
const files = arg
  ? [arg]
  : readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md')).map((f) => join(BLOG_DIR, f));

let totalImages = 0;
let totalPosts = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf8');
  const urls = findMediumImages(content);
  if (!urls.length) continue;

  const slug = basename(file, '.md');
  const outDir = join(PUBLIC_DIR, slug);
  mkdirSync(outDir, { recursive: true });

  const used = new Set();
  let count = 0;
  for (const url of urls) {
    try {
      const res = await fetchImage(url);
      const buf = Buffer.from(await res.arrayBuffer());
      // Trust the bytes, not the URL/header — Medium serves some GIFs as .png.
      const name = deriveFilename(url, res.headers.get('content-type'), used, sniffImageExt(buf));
      const dest = join(outDir, name);
      if (!existsSync(dest)) writeFileSync(dest, buf);
      const localPath = `/blog/${slug}/${name}`;
      content = content.split(url).join(localPath); // replace every occurrence
      count++;
      await sleep(THROTTLE_MS);
    } catch (e) {
      console.warn(`  ⚠ ${slug}: failed ${url} (${e.message})`);
    }
  }

  writeFileSync(file, content);
  totalImages += count;
  totalPosts++;
  console.log(`  ✓ ${slug}: localized ${count} image(s) → ${outDir}/`);
}

console.log(`\nDone. Localized ${totalImages} image(s) across ${totalPosts} post(s).`);
