# AIDF-012 — Abrir o editor em folha em branco

## Objetivo
Ao entrar no editor (nova sessão do navegador), mostrar uma folha em branco e guardar o rascunho anterior em "Rascunhos guardados", sem apagar nada.

## Decisões do usuário
- Abrir sempre em branco ao entrar.
- O panfleto anterior é salvo como rascunho (+ Novo → Rascunhos guardados → Restaurar).

## Estratégia
- `openBlankSession` (src/draft-library.ts) roda uma vez por sessão do navegador (flag em sessionStorage). Recarregar a página na mesma aba mantém o rascunho atual, evitando perder o trabalho em andamento.
- Se houver rascunho salvo com conteúdo, `replaceDraft` o arquiva (cópia verificada) antes de gravar a folha em branco. Primeira visita sem rascunho abre em branco e não arquiva o modelo de exemplo.
- Falhas (rascunho ilegível, cota cheia, sessionStorage bloqueado) mantêm o rascunho carregado, sem substituir nada. Nenhuma chave de armazenamento nova além da flag de sessão; formato JSON inalterado.

## Critérios de aceitação
- Nova sessão abre sem blocos; o rascunho anterior aparece em Rascunhos guardados e pode ser restaurado.
- Recarregar na mesma aba mantém o trabalho; não gera cópias repetidas.
- Rascunho vazio não é arquivado; rascunho ilegível continua indo para a tela de recuperação.

## Evidências
- `npm run test:model`: 37 testes passaram (3 novos).
- `npm run lint`: sem erros (avisos existentes). `npm run build`: aprovado.
- Navegador local: primeira visita em branco, recarga mantém bloco, nova sessão arquiva 1 cópia e abre em branco, lista de rascunhos exibe a cópia, sem erros de console.
- Pendentes: celular, modo escuro e testes `scripts/*.browser.mjs` (exigem Edge e não foram executados).

## Reversão
Reverter o commit. As cópias guardadas permanecem no navegador e continuam restauráveis.
