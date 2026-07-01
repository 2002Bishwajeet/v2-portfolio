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
});
