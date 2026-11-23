# Planejamento e Condução do Ciclo de Vida – Scrum

## 1. Papéis

O projeto é individual, então os papéis foram acumulados e adaptados:

| Papel Scrum | Quem | Responsabilidade |
|---|---|---|
| **Product Owner** | Alexandre de Jesus Gonçalves | Priorizar o backlog conforme o valor para a persona e a rubrica. |
| **Scrum Master** | Alexandre de Jesus Gonçalves | Manter o processo (sprints, quadro, Definition of Done) e remover impedimentos. |
| **Time de Desenvolvimento** | Alexandre de Jesus Gonçalves | Construir, testar e entregar os incrementos. |
| **Stakeholder** | Professor orientador | Define critérios (rubrica) e avalia as entregas. |

## 2. Product Backlog

O backlog está no **Jira** (espaço **AutoCatira**, modelo Scrum), organizado em **6 épicos**:

| Épico | Itens |
|---|---|
| Correções e qualidade do código | 7 bugs + refatoração em módulos, services e DTOs |
| Cache e mensageria com Redis | Cache com TTL, invalidação, Pub/Sub |
| Infraestrutura e entrega contínua | Docker Compose + Nginx, pipeline CI/CD, deploy e runbook |
| API, resiliência e observabilidade | Swagger, saúde do sistema, Redis fora do ar, SLOs |
| Documentação de arquitetura | C4, ADRs, Quality Scenarios, DDD, persona |
| Gestão do projeto | Cynefin, ciclo de vida, versão v3.0.0 |

**Priorização:**
1. Bugs que afetam o usuário ou a privacidade.
2. Itens de maior peso na rubrica (Redis, Docker, DDD).
3. Documentação.

## 3. User Stories com critérios de aceite

> Formato: *Como **[persona]**, quero **[objetivo]** para **[benefício]**.*

**US-01: Listagem rápida com cache**
Como visitante, quero que a lista e o detalhe de veículos carreguem rápido para navegar sem espera.
- [x] `GET /vehicles` e `GET /vehicles/:id` usam cache-aside no Redis.
- [x] TTL de 60 s (lista) e 300 s (detalhe).
- [x] A resposta informa `X-Cache: HIT/MISS` e o log registra `cache.hit/miss`.

**US-02: Cache sempre atualizado**
Como usuário, quero ver imediatamente as alterações feitas nos anúncios.
- [x] Criar, editar, excluir, vender e enviar ou excluir imagem invalidam o cache.
- [x] Demonstrado nos logs (`cache.invalidado`).

**US-03: Eventos de negociação**
Como sistema, quero publicar eventos da negociação para que outras partes reajam sem acoplamento.
- [x] Eventos `proposta.criada`, `proposta.status_alterado`, `veiculo.vendido` e `avaliacao.criada` publicados no Redis.
- [x] O assinante registra o recebimento (`evento.recebido`) com o mesmo `requestId`.

**US-04: Ambiente completo com um comando**
Como desenvolvedor, quero subir todo o sistema com `docker compose up`.
- [x] Serviços db, redis, backend, frontend e nginx com healthchecks.
- [x] Nginx como proxy reverso acessível pelo app mobile.
- [x] Backend em build de produção.

**US-05: Pipeline de integração contínua**
Como equipe, quero que cada push rode build e testes automaticamente.
- [x] GitHub Actions com as etapas build, test e deploy (imagem Docker).

**US-06: Documentação da API**
Como desenvolvedor do app, quero consultar os endpoints da API numa página.
- [x] Swagger em `/docs` com auth, veículos, propostas, avaliações e admin.

**US-07: Monitorar a saúde do sistema**
Como responsável pelo sistema, quero saber se a API, o banco e o Redis estão funcionando.
- [x] `/health` com o status de cada dependência.
- [x] Logs estruturados com rota, status e tempo de resposta.

**US-08: Funcionar mesmo com o Redis fora do ar**
Como usuário, quero continuar usando o app mesmo com falha no cache.
- [x] Retry com backoff e timeout nas operações.
- [x] Fallback para o MySQL e circuit breaker.

