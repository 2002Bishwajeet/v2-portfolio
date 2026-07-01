// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

/**
 * Lazy-load and async-decode every in-content image so off-screen media (notably
 * the animated GIFs) doesn't block first paint. Skips the first image in a post
 * (usually the hero, above the fold) so it isn't needlessly deferred.
 */
function rehypeLazyImages() {
  return (tree) => {
    let seen = 0;
    const walk = (node) => {
      if (node.tagName === 'img' && node.properties) {
        seen += 1;
        if (seen > 1 && node.properties.loading === undefined) node.properties.loading = 'lazy';
        if (node.properties.decoding === undefined) node.properties.decoding = 'async';
      }
      (node.children || []).forEach(walk);
    };
    walk(tree);
  };
}

// https://astro.build/config
export default defineConfig({
  // Drives canonical URLs, sitemap.xml and the RSS feed. Keep in sync with CNAME.
  site: 'https://about.bishwajeetparhi.dev',
  trailingSlash: 'ignore',
  integrations: [mdx(), sitemap()],
  markdown: {
    rehypePlugins: [rehypeLazyImages],
    shikiConfig: {
      // Emit both light + dark token colors as CSS variables (--shiki-light /
      // --shiki-dark). `defaultColor: false` means Shiki sets no inline color,
      // so global.css drives everything from variables per theme.
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
    },
  },
});
