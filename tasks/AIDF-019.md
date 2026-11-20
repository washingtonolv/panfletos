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

## Etapa B — barra de menus do toolcraft
- Decisão: opção 1 (componentes visuais do toolcraft ligados ao estado atual do montador).
- Copiados de `starter/src/toolcraft/ui`: `lib/utils.ts`, `components/primitives/primitive-arrow-icon.tsx`, `components/composites/menubar.tsx`, `components/composites/dropdown-menu.tsx`. Helper `sanitize-composed-host-props` removido (usado só em dois spans de atalho). Licença MIT em `src/toolcraft/LICENSE.md` e `NOTICE.md`.
- Dependências: `@base-ui/react`, `@phosphor-icons/react`, `clsx`, `tailwind-merge`.
- Tailwind sem prefixo, com varredura limitada a `src/toolcraft` (verificado: nenhuma classe do editor coincide com utilitários comuns).
- `src/EditorMenubar.tsx` aplica os mesmos dados `Menu[]` ao Menubar do toolcraft; `BlockEditor.tsx` usa o novo componente.
- Tokens `--foreground`, `--muted`, `--popover`, `--accent` etc. definidos em `:root` (menus usam portal).
- Verificação: `tsc -b` ok; lint sem erros; `npm run test:model` 39 aprovados; `vite build` ok com stub de WASM (removido); captura em `/tmp/s19b.png`.
- Pendente: abrir e testar os menus com teclado; migrar o restante da casca (barra superior, painel, propriedades, controles) nas próximas etapas.

## Etapa C (parcial) — motion e dialkit
- Decisão: opção 1. `motion@14.14.0` como dependência do app; `dialkit@2.2.1` como devDependency, sem importação no código do editor (é um painel de ajuste para desenvolvimento, sem menu nem dropdown).
- `motion/react` anima a troca de painel do trilho (`ed-left`), com `useReducedMotion` para desativar a animação quando o sistema pedir movimento reduzido.
- Verificação: `tsc -b` ok; lint sem erros; `npm run test:model` 39 aprovados; `vite build` ok com stub de WASM (removido).

## Rodada de refinamento visual (feedback: quadrado, ícones, controles)
- Ícones Phosphor (`@phosphor-icons/react`, já instalado) no logotipo, trilho (Blocos, Camadas, Modelos), desfazer/refazer e tema.
- Cantos mais arredondados: botões 10 px, painel de zoom 16 px, menus 14 px; sombras mais suaves.
- Pendente (feedback do responsável): painéis e cartões ainda retangulares; controles deslizantes, controles de texto e fonte e seletor de cor moderno ainda não substituídos.
- Verificação: `tsc -b` ok; lint sem erros; build com stub de WASM ok; captura `/tmp/s19d.png`.
