import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findMediumImages, extFromContentType, sanitizeName, deriveFilename, imageSize, linkCardVariant, styleLinkCardLine, sniffImageExt } from './images.mjs';

test('findMediumImages finds unique Medium URLs in md and HTML', () => {
  const text = `
    ![](https://cdn-images-1.medium.com/max/800/1*ABC.png)
    <img src="https://miro.medium.com/fit/c/160/160/0*XYZ" />
    ![again](https://cdn-images-1.medium.com/max/800/1*ABC.png)
    [not an image](https://example.com/page)`;
  const urls = findMediumImages(text);
  assert.equal(urls.length, 2);
  assert.ok(urls.includes('https://cdn-images-1.medium.com/max/800/1*ABC.png'));
  assert.ok(urls.includes('https://miro.medium.com/fit/c/160/160/0*XYZ'));
});

test('extFromContentType maps content types to extensions', () => {
  assert.equal(extFromContentType('image/png'), 'png');
  assert.equal(extFromContentType('image/jpeg'), 'jpg');
  assert.equal(extFromContentType('image/webp; charset=binary'), 'webp');
  assert.equal(extFromContentType('application/octet-stream'), '');
});

test('sanitizeName produces filesystem-safe names', () => {
  assert.equal(sanitizeName('1*JUCzZ4tP'), '1-juczz4tp');
  assert.equal(sanitizeName('!!!'), 'image');
});

test('deriveFilename uses URL extension when present', () => {
  const name = deriveFilename('https://cdn-images-1.medium.com/max/800/1*ABC.PNG', 'image/png');
  assert.equal(name, '1-abc.png');
});

test('deriveFilename falls back to content-type when URL has no extension', () => {
  const name = deriveFilename('https://miro.medium.com/fit/c/160/160/0*XYZ', 'image/jpeg');
  assert.equal(name, '0-xyz.jpg');
});

test('deriveFilename disambiguates collisions from different URLs', () => {
  const used = new Set();
  const a = deriveFilename('https://cdn-images-1.medium.com/max/800/0*McP', 'image/png', used);
  const b = deriveFilename('https://cdn-images-1.medium.com/fit/c/160/160/0*McP', 'image/png', used);
  assert.equal(a, '0-mcp.png');
  assert.notEqual(a, b); // second gets a hash suffix
  assert.match(b, /^0-mcp-[0-9a-f]{6}\.png$/);
});

test('sniffImageExt identifies real format from magic bytes', () => {
  const gif = Buffer.alloc(12); gif.write('GIF89a', 0, 'ascii');
  const png = Buffer.alloc(12); png.writeUInt32BE(0x89504e47, 0);
  const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const webp = Buffer.alloc(12); webp.write('RIFF', 0, 'ascii'); webp.write('WEBP', 8, 'ascii');
  assert.equal(sniffImageExt(gif), 'gif');
  assert.equal(sniffImageExt(png), 'png');
  assert.equal(sniffImageExt(jpg), 'jpg');
  assert.equal(sniffImageExt(webp), 'webp');
  assert.equal(sniffImageExt(Buffer.from('nope')), '');
});

test('deriveFilename honors a sniffed extension over URL/content-type', () => {
  // Medium serves a GIF from a .png URL — the real format should win.
  const name = deriveFilename('https://cdn-images-1.medium.com/max/800/0*ABC.png', 'image/png', new Set(), 'gif');
  assert.equal(name, '0-abc.gif');
});

test('imageSize reads PNG header dimensions', () => {
  const png = Buffer.alloc(24);
  png.writeUInt32BE(0x89504e47, 0);
  png.writeUInt32BE(300, 16);
  png.writeUInt32BE(200, 20);
  assert.deepEqual(imageSize(png), { width: 300, height: 200 });
});

test('imageSize reads GIF header dimensions', () => {
  const gif = Buffer.alloc(16);
  gif.write('GIF89a', 0, 'ascii');
  gif.writeUInt16LE(300, 6);
  gif.writeUInt16LE(200, 8);
  assert.deepEqual(imageSize(gif), { width: 300, height: 200 });
});

