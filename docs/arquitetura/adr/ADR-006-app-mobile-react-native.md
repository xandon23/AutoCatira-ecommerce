# ADR-006 – App mobile com React Native + Expo sobre a mesma API

- **Status:** Aceita
- **Data:** 18/09/2026 (bimestre anterior, registrada retroativamente)

## Contexto
A primeira versão do AutoCatira era somente web. Negociação de veículos acontece principalmente pelo celular, e a evolução precisava reaproveitar as regras já implementadas.

## Decisão
Criar o app com **React Native + Expo (TypeScript)**, consumindo **a mesma API REST e o mesmo banco** da versão web, com serviços separados por recurso (`vehicleService`, `proposalService` etc.), autenticação por JWT e upload de imagens pela câmera ou galeria.

## Alternativas consideradas
- **App nativo (Kotlin/Swift):** melhor desempenho, porém duas bases de código e outra linguagem.
- **Flutter:** multiplataforma, mas sem reaproveitar o conhecimento em React/TypeScript da equipe.
- **PWA (site responsivo):** sem instalação, mas com acesso limitado à câmera e à experiência nativa.

## Consequências
- ✅ Um único back-end para web e mobile.
- ✅ Build Android configurado via EAS.
- ⚠️ O app depende do endereço da API configurado em `EXPO_PUBLIC_API_URL`.
