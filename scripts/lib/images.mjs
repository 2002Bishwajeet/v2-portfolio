// Pure helpers for localizing remote (Medium-hosted) images. IO lives in
// scripts/localize-images.mjs; these are unit tested in images.test.mjs.
import { createHash } from 'node:crypto';

const MEDIUM_HOSTS = /https?:\/\/(?:cdn-images-1\.medium\.com|miro\.medium\.com)\/[^\s")>]+/g;

/** Find all unique Medium-hosted image URLs in a piece of text (md or HTML). */
export function findMediumImages(text) {
  return [...new Set(String(text).match(MEDIUM_HOSTS) || [])];
}

const CT_EXT = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
};

export function extFromContentType(ct = '') {
  return CT_EXT[String(ct).split(';')[0].trim().toLowerCase()] || '';
}

export function sanitizeName(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'image';
}

/**
 * Pick a stable, filesystem-safe filename for a downloaded image.
 * `used` is a Set of names already taken for the current post (collisions get a
 * short URL hash appended so different source URLs never overwrite each other).
 */
export function deriveFilename(url, contentType, used = new Set()) {
  const lastSeg = url.split('/').pop().split('?')[0] || '';
  const extMatch = lastSeg.match(/\.(png|jpe?g|gif|webp|svg|avif)$/i);
  const id = extMatch ? lastSeg.slice(0, -extMatch[0].length) : lastSeg;
  const ext = (extMatch ? extMatch[1].toLowerCase().replace('jpeg', 'jpg') : extFromContentType(contentType)) || 'png';

  let name = `${sanitizeName(id)}.${ext}`;
  if (used.has(name)) {
    const hash = createHash('sha1').update(url).digest('hex').slice(0, 6);
    name = `${sanitizeName(id)}-${hash}.${ext}`;
  }
  used.add(name);
  return name;
}
