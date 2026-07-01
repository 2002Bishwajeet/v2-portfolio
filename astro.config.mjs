// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  // Drives canonical URLs, sitemap.xml and the RSS feed. Keep in sync with CNAME.
  site: 'https://about.bishwajeetparhi.dev',
  trailingSlash: 'ignore',
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      // Emit both light + dark token colors as CSS variables (--shiki-light /
      // --shiki-dark). `defaultColor: false` means Shiki sets no inline color,
      // so global.css drives everything from variables per theme.
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
    },
  },
});
