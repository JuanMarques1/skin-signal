# Skin Signal API

API ASP.NET Core 10 + Identity + EF Core + PostgreSQL. O frontend React continua na Vercel. Esta primeira versão inclui conta, uma rotina por usuário e registros de conclusão por data/período. Não inclui fotos, análise de pele, venda ou recuperação de senha por e-mail.

## Rodar localmente

Instale o SDK .NET 10 e tenha um PostgreSQL de desenvolvimento. Configure `DATABASE_URL` (URL Postgres do Render ou connection string Npgsql) e `ALLOWED_ORIGINS=http://localhost:5173`. Não comite credenciais. Para aplicar as migrações da primeira versão, defina `INITIALIZE_DATABASE=true`.

```bash
dotnet run --project backend/SkinSignal.Api --urls http://localhost:5080
```

No frontend, copie `.env.example` para `.env.local`, configure `VITE_API_URL=http://localhost:5080` e rode `npm run dev`. Essa variável é pública e deve conter apenas a origem da API, nunca senha de banco.

## Render

O `render.yaml` descreve um serviço Docker e um PostgreSQL, ambos no plano Free e na mesma região. A conexão usa a referência interna do banco, sem credencial no código. O acesso externo ao banco fica bloqueado (`ipAllowList: []`).

1. Integre a branch revisada ao GitHub.
2. No Render, crie um Blueprint usando este repositório e revise os dois recursos antes de confirmar.
3. Confira o build e o endpoint `/health` (também verifica conexão ao banco).
4. Copie a URL real atribuída à API e configure `VITE_API_URL` no projeto Vercel; faça novo deploy.
5. Se usar outro domínio, configure `ALLOWED_ORIGINS` na API com a origem exata do frontend (ou lista separada por vírgula). Não autorize curingas de previews de terceiros.

O Postgres Free do Render expira em 30 dias e não possui backup automático; use-o somente para teste/aula. Para manter dados reais, revise um plano durável e backups antes do lançamento. O serviço Free pode iniciar lentamente após inatividade. Nenhum plano pago está contratado por este código.

## Banco e evolução

As migrações EF ficam em `SkinSignal.Api/Migrations`. `INITIALIZE_DATABASE=true` aplica as migrações pendentes no início, sem recriar o banco. Para mudanças futuras, gere uma nova migração, revise o SQL e faça backup antes de aplicar. Nunca use EnsureDeleted ou substitua a migração inicial em um banco existente.

Tabelas: Identity (usuários e hashes de senha), Sessions (somente hash dos tokens e expiração), Routines (escolhas e revisão), Completions (snapshot das escolhas, data, período e índices concluídos). Exclusão de usuário remove sessões, rotina e histórico em cascata.

## Sessão e dados

Senhas são gerenciadas pelo Identity, com mínimo de 12 caracteres, bloqueio após cinco falhas e limitação de tentativas de autenticação. A API emite tokens aleatórios de 256 bits, guarda apenas SHA-256 do token e exige autorização em todos os dados privados. Cada consulta filtra pelo usuário autenticado. As sessões expiram em oito horas e são revogadas no logout ou exclusão da conta.

O token fica somente na memória do React. Recarregar a página exige novo login; não há tokens em localStorage, URLs, cookies ou logs. CORS aceita somente as origens configuradas, sem cookies. O limite por IP utiliza o endereço da conexão; atrás do proxy, pode ser compartilhado por usuários. Configure somente proxies conhecidos antes de usar cabeçalhos encaminhados.

A sincronização é explícita. Consulte a rotina da conta antes de salvar; revisões incompatíveis retornam 409 em vez de substituir silenciosamente. Um registro para a mesma data e período atualiza o anterior. O histórico preserva as escolhas daquele registro mesmo quando a rotina muda; as datas seguem Brasília. O modo local continua independente.

## Endpoints

- `GET /health`
- `POST /api/auth/register`, `/api/auth/login`, `/api/auth/logout`
- `GET /api/me`, `DELETE /api/me`
- `GET /api/routine/`, `PUT /api/routine/`, `DELETE /api/routine/`
- `GET /api/history`, `PUT /api/history`, `DELETE /api/history/{id}`

A API retorna erros sem detalhes internos em produção. Nunca ative logs sensíveis ou registre senhas, tokens e connection strings.

## Verificar

```bash
dotnet build backend/SkinSignal.Api
python backend/tests/smoke.py http://localhost:5080
```

O smoke test deve rodar somente em ambiente descartável: cria duas contas de teste e as remove ao final. Verifica isolamento entre contas, dados inválidos, revisão conflitante, histórico por data/período, snapshot, revogação e recuperação após novo login. A origem `/conta` é pré-renderizada com noindex e não entra no sitemap.
