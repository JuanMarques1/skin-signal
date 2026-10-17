# Skin Signal

Site do Skin Signal, desenvolvido com React + Vite para apresentar o conceito de espelho inteligente e suas funcionalidades.

## Executar

Requer Node.js 20.19+ ou 22.12+.

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy na Vercel

1. Envie o projeto para um repositório GitHub.
2. Na Vercel, selecione **Add New → Project** e importe o repositório.
3. Framework: **Vite**. Build: `npm run build`. Output: `dist`.
4. Se necessário, configure a pasta do projeto como Root Directory.
5. Clique em **Deploy**. `vercel.json` serve as páginas HTML geradas no build e retorna 404 para URLs inexistentes.

Não são necessárias variáveis de ambiente nesta versão. Também é possível usar a CLI da Vercel após autenticação: `npx vercel`.

## Rotas

- `/`: Home
- `/sobre`: história, missão, visão e valores
- `/produto`: produto e funcionalidades propostas
- `/contato`: formulário de contato
- `/privacidade` e `/termos`: informações legais
- `/blog`: artigos
- `/loja`: apresentação do produto, sacola e checkout demonstrativo
- `/faq`: perguntas frequentes

## Funcionalidades atuais

Navegação, menu mobile, FAQ expansível, validação nativa do formulário e fluxo demonstrativo de sacola e checkout. O carrinho é mantido apenas na memória e é apagado ao recarregar. Atualmente não há processamento de pagamentos, envio de formulários, pedidos reais ou backend. A visualização do espelho utiliza CSS e dados ilustrativos.

## Próximas etapas

Integrar contatos verificados, pagamentos seguros, backend, envio de mensagens, logística e políticas adequadas à operação real. Não adicionar credenciais ao frontend nem apresentar depoimentos ou resultados clínicos não verificados.

## Fontes

Inter variável via Google Fonts, com alternativas locais de sistema. Para eliminar a requisição externa, hospede as fontes localmente ou remova o `@import` em `src/styles.css`.

## Busca e GEO

O build pré-renderiza todas as rotas públicas com o mesmo componente React usado no navegador. O cliente hidrata esse HTML para preservar as interações. Os artigos e o FAQ compartilham os dados entre renderização estática e navegador.

`src/seo.js` centraliza títulos, descrições, canonical, Open Graph e JSON-LD. Ao criar uma página, adicione-a à lista de metadados; os artigos de `src/content.js` entram automaticamente. O domínio canônico está definido em `origin`: atualize-o se adotar um domínio próprio.

`scripts/prerender.mjs` gera o sitemap e robots.txt em `dist`. Não há regras especiais de bloqueio de robôs. A estrutura usa WebSite, WebPage e Article, sem ofertas comerciais ou resultados clínicos.

Após gerar o build, execute `npm run check:seo`. Depois do deploy, confirme as URLs no Search Console e envie `/sitemap.xml`. Indexação e citações por ferramentas de IA não são garantidas.

## Rotina interativa e comparação

A página `/produto` compara um espelho comum com os recursos propostos do Skin Signal. `/rotina` oferece três perguntas sobre horário, tempo e objetivo, gerando um checklist que pode ser marcado. É possível voltar, ajustar respostas e recomeçar. Tudo fica no estado do React: não há conta, API, envio de dados ou armazenamento persistente. O checklist organiza hábitos e não recomenda tratamentos.

As perguntas e a lógica estão em `src/routine.js`; a interface está em `src/RoutineQuiz.jsx` e a tabela em `src/ProductComparison.jsx`.
