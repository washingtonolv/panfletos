# AIDF-018 — Casca do editor com componentes do toolcraft

Pedido: adotar o layout e os componentes de casca do toolcraft no montador de panfletos, aprovado pelo responsável em conversa.

## Plano e limites
- Objetivo: substituir a casca visual do montador (barra de menus, painel de estrutura, propriedades, barra flutuante e controles) por componentes equivalentes do toolcraft, mantendo a lógica de documento e a impressão.
- Fora de escopo: `src/block-model.ts`, `src/prices.ts`, `src/project-import.ts`, `src/draft-library.ts`, motor Rust (`rust/`, `src/layout-engine*`, `src/render*`), etiquetas, dimensões de impressão, paginação, chaves de armazenamento e modos `#livre`/`#avancado`.
- Origem dos componentes: toolcraft (pixel-point/toolcraft, `starter/src/toolcraft/ui`), licença MIT. Manter `NOTICE`/`LICENSE` do toolcraft junto da cópia.
- Dependências novas previstas (exigem registro no PR): Tailwind 4 (`tailwindcss`, `@tailwindcss/vite`), Base UI (`@base-ui/react`), `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`. Nenhum serviço, login, backend ou banco.
- Conflito conhecido: o `docs/DESIGN_SYSTEM.md` aprova o tema grafite atual; a troca de casca altera esse visual. A aprovação para a troca foi dada pelo responsável nesta conversa; o resultado visual precisa de nova revisão antes do merge.

## Etapas (cada uma com testes e verificação visual)
1. Adicionar dependências e configuração de Tailwind sem alterar a aparência atual (estilos isolados em escopo próprio).
2. Barra de menus e barra flutuante do canvas com componentes do toolcraft.
3. Biblioteca de blocos e estrutura da página.
4. Painel de propriedades (Produto/Bloco/Documento) e controles de cor, fonte, slider e select.
5. Remoção do CSS antigo substituído, uma área por vez.

## Aceitação
- `npm run lint`, `npm run test:model` e `npm run build` aprovados (o build depende do Rust 1.100.0; validar no CI do PR).
- Editor abre em `/panfletos/`, `#livre` e `#avancado` funcionam.
- Frente, verso e ambos imprimem com as mesmas dimensões (153 × 207 mm; 185 × 270 mm) e sem sangria ou marcas de corte.
- Rascunhos, importação/exportação JSON, histórico e seleção de produtos preservados.
- Revisão em desktop, em larguras próximas aos pontos de quebra e em celular; contraste e navegação por teclado verificados.

## Riscos e reversão
- Regressão visual não aprovada: mitigado por etapas pequenas e revisão antes do merge.
- Dependências novas aumentam o tamanho do build: medir antes e depois.
- Reversão por commit em branch; nenhuma migração de dados.

## Evidências locais
- Branch `aidf/018-toolcraft-shell` criada a partir da `main`.
- `npm run lint`: sem erros; avisos já existentes na baseline.
- `npm run test:model`: 39 testes aprovados.
- `npm run build`: bloqueado localmente pelo download do Rust 1.100.0 (proxy da sessão). Validar no CI.
- Nenhuma alteração de código ainda; etapa 1 pendente.

## Etapa 1 — evidências
- Tailwind 4.3 e @tailwindcss/vite instalados; plugin adicionado em `vite.config.ts`.
- `src/tailwind.css` importa apenas theme e utilities, com prefixo `tc:` e sem preflight. Importado somente por `BlockEditor.tsx`, então `#livre` e `#avancado` não recebem o CSS.
- Comparação do CSS compilado do montador: 49753 → 49836 bytes (+83, só o wrapper de camadas). Nenhum utilitário sem prefixo foi gerado; o probe `tc:flex` gera `tc\:flex{display:flex}`.
- `tsc -b`, `npm run lint` (sem erros) e `npm run test:model` (39 aprovados).
- Build completo ainda depende do WASM (`build-rust.mjs`, bloqueado por Rust 1.100.0 nesta sessão); com um stub temporário de WASM, `vite build` passa, e o stub foi removido.

## Etapa 2 — restilização (decisão: restilizar tudo, sem copiar o menubar)
- Decisão do responsável: restilizar a casca em vez de copiar o menubar do toolcraft. Os menus, a barra flutuante, o painel e a biblioteca usam os tokens `--editor-*`, então a troca de tokens em `src/editor-shell.css` restilizou a casca inteira.
- Tokens escuros trocados por valores derivados do tema do toolcraft; tema claro mantido.
- `docs/DESIGN_SYSTEM.md` atualizado com os novos valores.
- Verificação: `tsc -b` ok; `npm run lint` sem erros (aviso já existente); `npm run test:model` 39 aprovados; `vite build` ok com stub de WASM (removido depois).
- Captura headless do preview local: menus, barra flutuante, painel e biblioteca no tema novo; folha em branco com a mesma estrutura. Build real do WASM continua pendente para o CI.
- Pendências visuais: raio e espaçamento finos (ainda os do AIDF-013), revisão em larguras estreitas e no tema claro, e navegação por teclado.
