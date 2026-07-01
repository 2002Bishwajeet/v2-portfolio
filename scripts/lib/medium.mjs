// Pure conversion logic for the Medium importer, split out so it can be unit
// tested without touching the filesystem, network, or `gh`. The CLI
// (scripts/import-medium.mjs) wires these to real files and gist fetching.
import { parse } from 'node-html-parser';
import TurndownService from 'turndown';

export function slugify(str) {
  return String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Derive a clean slug from a Medium export filename. */
export function slugFromFilename(file) {
  return file
    .replace(/\.html$/i, '')
    .replace(/^draft_/, '')
    .replace(/^\d{4}-\d{2}-\d{2}_/, '') // strip date prefix
    .replace(/-+[0-9a-f]{6,}$/i, '')    // strip trailing --hash
    .replace(/-{2,}/g, '-')             // collapse repeated hyphens
    .replace(/^-+|-+$/g, '')            // trim leading/trailing hyphens
    .toLowerCase();
}

export function yamlEscape(str) {
  return String(str).replace(/"/g, '\\"').trim();
}

export function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Map GitHub's language name to a Shiki language id for syntax highlighting. */
export function ghLangToShiki(lang) {
  if (!lang) return '';
  const map = { 'shell': 'bash', 'plain text': 'text', 'text': 'text', 'c++': 'cpp' };
  const key = String(lang).toLowerCase();
  return map[key] || key;
}

export function hostFromUrl(u) {
  try { return new URL(u).host; } catch { return ''; }
}

export function makeTurndown() {
  const t = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' });
  // Pass our generated link cards through as raw HTML instead of collapsing them.
  t.addRule('linkCard', {
    filter: (node) => node.nodeName === 'A' && (node.getAttribute('class') || '').includes('link-card'),
    replacement: (_content, node) => '\n\n' + node.outerHTML + '\n\n',
  });
  return t;
}

const turndown = makeTurndown();

/**
 * Rewrite the article DOM in place so embedded content survives conversion.
 * `fetchGist(hash)` returns [{ language, content }] (or null on failure).
 * Returns counts of what was recovered.
 */
export function recoverCode(body, fetchGist) {
  let gistsInlined = 0;
  let linkCards = 0;

  // 1) Bare <pre> FIRST — so it can't re-wrap (and strip the language from) the
  //    gist code blocks inserted in step 2 (node-html-parser linkage quirk).
  for (const pre of body.querySelectorAll('pre')) {
    if (pre.querySelector('code')) continue;
    const text = parse(`<div>${pre.innerHTML.replace(/<br\s*\/?>/gi, '\n')}</div>`).text;
    pre.set_content(`<code>${escapeHtml(text)}</code>`);
  }

  // 2) GitHub Gist embeds → real code blocks with syntax highlighting.
  for (const fig of body.querySelectorAll('figure')) {
    const src = fig.querySelector('script')?.getAttribute('src') || fig.querySelector('a')?.getAttribute('href') || '';
    const m = src.match(/gist\.github\.com\/[^/]+\/([0-9a-f]{16,})/i);
    if (!m) continue;
    const files = fetchGist(m[1]);
    let out;
    if (files && files.length) {
      out = files
        .map((f) => `<pre><code class="language-${ghLangToShiki(f.language)}">${escapeHtml(f.content.replace(/\n+$/, ''))}</code></pre>`)
        .join('');
      gistsInlined += files.length;
    } else {
      out = `<p><a href="https://gist.github.com/2002Bishwajeet/${m[1]}">View code snippet on GitHub Gist</a></p>`;
    }
    fig.insertAdjacentHTML('afterend', out);
    fig.remove();
  }

  // 3) Medium "mixtape" link previews → clean link cards (title/desc/thumbnail).
  for (const box of body.querySelectorAll('.graf--mixtapeEmbed')) {
    const url = box.querySelector('a')?.getAttribute('href') || '';
    if (!url) continue;
    const title = box.querySelector('.markup--mixtapeEmbed-strong')?.text?.trim() || url;
    const desc = box.querySelector('.markup--mixtapeEmbed-em')?.text?.trim() || '';
    const thumb = ((box.querySelector('.mixtapeImage')?.getAttribute('style') || '').match(/url\(([^)]+)\)/) || [])[1] || '';
    const card =
      `<a class="link-card" href="${url}" target="_blank" rel="noopener">` +
      (thumb ? `<img class="link-card-thumb" src="${thumb}" alt="" />` : '') +
      `<span class="link-card-body">` +
      `<span class="link-card-title">${escapeHtml(title)}</span>` +
      (desc ? `<span class="link-card-desc">${escapeHtml(desc)}</span>` : '') +
      `<span class="link-card-host">${escapeHtml(hostFromUrl(url))}</span>` +
      `</span></a>`;
    box.insertAdjacentHTML('afterend', card);
    box.remove();
    linkCards++;
  }

  return { gistsInlined, linkCards };
}

/**
 * Convert one Medium export HTML string into a blog post.
 * opts: { file, fallbackDate, minWords, addCanonical, fetchGist }
 * Returns { slug, content, title, wordCount, isDraft, pubDate, gistsInlined,
 * linkCards } — or { skipped: 'no-body' | 'too-short', wordCount } when skipped.
 */
export function convertHtml(html, opts = {}) {
  const {
    file = '',
    fallbackDate = '',
    minWords = 100,
    addCanonical = true,
    fetchGist = () => null,
  } = opts;

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
  const pubDate = (datetime ? datetime.slice(0, 10) : dateMatch?.[1]) || fallbackDate;

  const canonicalHref = root.querySelector('.p-canonical')?.getAttribute('href') || '';
  const tags = root.querySelectorAll('.p-tags a, ul.tags > li').map((el) => el.text.trim()).filter(Boolean);

  const body = root.querySelector('.e-content') || root.querySelector('section[data-field="body"]');
  if (!body) return { skipped: 'no-body' };

  const wordCount = (body.text || '').trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < minWords) return { skipped: 'too-short', wordCount };

  // Drop the repeated title (h3.graf--title) and subtitle (h4) Medium injects.
  body.querySelector('.graf--title')?.remove();
  body.querySelector('.graf--subtitle')?.remove();

  const { gistsInlined, linkCards } = recoverCode(body, fetchGist);

  const markdown = turndown
    .turndown(body.innerHTML)
    .trim()
    .replace(/^(?:\*\s*\*\s*\*|-{3,}|_{3,})\s*\n+/, '') // drop Medium's leading divider
    // Fix links Medium wrapped in inline code (`[text](url)` renders literally).
    .replace(/`\[([^\]]+)\]\(([^)]+)\)`/g, '[`$1`]($2)');

  const isDraft = file.startsWith('draft_');
  const slug = slugFromFilename(file) || slugify(title);

  const frontmatter = [
    '---',
    `title: "${yamlEscape(title)}"`,
    `description: "${yamlEscape(subtitle || title)}"`,
    `pubDate: ${pubDate}`,
    tags.length ? `tags: [${tags.map((t) => `"${yamlEscape(t)}"`).join(', ')}]` : 'tags: []',
    ...(addCanonical && canonicalHref ? [`canonicalURL: "${canonicalHref}"`] : []),
    ...(isDraft ? ['draft: true'] : []),
    '---',
    '',
  ].join('\n');

  return { slug, content: frontmatter + markdown + '\n', title, wordCount, isDraft, pubDate, gistsInlined, linkCards };
}
