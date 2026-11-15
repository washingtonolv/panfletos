# AIDF-001 — Adotar AIDF 1.0 no editor existente

Status: preparado para revisão em PR. Data: 2026-11-15.

## Objetivo
Dar contexto verificável às próximas evoluções sem alterar a aplicação.

## Escopo
Instruções de agentes, contexto de produto/arquitetura/design/fluxos/verificação, templates, prompts, guias opcionais e navegação no README.
Fora do escopo: recursos do editor, dependências, migrações, workflow, merge na main e deploy.

## Aceitação
- [x] Kit presente e documentos adaptados ao editor real.
- [x] Objetivo de evoluir o editor registrado; recurso seguinte em aberto.
- [x] Persistência, modos legados, etiquetas e impressão tratados como regressões.
- [x] Comandos existentes e limitações documentados.
- [x] Código e workflow preservados.
- [ ] Revisão do responsável e definição da primeira melhoria funcional.

## Evidência e reversão
Seis testes de modelo passaram. Lint/build e revisão no navegador não executados; detalhes em docs/TEST_PLAN.md.
Confirmar no diff do PR que somente documentação/instruções mudaram. Fechar o PR mantém a aplicação publicada intacta.
