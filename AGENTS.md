# AIDF agent contract
## Contexto do Panfletos
- Objetivo confirmado: evoluir o editor existente. Recuperação em tasks/AIDF-002.md; importação em tasks/AIDF-003.md; preços numéricos com testes e deploy em tasks/AIDF-004.md.
- Leia `docs/AIDF_BASELINE.md` e os documentos de contexto antes de editar.
- Montador principal: `src/BlockEditor.tsx`, `src/block-model.ts` e `src/block-editor.css`. Preserve também `#livre` e `#avancado` em `src/main.tsx`.
- Preserve rascunhos locais e compatibilidade JSON. Mudanças de formato ou chaves de armazenamento exigem tarefa e estratégia de migração aprovadas.
- Não redesenhe etiquetas, dimensões de impressão ou paginação fora do escopo. Reutilize o CSS existente.
- Comandos reais: `npm run lint`, `npm run test:model`, `npm run build`. O build inclui TypeScript; não invente scripts.
- Todo push na `main` aciona publicação no GitHub Pages. Trabalhe em branch e PR; merge, push na `main` ou acionamento manual do workflow exigem autorização explícita para publicar a aplicação.
- A adoção do AIDF não autoriza novos serviços, login, backend ou banco de dados.

## Contrato universal
Read `docs/PRD.md`, `docs/AI_RULES.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`, `docs/USER_FLOWS.md` and `docs/TEST_PLAN.md` as relevant. For existing projects, inspect actual files and configuration before proposing changes; documentation may be stale.

Before editing: state goal, assumptions/questions, affected files, risks, acceptance criteria and smallest viable plan. Do not invent business rules. Ask for clarification when a missing answer could cause rework, security issues or destructive changes.

During editing: preserve existing behavior outside scope; reuse design tokens/components; enforce accessibility, responsive states and authorization on the server; avoid secrets in code or logs; use migrations with rollback planning. Never claim tools/tests ran if they did not.

After editing: list files changed, evidence of lint/typecheck/build/tests, visual review status, known gaps and rollback steps. Stop before production deployment, destructive DB actions, billing changes or external publication until authorized.
