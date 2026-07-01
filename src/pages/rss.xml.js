import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

// Generated at /rss.xml on every build. Advertised via <link rel="alternate">
// in BaseLayout so feed readers discover it automatically.
export async function GET(context) {
  const posts = (await getCollection('blog'))
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: 'Bishwajeet Parhi — Blog',
    description:
      'Writing on frontend architecture, cross-platform development, and agentic AI workflows.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}/`,
      categories: post.data.tags,
    })),
    customData: `<language>en-us</language>`,
  });
}
