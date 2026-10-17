import {readFile, writeFile, mkdir, rm} from 'node:fs/promises';
import {dirname} from 'node:path';
import {render} from '../.prerender/entry-server.js';
import {metadata, routes, indexableRoutes, origin} from '../src/seo.js';

const template = await readFile('dist/index.html', 'utf8');
const escape = value => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
for (const path of [...routes, '/404']) {
  const m = metadata(path);
  const meta = (name, value, property = false) => `<meta ${property ? 'property' : 'name'}="${name}" content="${escape(value)}"/>`;
  const head = `<title>${escape(m.title)}</title>${meta('description', m.description)}${meta('robots', m.robots)}<link rel="canonical" href="${escape(m.url)}"/>`
    + Object.entries({'og:title':m.title, 'og:description':m.description, 'og:url':m.url, 'og:type':m.type, 'og:site_name':'Skin Signal', 'og:locale':'pt_BR', 'og:image':`${origin}/images/hero-editorial.jpg`, 'twitter:card':'summary_large_image', 'twitter:title':m.title, 'twitter:description':m.description, 'twitter:image':`${origin}/images/hero-editorial.jpg`}).map(([k,v]) => meta(k,v,k.startsWith('og:'))).join('')
    + `<script id="page-schema" type="application/ld+json">${JSON.stringify(m.schema).replace(/</g, '\\u003c')}</script>`;
  const html = template.replace(/<title>.*?<\/title>/s, '').replace(/<meta name="description"[^>]*>/, '').replace('</head>', `${head}</head>`).replace('<div id="root"></div>', `<div id="root">${render(path)}</div>`);
  const file = path === '/' ? 'dist/index.html' : path === '/404' ? 'dist/404.html' : `dist${path}/index.html`;
  await mkdir(dirname(file), {recursive:true});
  await writeFile(file, html);
}
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexableRoutes.map(path => `  <url><loc>${origin}${path}</loc></url>`).join('\n')}\n</urlset>\n`);
await rm('.prerender', {recursive:true, force:true});
console.log(`Generated ${routes.length} public pages, 404, robots.txt and sitemap.xml.`);
