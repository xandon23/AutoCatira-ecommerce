# Gestão do Trabalho via Jira

- **Ferramenta:** Jira Software Cloud. Site `autocatira.atlassian.net`, espaço **AutoCatira**, chave **AC**.
- **Modelo:** Scrum, gerenciado pela equipe.

## Estrutura
| Tipo de item | Uso no projeto | Quantidade |
|---|---|---|
| **Epic** | Grandes temas da rubrica | 6 |
| **Story** | Funcionalidades com valor para o usuário, com critérios de aceite | 9 |
| **Task** | Trabalho técnico ou documentação (C4, ADRs, DDD, Cynefin…) | 10 |
| **Bug** | Erros encontrados na revisão do código | 7 |

O backlog foi importado por CSV com as hierarquias (épico → itens), as prioridades (High, Medium, Low) e as descrições com critérios de aceite.

## Fluxo do quadro
`A fazer → Fazendo → Feito`

- Cada sessão de trabalho começa movendo o card para **Fazendo** e termina movendo para **Feito**, gerando o histórico de progresso.
- Os itens são distribuídos em **Sprint 1** e **Sprint 2**, cada uma com datas e objetivo.

## Rastreabilidade entre Jira e código
- **Mensagens de commit** com a chave do card. Exemplo: `feat: configura docker compose com redis, healthchecks e nginx como proxy reverso (AC-18)`.
- **Branches por versão** (`feat/v2-app-mobile`, `feat/v3-arquitetura-backend-avancado`) e **Pull Requests** para `dev` e `main`.
- **Bugs** do Jira correspondem aos commits `fix:` no repositório.

## Evidências para a apresentação
1. **Quadro:** colunas com os cards concluídos.
2. **Backlog:** os épicos com seus itens.
3. **Histórico de um card:** aba Histórico, mostrando as transições de status com data.
4. **Relatório da sprint:** Relatórios → Relatório da sprint / Burndown.
