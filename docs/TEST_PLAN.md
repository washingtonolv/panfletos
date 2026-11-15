# Verificação — Panfletos

## Comandos existentes
| Comando | Cobertura |
|---|---|
| npm ci | Instalação pelo lockfile; não é teste. |
| npm run lint | Oxlint. |
| npm run test:model | Testes Node em scripts/block-model.test.mjs. |
| npm run build | tsc -b e vite build; inclui verificação TypeScript. |

Não há script separado de typecheck nem suíte de navegador na baseline.

## Evidência da adoção do AIDF — 2026-11-15
- Executado: node --experimental-strip-types --test scripts/block-model.test.mjs, equivalente ao script test:model, com Node 24.22.1.
- Resultado: 6 testes passaram, 0 falhas.
- Cobertura: conteúdo inicial, normalização/migração, ordenação, paginação das etiquetas, rejeição de documento inválido e inteiro/centavos.
- Instalação, lint e build não executados: npm não está disponível no PATH deste ambiente.
- Navegador, revisão visual, impressão/PDF e auditoria completa de acessibilidade/segurança não executados.
- Alteração documental: código, dependências e workflow devem permanecer byte a byte iguais à baseline.

## Aceitação de futuras mudanças
- [ ] Critérios da tarefa associados a evidências.
- [ ] Lint, testes de modelo e build executados; limitações registradas.
- [ ] Fluxos afetados revisados com casos inválidos.
- [ ] Rascunhos, exportação/importação e modos anteriores preservados.
- [ ] Etiquetas, paginação e impressão conferidas quando afetadas.
- [ ] Teclado, foco, rótulos e diferentes larguras conferidos.
- [ ] Nenhum segredo em arquivos ou logs.
- [ ] Autorização explícita para publicação antes de merge na main.

## Reversão
Fechar o PR documental deixa a main intacta. Reverter commit na main também aciona publicação e exige autorização para esse efeito. Mudanças de dados exigem backup JSON e estratégia de migração.
