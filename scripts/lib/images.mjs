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

/**
 * Read intrinsic pixel dimensions from an image buffer by parsing its header.
 * Pure JS, no dependencies. Supports PNG, GIF, JPEG and WebP. Returns
 * `{ width, height }`, or `null` if the format isn't recognized or the header is
 * truncated. Used to size link-card thumbnails at build time.
 */
export function imageSize(buf) {
  if (!buf || buf.length < 16) return null;

  // PNG: 8-byte signature, then IHDR with big-endian uint32 width/height.
  if (buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }

  // GIF: "GIF87a"/"GIF89a", logical-screen width/height little-endian at 6/8.
  if (buf.toString('ascii', 0, 3) === 'GIF') {
    return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
  }

  // WebP: "RIFF"...."WEBP" then a format-specific chunk.
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const fmt = buf.toString('ascii', 12, 16);
    if (fmt === 'VP8 ') { // lossy: 14-bit width/height at 26/28
      return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    }
    if (fmt === 'VP8L') { // lossless: 14-bit dims packed after a 1-byte signature
      const bits = buf.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (fmt === 'VP8X') { // extended: 24-bit (width-1)/(height-1) at 24/27
      const width = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
      const height = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
      return { width, height };
    }
    return null;
  }

  // JPEG: FF D8, then walk segments to a Start-Of-Frame marker.
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let off = 2;
    while (off + 1 < buf.length) {
      if (buf[off] !== 0xff) { off++; continue; }
      let marker = buf[off + 1];
      off += 2;
      while (marker === 0xff && off < buf.length) marker = buf[off++]; // skip fill bytes
      // Markers without a length payload.
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (off + 1 >= buf.length) break;
      const len = buf.readUInt16BE(off);
      // SOF0..SOF15 carry dimensions, except DHT(C4), JPG(C8) and DAC(CC).
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: buf.readUInt16BE(off + 3), width: buf.readUInt16BE(off + 5) };
      }
      off += len;
    }
    return null;
  }

  return null;
}

/**
 * Decide how a link card should render, given its thumbnail's pixel size.
 * Large landscape preview images (OG/social images) earn the roomy "wide"
 * treatment — a full-width hero image on top. Small or square thumbnails
 * (favicons, logos) stay in the compact horizontal layout. `null` → 'default'.
 */
export function linkCardVariant(size) {
  if (!size || !size.width || !size.height) return 'default';
  const ratio = size.width / size.height;
  return size.width >= 320 && ratio >= 1.4 ? 'wide' : 'default';
}

/**
 * Rewrite a single line of post markdown that contains a link card: stamp the
 * thumbnail's measured `width`/`height` (for zero layout-shift) and tag the card
 * `link-card--wide` when its thumbnail is large and landscape. `measure(src)`
 * returns `{ width, height } | null`. Idempotent — safe to re-run.
 */
export function styleLinkCardLine(line, measure) {
  if (!/class="link-card( link-card--wide)?"/.test(line)) return line;

  let variant = 'default';
  const thumbRe = /<img class="link-card-thumb"([^>]*)>/;
  const m = line.match(thumbRe);
  if (m) {
    let attrs = m[1].replace(/\s(?:width|height)="[^"]*"/g, ''); // drop prior dims (re-runs)
    const src = (attrs.match(/\ssrc="([^"]*)"/) || [])[1] || '';
    const size = src ? measure(src) : null;
    variant = linkCardVariant(size);
    const dims = size && size.width && size.height ? ` width="${size.width}" height="${size.height}"` : '';
    line = line.replace(thumbRe, `<img class="link-card-thumb"${attrs}${dims}>`);
  }

  const cls = variant === 'wide' ? 'link-card link-card--wide' : 'link-card';
  return line.replace(/class="link-card( link-card--wide)?"/, `class="${cls}"`);
}
