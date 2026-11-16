# AIDF-014 — Refinamento da interface

Branch: refine/editor-interface. Pedido: finalizar o refinamento do painel existente.

## Objetivo e premissas
Melhorar a área útil e a clareza do montador grafite. A referência é o editor real publicado. Preservar dados, impressão, etiquetas, modelos e modos legados. A autorização de publicação foi dada na conversa; esta tarefa continua a evolução do editor publicado.

## Problema observado
Zoom inicial fixo e excesso de espaço de navegação exigem rolagem horizontal; a biblioteca rola também seu cabeçalho e corta as últimas miniaturas; propriedades extensas escondem a navegação e as camadas. A folha vazia não orienta a criação dentro da página.

## Plano mínimo e arquivos
1. CanvasViewport e BlockEditor: ajustar à tela inicialmente e sob redimensionamento, ação explícita de ajuste e zoom manual preservado; orientação na folha vazia.
2. LayoutLibrary e editor-shell.css: busca/filtros, rolagem própria, miniaturas coerentes com a composição, propriedades com cabeçalho fixo e painéis responsivos.
3. Validar os fluxos de montar/editar/arrastar/histórico, zoom, temas e impressão; executar lint, modelo e build.

## Aceitação
- Folha inteira centralizada no ajuste à tela, inclusive após mudança de tamanho/formato; zoom manual continua disponível.
- Biblioteca pesquisável, filtros reais e todos os itens alcançáveis, sem rolar os títulos.
- Propriedades e camadas acessíveis em desktop; sem estouro horizontal no celular.
- Foto, nome, preço, etiqueta, arraste, histórico e projetos continuam funcionando.
- Nenhuma alteração no modelo, armazenamento, tamanho físico, dependências ou workflow.

## Riscos e reversão
Riscos: zoom interferir na navegação, painéis pequenos e foco oculto ao editar. Conferir no navegador em diferentes larguras. Reverter o commit restaura a interface anterior; não há migração de dados.

## Evidências
- `pnpm run lint`: sem erros e cinco avisos preexistentes. `pnpm run test:model`: 37 testes aprovados. `pnpm run build`: TypeScript e produção aprovados. Scripts originais do package.json executados pela ferramenta disponível; nenhum manifesto/lockfile será alterado.
- Navegador local: busca sem acentos, filtros, resultado vazio, inserção por clique, arraste real da biblioteca para o verso vazio, edição de nome/De/Por/complemento, foto WebP enviada pelo seletor, troca de etiquetas e aplicação ao bloco.
- Zoom manual preservado ao redimensionar; Ajustar pelo botão e pelo menu. Folha inteira contida no canvas em 1100 × 820, 900 × 800 e 390 × 844; sem rolagem horizontal do documento nas larguras verificadas. Layout maior 185 × 270 mm importado e reenquadrado automaticamente.
- Modelo MM/Jequiti: 6 blocos na frente e 8 no verso; edição rápida Preço leva ao campo correto, foto aplicada, cartões sem interseção. Download JSON preservou modelo, formato, ambos os lados e a foto.
- Desfazer/Refazer da importação, temas claro/grafite e navegação da galeria até a prévia D&D/cancelamento conferidos. A confirmação nativa de troca de modelo bloqueou a automação na sessão anterior; seu código permanece inalterado. A composição completa foi verificada pela importação do mesmo documento de modelo.
- Mídia de impressão emulada: duas folhas, interface oculta, 699,203 × 1020,47 px (185 × 270 mm). Nenhum erro JavaScript observado. Sem impressão física ou auditoria completa de acessibilidade.
- Publicação autorizada expressamente pelo usuário ao retomar a verificação. Rollback: reverter o commit desta tarefa, sem migração de dados.
