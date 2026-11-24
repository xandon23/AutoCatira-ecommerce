# Documentação – AutoCatira v3.0

Documentação da versão 3 (Arquitetura de Software, Back-end Avançado e Tech Forge).

## Produto
- [Persona e conexão com o cliente](produto/persona.md)

## Arquitetura de Software
| Item da rubrica | Documento |
|---|---|
| Documentação Arquitetural (C4, ADRs, Quality Scenarios) | [C4 – Contexto e Containers](arquitetura/01-c4.md) · [ADRs](arquitetura/adr/README.md) · [Quality Scenarios](arquitetura/02-quality-scenarios.md) |
| Estilos Arquiteturais e DDD | [DDD – Context Map, Bounded Contexts, Entities, VOs e Aggregates](arquitetura/03-ddd.md) |
| Integração, APIs e Dados | [API e Dados](arquitetura/04-api-e-dados.md) · [OpenAPI](../backend/docs/openapi.yaml) · [ADR do banco](arquitetura/adr/ADR-002-banco-mysql.md) |
| Qualidade, Resiliência e Observabilidade | [SLOs/SLIs, resiliência e observabilidade](arquitetura/05-qualidade-resiliencia-observabilidade.md) |
| Entrega Contínua | [Pipeline, deploy e runbook](arquitetura/06-entrega-continua.md) · [ci.yml](../.github/workflows/ci.yml) |

## Back-end Avançado (onde está no código)
| Item da rubrica | Implementação |
|---|---|
| Cache distribuído com Redis | `backend/src/cache/cacheService.ts` (cache-aside, TTL, invalidação, circuit breaker) |
| Mensageria Pub/Sub | `backend/src/events/` (publicação) → **microsserviço `notification-service/`** (assinatura, banco próprio, validação síncrona com cache, consistência eventual) |
| Docker Compose + Nginx | `docker-compose.yml`, `nginx/default.conf`, `backend/Dockerfile` |
| Boas práticas e observabilidade | `backend/src/modules/negotiation/` (módulo, DTOs, repositories, services, controller), `utils/logger.ts`, `middlewares/requestLogger.ts`, `middlewares/errorMiddleware.ts`, `/health` |

## Tech Forge
- [Gestão via Jira](gestao/03-jira.md)
- [Cynefin e escolha da abordagem](gestao/01-cynefin.md)
- [Ciclo de vida Scrum: backlog, user stories, sprints e versões](gestao/02-ciclo-de-vida-scrum.md)

## Como executar
```bash
docker compose up -d --build
# Saúde:   http://localhost/api/health
# Swagger: http://localhost/api/docs
# Notificações (microsserviço): http://localhost/api/notifications/health
# Web:     https://autocatira.local
# Mobile:  EXPO_PUBLIC_API_URL=http://<IP-do-Wi-Fi>/api  →  npx expo start -c
```
