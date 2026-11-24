# Atributos de Qualidade, Resiliência e Observabilidade

## 1. SLIs e SLOs

- **SLI (Service Level Indicator):** o que é medido.
- **SLO (Service Level Objective):** a meta para essa medida.

Período de avaliação: **30 dias**.

| Serviço / Jornada | SLI (como medir) | SLO (meta) |
|---|---|---|
| Disponibilidade da API | % de requisições com status **diferente de 5xx** (log `http.requisicao`) | **≥ 99,0 %** |
| Disponibilidade do sistema | % de verificações do `/health` com `status` = `up` ou `degraded` | **≥ 99,5 %** |
| Latência da listagem | p95 de `durationMs` em `GET /vehicles` | **≤ 300 ms** |
| Latência das escritas | p95 de `durationMs` em `POST /proposals`, `PATCH /proposals/:id/status`, `PATCH /vehicles/:id/sell` | **≤ 800 ms** |
| Eficiência do cache | % de `cache.hit` sobre `cache.hit + cache.miss` na listagem | **≥ 70 %** |
| Uploads | % de uploads concluídos sem erro 5xx | **≥ 99 %** |

**Orçamento de erro (error budget):** com SLO de 99 %, a API pode falhar em até 1 % das requisições no mês. Se o orçamento for consumido, novas funcionalidades param e a equipe prioriza estabilidade.

## 2. Estratégias de resiliência aplicadas

| Estratégia | Onde | Como funciona |
|---|---|---|
| **Retry com backoff exponencial** | Conexão com o MySQL na subida (`server.ts`) | Até 10 tentativas, esperando 1 s, 2 s, 4 s… até 15 s. Se falhar, o processo encerra e o Docker reinicia (`restart: always`). |
| **Retry / reconexão** | Cliente Redis (`config/redis.ts`) | Reconexão automática com espera crescente (até 5 s). |
| **Timeout** | Operações no Redis (300 ms), checagens do `/health` (1 s), Nginx → API (conexão 5 s, leitura 30 s), app mobile (10 s) | Nenhuma dependência lenta trava o usuário indefinidamente. |
| **Circuit breaker** | Cache Redis (`utils/circuitBreaker.ts`) | 3 falhas seguidas → circuito **aberto** por 30 s: a API vai direto ao MySQL sem esperar o Redis. Depois, uma requisição de teste (**meio-aberto**) decide se volta ao normal. |
| **Fallback** | Cache e eventos | Sem Redis, a resposta vem do MySQL (`X-Cache: BYPASS`) e o evento apenas não é publicado (log `evento.nao_publicado`); a operação principal não falha. |
| **Healthchecks + ordem de subida** | Docker Compose | O MySQL e o Redis precisam estar saudáveis para a API subir, e a API para o Nginx. |
| **Transação ACID** | Finalização da venda e exclusão de anúncio | Ou tudo é gravado, ou nada. |
| **Encerramento gracioso** | `server.ts` da API e do microsserviço (SIGTERM/SIGINT) | Para de aceitar requisições, termina as em andamento e fecha MySQL e Redis. |
| **Retry + timeout entre serviços** | Microsserviço → API principal (`clients/userClient.ts`) | Timeout de 2 s por chamada e até 3 tentativas com backoff (300 ms, 600 ms). |
| **Consistência eventual + reconciliação** | Microsserviço de notificações | Com a API principal fora, a notificação fica `PENDENTE`; a cada 30 s uma rotina tenta de novo e conclui como `ENTREGUE` ou `DESCARTADA`. |
| **Idempotência** | Microsserviço de notificações | `eventId` em cada evento e índice único: evento repetido não duplica a notificação. |
| **Isolamento de falhas** | Arquitetura (monólito + microsserviço) | Se o microsserviço cair, propostas e vendas continuam funcionando; só as notificações deixam de ser geradas. |

Comprovação do circuit breaker (teste com Redis travado):
```
req 1  BYPASS  302 ms  circuito CLOSED
req 2  BYPASS  300 ms  circuito CLOSED
circuit_breaker.estado  redis  CLOSED → OPEN  falhas: 3
req 4  BYPASS    0 ms  circuito OPEN
```

