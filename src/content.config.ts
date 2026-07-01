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
    /** Optional social/preview image: site-root path (e.g. /blog/foo.png) or URL. */
    heroImage: z.string().optional(),
    tags: z.array(z.string()).default([]),
    /** Set true to keep a post out of the listing, RSS and sitemap. */
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
