# AIDF-013 — Novo painel profissional do editor

## Objetivo
Adaptar a interface do editor real à proposta visual aprovada (ambiente grafite inspirado em editores gráficos), mantendo o fluxo **escolher, arrastar e editar**: escolher um layout pronto, arrastar o bloco e editar foto, nome e preço. Especificação: `ESPECIFICACAO-NOVO-PAINEL.md` enviada pelo usuário.

## Decisões do usuário
- Um único PR com tudo junto.
- Grafite vira o tema padrão; o tema claro continua opcional (botão de tema mantido).
- O JSON enviado (`panfleto-editavel`) é só dado de teste: não entra no repositório nem substitui o exemplo.

## Premissas (registrar no PR)
- O HTML de referência não chegou ao ambiente. O trabalho parte da especificação escrita e de uma captura de tela da referência enviada pelo usuário.
- Nada é inventado: só entram controles com ação real. Régua, olhos de visibilidade de camada e "encaixe automático" como botão ficam de fora (encaixe aparece só como texto de estado).

## Escopo
- Casca nova: barra de menus (Arquivo, Editar, Visualizar, Organizar), faixa do documento, trilho de ferramentas à esquerda, biblioteca de layouts com miniaturas, estrutura da página, abas Frente/Verso, barra contextual (Foto, Nome, Preço, Duplicar), inspetor "Propriedades" com abas Produto / Bloco / Documento, lista de blocos e barra de status.
- Lógica do editor (estado, histórico, salvamento, imagens, importação, impressão) **não muda**: apenas é reorganizada em componentes.
- Tokens de cor em variáveis CSS (`--editor-*`) com temas grafite e claro.
- Sem backend, login, serviços externos ou novas chaves de armazenamento (a chave do tema continua `panfletos:editor:theme`).

## Arquivos previstos
`src/BlockEditor.tsx` (orquestração), `src/PriceTag.tsx` (extraído), `src/EditorMenus.tsx`, `src/LayoutLibrary.tsx`, `src/PageStructure.tsx`, `src/Inspector.tsx`, `src/CanvasViewport.tsx` (ferramenta controlada; zoom em cluster próprio), `src/editor-shell.css` (nova), `src/editor-dark.css` e `src/block-editor.css` (limpeza do que ficar morto), `docs/DESIGN_SYSTEM.md`, este arquivo.

## Riscos
- Regressão no fluxo de imagem, histórico ou impressão ao mover o JSX: mitigado mantendo as funções no mesmo componente e testando no navegador.
- Contraste insuficiente no grafite: usar tokens validados e conferir foco/estados desabilitados.
- Celular: biblioteca e inspetor viram painéis recolhíveis empilhados.
- Impressão: nenhuma parte da interface pode aparecer (a `.builder-app` continua oculta no `@media print`).

## Critérios de aceitação
- Abre em grafite; alternar para claro funciona e persiste.
- Inserir bloco por clique e por arraste (destino visível), reordenar pela estrutura e por Subir/Descer, selecionar bloco e produto, editar foto/nome/preço, formatos de etiqueta, adicionar/remover produto (1 a 5), duplicar/excluir, desfazer/refazer.
- Abrir o JSON de teste via "Abrir projeto" e exportar de volta sem perda.
- Frente/verso, fundo do panfleto, cores do modelo, impressão (sem interface), recarregar mantém o trabalho.
- `npm run lint` sem erros, `npm run test:model` e `npm run build` aprovados.

## Evidências
- `npm run test:model`: 37 testes passaram. `npm run lint`: sem erros, 5 avisos (os mesmos de antes). `npm run build`: aprovado.
- Playwright em `vite preview` com o JSON de teste do usuário: 26 verificações passaram (grafite padrão, folha em branco, inserir por clique e por arraste com destino visível, reordenar por Subir/Descer e por arraste na estrutura, seleção de produto, edição de nome e preço com normalização 1.299,90, atalhos Nome/Preço da barra contextual, formato de etiqueta e aplicar ao bloco, adicionar/remover produto, duplicar/excluir/desfazer, menus e Escape, tema claro persistido, Frente/Verso, recarregar mantém o trabalho, abrir e baixar o JSON sem perda, ferramentas Selecionar/Mão e atalhos, zoom).
- Impressão emulada: `.builder-app` oculto e 3 folhas em `.print-document`. Sem estouro horizontal em 1440, 1100, 900 e 390 px. Console sem erros.
- Pendentes: `scripts/*.browser.mjs` (exigem Edge), impressão real em PDF no navegador do usuário, revisão manual de contraste/teclado com leitor de tela.

## Reversão
Reverter o commit/PR. Nenhum formato de dados ou chave de armazenamento muda; rascunhos existentes continuam abrindo.