## 3. Plano de observabilidade

### Logs estruturados (implementado)
Cada linha é um JSON com `time`, `level`, `event`, `requestId` e dados do evento; no microsserviço também há `service: "notification-service"`. O `requestId` é gerado por requisição, devolvido no header `X-Request-Id` e **propagado nos eventos e nas chamadas HTTP entre serviços**. Assim, um fluxo inteiro pode ser seguido nos logs dos dois serviços:

```json
{"level":"info","event":"veiculo.vendido","requestId":"8640f04e…","comTroca":true,"propostasRejeitadas":1}
{"level":"info","event":"cache.invalidado","requestId":"8640f04e…","chaves":3}
{"level":"info","event":"evento.publicado","requestId":"8640f04e…","evento":"veiculo.vendido","assinantes":1}
{"level":"info","service":"notification-service","event":"evento.recebido","requestId":"8640f04e…","atrasoMs":1}
{"level":"info","service":"notification-service","event":"cache.miss","key":"notif:user:a43e…"}
{"level":"info","service":"notification-service","event":"api_principal.usuario_validado","requestId":"8640f04e…"}
{"level":"info","service":"notification-service","event":"notificacao.entregue","requestId":"8640f04e…"}
```

| Categoria | Eventos de log |
|---|---|
| HTTP | `http.requisicao` (método, rota, status, `durationMs`), `http.erro_requisicao`, `http.erro_interno` (com stack) |
| Negócio | `anuncio.criado/atualizado/excluido`, `proposta.criada`, `proposta.status_alterado`, `veiculo.vendido`, `avaliacao.criada` |
| Segurança | `auth.login_sucesso`, `auth.login_falhou`, `auth.acesso_admin_negado`, `upload.rejeitado` |
| Cache | `cache.hit`, `cache.miss`, `cache.bypass`, `cache.invalidado`, `circuit_breaker.estado` |
| Eventos | API: `evento.publicado`, `evento.nao_publicado`. Microsserviço: `evento.recebido`, `notificacao.entregue/pendente/descartada/duplicada_ignorada`, `reconciliacao.iniciada`, `api_principal.usuario_validado/falha` |
| Infraestrutura | `servidor.iniciado/encerrando`, `banco.sincronizado`, `banco.falha_conexao`, `redis.conectado/desconectado/erro` |

Níveis: `info` (fluxo normal), `warn` (erro do cliente ou degradação), `error` (falha interna). Configurável por `LOG_LEVEL`.

### Métricas a coletar
| Métrica | Origem | Uso |
|---|---|---|
| Requisições por segundo, por rota e status | `http.requisicao` | Volume e taxa de erro (SLO de disponibilidade) |
| Latência p50/p95/p99 por rota | `durationMs` | SLOs de latência |
| Taxa de acerto do cache | `cache.hit` / `cache.miss` | SLO de cache e ajuste de TTL |
| Estado do circuit breaker | `circuit_breaker.estado` | Alerta quando o Redis degrada |
| Saúde das dependências | `GET /health` | Disponibilidade e healthcheck do Docker |
| Funil de negócio | eventos de negócio | Propostas → negociações → vendas |

### Como consultar hoje
```bash
docker compose ps                                  # saúde dos containers
docker compose logs -f backend                     # logs em tempo real
docker compose logs backend | findstr "<requestId>"   # seguir um fluxo (Windows)
curl http://localhost/api/health                   # saúde da API, MySQL e Redis
curl http://localhost/api/notifications/health     # saúde do microsserviço + contagem por status
docker compose logs -f notification-service        # logs do microsserviço
```

### Próximos passos (evolução)
Enviar os logs JSON para **Grafana Loki** (ou ELK), expor métricas para **Prometheus** e criar alertas para:
- taxa de 5xx acima de 1 %;
- p95 da listagem acima de 300 ms;
- `/health` diferente de `up`;
- circuit breaker aberto.