**US-10: Ser avisado sobre a minha negociação (microsserviço)**
Como comprador ou vendedor, quero ser avisado quando recebo proposta, quando ela é aceita ou recusada e quando a venda é concluída, para não perder negócios.
- [x] Microsserviço de notificações separado, com banco próprio.
- [x] Recebe os eventos da API por Redis Pub/Sub (assíncrono).
- [x] Valida o usuário na API principal por HTTP com cache (síncrono).
- [x] Notificação fica PENDENTE se a API estiver fora e é reprocessada (consistência eventual).
- [x] Endpoint `GET /api/notifications/me`.

**US-09: Proposta com veículo na troca (versão 2, com correção na versão 3)**
Como comprador (Marcos), quero oferecer meu carro como parte do pagamento para trocar de carro sem ter o valor total.
- [x] A proposta aceita o valor em dinheiro (≥ 0) e o veículo do comprador.
- [x] Ao vender, todas as propostas ligadas aos dois veículos são recusadas automaticamente.

**Bugs registrados no backlog (Jira, tipo Bug):**
- venda com troca não rejeitava propostas do carro da troca;
- app continuava logado com token expirado;
- rota de proposta expunha dados do comprador;
- listagem pública expunha o e-mail;
- admin rebaixado mantinha acesso;
- exclusão com propostas gerava erro 500;
- validações faltando em proposta e login.

## 4. Sprints

| Sprint | Período | Objetivo | Principais entregas |
|---|---|---|---|
| **Sprint 1** | 10/11 a 16/11 | Corrigir bugs e implementar Redis e Docker | 7 bugs, módulo de Negociação, logs e erros centralizados, cache + Pub/Sub, Docker Compose + Nginx + healthchecks, `/health` |
| **Sprint 2** | 17/11 a 23/11 | API documentada, resiliência, CI, microsserviço e documentação | Swagger, retry + circuit breaker, pipeline CI/CD, testes atualizados, **microsserviço de notificações**, camada de repositories, documentação de arquitetura e gestão |

**Eventos adaptados ao projeto individual:**
- **Planning:** seleção dos itens do backlog para a sprint no Jira.
- **Daily:** no início de cada sessão de trabalho, o card do dia vai para **Fazendo**; no fim, para **Feito**.
- **Review:** demonstração ao professor (apresentação da versão).
- **Retrospectiva:** registrada abaixo.

**Definition of Done (DoD):**
- O código compila sem erros de tipo.
- Os critérios de aceite da story foram verificados.
- O commit segue o padrão Conventional Commits.
- O push passa no pipeline de CI.
- O card está em **Feito** no Jira.

**Retrospectiva:**
- ✅ Logs estruturados aceleraram a correção de bugs (erro de consulta das negociações resolvido em minutos).
- ✅ Testar no celular contra o Docker revelou problemas de rede reais (IP do Wi-Fi, firewall), hoje documentados no runbook.
- ⚠️ A Sprint 2 concentrou a documentação no fim. Na próxima versão, a documentação deve acompanhar cada story.

## 5. Versões (lançamentos parciais)

O versionamento segue o **SemVer** com **tags Git** e Pull Requests entre branches (`feature → dev → main`):

| Versão | Entrega | Marco |
|---|---|---|
| **v1.0.0** | Aplicação web: anúncios, propostas, negociação e venda | 1º bimestre |
| **v2.0.0** | Aplicativo mobile (React Native + Expo) sobre a mesma API | 2º bimestre (PR #16 → dev, PR #17 → main) |
| **v3.0.0** | Arquitetura e back-end avançado: Redis, Docker/Nginx, CI/CD, observabilidade, documentação | 3º bimestre |

Fluxo de branches:
- `feat/v3-arquitetura-backend-avancado`: desenvolvimento, com PR rascunho aberto para `dev`.
- `dev`: integração.
- `main`: versão estável com tag.
