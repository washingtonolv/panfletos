# AIDF-006 — imagens e navegação do editor

## Objetivo e autorização
Implementar os quatro comentários do usuário na continuação da entrega da galeria: foto direta nos produtos com remoção, imagem de cabeçalho/rodapé e barra flutuante com seleção/mão/desfazer/refazer e Ctrl + rolagem. Continuação da implementação e publicação autorizadas na AIDF-005.

## Escopo
BlockEditor, novo CanvasViewport, modelo/validação de imagens, CSS e testes. Imagem de cabeçalho/rodapé substitui a composição visual sem apagar os campos de texto; remover restaura a composição. Ajuste padrão contém a imagem inteira; opção preencher pode cortar bordas. Produtos mantêm encaixe sem corte. Imagens PNG/JPEG/WebP locais, otimização e limite de 20 MiB por arquivo. URLs importadas seguem as mesmas regras das fotos existentes.

Zoom 25–250% ao redor do cursor no canvas, Ctrl/Cmd + rolagem; barra flutuante com seleção (V), mão (H/espaço temporário), desfazer/refazer e seletor de zoom acessível. Arrastar com mão não edita nem reordena. Navegação não entra no histórico, no JSON ou na impressão. Inputs e galeria não recebem os atalhos globais de edição.

## Critérios
- Inserir/trocar/remover fotos dos produtos e imagens dos cabeçalhos/rodapés, nos dois lados; desfazer/refazer, salvar/recarregar, JSON e impressão preservam imagens.
- Cancelar arquivo, tipo inválido, falha de leitura e arquivo excessivo não alteram o conteúdo. Upload atrasado não reaparece após remover/desfazer/importar/trocar projeto nem altera bloco/produto que mudou enquanto era lido.
- Rascunhos existentes/galeria/cópias guardadas continuam compatíveis. Metadados novos inválidos são rejeitados antes da importação.
- Barra antiga removida; seleção/mão claras; Ctrl+rolagem muda somente zoom do canvas e mantém o ponto do cursor quando possível; rolagem normal permanece normal; mão arrasta nos dois eixos sem modificar documento.
- Atalhos não interferem com digitação ou galeria. Foco, celular e impressão sem controles conferidos.
- Testes de modelo, navegador, lint e build; publicar e verificar em produção.

## Riscos / reversão
Armazenamento local limitado: preservar avisos/backup existentes. Cabeçalho/rodapé usam dimensões do bloco; modo preencher corta bordas por escolha explícita. Mudança opcional no JSON (image/imageFit), sem alterar chaves. Reverter o commit com novo deploy, guardando backups antes: versões anteriores não preservam novos campos. Não excluir rascunhos nem cópias.

## Evidências
Implementado. 31 testes de modelo e 30 cenários de navegador locais passaram (sete novos e 23 regressões). Lint sem erros (cinco avisos existentes), TypeScript/build aprovados. Screenshots desktop/celular revisados; imagens em JSON/rascunhos/print e zoom ancorado verificados. Detalhes em docs/TEST_PLAN.md. Publicação e verificação em produção serão confirmadas no fechamento; sem impressão física ou auditoria completa de acessibilidade.
