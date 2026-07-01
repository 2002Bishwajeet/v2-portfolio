# Portfolio

v2 version of my portfolio website.

A minimal, pixel-art inspired portfolio.

## Features

- Retro pixel-art aesthetic
- Responsive design
- Minimal dependencies
- Clean separation of concerns

## Tech

Built with [Astro](https://astro.build). The homepage and blog are pre-rendered
to static HTML at build time, so everything stays fast and SEO-friendly.

## Local development

```bash
npm install      # first time only
npm run dev      # start the dev server at http://localhost:4321
npm run build    # build the static site into ./dist
npm run preview  # preview the built site locally
```

## Writing a blog post

1. Create a Markdown file in `src/content/blog/`, e.g. `my-post.md`.
   The filename becomes the URL slug (`/blog/my-post/`).
2. Add frontmatter at the top:

   ```markdown
   ---
   title: "My Post Title"
   description: "One-line summary used for SEO + social cards."
   pubDate: 2026-07-01
   updatedDate: 2026-07-05   # optional
   heroImage: "/blog/my-cover.png"   # optional; put the file in public/blog/
   tags: ["astro", "seo"]
   draft: false              # true = hidden from listing, RSS and sitemap
   ---
   ```

3. Write the body in Markdown (or `.mdx` to embed components).
4. Commit and push to `main` — GitHub Actions rebuilds and deploys automatically.

Each post automatically gets a canonical URL, `<meta>` description, Open Graph +
Twitter cards, `BlogPosting` JSON-LD, and entries in `sitemap.xml` and `/rss.xml`.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site
and publishes `./dist` to GitHub Pages. `public/CNAME` keeps the
`about.bishwajeetparhi.dev` custom domain.

> One-time setup: in the repo's **Settings → Pages**, set **Source** to
> **GitHub Actions** (instead of "Deploy from a branch").

## Project structure

```
src/
├─ content/blog/       Markdown/MDX posts (your writing lives here)
├─ content.config.ts   Blog frontmatter schema (validated at build)
├─ layouts/            BaseLayout (SEO shell) + BlogPost (article template)
├─ pages/
│  ├─ index.astro      Homepage
│  ├─ blog/index.astro Blog listing
│  ├─ blog/[slug].astro One static page per post
│  └─ rss.xml.js       RSS feed
└─ styles/global.css   Theme variables + all styling
public/                Static assets (images, CNAME) served at site root
```

## Fonts

Uses Google Fonts:
- Press Start 2P (headers)
- VT323 (body text)

## License

MIT License. See [LICENSE](LICENSE) for details.

---

© 2025 by Bishwajeet Parhi -
