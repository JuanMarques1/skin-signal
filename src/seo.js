import {articles} from './content.js';

export const origin = 'https://skin-signal.vercel.app';
const pages = {
  '/rotina': ['Monte sua rotina de autocuidado | Skin Signal', 'Responda três perguntas sobre horários e hábitos e monte um checklist simples de autocuidado, sem cadastro ou envio de dados.'],
  '/': ['Skin Signal | Espelho inteligente para autocuidado', 'Conheça o conceito Skin Signal: espelho inteligente com iluminação, organização da rotina e proposta de acompanhamento visual. Produto em desenvolvimento.'],
  '/produto': ['Espelho inteligente Skin Signal | Recursos propostos', 'Entenda a proposta do espelho Skin Signal: LED ajustável, registros visuais e lembretes de autocuidado. Conheça os recursos e seus limites.'],
  '/sobre': ['Sobre o Skin Signal | Tecnologia e autocuidado', 'Conheça a ideia, a missão e os valores do Skin Signal, um conceito de espelho inteligente para organizar a rotina de autocuidado.'],
  '/loja': ['Skin Signal Smart Mirror | Demonstração do produto', 'Explore o conceito Skin Signal Smart Mirror. Produto em desenvolvimento, sem preço definido, vendas ou pagamentos reais.'],
  '/blog': ['Skin Signal Journal | Rotina, IA e privacidade', 'Leia sobre organização do autocuidado, inteligência artificial e privacidade no conceito de espelho inteligente Skin Signal.'],
  '/contato': ['Contato | Skin Signal', 'Conheça a página de contato do Skin Signal. O formulário desta versão é demonstrativo e não envia nem armazena mensagens.'],
  '/faq': ['Perguntas frequentes | Espelho Skin Signal', 'Tire dúvidas sobre o estágio do Skin Signal, os recursos de IA propostos, privacidade, assinatura e limites do produto.'],
  '/privacidade': ['Política de privacidade | Skin Signal', 'Entenda como esta demonstração do Skin Signal trata formulários, sacola, câmera e dados de navegação.'],
  '/termos': ['Termos de uso | Skin Signal', 'Consulte os termos da demonstração Skin Signal: produto conceitual, recursos propostos e simulação de compra sem cobrança.'],
};
for (const article of articles) pages[`/blog/${article.slug}`] = [`${article.title} | Skin Signal Journal`, article.excerpt];
export const routes = Object.keys(pages);
export function metadata(path) {
  const [title, description] = pages[path] || ['Página não encontrada | Skin Signal', 'A página solicitada não foi encontrada. Explore o conceito Skin Signal.'];
  const article = articles.find(a => path === `/blog/${a.slug}`);
  const url = origin + path;
  return {title, description, url, type: article ? 'article' : 'website', robots: pages[path] ? 'index,follow' : 'noindex,follow', schema: {
    '@context': 'https://schema.org', '@graph': [
      {'@type': 'WebSite', '@id': `${origin}/#website`, url: `${origin}/`, name: 'Skin Signal', inLanguage: 'pt-BR', description: pages['/'][1]},
      {'@type': article ? 'Article' : 'WebPage', '@id': `${url}#page`, url, name: title, description, inLanguage: 'pt-BR', isPartOf: {'@id': `${origin}/#website`}, ...(article ? {headline: article.title, author: {'@type': 'Organization', name: 'Equipe Skin Signal'}, articleBody: article.body.join('\n\n')} : {})},
    ],
  }};
}
export function updateMetadata(path) {
  const data = metadata(path);
  document.title = data.title;
  const setMeta = (key, value, property = false) => {
    const attr = property ? 'property' : 'name';
    let node = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!node) { node = document.createElement('meta'); node.setAttribute(attr, key); document.head.append(node); }
    node.content = value;
  };
  setMeta('description', data.description);
  setMeta('robots', data.robots);
  for (const [key, value] of Object.entries({'og:title':data.title, 'og:description':data.description, 'og:url':data.url, 'og:type':data.type, 'og:site_name':'Skin Signal', 'og:locale':'pt_BR', 'og:image':`${origin}/images/hero-editorial.jpg`})) setMeta(key, value, true);
  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', data.title);
  setMeta('twitter:description', data.description);
  setMeta('twitter:image', `${origin}/images/hero-editorial.jpg`);
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical); }
  canonical.href = data.url;
  let schema = document.getElementById('page-schema');
  if (!schema) { schema = document.createElement('script'); schema.id = 'page-schema'; schema.type = 'application/ld+json'; document.head.append(schema); }
  schema.textContent = JSON.stringify(data.schema).replace(/</g, '\\u003c');
}
