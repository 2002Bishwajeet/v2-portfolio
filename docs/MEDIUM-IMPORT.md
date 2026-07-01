# Importing Your Posts from Medium

Move your Medium stories into this site as Markdown, with SEO handled correctly.
There's a converter script that does the heavy lifting.

- [Step 1 — Export your content from Medium](#step-1--export-your-content-from-medium)
- [Step 2 — Run the converter](#step-2--run-the-converter)
- [Step 3 — Review each post](#step-3--review-each-post)
- [Step 4 — The canonical-URL / SEO decision (important)](#step-4--the-canonical-url--seo-decision-important)
- [Handling images](#handling-images)
- [Alternatives](#alternatives-for-a-post-or-two)

---

## Step 1 — Export your content from Medium

1. Go to **Medium → Settings → Security and apps** (or visit
   <https://medium.com/me/settings/security>).
2. Find **"Download your information"** and click **Download `.zip`**.
3. Medium emails you a link (can take a few minutes). Download and unzip it.
4. Inside you'll find a **`posts/`** folder full of `.html` files — one per story
   (drafts are prefixed with `draft_`). That folder is what you feed the script.

---

## Step 2 — Run the converter

From the project root:

```bash
npm install                                   # first time only (installs the converter deps)
npm run import:medium -- ~/Downloads/medium-export/posts
```

Point the path at your unzipped `posts/` folder. The script writes one Markdown
file per story into `src/content/blog/`, with frontmatter (`title`, `description`,
`pubDate`, `tags`, `canonicalURL`) already filled in from the Medium metadata.

Options:

| Flag                | Effect |
| ------------------- | ------ |
| `--drafts`          | Also import Medium drafts (marked `draft: true`, so they stay unpublished). |
| `--out <dir>`       | Write somewhere other than `src/content/blog`. |
| `--no-canonical`    | Don't add a `canonicalURL` back to Medium (see Step 4 before using this). |

Example — import everything including drafts:

```bash
npm run import:medium -- ~/Downloads/medium-export/posts --drafts
```

### What the importer recovers automatically

Medium's export is messy; the script handles the tricky parts:

- **GitHub Gist embeds** → fetched via the `gh` CLI and inlined as real, syntax-highlighted code blocks (with the correct language). Requires `gh` to be authenticated (`gh auth status`).
- **Bare `<pre>` snippets** → converted to proper fenced code blocks.
- **Medium "mixtape" link previews** → rebuilt as themed link cards (title, description, thumbnail).
- **Replies/comments** → filtered out via `--min-words` (default 100).
- **Links Medium wrapped in inline code** → unwrapped so they render as links.

The conversion logic lives in `scripts/lib/medium.mjs` and is covered by unit
tests — run `npm test`.

---

## Step 3 — Review each post

Medium's exported HTML is messy, so treat the output as a strong first draft:

- Check **code blocks** — verify the language and that nothing got mangled.
- Check **images** — see [Handling images](#handling-images) below.
- Fill in any **`pubDate`** the script couldn't detect (it warns you which files).
- Tidy the **`description`** — Medium subtitles are sometimes empty or too long
  for a good search snippet (aim for 120–160 chars).
- Rename the file if you want a cleaner **URL slug**.

Preview locally before publishing:

```bash
npm run dev     # then open the post under http://localhost:4321/blog/...
```

---

## Step 4 — The canonical-URL / SEO decision (important)

If the same article lives on both Medium and your site, search engines see
**duplicate content** and may rank neither well. You have three clean options:

1. **Keep both, credit Medium as the original (safe default).**
   The script sets `canonicalURL` to the Medium URL automatically. Search engines
   treat Medium as canonical; your copy won't compete or get penalized. This is
   the default — do nothing extra.

2. **Make *your site* the canonical (best if you want SEO credit).**
   Do this **only** if the Medium post also points its canonical at your site.
   Medium supports this when you *import* a story from an existing URL, or you can
   unlist/delete the Medium version. Then run the import with `--no-canonical` (or
   delete the `canonicalURL` line) so your post is self-canonical.

3. **Remove it from Medium entirely**, then use `--no-canonical`. Your site becomes
   the one true home for the content.

> **Rule of thumb:** if the post stays public on Medium, keep the default
> (`canonicalURL` → Medium). Only go self-canonical when your site is genuinely
> the primary home.

See the `canonicalURL` field in [AUTHORING.md](./AUTHORING.md#frontmatter-reference).

---

## Handling images

Right after import, images still point at Medium's CDN (e.g.
`https://cdn-images-1.medium.com/...`). That works, but ties your posts to Medium.
Self-host them with one command:

```bash
npm run localize:images
```

This downloads every Medium-hosted image (inline images **and** link-card
thumbnails) into `public/blog/<post-slug>/` and rewrites the references to local
paths. The real format is detected from each file's bytes, so a GIF that Medium
serves from a `.png` URL is still saved as `.gif` (animated GIFs then play and
are served with the right type). It's re-runnable and throttled with backoff
(Medium's CDN rate-limits bursts — if some images 429, just run it again;
already-localized ones are skipped).

> Imported before this format check existed? Repair any mislabeled files (and
> their references) in one pass with `npm run fix:extensions`.

Then size the link-card thumbnails so each preview renders to its image's real
shape:

```bash
npm run style:cards
```

This measures each localized thumbnail and stamps its `width`/`height` (zero
layout shift). Square/portrait thumbnails render as a tile beside the text; a
large landscape preview (an OG/social image) becomes a full-width hero on top.
It's idempotent — safe to re-run after any import. (`npm run localize:images`
must run first so the images exist locally.)

Afterwards, consider adding real **alt text** to the `![](…)` images — Medium
usually leaves it blank, and alt text helps accessibility and SEO. See
[AUTHORING.md → Adding images](./AUTHORING.md#adding-images).

---

## Alternatives for a post or two

If you only have one or two posts, converting by hand may be faster than exporting
the whole account:

- Open the Medium post, copy the text, paste into a new `.md` file, and add
  frontmatter yourself (see [AUTHORING.md](./AUTHORING.md#quick-start)).
- Medium also exposes an RSS feed at `https://medium.com/feed/@yourusername` — handy
  for grabbing recent post content/URLs, though it only includes the latest ~10.
