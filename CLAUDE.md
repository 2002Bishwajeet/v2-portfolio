# CLAUDE.md

Guidance for working in this repository.

## What this is

A static portfolio + blog built with **Astro 7**, deployed to **GitHub Pages**.
Pushing to `main` triggers `.github/workflows/deploy.yml` (Astro build on Node 22)
which publishes the site to `https://about.bishwajeetparhi.dev`. There is no
server — everything is pre-rendered static HTML.

## Commands

```bash
npm run dev          # local dev server at http://localhost:4321 (hot reload)
npm run build        # production build to dist/ — run before pushing to catch frontmatter errors
npm run preview      # serve the built dist/ locally
npm test             # node:test unit tests for scripts/lib/*
```

Medium-import / maintenance scripts (see docs):

```bash
npm run import:medium -- <export/posts>   # convert Medium HTML export → Markdown
npm run localize:images                   # download CDN images into public/, rewrite refs
npm run fix:extensions                    # repair mislabeled image extensions (e.g. GIF-as-.png)
npm run style:cards                       # measure & stamp link-card thumbnail width/height
npm run restore:captions -- <export/posts># bring back <figcaption>s as image titles
```

## Layout

- `src/content/blog/*.md` — blog posts (Astro content collection). Filename = URL slug.
  Frontmatter is schema-validated in `src/content.config.ts` (bad frontmatter fails the build).
- `src/pages/` — routes: `index.astro`, `blog/index.astro`, `blog/[slug].astro`, `rss.xml.js`.
- `src/layouts/` — `BaseLayout.astro` (shell, SEO/meta) and `BlogPost.astro` (article).
- `src/styles/global.css` — all styling. Brown palette + `[data-theme]` dark/light.
  Retro pixel theme. Link-card, figure/figcaption, and centered-embed styles live here.
- `astro.config.mjs` — `site` (drives canonical URLs / sitemap / RSS), Shiki dual-theme
  code highlighting, and two custom rehype plugins:
  - `rehypeFigures` — turns `![alt](src "caption")` into `<figure>` + `<figcaption>`.
  - `rehypeLazyImages` — adds `loading="lazy"`/`decoding="async"` to content images (skips the hero).
- `scripts/` — Medium importer + image tooling. Pure logic lives in `scripts/lib/`
  (`medium.mjs`, `images.mjs`) and is unit-tested — keep new logic there and add tests.

## Conventions

- **Writing/editing posts:** follow `docs/AUTHORING.md`. It documents frontmatter,
  images, captions, GIFs, embeds (tweet/Tenor/Giphy/YouTube), link cards, and SEO.
- **Importing from Medium:** follow `docs/MEDIUM-IMPORT.md`.
- **Embeds** are pasted provider widget code (Astro preserves raw HTML). Load each
  provider `<script>` once per post, at the bottom. Verify the source is still public.
- No image library is available (no sharp/PIL/ffmpeg). Image work in `scripts/lib/images.mjs`
  parses headers with pure JS (magic bytes) — extend that, don't add a dependency.
- Use `##`/`###` in post bodies — `#` is reserved for the generated title.
- Run `npm run build` and `npm test` before pushing.

## Deploy notes

- `site` in `astro.config.mjs` must stay in sync with the `CNAME`.
- A push to `main` is a publish. Prefer confirming the build is green locally first.
