---
title: "Welcome to the Blog"
description: "How this blog works — write Markdown, commit, and get a fast, SEO-friendly article deployed automatically."
pubDate: 2026-07-01
tags: ["meta", "astro"]
draft: false
---

This is the first post on my new blog. It exists to prove the pipeline works — and
to show how I'll write everything from here on.

## How writing a post works

1. Create a Markdown file in `src/content/blog/`.
2. Fill in the frontmatter at the top (`title`, `description`, `pubDate`, `tags`).
3. Write the body in plain **Markdown**.
4. Commit and push — the site rebuilds and deploys itself.

That's it. Every post becomes its own static HTML page with the right meta tags,
Open Graph preview, Twitter card, and `BlogPosting` structured data baked in at
build time.

## What you get for free

- A canonical URL and per-post `<meta>` description
- Open Graph + Twitter preview cards
- JSON-LD structured data for rich search results
- An entry in `sitemap.xml` and the RSS feed at `/rss.xml`

## Markdown features

You can use everything you'd expect:

> Blockquotes for the important bits.

Inline `code`, and fenced blocks:

```ts
export function hello(name: string) {
  return `Hello, ${name}!`;
}
```

Lists, [links](https://about.bishwajeetparhi.dev/), tables — all styled to match
the retro pixel theme.

| Feature   | Status |
| --------- | ------ |
| Markdown  | ✅     |
| SEO       | ✅     |
| RSS       | ✅     |

Onward. 🎮
