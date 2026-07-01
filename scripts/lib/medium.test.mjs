import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  slugify,
  slugFromFilename,
  escapeHtml,
  ghLangToShiki,
  hostFromUrl,
  convertHtml,
} from './medium.mjs';

// --- small pure helpers ---

test('slugify lowercases and hyphenates', () => {
  assert.equal(slugify('Hello, World!'), 'hello-world');
  assert.equal(slugify('  Spaces  &  Symbols  '), 'spaces-symbols');
});

test('slugFromFilename strips date prefix, trailing hash, draft_, and collapses hyphens', () => {
  assert.equal(
    slugFromFilename('2021-07-19_CppCon-2021--Hybrid-C---Conference-89fd6534acf7.html'),
    'cppcon-2021-hybrid-c-conference',
  );
  assert.equal(slugFromFilename('draft_Fluttering-With-Bubbles-444d137283d9.html'), 'fluttering-with-bubbles');
  assert.equal(slugFromFilename('2024-08-31_Simple-Post-4a0b7ee90ba6.html'), 'simple-post');
});

test('ghLangToShiki maps GitHub language names to Shiki ids', () => {
  assert.equal(ghLangToShiki('Dart'), 'dart');
  assert.equal(ghLangToShiki('Shell'), 'bash');
  assert.equal(ghLangToShiki('C++'), 'cpp');
  assert.equal(ghLangToShiki('Plain Text'), 'text');
  assert.equal(ghLangToShiki('TypeScript'), 'typescript');
  assert.equal(ghLangToShiki(null), '');
  assert.equal(ghLangToShiki(undefined), '');
});

test('escapeHtml escapes ampersands and angle brackets (but not quotes)', () => {
  assert.equal(escapeHtml('<a> & <b>'), '&lt;a&gt; &amp; &lt;b&gt;');
  assert.equal(escapeHtml('a "b" c'), 'a "b" c');
});

test('hostFromUrl returns host or empty string', () => {
  assert.equal(hostFromUrl('https://www.gitpod.io/docs/x'), 'www.gitpod.io');
  assert.equal(hostFromUrl('not a url'), '');
});

// --- convertHtml (full pipeline, incl. recoverCode) ---

function mediumHtml({
  title = 'My Post',
  subtitle = 'A subtitle',
  date = '2022-05-06T10:00:00.000Z',
  canonical = 'https://medium.com/@me/my-post-abc',
  bodyInner,
} = {}) {
  bodyInner = bodyInner ?? `<p>${'word '.repeat(150)}</p>`;
  return `<!DOCTYPE html><html><head><title>${title} – Medium</title></head><body>
    <header><h1 class="p-name">${title}</h1></header>
    <section data-field="description" class="p-summary">${subtitle}</section>
    ${date ? `<time class="dt-published" datetime="${date}">d</time>` : ''}
    ${canonical ? `<a class="p-canonical" href="${canonical}">c</a>` : ''}
    <section data-field="body" class="e-content">${bodyInner}</section>
  </body></html>`;
}

const fakeGist = () => [{ language: 'Dart', content: 'void main() {}\n' }];

test('convertHtml extracts title, description, date, canonical, and slug', () => {
  const r = convertHtml(mediumHtml(), { file: '2022-05-06_My-Post-abc123def456.html', minWords: 0 });
  assert.match(r.content, /title: "My Post"/);
  assert.match(r.content, /description: "A subtitle"/);
  assert.match(r.content, /pubDate: 2022-05-06/);
  assert.match(r.content, /canonicalURL: "https:\/\/medium\.com\/@me\/my-post-abc"/);
  assert.equal(r.slug, 'my-post');
  assert.equal(r.isDraft, false);
});

test('convertHtml skips short replies (below min-words)', () => {
  const r = convertHtml(mediumHtml({ bodyInner: '<p>thanks for reading</p>' }), { file: 'x.html' });
  assert.equal(r.skipped, 'too-short');
});

test('convertHtml returns no-body when content section is missing', () => {
  const r = convertHtml('<html><body><h1 class="p-name">x</h1></body></html>', { file: 'x.html', minWords: 0 });
  assert.equal(r.skipped, 'no-body');
});

