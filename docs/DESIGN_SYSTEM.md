# Contrato visual — Panfletos

## Fonte atual
src/BlockEditor.tsx e src/block-editor.css são a referência implementada. Este documento não aprova um redesenho. Os modos legados possuem estilos próprios. Nenhuma referência Figma foi fornecida.

## Fundações observadas
- Fonte da interface: Inter, Arial, sans-serif.
- Texto #292235; fundo #f2eff5; ação principal #6a2c91; painéis brancos; foco #b18cd5.
- Etiquetas D&D: vermelho #e91d47, cápsula branca e centavos elevados. Destaque progressivo usa azul, verde e roxo.
- Biblioteca à esquerda, folha ao centro e edição à direita. Há regras em 1100 px, 780 px e para impressão.
- Folha de tela 578 × 782 px; saída pretendida 153 × 207 mm. Zoom não muda o tamanho físico da impressão.

## Componentes a preservar
Biblioteca, ordenação de blocos, seleção de produto, campos, envio de foto, seletor de etiquetas, histórico, zoom, avisos e opções de impressão.
Linhas e destaque duplo usam foto à esquerda e conteúdo/etiqueta à direita; destaque progressivo possui composição própria.

## Aceitação visual das próximas tarefas
Comparar antes/depois nas mesmas condições. Verificar nomes longos, milhares, complementos, cinco produtos, foto ausente, foco e estados desabilitados.
Revisar desktop, larguras próximas dos dois pontos de quebra e celular; matriz oficial ainda pendente.
Conferir frente, verso e ambos na impressão, sem sangria ou marcas de corte.
Revisão visual, contraste e navegação completa por teclado não foram executados nesta adoção documental.
