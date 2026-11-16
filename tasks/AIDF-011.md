# AIDF-011 — Painel de edição em seções

## Objetivo
Melhorar o layout do painel "Edite o conteúdo" (painel 3): agrupar em seções e compactar foto e marca. Somente interface; documento, JSON, folha e impressão não mudam.

## Escopo
- Seções "Foto e identificação", "Preço e etiqueta" e "Documento" (cores do modelo, fundo do panfleto, impressão).
- Envio de foto compacto (miniatura ao lado do texto); logos em 3 colunas com altura menor.
- "Etiqueta de preço" passa a "Formato da etiqueta". Nenhuma chave de armazenamento ou formato JSON alterada.

## Critérios de aceitação
- Todos os campos e ações anteriores continuam disponíveis e com o mesmo comportamento.
- Painel legível em desktop; sem alteração na folha e na impressão.

## Evidências
- `npm run lint`: sem erros (avisos existentes).
- `npm run test:model`: 34 testes passaram.
- `npm run build`: TypeScript e build de produção aprovados.
- Prévia local em desktop 1400 px (claro e escuro) e celular 390 px, sem rolagem horizontal nem erros de console. Impressão emulada: editor oculto e folhas inalteradas.
- Revisão encontrou texto ilegível no modo escuro (fundo claro das seções e da caixa de foto); corrigido em `src/editor-dark.css`.

## Reversão
Reverter o commit; não há migração nem mudança de dados.
