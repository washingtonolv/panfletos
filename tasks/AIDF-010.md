# AIDF-010 — Cor de fundo do panfleto

## Objetivo
Oferecer no editor uma cor de fundo para todo o panfleto, compartilhada por frente e verso, com opção de restaurar branco. A cor pertence ao documento, não ao tema da interface.

## Critérios de aceitação
- O seletor é visível mesmo em projetos antigos sem metadados de modelo.
- A cor escolhida aparece na tela, nos dois lados, na impressão/PDF e no JSON exportado.
- Cartões de produtos revelam a cor da folha, e seus textos alternam entre tinta clara/escura para manter legibilidade.
- Rascunhos e arquivos anteriores continuam brancos; novo atributo é opcional.
- Importação rejeita cores inválidas sem substituir o documento.
- Restaurar branco remove o atributo e pode ser desfeito pelo histórico.

## Plano e riscos
Adicionar `pageBackground` opcional ao documento e validá-lo na normalização e importação. Reutilizar o seletor nativo de cor, sem alterar a paleta da campanha ou etiquetas. Aplicar a cor à folha e tornar os cartões transparentes somente quando a opção estiver presente. Risco: CSS de impressão ou modo escuro sobrescrever o fundo; verificar ambos no navegador.

## Evidências
- `npm run lint`: sem erros; cinco avisos existentes.
- `npm run test:model`: 34 testes passaram, incluindo round trip e rejeição de cores inválidas.
- `npm run build`: TypeScript e build de produção aprovados.
- Edge local: frente, verso, modo escuro, CSS de impressão, salvamento, exportação, reload, restauração e ausência de erros JavaScript passaram.
- Revisão visual desktop 1397 × 929 px com fundo azul escuro e tema escuro.

## Reversão
Reverter código e CSS; documentos já exportados com `pageBackground` continuam íntegros, mas versões antigas ignoram o campo opcional.
