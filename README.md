# BackendProjetosERP

API do sistema interno da Konvex Jr (Express + TypeScript + PostgreSQL).

## Subir localmente
1. Node.js 20+ e um PostgreSQL acessível.
2. `cp .env.example .env` e ajuste as credenciais (ou use `DATABASE_URL`).
3. `npm install`
4. `npm run migrate` aplica as migrações de `migrations/` (funciona em banco novo e no banco antigo criado pelo schema.sql).
5. `npm run seed:admin` cria o primeiro diretor com `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD`.
6. `npm start` sobe a API em `http://localhost:5001`.

Swagger: `http://localhost:5001/api-docs` (desligado com `NODE_ENV=production`, salvo `SWAGGER_ENABLED=true`).

## Variáveis importantes
- `CORS_ORIGINS`: origens do frontend, separadas por vírgula (padrão: `http://localhost:5173,http://localhost:4173`).
- `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` (ou os arquivos `private.key` e `public.key`). Em container, guarde as chaves fora da imagem para as sessões sobreviverem a um novo deploy.
- `JWT_ACCESS_TTL` (padrão `15m`) e `REFRESH_TOKEN_DIAS` (padrão `7`).

## Sessão
`POST /auth/login` devolve `token` (acesso, curto) e `refreshToken`. Renove com `POST /auth/refresh` e encerre com `POST /auth/logout`. Não existe cadastro público: contas são criadas por diretores e gerentes.

## Permissões
Diretor = ADMIN, gerente = MANAGER, membro = MEMBER (doc 02, seção 6). As regras ficam em `source/shared/seguranca/permissoes.ts` e são checadas no backend.

## Testes
- `npm test`: testes unitários e HTTP (repositórios em memória, não precisam de banco).
- `npm run build`: compilação TypeScript.
