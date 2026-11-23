# ADR-007 – Microsserviço de notificações com banco próprio

- **Status:** Aceita
- **Data:** 22/11/2026

## Contexto
As partes precisam ser avisadas dos acontecimentos da negociação: nova proposta, aceite ou recusa, venda concluída, avaliação recebida. Esse aviso não faz parte do fluxo principal: uma venda não pode falhar porque o aviso falhou. Além disso, notificações tendem a crescer (e-mail, push, WhatsApp) e a gerar processamento em massa, que não deve competir com a API principal.

## Decisão
Criar o **notification-service**, um **microsserviço independente**:

- **Container e banco próprios:** container separado com **banco MySQL próprio** (*database per service*). Sobe e funciona sem a API principal.
- **Comunicação assíncrona:** consome os eventos `proposta.criada`, `proposta.status_alterado`, `veiculo.vendido` e `avaliacao.criada` publicados pela API no **Redis Pub/Sub**.
- **Comunicação síncrona:** valida o destinatário na API principal por **HTTP** (`GET /internal/users/:id`, protegida por token interno e bloqueada no Nginx), com **cache-aside no Redis** (TTL 5 min), timeout de 2 s e retry com backoff.
- **Consistência eventual:** se a API principal estiver fora, a notificação é gravada como `PENDENTE`. Uma rotina de reconciliação a cada 30 s tenta de novo e a marca como `ENTREGUE`, ou como `DESCARTADA` se o usuário não existir.
- **Idempotência:** cada evento tem um `eventId`; índice único `(eventId, userId, type)` impede notificação duplicada.
- **API própria via Nginx:** `GET /api/notifications/me` e `PATCH /api/notifications/:id/read`, autenticadas com o mesmo JWT; `GET /api/notifications/health`.

## Alternativas consideradas
- **Assinante dentro da própria API** (solução anterior): simples, mas não há comunicação real entre serviços. Uma falha ou sobrecarga das notificações afetaria a API.
- **Separar autenticação como microsserviço:** comum no mercado, mas login é um fluxo síncrono crítico, que não exercita mensageria nem consistência eventual.
- **RabbitMQ/Kafka no lugar do Redis:** garantia de entrega, porém mais infraestrutura. Fica como evolução (ver ADR-004).

## Consequências
- ✅ A API principal não conhece o microsserviço: só publica eventos.
- ✅ Notificações podem escalar e ter novos canais (e-mail, push) sem mexer no núcleo.
- ✅ Demonstra comunicação síncrona e assíncrona, cache distribuído e consistência eventual entre serviços.
- ⚠️ Com Pub/Sub, eventos publicados enquanto o microsserviço está fora são perdidos. Mitigação futura: Redis Streams com consumer groups.
- ⚠️ Mais dois containers para operar (serviço e banco), cobertos por healthchecks e pelo runbook.
