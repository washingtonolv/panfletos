# AIDF-002 — Recuperação segura de rascunhos

Data: 2026-11-15. Implementação e deploy autorizados pelo responsável.

## Problema e resultado
Um rascunho ilegível podia ser substituído pelo salvamento automático do conteúdo inicial ou de uma versão anterior. Agora a falha abre uma tela de recuperação e bloqueia o salvamento antes de qualquer edição.

## Escopo e plano
Separar leitura, decisão de recuperação e gravação em src/block-model.ts; conectar a proteção ao efeito de salvamento em src/BlockEditor.tsx; adicionar aviso acessível e download dos originais; testar dados e fluxo real no navegador.
Não alterar validação geral de importação, etiquetas, impressão, modos legados ou dependências.

## Critérios de aceitação e evidência
- [x] Original ilegível permanece intacto após abertura e recarregamento: teste de modelo e navegador.
- [x] Aviso claro e salvamento bloqueado: teste de navegador.
- [x] Download preserva exatamente o conteúdo original: arquivo baixado comparado no navegador.
- [x] Novo documento exige confirmação; cancelar preserva o estado: teste de navegador.
- [x] Cópia persistente é gravada e relida antes de liberar salvamento: testes de modelo e navegador.
- [x] Falha de quota, leitura ou verificação da cópia mantém a proteção: testes de modelo; quota também no navegador.
- [x] Rascunhos válidos e versões v2/v1 continuam legíveis: testes de modelo; recuperação v2 no navegador.
- [x] Alteração do original em outra aba durante a decisão impede substituição: teste de modelo.
- [x] Tentar novamente permite abrir um rascunho reparado: teste de navegador.
- [x] Testes, lint e build executados: 14 testes passaram; lint sem erros e com cinco avisos; build aprovado.

## Riscos e limites
As cópias de recuperação usam espaço local e não são removidas automaticamente. Com armazenamento sem espaço, é necessário liberar espaço e tentar novamente; o download permite preservar uma cópia externa. A ferramenta preserva os dados, mas não repara automaticamente o JSON inválido.
A proteção não é sincronização geral entre abas e não altera a validação estrutural dos documentos.

## Verificação visual e reversão
Tela de recuperação conferida em 390 × 844 px, sem rolagem horizontal. Fluxo automatizado no Edge; outros navegadores e impressão não revalidados porque não foram alterados.
Antes de reverter para a versão anterior, baixar os originais: o código antigo não tem esta proteção. Reverter código não apaga cópias panfletos:recovery:, mas pode voltar a sobrescrever o rascunho ativo ilegível. Publicação e reversão exigem acompanhar o workflow do Pages.
