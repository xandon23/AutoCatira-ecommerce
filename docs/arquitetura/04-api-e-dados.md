# Integração, APIs e Dados

## Especificação OpenAPI (Swagger)

- **Arquivo:** [`backend/docs/openapi.yaml`](../../backend/docs/openapi.yaml), OpenAPI 3.0.3, com 23 rotas.
- **Documentação interativa:** com o Docker rodando, acesse **http://localhost/api/docs** (Swagger UI).
- **Grupos documentados:** Saúde, Autenticação, Usuários, Veículos (com upload), Propostas e Negociação, Avaliações e Administração.
- **Documentado em cada rota:** corpo de requisição, respostas e códigos de erro (`400`, `401`, `403`, `404`, `409`, `413`), segurança JWT (`bearerAuth`) e os headers `X-Cache` e `X-Request-Id`.

### Principais endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Saúde da API, MySQL e Redis |
| POST | `/auth/login` | Login e emissão do JWT |
| POST | `/users` | Cadastro |
| GET | `/vehicles` | Listagem pública paginada (cache 60 s) |
| GET | `/vehicles/:id` | Detalhe público (cache 300 s) |
| POST/PUT/DELETE | `/vehicles`, `/vehicles/:id` | Gerenciamento do anúncio pelo dono |
| POST | `/vehicles/:id/images` | Upload de imagem (Multer) |
| POST | `/proposals` | Envia proposta (dinheiro e/ou troca) |
| PATCH | `/proposals/:id/status` | Vendedor aceita negociar ou recusa |
| PATCH | `/vehicles/:id/sell` | Finaliza a venda |
| POST | `/reviews` | Avalia a outra parte |
| GET/PATCH | `/admin/users…` | Administração (somente ADMIN) |

### Microsserviço de notificações (via Nginx em `/api/notifications/`)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/notifications/health` | Saúde do microsserviço: banco próprio, Redis, API principal e contagem por status |
| GET | `/api/notifications/me` | Notificações entregues ao usuário logado (JWT) |
| PATCH | `/api/notifications/:id/read` | Marca como lida |

### Rota interna (serviço-a-serviço)
`GET /internal/users/:id` na API principal: retorna `{ id, name }`. Exige o header `X-Internal-Token` e **é bloqueada no Nginx** (`/api/internal/` → 404). Só é acessível pela rede interna do Docker.

## Padrões da API

- **REST + JSON**, erros no formato `{ "error": "mensagem" }`.
- **Tratamento de erros centralizado:** erros de negócio (`AppError`) viram `4xx` com mensagem clara. Erros inesperados viram `500` com mensagem genérica; o detalhe técnico vai apenas para o log.
- **Validação na borda com DTOs** (`toCreateProposalDTO`, `toUpdateProposalStatusDTO`, `toFinalizeSaleDTO`) antes das regras de negócio.
- **Paginação saneada:** `page ≥ 1` e `limit` entre 1 e 50.

## Dados

- **Banco:** MySQL 8, decisão registrada no [ADR-002](adr/ADR-002-banco-mysql.md).
- **Modelo:** `users`, `vehicles`, `vehicle_images`, `proposals`, `reviews` (ver DER na documentação da versão 2).
- **Cache:** Redis, decisão no [ADR-004](adr/ADR-004-redis-cache-e-eventos.md). Chaves:
  - `vehicles:list:page=<n>:limit=<n>:sold=<bool>`
  - `vehicles:detail:<id>`
- **Arquivos:** imagens no volume `uploads/` com nome UUID, servidas em `/uploads/<arquivo>`.
- **Banco do microsserviço:** MySQL separado (`autocatira_notifications`), tabela `notifications` (`eventId`, `event`, `userId`, `type`, `title`, `message`, `status`, `readAt`, `requestId`), com índice único `(eventId, userId, type)` para idempotência.
