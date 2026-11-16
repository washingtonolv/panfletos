# Contrato visual — Panfletos

## Fonte atual
src/BlockEditor.tsx, src/editor-shell.css e os componentes EditorMenus, LayoutLibrary, PageStructure e Inspector são a referência implementada. O redesenho do painel foi aprovado pelo usuário em AIDF-013 (ambiente grafite). Os modos legados possuem estilos próprios. Nenhuma referência Figma foi fornecida.

## Fundações observadas
- Fonte da interface: Inter, Arial, sans-serif.
- Tema grafite (padrão) via tokens `--editor-*` em .builder-app: painel #444444, barra #4b4b4b, canvas #262626, campo #393939, borda #333333, texto #eeeeee, texto secundário #bcbcbc, seleção #89a9ff, ação #3d63d9. Tema claro opcional (texto #292235, ação #6a2c91) pelo botão de tema; preferência em `panfletos:editor:theme`. A folha do panfleto mantém as cores de impressão em qualquer tema.
- Etiquetas D&D: vermelho #e91d47, cápsula branca e centavos elevados. Destaque progressivo usa azul, verde e roxo.
- Barra de menus (Arquivo, Editar, Visualizar, Organizar, só com ações reais), faixa do documento, trilho de ferramentas, layouts prontos com miniaturas e estrutura da página à esquerda, folha ao centro com abas 01 · Frente / 02 · Verso e barra contextual (Foto, Nome, Preço, Duplicar), inspetor Propriedades (Produto / Bloco / Documento) e lista de blocos à direita, barra de status. Sem régua e sem controles sem função. Regras em 1100 px, 780 px (painéis empilhados) e para impressão.
- Folha de tela 578 × 782 px; saída pretendida 153 × 207 mm. Zoom não muda o tamanho físico da impressão.

## Componentes a preservar
AIDF-015: ferramentas em barra horizontal flutuante no canvas, com Selecionar, Mão, Texto (T), Foto, Duplicar e Excluir. Em áreas estreitas, ferramentas e zoom ficam em duas faixas para não se encobrirem. O botão Texto abre a seção Texto e tipografia do alvo selecionado. Controles de família/tamanho/peso/itálico/cor/alinhamento/letras/entrelinhas aplicam-se ao nome, marca textual, chamada ou campo do bloco, com valores automáticos do modelo e restauração por alvo. Fontes disponíveis são do sistema; nenhuma fonte externa é carregada.

AIDF-006 substitui os controles superiores por barra flutuante centralizada na parte inferior do canvas. Estados selecionados, cursor grab/grabbing e percentuais explícitos distinguem navegação de edição. Cabeçalhos/rodapés têm CTA para imagem; painel oferece remoção e contain/cover. Celular empilha biblioteca, canvas e edição, mantendo a barra dentro da largura disponível. Controles e dicas não aparecem na impressão.
Galeria AIDF-005: modal de até 1280 px / 92dvh, grade de três/duas/uma colunas, filtros, prévias renderizadas com os mesmos componentes do editor, tela inteira no celular, Escape e restauração de foco. Folhas com layout opcional suportam também 699 × 1020 px / 185 × 270 mm e cores da campanha; documentos antigos preservam os estilos anteriores. Cabeçalhos e ornamentos das referências foram adaptados, não copiados pixel a pixel.
Biblioteca, ordenação de blocos, seleção de produto, campos, envio de foto, seletor de etiquetas, histórico, zoom, avisos e opções de impressão.
Linhas e destaque duplo usam foto à esquerda e conteúdo/etiqueta à direita; destaque progressivo possui composição própria.

## Aceitação visual das próximas tarefas
Refinamento AIDF-014: a folha inicia ajustada à área disponível; botão Ajustar, menu Visualizar e Ctrl/Cmd+0 restauram o enquadramento. Redimensionamento acompanha o modo ajustado e preserva o zoom escolhido manualmente. Biblioteca com busca sem acentos, filtros Todos/Produtos/Estrutura, contagem e rolagem das miniaturas independente do título. Propriedades mantêm cabeçalho/abas visíveis enquanto campos e camadas rolam em áreas próprias. Folha vazia orienta a montagem, abre os modelos e recebe blocos por arraste. O estado de navegação continua fora do documento e da impressão.

Comparar antes/depois nas mesmas condições. Verificar nomes longos, milhares, complementos, cinco produtos, foto ausente, foco e estados desabilitados.
Revisar desktop, larguras próximas dos dois pontos de quebra e celular; matriz oficial ainda pendente.
Conferir frente, verso e ambos na impressão, sem sangria ou marcas de corte.
Revisão visual, contraste e navegação completa por teclado não foram executados nesta adoção documental.
