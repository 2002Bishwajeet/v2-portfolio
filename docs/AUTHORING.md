# Writing & Publishing Blog Posts

Everything you need to write posts, add images, control social previews, and keep
every article fully SEO-compatible. No web framework knowledge required — if you
can write Markdown, you can publish.

- [Quick start](#quick-start)
- [Frontmatter reference](#frontmatter-reference)
- [Writing the body (Markdown)](#writing-the-body-markdown)
- [Adding images](#adding-images)
- [Image captions](#image-captions)
- [GIFs](#gifs)
- [Embedding tweets, GIFs & videos](#embedding-tweets-gifs--videos)
- [Link cards](#link-cards)
- [Custom social / OGP preview image](#custom-social--ogp-preview-image)
- [SEO checklist](#seo-checklist-per-post)
- [Drafts & scheduling](#drafts--scheduling)
- [Previewing locally](#previewing-locally)
- [Importing posts from Medium](#importing-posts-from-medium)

---

## Quick start

1. Create a file in `src/content/blog/`, e.g. `src/content/blog/my-first-post.md`.
   **The filename becomes the URL** → `/blog/my-first-post/`. Use lowercase words
   separated by hyphens, no spaces.
2. Paste this template at the very top and fill it in:

   ```markdown
   ---
   title: "My First Post"
   description: "A one-sentence summary — this is what shows up in Google and on social cards."
   pubDate: 2026-07-01
   tags: ["react", "architecture"]
   ---

   Your article starts here, in plain Markdown.
   ```

3. Write your post below the second `---`.
4. Commit and push to `main`. GitHub Actions rebuilds and deploys automatically —
   the new article appears at `about.bishwajeetparhi.dev/blog/my-first-post/` with
   all SEO tags generated for you.

That's the whole loop. Everything below is detail.

---

## Frontmatter reference

The block between the two `---` lines is "frontmatter" — structured metadata. It's
validated when the site builds, so a typo (missing title, malformed date) **fails
the build loudly** instead of silently shipping a broken, un-indexed page.

| Field          | Required | Type            | What it does |
| -------------- | -------- | --------------- | ------------ |
| `title`        | ✅       | text            | Article `<h1>`, `<title>` tag, OG/Twitter title. |
| `description`  | ✅       | text            | Meta description + social card text. **Write this deliberately — it's your search snippet.** Aim for 120–160 characters. |
| `pubDate`      | ✅       | date `YYYY-MM-DD` | Publish date; drives ordering, `article:published_time`, and the sitemap. |
| `updatedDate`  | ❌       | date            | Shown as "Updated …" and used for `dateModified`. Set it when you meaningfully revise a post. |
| `heroImage`    | ❌       | path or URL     | Large image shown at the top of the article. |
| `ogImage`      | ❌       | path or URL     | Dedicated social-share image (1200×630). See [below](#custom-social--ogp-preview-image). |
| `tags`         | ❌       | list of text    | Topic chips + RSS categories. `["react", "seo"]`. |
| `canonicalURL` | ❌       | full URL        | Point search engines at the original when re-publishing (e.g. from Medium). See [Medium import](#importing-posts-from-medium). |
| `draft`        | ❌       | `true`/`false`  | `true` hides the post from the listing, RSS, and sitemap. Defaults to `false`. |

---

## Writing the body (Markdown)

Standard Markdown, all styled to match the retro pixel theme:

```markdown
## A section heading

Regular paragraph text with **bold**, *italic*, and `inline code`.

- Bullet lists
- Like this

1. Numbered lists
2. Like this

> A blockquote for callouts.

[A link](https://example.com)

​```ts
// Fenced code blocks get syntax highlighting
const x = 1;
​```
```

Tables, horizontal rules (`---`), and images all work too. Use `##` and `###` for
headings inside a post — **don't use `#`**, that's reserved for the post title
which is generated from `title`.

> **Want to embed interactive components?** Rename the file from `.md` to `.mdx`
> and you can import and use Astro/React components inline. Plain Markdown is fine
> for 99% of posts.

---

## Adding images

**Step 1 — put the image file in `public/`.** Create a `public/blog/` folder to
keep things tidy:

```
public/
└─ blog/
   └─ my-first-post/
      ├─ diagram.png
      └─ screenshot.png
```

**Step 2 — reference it in Markdown by its site-root path** (starts with `/`, drop
the `public` part):

```markdown
![Architecture diagram showing the request flow](/blog/my-first-post/diagram.png)
```

The text in the square brackets is **alt text** — always write it. It's required
for accessibility *and* it's an SEO signal (it's how image search understands your
image).

> **Tip:** Keep images reasonably sized (compress before committing; aim for
> < 300 KB). Large images slow the page, which hurts SEO rankings.

---

## Image captions

To show a caption under an image, add a **title** in quotes after the path —
`![alt](src "caption")`:

```markdown
![Signal purple sent bubble reading Yo with a 12:41 PM timestamp](/blog/my-post/bubble.png "Chat bubble in Signal")
```

At build time a lone captioned image is wrapped in a `<figure>` and the title is
rendered as a centered, muted `<figcaption>` beneath it. The alt text (for
accessibility/SEO) and the caption (for readers) are separate — write both.

> This is handled by the `rehypeFigures` plugin in `astro.config.mjs`. It only
> fires when the image is alone in its paragraph, so keep captioned images on
> their own line with a blank line above and below.

---

## GIFs

A GIF is just an image — reference it exactly like any other:

```markdown
![Man gesturing dismissively, a reaction meme](/blog/my-post/reaction.gif)
```

It animates automatically and is centered like other images. Content images
(everything except the first/hero image) get `loading="lazy"` and
`decoding="async"` at build time, which matters for GIFs since they're often
several MB. For a GIF **hosted on Tenor or Giphy**, prefer their embed widget
instead — see the next section.

---

## Embedding tweets, GIFs & videos

Astro passes raw HTML in Markdown straight through, so you embed third-party
content by pasting the provider's official embed code directly into the post.
Load each provider's `<script>` **once per post** (put them at the very bottom of
the file). Everything below is centered automatically by the site's styles.

**Before embedding, check the source is still public** — a private or deleted
tweet/video renders as an error box on your page.

### Tweet / X post

On the tweet, use **••• → Embed post** and copy the code. It looks like:

```html
<blockquote class="twitter-tweet"><p>…tweet text…</p>&mdash; Name (@handle)
<a href="https://twitter.com/handle/status/1234567890">date</a></blockquote>
```

Then, **once at the bottom of the post**:

```html
<script async src="https://platform.x.com/widgets.js" charset="utf-8"></script>
```

The plain blockquote hydrates into the full rich card (avatar, media, likes).

### Tenor GIF

On the GIF, use **Share → Embed** and copy its `<div>`:

```html
<div class="tenor-gif-embed" data-postid="21179541" data-share-method="host" data-width="100%" data-aspect-ratio="1.5"></div>
```

Then, **once at the bottom of the post**:

```html
<script type="text/javascript" async src="https://tenor.com/embed.js"></script>
```

### Giphy / YouTube (and other iframes)

Wrap the provider's `<iframe>` in `<div class="video-embed">` for a responsive,
centered 16:9 frame. For YouTube, use `youtube-nocookie.com` for privacy:

```html
<div class="video-embed"><iframe src="https://www.youtube-nocookie.com/embed/VIDEO_ID" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe></div>
```

No extra `<script>` is needed for iframe embeds.

> **Trade-off:** these are third-party widgets styled by the provider, so they
> won't match the site's theme and add external requests. That's the accepted
> deal for keeping the real tweet/GIF/video interactive.

---

## Link cards

A "link card" is the themed preview box for an external link (title, description,
thumbnail) — matching the site's palette. Write it as an `<a class="link-card">`:

```html
<a class="link-card" href="https://example.com/article" target="_blank" rel="noopener"><img class="link-card-thumb" src="/blog/my-post/thumb.jpg" alt="Short thumbnail description" width="160" height="160"><span class="link-card-body"><span class="link-card-title">The article title</span><span class="link-card-desc">A one- or two-sentence summary of what's behind the link.</span><span class="link-card-host">example.com</span></span></a>
```

- The `<img>` is optional — omit it for a text-only card.
- Stamp the thumbnail's real `width`/`height` to avoid layout shift. If you
  localized the image, `npm run style:cards` measures and stamps this for you
  (see [MEDIUM-IMPORT.md](./MEDIUM-IMPORT.md#handling-images)).

---

## Custom social / OGP preview image

The "OGP preview" is the image/card that appears when your link is shared on
Twitter/X, LinkedIn, WhatsApp, Slack, etc. There's a clear priority order:

1. **`ogImage`** in frontmatter — a dedicated share image (best).
2. If no `ogImage`, the **`heroImage`** is used.
3. If neither, the **site default** (`/og-image.png`) is used.

To set a custom one for a post:

```markdown
---
title: "Scaling a Frontend Team"
description: "Lessons from growing a frontend org from 2 to 20."
pubDate: 2026-07-01
ogImage: "/blog/scaling-team/social-card.png"
---
```

Requirements for a good OGP image:

- **Exactly 1200 × 630 px** (the site advertises this size to crawlers).
- PNG or JPG, under ~1 MB.
- Put readable text near the center — some platforms crop the edges.

After publishing, validate how it looks with:

- X/Twitter: <https://cards-dev.twitter.com/validator>
- Facebook/LinkedIn: <https://developers.facebook.com/tools/debug/>

> These validators cache aggressively. If you update an image, use the debugger's
> "Scrape Again" to refresh the preview.

---

## SEO checklist (per post)

Most of this is automatic. The ✍️ items are the ones you control — do them and
every post is fully SEO-compatible.

Automatic on every build:

- ✅ `<title>` and meta description
- ✅ Canonical URL
- ✅ Open Graph + Twitter card tags (with 1200×630 dimensions)
- ✅ `BlogPosting` JSON-LD structured data (rich results)
- ✅ Entry in `sitemap.xml`
- ✅ Entry in the RSS feed at `/rss.xml`
- ✅ Fast, pre-rendered static HTML (no client JS needed to read the article)

Your job when writing:

- ✍️ Write a real, keyword-aware **`description`** (120–160 chars) — this is your
  search snippet.
- ✍️ Put the primary keyword in the **`title`** and the first paragraph.
- ✍️ Use **`##` / `###` headings** to structure the post (helps readers + crawlers).
- ✍️ Add **alt text** to every image.
- ✍️ Set an **`ogImage`** (or `heroImage`) so shares look good.
- ✍️ Link to your other relevant posts (internal links help SEO).
- ✍️ Keep the URL slug short and descriptive.

---

## Drafts & scheduling

- Set `draft: true` to keep a post out of the listing, RSS, and sitemap while you
  work on it. It won't be published. Flip to `false` (or remove the line) when
  ready.
- There's no timed scheduler — a post goes live the next time the site builds
  after you push it with `draft: false`.

---

## Previewing locally

```bash
npm install     # first time only
npm run dev     # http://localhost:4321 — hot-reloads as you edit
```

Before pushing, it's worth running the production build to catch any frontmatter
errors:

```bash
npm run build
npm run preview
```

---

## Importing posts from Medium

See the dedicated guide: **[MEDIUM-IMPORT.md](./MEDIUM-IMPORT.md)**. It covers
exporting from Medium, the one-command converter script, and — importantly — the
canonical-URL strategy so you don't get penalized for duplicate content.
