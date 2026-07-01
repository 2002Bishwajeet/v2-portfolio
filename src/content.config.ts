import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * The "blog" collection. Every Markdown/MDX file in src/content/blog/ becomes
 * a post. The schema validates frontmatter at build time, so a typo (missing
 * title, bad date) fails the build instead of shipping a broken, un-SEO'd page.
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    /** Optional in-article hero image: site-root path (e.g. /blog/foo.png) or URL. */
    heroImage: z.string().optional(),
    /** Custom social/OGP preview image (1200×630). Falls back to heroImage, then the site default. */
    ogImage: z.string().optional(),
    tags: z.array(z.string()).default([]),
    /**
     * Override the canonical URL for this post. Use when re-publishing content
     * that lives elsewhere (e.g. Medium) to point search engines at the original
     * and avoid duplicate-content penalties. Leave blank to be self-canonical.
     */
    canonicalURL: z.string().url().optional(),
    /** Set true to keep a post out of the listing, RSS and sitemap. */
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
