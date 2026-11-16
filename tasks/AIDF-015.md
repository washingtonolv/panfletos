# AIDF-015 — Barra horizontal flutuante e propriedades de texto

Pedido do usuário: converter a barra de ferramentas vertical em horizontal flutuante e incluir fonte, alinhamento e espaçamento.

## Escopo e plano
- Mover as ferramentas existentes para uma barra horizontal sobre a área de trabalho; preservar atalhos, imagens, histórico e zoom. Responsiva e oculta na impressão.
- Adicionar controles reais para família/tamanho, peso/itálico, cor, alinhamento, letras e entrelinhas. Alvos explícitos: nome, marca textual, chamada e campos de cabeçalho/rodapé/título.
- Metadados opcionais de texto em produtos/campos; sem nova chave, renomeação ou migração obrigatória. Projetos anteriores mantêm seus estilos. Validar valores na importação e preservar no rascunho, JSON, histórico e impressão.
- Arquivos: CanvasViewport, BlockEditor, Inspector, BrandMark, editor-shell.css, novo módulo de estilos e controles, block-model/project-import e testes/documentação.

## Aceitação e riscos
- Barra horizontal flutuante sem ocupar coluna lateral nem encobrir o zoom, em desktop/celular.
- Mudança de texto atua apenas no alvo escolhido; restaurar estilo volta ao modelo. Sem alterar fotos, etiquetas ou dimensões da impressão.
- JSON/rascunho preservam ajustes; importações malformadas são rejeitadas. Valores extremos ficam limitados e conteúdo permanece dentro do bloco.
- Conferir nomes longos, fonte e espaçamento em tela/impressão, undo/redo, fotos e arraste, modelo antigo e tela estreita. Executar lint, testes e build.

Reversão: reverter o commit. Formato anterior continua legível; estilos opcionais só são usados pelo editor atualizado. Sem serviços/dependências novos.

## Evidências
- `pnpm run test:model`: 39 testes aprovados, incluindo preservação de estilos no JSON/rascunho/ordenação e rejeição de valores inválidos. `pnpm run lint`: sem erros, cinco avisos preexistentes. `pnpm run build`: TypeScript e produção aprovados. Nenhuma dependência alterada.
- Navegador local: nome em Georgia 16 px/negrito/itálico/centro, letras 0,5 px e entrelinhas 1,5 aplicados apenas ao alvo; segundo produto permaneceu com o estilo anterior. Marca em Impact independente do nome; restaurar, Desfazer e Refazer conferidos.
- Cabeçalho em Verdana/alinhado à direita; projeto antigo importado, foto aplicada, modelo completo com nome em Verdana 12 px. Botão T abre e foca a seção de tipografia. Arraste real reordenou o bloco preservando fonte e foto; Desfazer recuperou a ordem.
- JSON baixado preservou as propriedades; reload manteve a fonte. Impressão emulada manteve Georgia 16 px e ocultou a interface. Sem impressão física ou auditoria completa de acessibilidade.
- Barra horizontal, dentro da tela e sem interseção com zoom em desktop, 900 × 800 e 390 × 844. Sem estouro horizontal nas larguras menores; console sem erros observados.
- Estilos são extensões opcionais no formato existente: `Product.textStyles` para name/brand/label e `Block.fields[].style`. Sem alteração de armazenamento ou migração. Modelos antigos não ganham estilos automaticamente; remover o ajuste volta ao CSS do modelo. Logos em imagem preservam sua arte e não oferecem formatação de marca textual enquanto ativas.
- Publicação continua a tarefa de refinamento autorizada pelo usuário. Reversão por commit; preservar um JSON atualizado antes de abrir o documento em versões antigas, que desconhecem esses campos opcionais.
