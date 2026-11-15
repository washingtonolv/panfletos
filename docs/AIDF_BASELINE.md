# AIDF 1.0 no Panfletos

Data: 2026-11-15.
Origem do kit: washingtonolv/aidf-framework, commit 585cf403b7b0aa21763bf627d62c7dd5bbaa6fdf.
Baseline do aplicativo: 80c11f2d5a25d2fa57a6b1df7a654eac2c38a47c.

## Objetivo
Objetivo confirmado: evoluir o editor existente. Esta adoção adiciona contexto, instruções e modelos; não altera o editor nem escolhe um novo recurso.

## Rotina
1. Ler AGENTS.md e os documentos relevantes de docs/.
2. Usar templates/EXISTING_PROJECT.md para descrever a melhoria e as restrições.
3. Copiar templates/TASK.md para tasks/ e definir critérios de aceitação.
4. Usar prompts/PLAN.md e revisar decisões pendentes.
5. Implementar com prompts/IMPLEMENT.md e revisar com prompts/REVIEW.md; para falhas, usar prompts/BUGFIX.md.
6. Registrar verificações reais e atualizar os documentos.

Os guias de integrations/ são opcionais. Sua presença não significa que Vercel, Supabase, Figma ou Cloudflare estejam configurados.

## Critérios desta adoção
Instruções disponíveis em AGENTS.md, CLAUDE.md e .cursor/rules/aidf.mdc.
Contexto baseado no código, distinguindo fatos e hipóteses.
Arquivos existentes preservados; README recebe somente navegação adicional.
Nenhuma mudança de funcionalidade, workflow ou dependência; nenhum deploy.
Evidências em TEST_PLAN.md e tarefa em tasks/AIDF-001.md.

## Próxima decisão
Definir a primeira melhoria: o que ocorre hoje, o que deve ocorrer e um exemplo de aceitação. Não presumir que evoluir o editor autoriza redesenho, login, banco remoto ou migração de dados.
