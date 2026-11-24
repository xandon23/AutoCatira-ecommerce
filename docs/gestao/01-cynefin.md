# Análise do Contexto com o Framework Cynefin

## O framework

O Cynefin classifica problemas em cinco domínios, conforme a relação entre causa e efeito:

| Domínio | Relação causa–efeito | Como agir | Abordagem típica |
|---|---|---|---|
| **Simples (Claro)** | Óbvia para todos | Perceber → Categorizar → Responder (boas práticas) | Preditiva |
| **Complicado** | Existe, mas exige análise de especialistas | Perceber → **Analisar** → Responder (práticas recomendadas) | Preditiva ou híbrida |
| **Complexo** | Só é entendida depois (emergente) | **Experimentar** → Perceber → Responder | **Ágil** |
| **Caótico** | Não há relação perceptível | Agir → Perceber → Responder | Ação imediata |
| **Desordenado (Confuso)** | Não se sabe em qual domínio está | Decompor o problema e trazê-lo para um dos outros domínios | — |

## Classificação do AutoCatira: **Complexo**, com partes Complicadas

Analisamos o projeto por partes:

| Parte do projeto | Domínio | Justificativa |
|---|---|---|
| Infraestrutura (Docker, Nginx, Redis, CI) | Complicado | Soluções conhecidas e documentadas; exigem conhecimento técnico, mas o resultado é previsível. |
| Segurança (JWT, hash, autorização) | Complicado | Há boas práticas consolidadas a seguir. |
| **Regras de negociação com troca** | **Complexo** | Não existe um padrão de mercado para "proposta com carro na troca". As regras surgiram com o uso: o bug da venda com troca (propostas pelo carro dado na troca continuavam ativas) só apareceu ao testar o fluxo real. |
| **Aceitação pelos usuários (persona)** | **Complexo** | Não sabemos de antemão se o comprador vai preferir ofertar pelo app ou continuar no WhatsApp; isso só se descobre com feedback. |
| **Requisitos da disciplina** | **Complexo** | Mudam a cada bimestre (versão web → mobile → arquitetura e back-end avançado), com rubricas novas. |

**Conclusão:** o **núcleo do produto e o contexto do projeto estão no domínio Complexo**. Os requisitos e as regras de negócio emergem do uso e do feedback, e não podem ser totalmente planejados no início. As partes técnicas de infraestrutura são Complicadas e se resolvem com análise e boas práticas.

## Abordagem escolhida: **Ágil (Scrum)**

Pelo Cynefin, problemas complexos pedem **ciclos curtos de experimentação, inspeção e adaptação**, que é exatamente o que o Scrum oferece:

- **Entregas incrementais por versão** (v1 web → v2 mobile → v3 arquitetura), cada uma utilizável e apresentada como "Sprint Review" ao professor (stakeholder).
- **Backlog priorizado e replanejado:** bugs descobertos no uso (ex.: venda com troca) entram no backlog e são priorizados na sprint seguinte.
- **Sprints curtas de 1 semana**, adequadas a um prazo de bimestre.
- As partes **Complicadas** (infraestrutura) entram no backlog como tarefas técnicas e são executadas com análise prévia, registrada em ADRs. Isso mostra que o Scrum convive bem com análise especializada onde ela cabe.

**Por que não preditiva (cascata):** exigiria requisitos estáveis desde o início. Aqui as rubricas e as regras mudaram a cada ciclo, e um plano fechado ficaria obsoleto.
