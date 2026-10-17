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
5. Clique em **Deploy**. `vercel.json` configura as URLs internas para a SPA.

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
