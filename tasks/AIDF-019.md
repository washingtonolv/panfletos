# AIDF-019 — Novo layout estilo Canva

Pedido: trocar o layout do montador por um estilo parecido com os editores atuais (referência: Canva), com componentes e controles novos.

## Plano e limites
- Estrutura: trilho de ícones à esquerda escolhendo um painel por vez (Blocos, Camadas, Modelos); folha central; propriedades à direita.
- Fora de escopo: `src/block-model.ts`, `src/prices.ts`, importação/exportação, rascunhos, motor Rust, impressão e paginação.
- Etapas: A) trilho de ícones (feito); B) barra superior no estilo Canva com documento e ações; C) barra contextual flutuante acima do bloco selecionado; D) painel de propriedades contextual e recolhível; E) controles novos (sliders, selects, cor, fonte) com decisão de biblioteca pendente.

## Etapa A — evidências
- `BlockEditor.tsx`: estado `leftPanel` ('blocos' | 'camadas') e trilho `.ed-iconrail`; "Modelos" abre a galeria existente.
- `editor-shell.css`: `.ed-leftwrap`, `.ed-iconrail`; colunas da grade ajustadas para 336 px (desktop) e 280 px (1100 px); no celular o trilho fica horizontal.
- Verificação: `tsc -b` ok; lint sem erros; `npm run test:model` 39 aprovados; `vite build` ok com stub de WASM (removido); captura headless em `/tmp/s19-desktop.png`.