test('convertHtml marks drafts and uses the fallback date when Medium has none', () => {
  const r = convertHtml(mediumHtml({ date: null }), { file: 'draft_My-Post.html', minWords: 0, fallbackDate: '2024-01-01' });
  assert.match(r.content, /draft: true/);
  assert.match(r.content, /pubDate: 2024-01-01/);
  assert.equal(r.isDraft, true);
});

test('convertHtml omits canonicalURL when addCanonical is false', () => {
  const r = convertHtml(mediumHtml(), { file: 'x.html', minWords: 0, addCanonical: false });
  assert.doesNotMatch(r.content, /canonicalURL/);
});

test('convertHtml inlines gist code WITH language, even alongside a bare <pre> (regression)', () => {
  const body = `
    <pre class="graf--pre">dep: ^1.0.0<br>other: ^2.0.0</pre>
    <figure class="graf--iframe"><script src="https://gist.github.com/2002Bishwajeet/99cb74f64479cb2a1b7d119e4de65aa1.js"></script></figure>
    <p>${'word '.repeat(120)}</p>`;
  const r = convertHtml(mediumHtml({ bodyInner: body }), { file: 'x.html', minWords: 0, fetchGist: fakeGist });
  assert.equal(r.gistsInlined, 1);
  assert.match(r.content, /```dart\nvoid main\(\) \{\}\n```/); // language survived the bare-pre pass
  assert.match(r.content, /```\r?\ndep: \^1\.0\.0\nother: \^2\.0\.0\n```/); // bare pre fenced (no lang)
});

test('convertHtml falls back to a gist link when the fetch fails', () => {
  const body = `<figure class="graf--iframe"><script src="https://gist.github.com/2002Bishwajeet/99cb74f64479cb2a1b7d119e4de65aa1.js"></script></figure><p>${'word '.repeat(120)}</p>`;
  const r = convertHtml(mediumHtml({ bodyInner: body }), { file: 'x.html', minWords: 0, fetchGist: () => null });
  assert.equal(r.gistsInlined, 0);
  assert.match(r.content, /View code snippet on GitHub Gist/);
});

test('convertHtml converts a Medium mixtape embed into a themed link card', () => {
  const body = `
    <div class="graf--mixtapeEmbed"><a href="https://www.gitpod.io/" class="markup--mixtapeEmbed-anchor"><strong class="markup--mixtapeEmbed-strong">Gitpod</strong><br><em class="markup--mixtapeEmbed-em">Ready to code</em>www.gitpod.io</a><a href="https://www.gitpod.io/" class="mixtapeImage" style="background-image: url(https://cdn/img.png);"></a></div>
    <p>${'word '.repeat(120)}</p>`;
  const r = convertHtml(mediumHtml({ bodyInner: body }), { file: 'x.html', minWords: 0 });
  assert.equal(r.linkCards, 1);
  assert.match(r.content, /<a class="link-card" href="https:\/\/www\.gitpod\.io\/"/);
  assert.match(r.content, /link-card-title">Gitpod</);
  assert.match(r.content, /link-card-desc">Ready to code</);
  assert.match(r.content, /link-card-thumb" src="https:\/\/cdn\/img\.png"/);
  assert.match(r.content, /link-card-host">www\.gitpod\.io</);
});

test('convertHtml unwraps links Medium put inside inline code', () => {
  const body = `<p>see <code>[contributing.md](https://example.com/CONTRIBUTING.md)</code> ${'word '.repeat(120)}</p>`;
  const r = convertHtml(mediumHtml({ bodyInner: body }), { file: 'x.html', minWords: 0 });
  assert.match(r.content, /\[`contributing\.md`\]\(https:\/\/example\.com\/CONTRIBUTING\.md\)/);
  assert.doesNotMatch(r.content, /`\[contributing/);
});

test('convertHtml strips a leading Medium divider', () => {
  const body = `<hr><p>${'word '.repeat(120)}</p>`;
  const r = convertHtml(mediumHtml({ bodyInner: body }), { file: 'x.html', minWords: 0 });
  assert.doesNotMatch(r.content, /\* \* \*/);
});
