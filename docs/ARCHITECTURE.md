# Arquitetura — Panfletos

Baseline: 80c11f2d5a25d2fa57a6b1df7a654eac2c38a47c.

## Tecnologias observadas
React + TypeScript + Vite; módulos ES; package-lock.json para instalação reproduzível com npm ci.
Faixas declaradas no package.json: React/React DOM ^19.3.1, Vite ^8.3.6, TypeScript ~7.0.2, Zustand ^5.1.0, Immer ^11.2.10, react-moveable ^0.56.0, morphdom ^2.7.8 e xlsx ^0.18.5.
Essas faixas não equivalem a versões instaladas. O workflow usa Node 22; o teste local desta adoção usou Node 24.22.1.

## Responsabilidades
| Arquivo | Responsabilidade |
|---|---|
| src/main.tsx | Seleciona montador, modo livre ou avançado pelo fragmento da URL. |
| src/BlockEditor.tsx | Interface principal, seleção, edição, histórico, fotos, JSON e impressão. |
| src/block-model.ts | Tipos, catálogo, normalização, migração, preços, ordenação e paginação. |
| src/block-seed.json | Conteúdo inicial do montador. |
| src/block-editor.css | Layout, etiquetas, adaptação de tela e impressão. |
| src/App.tsx e src/store.ts | Editor livre legado e estado com Zustand/Immer. |
| src/dc/runtime.ts e src/dc/Main32.dc.html | Modo avançado legado. |
| scripts/block-model.test.mjs | Seis testes do modelo na baseline. |

## Dados e persistência
O documento principal contém frente e verso, com blocos e produtos. Estado e histórico do montador ficam em React; não presumir que o montador usa o store legado.
O rascunho usa panfletos:montador:v3. A inicialização também tenta ler panfletos:montador:v2 e panfletos:v1; registros antigos são preservados.
Projetos são importados/exportados em JSON. Fotos PNG/JPEG/WebP enviadas ao montador são limitadas a 900 px no maior lado e convertidas em WebP.

## Serviços e publicação
Nenhum backend próprio, autenticação ou banco remoto foi identificado na árvore inspecionada; isso não é auditoria de segurança completa.
vite.config.ts usa base /panfletos/. O workflow .github/workflows/pages.yml instala, testa, compila e publica após push na main, além de aceitar execução manual.
Preparar alterações em branch e PR. Merge ou push na main exige autorização explícita para publicar a aplicação.

## Riscos e reversão
Persistência/migração, paginação, etiquetas estreitas e impressão exigem regressões relevantes. Preservar cópias JSON antes de testar migrações: reverter código não recupera dados automaticamente.
