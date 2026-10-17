import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {metadata, routes, indexableRoutes, origin} from '../src/seo.js';
import {articles, faqs} from '../src/content.js';

const decode = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'");
const titles = new Set();
for (const route of routes) {
  const html = await readFile(route === '/' ? 'dist/index.html' : `dist${route}/index.html`, 'utf8');
  assert.match(html, /<div id="root"><.+/s, `${route}: missing rendered content`);
  assert.match(html, /<h1[ >]/, `${route}: missing heading`);
  assert.equal((html.match(/<title>/g) || []).length, 1);
  const title = decode(html.match(/<title>(.*?)<\/title>/s)[1]);
  assert.equal(title, metadata(route).title);
  assert(!titles.has(title), `${route}: duplicate title`); titles.add(title);
  assert(html.includes(`rel="canonical" href="${origin}${route}"`));
  assert(html.includes(`name="robots" content="${metadata(route).robots}"`));
  const schema = JSON.parse(html.match(/id="page-schema" type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(schema['@graph'][1].url, origin + route);
  for (const [, href] of html.matchAll(/<a[^>]*href="(\/[^"#?]*)"/g)) assert(routes.includes(href), `${route}: internal link missing static page: ${href}`);
  const article = articles.find(a => route === `/blog/${a.slug}`);
  if (article) for (const paragraph of article.body) assert(decode(html).includes(paragraph));
  if (route === '/faq') for (const [question, answer] of faqs) { assert(decode(html).includes(question)); assert(decode(html).includes(answer)); }
}
const sitemap = await readFile('dist/sitemap.xml', 'utf8');
assert.equal((sitemap.match(/<loc>/g) || []).length, indexableRoutes.length);
for (const route of indexableRoutes) assert(sitemap.includes(`<loc>${origin}${route}</loc>`));
assert.match(await readFile('dist/robots.txt', 'utf8'), /User-agent: \*\nAllow: \/\n/);
assert.match(await readFile('dist/404.html', 'utf8'), /name="robots" content="noindex,follow"/);
const config = JSON.parse(await readFile('vercel.json', 'utf8'));
assert(!config.rewrites, 'Catch-all rewrites would hide missing pages');
console.log(`SEO checks passed for ${routes.length} pages, article/FAQ content, internal links, sitemap, robots and 404.`);
