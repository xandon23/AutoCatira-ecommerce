# ADR-003 – Autenticação stateless com JWT

- **Status:** Aceita
- **Data:** 10/11/2026

## Contexto
A mesma API atende o app mobile e a aplicação web. O app precisa manter o usuário logado entre aberturas, e a API deve continuar sem estado para facilitar o escalonamento e o uso atrás do proxy reverso.

## Decisão
Autenticar com **JSON Web Token (JWT)** assinado com `JWT_SECRET`, validade de **1 dia**, enviado no header `Authorization: Bearer`. As senhas são armazenadas com **hash bcrypt** e nunca retornadas pela API. No mobile, o token fica no **SecureStore**, e o app encerra a sessão ao receber `401`.

Para operações de administrador, o perfil **é conferido no banco a cada requisição** (`adminMiddleware`). Assim, um admin rebaixado perde o acesso imediatamente, sem depender do perfil gravado no token.

## Alternativas consideradas
- **Sessão no servidor (cookie + store):** revogação imediata, mas exige estado compartilhado (Redis) e lida pior com o app mobile.
- **OAuth / provedor externo (Auth0, Firebase):** robusto, porém adiciona dependência externa e custo de integração fora do escopo.

## Consequências
- ✅ API stateless: qualquer instância valida o token sem consultar sessão.
- ✅ Mesmo mecanismo para web e mobile.
- ⚠️ Um token roubado vale até expirar (mitigado pela validade curta e pelo HTTPS no web).
- ⚠️ Sem refresh token: o usuário faz login novamente após 1 dia.
