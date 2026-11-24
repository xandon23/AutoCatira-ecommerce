# ADR-002 – MySQL (relacional) como banco de dados

- **Status:** Aceita
- **Data:** 10/11/2026

## Contexto
Os dados do AutoCatira são fortemente relacionais: **usuário → veículos → imagens**, **proposta → veículo alvo + veículo oferecido na troca + comprador**, **avaliação → proposta + avaliador + avaliado**. Operações críticas precisam de consistência forte. A finalização de uma venda com troca altera dois veículos e várias propostas, e não pode ficar pela metade.

## Decisão
Usar **MySQL 8** como banco principal, acessado pelo ORM **Sequelize** (sequelize-typescript), com chaves estrangeiras, restrições de unicidade (e-mail, CPF, avaliação por proposta) e **transações** nas operações que alteram vários registros (venda e exclusão de anúncio).

## Alternativas consideradas
- **MongoDB (documentos):** esquema flexível, mas os relacionamentos N:N e as transações multi-documento tornariam a modelagem da troca mais frágil.
- **PostgreSQL:** igualmente adequado tecnicamente. O MySQL foi mantido porque já era usado desde a primeira versão e pela familiaridade da equipe, evitando migração de dados.
- **SQLite:** simples para desenvolvimento, mas inadequado para acesso concorrente em produção e containers.

## Consequências
- ✅ Integridade referencial e transações ACID garantem que a venda com troca é "tudo ou nada".
- ✅ Consultas com JOIN (proposta + veículo + comprador + imagens) em uma ida ao banco.
- ✅ Leituras frequentes (listagem pública) são aliviadas pelo cache Redis (ADR-004).
- ⚠️ Mudanças de esquema exigem cuidado (hoje via `sequelize.sync`; o próximo passo é usar migrations).
- ⚠️ Escala de escrita vertical; suficiente para o volume esperado.
