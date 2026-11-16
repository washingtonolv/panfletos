# Verificação — Panfletos

## AIDF-014 — refinamento do painel (2026-11-16)
- 37 testes de modelo aprovados, lint sem erros (cinco avisos existentes), TypeScript/build aprovados. Nenhuma dependência ou configuração de publicação alterada.
- Navegador local: busca/filtros, inserção por clique e arraste no verso, foto/nome/preço/etiqueta, histórico, ajuste à tela, zoom manual, temas, galeria/prévia/cancelamento, modelo maior e exportação JSON com foto.
- Revisão responsiva em 1100 × 820, 900 × 800 e 390 × 844; folha ajustada contida no canvas e documento sem estouro horizontal. Modelo completo sem interseção entre cartões.
- Impressão emulada: interface oculta, duas folhas no tamanho de 185 × 270 mm. Console sem erros. Limites e reversão em tasks/AIDF-014.md; sem impressão física ou auditoria completa de acessibilidade.

## AIDF-008 — biblioteca de logos
33 testes do modelo aprovados, incluindo persistência, remoção, arquivos ausentes e rejeição de identificadores malformados. Build/TypeScript aprovados e lint sem erros (cinco avisos existentes). scripts/logos.browser.mjs verifica carregamento das 58 imagens, busca, seleção, marca textual preservada, exibição na impressão, remoção, undo/redo, JSON, reload e fallback ausente em contexto Edge isolado. Screenshot desktop revisado. Sem impressão física ou auditoria completa de acessibilidade. Biblioteca usa arquivos fornecidos, sem logos inventadas. Manter arquivos antigos para compatibilidade de projetos.

## AIDF-006 — imagens e navegação (2026-11-15)
- Lint sem erros, cinco avisos já existentes; TypeScript/build aprovados. Nenhuma dependência ou workflow alterado.
- 31 testes de modelo passaram; novos casos cobrem imagem/ajuste de cabeçalhos/rodapés no JSON e rascunho, preservação dos textos, rejeição de URLs/ajustes/tipos inválidos e descarte de alvos obsoletos.
- Sete cenários Edge em scripts/editor-tools.browser.mjs: foto direta/troca/remoção/histórico/backup; cabeçalho/rodapé nos dois lados/JSON/print; erros/cancelamento/tamanho; uploads atrasados/remoção/edição/concorrência/undo/importação/modelo; zoom ancorado/rolagem/mão sem edição; atalhos e inputs/galeria; celular e impressão sem barra. Todos passaram no build local.
- Seis cenários da galeria, seis de recuperação, seis de importação e cinco de preços passaram no mesmo build (30 cenários de navegador no total), sem erros JavaScript.
- Screenshots revisados em 1397 × 929 e 390 × 844. Mídia print verificou imagens, ausência da barra e largura física preservada. Sem impressão física nem auditoria completa de acessibilidade.
- Runner usa PLAYWRIGHT_MODULE opcional, BROWSER_CHANNEL (padrão msedge), EDITOR_TEST_URL (padrão localhost:4177/panfletos), EDITOR_SCREENSHOT_DIR opcional e EDITOR_SCENARIO opcional para filtrar. Contextos isolados, sem perfis reais. Nenhuma dependência de produção adicionada.

## AIDF-005 — galeria de modelos (2026-11-15)
- npm ci pelo lockfile; 28 testes de modelo aprovados, incluindo todos os nove modelos / 15 fontes, contagens de produtos, IDs independentes, metadados/JSON, preservação de rascunhos inválidos, quota, conflitos, verificação de cópia e restauração.
- Lint sem erros e cinco avisos existentes. TypeScript e build de produção aprovados. Nenhuma dependência ou workflow alterado.
- Seis cenários Edge/build local: galeria/filtros/teclado/cancelamento; troca/edição/undo/redo/reload/backup/restauração; quota/conflito; todos os modelos/JSON/dimensões de impressão; celular/foco; foto/cabeçalho/cor/preço e reload.
- Mais 17 cenários existentes no mesmo build: seis de recuperação, seis de importação e cinco de preços passaram, sem erros JavaScript.
- Screenshots da galeria desktop 1440 × 1080, celular 390 × 844 e editor revisados. Mídia print verificou uma folha por lado preenchido, 153/185 mm de largura, lados vazios omitidos e preços inválidos bloqueados. Sem impressão física nem auditoria completa de acessibilidade; tipografia/ornamentos adaptados às referências.
- Suíte reproduzível da galeria em scripts/gallery.browser.mjs; operação documentada em LAYOUT_TEMPLATES.md. Validação após deploy será informada no fechamento da tarefa, sem commit extra que dispare outra publicação.

## AIDF-004 — preços numéricos (2026-11-15)
- npm ci sem alteração de dependências; 23 testes passaram, incluindo quatro novos testes com matrizes de formatos, centavos exatos, limites, importação, lados de impressão e rascunhos antigos.
- Lint sem erros, cinco avisos existentes; TypeScript e build de produção aprovados.
- Cinco cenários Edge/build local passaram: edição inválida/salvamento/reload/backup/bloqueio de impressão; formatos válidos/De opcional/zero; De inválido/Desfazer; importação rejeitada e válida; rascunho antigo e impressão por lado.
- Mídia print verificada: documento com erro exibe aviso e nenhuma folha de ofertas; frente válida imprime quando verso inválido está excluído. window.print foi interceptado nos testes para não abrir diálogo real.
- Screenshot da interface em 1366 × 1000 px revisado: aviso global, marcador na etiqueta e mensagem no campo legíveis. Sem erros JavaScript.
- Não houve impressão física, auditoria completa de acessibilidade nem revalidação visual dos modos legados. Contrato e reversão em tasks/AIDF-004.md.

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

## AIDF-010 — cor de fundo do panfleto (2026-11-15)
- `npm run lint`: sem erros, cinco avisos existentes. `npm run test:model`: 34 aprovados. `npm run build`: aprovado.
- Edge local: frente, verso, impressão, tema escuro, rascunho, JSON exportado, reload, restaurar branco e ausência de erros JavaScript.
- Revisão visual desktop com fundo azul escuro. Critérios e reversão em `tasks/AIDF-010.md`.

## AIDF-009 — modo escuro (2026-11-15)
- `npm run lint`: sem erros, cinco avisos existentes. `npm run test:model`: 33 testes aprovados. `npm run build`: aprovado.
- Edge local: alternância, rótulo e estado do botão, preferência após recarregar, galeria escura, folha branca, rascunho inalterado e ausência de erros JavaScript.
- Revisão visual desktop 1397 × 929 e móvel 390 × 844. Detalhes e reversão em `tasks/AIDF-009.md`.

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
