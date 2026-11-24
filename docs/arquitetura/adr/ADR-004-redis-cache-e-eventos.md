# ADR-004 – Redis para cache distribuído e mensageria Pub/Sub

- **Status:** Aceita
- **Data:** 13/11/2026

## Contexto
A listagem e o detalhe de veículos são as rotas mais acessadas, inclusive por visitantes, e cada acesso fazia consultas com JOIN no MySQL. Além disso, ações da negociação (nova proposta, aceite, venda, avaliação) precisam disparar reações, como avisar as partes ou liberar a avaliação, sem acoplar essas reações ao fluxo principal.

## Decisão
Adicionar **Redis 7** como container no Docker Compose, com dois usos:

1. **Cache distribuído (padrão cache-aside):** `GET /vehicles` (TTL 60 s) e `GET /vehicles/:id` (TTL 300 s). Toda alteração (criar, editar, excluir, vender, enviar ou remover imagem) **invalida** as chaves afetadas. A resposta informa `X-Cache: HIT | MISS | BYPASS`.
2. **Mensageria (Pub/Sub):** a API publica nos canais `autocatira:eventos:<evento>` (`proposta.criada`, `proposta.status_alterado`, `veiculo.vendido` e `avaliacao.criada`). O **microsserviço de notificações** (ADR-007), em outro container, assina esses canais. Cada evento leva `eventId` e o `requestId` de origem, o que permite seguir o fluxo nos logs dos dois serviços.
3. **Cache no microsserviço:** o notification-service guarda em cache (`notif:user:<id>`, TTL 5 min) os usuários validados na API principal, evitando uma chamada HTTP a cada evento.

O Redis é **opcional para o funcionamento**: com timeout de 300 ms, circuit breaker e fallback, a API continua atendendo pelo MySQL se o Redis falhar.

## Alternativas consideradas
- **Cache em memória do processo:** não é compartilhado entre instâncias e perde os dados a cada reinício.
- **RabbitMQ / Kafka para eventos:** garantem entrega e reprocessamento, mas são pesados para o volume atual. O Pub/Sub do Redis atende, aproveitando o mesmo container do cache.
- **Sem cache:** mais simples, porém toda navegação pública consultaria o banco.

## Consequências
- ✅ Medido no ambiente local: listagem com **MISS ≈ 7–50 ms** e **HIT ≈ 1 ms**.
- ✅ Eventos desacoplam notificações do fluxo de negócio: a API nem sabe que o microsserviço existe.
- ⚠️ Pub/Sub não persiste mensagens: um assinante fora do ar perde eventos. Aceitável hoje porque os eventos geram apenas notificações; para garantia de entrega, migrar para Redis Streams.
- ⚠️ Existe uma janela de até 60 s em que um dado pode estar desatualizado, caso algum caminho de alteração não invalide o cache.
