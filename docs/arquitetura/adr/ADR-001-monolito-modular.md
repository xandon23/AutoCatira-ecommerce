# ADR-001 – Monólito modular como serviço principal

- **Status:** Aceita
- **Data:** 10/11/2026

## Contexto
O AutoCatira é desenvolvido por uma pessoa, com prazos de um bimestre, um único banco relacional e regras de negócio fortemente ligadas entre si. A finalização da venda, por exemplo, altera veículo, propostas e libera avaliações na mesma transação. Ao mesmo tempo, o código cresceu e os controllers acumulavam regras, consultas e tratamento de erro.

## Decisão
Manter o **núcleo do negócio numa única aplicação (monólito)**, organizada em **módulos por contexto** (*modular monolith*). O contexto central, Negociação, fica em `backend/src/modules/negotiation`, com DTOs, repositories, services e controller próprios.

Contextos **periféricos**, que não fazem parte do fluxo principal, podem ser extraídos como microsserviços. O primeiro foi o de **Notificações** (ver ADR-007). A comunicação entre o monólito e os microsserviços usa eventos (ver ADR-004).

## Alternativas consideradas
- **Microsserviços para todos os contextos:** isolamento e escala independente, mas exigiria transações distribuídas para a venda (Saga), vários deploys e observabilidade distribuída. Custo alto demais para a equipe e o prazo. Por isso só o contexto de Notificações foi separado.
- **Monólito sem módulos (estrutura anterior):** simples, mas mistura regras de contextos diferentes e dificulta manutenção e testes.

## Consequências
- ✅ Um único deploy, uma imagem Docker e transações ACID locais.
- ✅ Fronteiras claras entre contextos, que permitem extrair um serviço no futuro.
- ✅ Eventos de domínio já desacoplam reações (notificações) do fluxo principal.
- ⚠️ A aplicação escala como um todo; um módulo pesado afeta os demais.
- ⚠️ A disciplina de não acessar internamente outro módulo depende de revisão de código.
