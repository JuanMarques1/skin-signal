# Skin Signal

Site acadêmico em React + Vite, inspirado no conceito de espelho inteligente Skin Signal. Design responsivo champagne/rosé.

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

1. Extraia este projeto e envie seu conteúdo para um repositório GitHub.
2. Na Vercel, selecione **Add New → Project** e importe o repositório.
3. Framework: **Vite**. Build: `npm run build`. Output: `dist`.
4. Se o projeto estiver dentro de uma pasta do repositório, defina essa pasta como Root Directory.
5. Clique em **Deploy**. `vercel.json` configura as URLs internas para a SPA.

Não precisa de variáveis de ambiente nesta versão. Também é possível usar a CLI da Vercel após autenticação: `npx vercel`.

## Rotas

- `/`: Home
- `/sobre`: história, missão, visão e valores
- `/produto`: produto e funcionalidades propostas
- `/contato`: formulário demonstrativo e situação dos canais de contato
- `/privacidade` e `/termos`: documentos para a demonstração acadêmica
- `/blog`: artigos, com URLs próprias
- `/loja`: produto, sacola e conclusão de compra simulada
- `/faq`: perguntas frequentes

## O que funciona

Navegação, menu mobile, FAQ expansível, validação nativa do formulário, sacola, quantidades e conclusão simulada. O carrinho existe apenas na memória e é apagado ao recarregar. Nenhum formulário envia dados. Não há cobrança, pedidos reais, backend ou IA executada. O espelho é uma ilustração em CSS com dados simulados.

## Antes de vender de verdade

Adicionar identidade e integrantes reais, contatos verificados, endereço/mapa se aplicável, preço validado, pagamento seguro, backend, envio de mensagens, logística e políticas revisadas para a operação real. Não adicionar credenciais ao código frontend. Não inventar depoimentos ou resultados clínicos.

## Fontes

DM Sans e Italiana via Google Fonts, com alternativas locais de sistema. Para eliminar a requisição externa, hospede as fontes localmente ou remova o `@import` em `src/styles.css`.
