import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findMediumImages, extFromContentType, sanitizeName, deriveFilename } from './images.mjs';

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
