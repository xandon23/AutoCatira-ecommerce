# Atributos de Qualidade – Quality Scenarios

Cada cenário segue o formato: **fonte do estímulo → estímulo → ambiente → artefato → resposta → medida da resposta**. Os cenários marcados com ✅ foram verificados no ambiente Docker local.

| # | Atributo | Fonte / Estímulo | Ambiente | Resposta esperada | Medida |
|---|---|---|---|---|---|
| QS-01 | **Desempenho** | Visitante abre a lista de veículos no app | Operação normal, Redis disponível | A API responde do cache Redis (`X-Cache: HIT`) | p95 < 300 ms; com cache ≈ 1 ms ✅ |
| QS-02 | **Disponibilidade** | O Redis fica lento ou cai | Operação normal | A API ignora o cache (`BYPASS`) e responde pelo MySQL; após 3 falhas o circuit breaker abre por 30 s | 0 requisições com erro por causa do Redis; espera máxima de 300 ms ✅ |
| QS-03 | **Disponibilidade** | O MySQL ainda não está pronto quando a API inicia | Inicialização dos containers | A API tenta conectar de novo com backoff (1 s, 2 s, 4 s… até 15 s), e o Compose só libera a API quando o MySQL está saudável | API disponível sem intervenção manual ✅ |
| QS-04 | **Segurança** | Usuário autenticado tenta editar ou excluir veículo, proposta ou perfil de outro usuário | Operação normal | A requisição é negada | 100% das tentativas com `403` (coberto por testes automatizados) |
| QS-05 | **Privacidade** | Visitante ou comprador consulta um anúncio | Operação normal | Apenas o nome do anunciante é exibido; o telefone só é liberado quando a proposta entra em negociação | 0 dados de contato em rotas públicas ✅ |
| QS-06 | **Integridade** | Vendedor finaliza uma venda com veículo na troca | Operação normal | Em uma única transação: veículo vendido, veículo da troca vendido, proposta aceita e todas as propostas ligadas aos dois veículos rejeitadas | Nenhum estado parcial; teste automatizado da venda com troca ✅ |
| QS-07 | **Observabilidade** | Ocorre um erro 500 em uma requisição | Operação normal | O usuário recebe mensagem genérica; o log registra erro, stack e `requestId`, que também volta no header `X-Request-Id` | Localizar a causa no log em < 5 min a partir do `requestId` ✅ |
| QS-08 | **Segurança (upload)** | Usuário envia arquivo `.exe` ou imagem de 20 MB | Operação normal | Upload recusado com mensagem clara | `400` para formato inválido e `413` acima de 5 MB |
| QS-09 | **Manutenibilidade** | Desenvolvedor faz push com erro de tipo ou teste quebrado | Desenvolvimento | O hook de push e o pipeline de CI bloqueiam a alteração | Falha detectada em < 10 min, antes do merge |
| QS-11 | **Consistência eventual** | A API principal fica fora do ar enquanto um evento de negociação chega ao microsserviço de notificações | Falha parcial | A notificação é gravada como `PENDENTE` e a reconciliação a valida e entrega quando a API volta | 100% das notificações pendentes entregues em até 30 s após a volta da API |
| QS-12 | **Idempotência** | O mesmo evento é recebido duas vezes pelo microsserviço | Operação normal | A segunda ocorrência é ignorada | 0 notificações duplicadas (índice único por `eventId`) |
| QS-10 | **Usabilidade / Segurança** | O token JWT do usuário expira (1 dia) | App mobile em uso | O app encerra a sessão e mostra "Sessão expirada" | Nenhuma tela fica "logada" sem conseguir carregar dados ✅ |
