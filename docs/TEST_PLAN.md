# Verificação — Panfletos

## AIDF-003 — importação JSON (2026-11-15)
- npm ci concluído sem alterar dependências; 19 testes passaram, incluindo cinco novos testes com matrizes de estruturas inválidas, tipos, identificadores, fotos, tags, quantidades, metadados históricos, BOM e limite de arquivo.
- npm run lint: nenhum erro, cinco avisos existentes. npm run build: TypeScript e produção aprovados.
- Seis cenários no Edge/build local: rejeições preservam documento/armazenamento/histórico e permitem repetir arquivo; importação válida/desfazer/refazer/reload; tamanho/leitura; edição durante leitura; seleção concorrente; BOM e lados vazios.
- Ausência de erros JavaScript confirmada. Recuperação permanece coberta pelos oito testes anteriores. Não há alteração visual, na impressão ou nos modos legados.
- Contrato, critérios e limites em tasks/AIDF-003.md.

## AIDF-002 — recuperação segura (2026-11-15)
- Instalação pelo lockfile concluída com npm ci usando ferramenta local, sem mudança de dependências.
- npm run test:model: 14 testes passaram (seis existentes e oito de recuperação).
- npm run lint: sem erros; cinco avisos nos padrões já existentes, incluindo estado no efeito de salvamento.
- npm run build: TypeScript e build de produção aprovados.
- Edge headless, build de produção local: seis cenários passaram — original preservado após reload/download/cancelamento; novo documento confirmado com cópia persistente; recuperação v2; falha de quota; nova tentativa após reparo; navegador sem rascunho.
- Download comparado ao texto original; ausência de erros JavaScript verificada. Tela móvel de recuperação inspecionada em 390 × 844 px, sem rolagem horizontal.
- Critérios, limites e reversão: tasks/AIDF-002.md. Impressão e modos anteriores não sofreram alterações e não foram revalidados visualmente nesta tarefa.

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
