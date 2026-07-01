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

/**
 * Turn a standalone captioned image — `![alt](src "caption")`, which renders as
 * a lone <img> (with a title) in its own <p> — into a <figure> with a
 * <figcaption>. Semantic markup + a styleable caption.
 */
function rehypeFigures() {
  return (tree) => {
    const walk = (node) => {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        if (child.tagName === 'p' && child.children) {
          const meaningful = child.children.filter(
            (c) => !(c.type === 'text' && !c.value.trim())
          );
          const img = meaningful[0];
          if (meaningful.length === 1 && img.tagName === 'img' && img.properties?.title) {
            const caption = img.properties.title;
            delete img.properties.title;
            return {
              type: 'element',
              tagName: 'figure',
              properties: { className: ['post-figure'] },
              children: [
                img,
                { type: 'element', tagName: 'figcaption', properties: {}, children: [{ type: 'text', value: caption }] },
              ],
            };
          }
        }
        return child;
      });
      node.children.forEach(walk);
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
    rehypePlugins: [rehypeFigures, rehypeLazyImages],
    shikiConfig: {
      // Emit both light + dark token colors as CSS variables (--shiki-light /
      // --shiki-dark). `defaultColor: false` means Shiki sets no inline color,
      // so global.css drives everything from variables per theme.
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
    },
  },
});
