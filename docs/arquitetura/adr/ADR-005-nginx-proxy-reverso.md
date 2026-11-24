# ADR-005 – Nginx como proxy reverso e ponto único de entrada

- **Status:** Aceita
- **Data:** 13/11/2026

## Contexto
O sistema tem vários containers (web, API, MySQL, Redis). Expor cada porta diretamente aumentaria a superfície de ataque e complicaria HTTPS, cabeçalhos de segurança e timeouts. O app mobile não aceita o certificado autoassinado usado no ambiente local.

## Decisão
Usar **Nginx** como único container com portas publicadas:

- **HTTPS :443:** `/` → aplicação web e `/api/` → API, com cabeçalhos `X-Frame-Options`, `X-Content-Type-Options` e `Content-Security-Policy`.
- **HTTP :80:** `/api/` → API (para o app mobile) e qualquer outra rota é redirecionada para HTTPS.
- Timeouts de proxy (conexão 5 s, leitura 30 s) e limite de upload de 10 MB.

A API (3333), o MySQL (3306) e o Redis (6379) ficam **acessíveis apenas na rede interna** do Docker.

## Alternativas consideradas
- **Expor a API diretamente na porta 3333:** mais simples, sem TLS centralizado nem cabeçalhos de segurança.
- **Traefik:** descoberta automática de serviços, mas configuração menos conhecida pela equipe.

## Consequências
- ✅ Um único ponto de entrada, mais fácil de proteger e monitorar.
- ✅ O backend fica protegido atrás do proxy.
- ⚠️ A API em HTTP na porta 80 é aceitável apenas em rede local. Em produção pública, o mobile deve usar HTTPS com certificado válido.