test('imageSize reads JPEG SOF0 dimensions', () => {
  const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0xc8, 0x01, 0x2c, 0, 0, 0, 0, 0]);
  assert.deepEqual(imageSize(jpg), { width: 300, height: 200 });
});

test('imageSize reads WebP (VP8X) dimensions', () => {
  const webp = Buffer.alloc(30);
  webp.write('RIFF', 0, 'ascii');
  webp.write('WEBP', 8, 'ascii');
  webp.write('VP8X', 12, 'ascii');
  webp[24] = 299 & 0xff; webp[25] = (299 >> 8) & 0xff; webp[26] = (299 >> 16) & 0xff; // width - 1
  webp[27] = 199 & 0xff; webp[28] = (199 >> 8) & 0xff; webp[29] = (199 >> 16) & 0xff; // height - 1
  assert.deepEqual(imageSize(webp), { width: 300, height: 200 });
});

test('imageSize returns null for unrecognized / truncated data', () => {
  assert.equal(imageSize(Buffer.from('not an image at all')), null);
  assert.equal(imageSize(Buffer.alloc(4)), null);
  assert.equal(imageSize(null), null);
});

test('linkCardVariant flags large landscape thumbnails as wide', () => {
  assert.equal(linkCardVariant({ width: 1280, height: 640 }), 'wide');
  assert.equal(linkCardVariant({ width: 160, height: 160 }), 'default'); // square
  assert.equal(linkCardVariant({ width: 160, height: 96 }), 'default');  // landscape but small
  assert.equal(linkCardVariant({ width: 400, height: 400 }), 'default'); // large but square
  assert.equal(linkCardVariant(null), 'default');
});

test('styleLinkCardLine stamps thumbnail dimensions and keeps square cards standard', () => {
  const line = '<a class="link-card" href="https://x.dev"><img class="link-card-thumb" src="/blog/p/logo.png" alt="Logo"><span class="link-card-body"></span></a>';
  const out = styleLinkCardLine(line, () => ({ width: 160, height: 160 }));
  assert.match(out, /<img class="link-card-thumb" src="\/blog\/p\/logo\.png" alt="Logo" width="160" height="160">/);
  assert.match(out, /class="link-card"/);
  assert.doesNotMatch(out, /link-card--wide/);
});

test('styleLinkCardLine tags large landscape thumbnails wide', () => {
  const line = '<a class="link-card" href="https://x.dev"><img class="link-card-thumb" src="/blog/p/og.png" alt="OG"><span class="link-card-body"></span></a>';
  const out = styleLinkCardLine(line, () => ({ width: 1280, height: 640 }));
  assert.match(out, /class="link-card link-card--wide"/);
  assert.match(out, /width="1280" height="640"/);
});

test('styleLinkCardLine is idempotent and re-classifies on re-run', () => {
  const line = '<a class="link-card" href="https://x.dev"><img class="link-card-thumb" src="/blog/p/og.png" alt="OG"><span class="link-card-body"></span></a>';
  const once = styleLinkCardLine(line, () => ({ width: 1280, height: 640 }));
  const twice = styleLinkCardLine(once, () => ({ width: 1280, height: 640 }));
  assert.equal(twice, once); // no duplicated attrs/classes
  // a later re-measure that returns a square downgrades it back to standard
  const down = styleLinkCardLine(once, () => ({ width: 160, height: 160 }));
  assert.doesNotMatch(down, /link-card--wide/);
  assert.match(down, /width="160" height="160"/);
});

test('styleLinkCardLine leaves non-card lines and thumbless cards alone', () => {
  const plain = 'Just a paragraph with no card.';
  assert.equal(styleLinkCardLine(plain, () => ({ width: 1, height: 1 })), plain);
  const noThumb = '<a class="link-card" href="https://x.dev"><span class="link-card-body"></span></a>';
  assert.equal(styleLinkCardLine(noThumb, () => null), noThumb);
});
