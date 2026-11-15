# AIDF-004 — Validação numérica dos preços

Data: 2026-11-15. Implementação, testes e deploy autorizados pelo responsável.

## Problema e objetivo
Texto arbitrário, preços negativos e valores com três casas decimais podiam virar etiquetas, às vezes aparentando um zero. Validar os campos De/Por na edição e importação, sem perder dados de rascunhos existentes, e impedir a impressão de ofertas inválidas.

## Escopo e plano
Criar um analisador monetário compartilhado em src/prices.ts; usá-lo na importação, etiquetas, campos e seleção dos lados de impressão; adicionar regressões e documentar as decisões. Preservar formato JSON/chaves de armazenamento, recuperação, modos legados, dependências e workflow. A funcionalidade é do montador principal; não redesenha o editor nem altera a entrada de planilhas dos modos anteriores.

## Formatos e decisões
- De é opcional; Por é obrigatório. Zero é aceito como valor explícito, mantendo compatibilidade com os novos produtos do catálogo.
- Aceitar inteiros, uma ou duas casas decimais com vírgula, ponto decimal com uma ou duas casas, agrupamento brasileiro de milhares, prefixo opcional R$ e espaços apenas nas extremidades/após a moeda.
- Exemplos: 19; 19,9; 19.90; 1.299,90; R$ 19,99. Um ponto seguido de três dígitos indica milhar: 1.299 = 1299,00. 12,345 é inválido, não é arredondado.
- Rejeitar letras, sinais negativos/positivos, exponenciais, separadores inconsistentes, campos incompletos, mais de duas casas e valores acima de 90.071.992.547.409,91 (limite exato de centavos seguros).
- Calcular centavos inteiros, sem parseFloat ou arredondamento; formatar em pt-BR com duas casas. Formatar o campo válido ao sair dele, preservando o cursor durante a digitação.
- Não impor De maior que Por, descontos mínimos ou preços positivos: essas regras comerciais não foram definidas.
- Rascunhos podem guardar texto incompleto/inválido durante a edição; o JSON de backup continua disponível sem descartar dados. Para reimportar, os preços precisam estar válidos. Não migrar nem substituir valores antigos silenciosamente.

## Critérios de aceitação e evidência
- [x] Parser aceita formatos documentados e representa centavos com precisão: matriz de teste, incluindo o limite exato.
- [x] Rejeita negativos, letras, três casas, valores incompletos e excesso de precisão: matriz de teste.
- [x] Campo inválido possui mensagem e aria-invalid; etiqueta mostra Revisar preço em vez de zero: navegador.
- [x] Rascunho inválido é preservado ao salvar/reabrir e pode ser baixado: testes de modelo e navegador.
- [x] Importação com preços inválidos informa produto/campo e mantém documento atual: modelo e navegador.
- [x] Impressão pelo botão bloqueia lados com erros; frente válida pode imprimir se o verso inválido estiver excluído: navegador.
- [x] Impressão pelo navegador não produz ofertas inválidas: mídia print contém apenas um aviso quando há erros nos lados escolhidos.
- [x] Correção libera impressão; De vazio, zero e Desfazer continuam funcionais: navegador.
- [x] 23 testes passaram; lint sem erros com cinco avisos existentes; TypeScript/build aprovados.
- [x] Cinco cenários no Edge/build local passaram, sem erros JavaScript; aviso, campo e etiqueta revisados visualmente em 1366 × 1000 px.

## Riscos, limites e reversão
Valores antigos incompletos deixam de aparecer como zero e precisam de correção antes de imprimir ou reimportar. O novo parser não apaga o texto. A tela de impressão nativa pode abrir via Ctrl+P, mas o conteúdo inválido é substituído por um aviso, sem folhas de ofertas.
Não houve auditoria completa de preços comerciais, acessibilidade ou impressão física. A mudança não pretende validar moeda de outros países.
Reverter o código mantém os dados/chaves, mas restaura a interpretação permissiva anterior; preservar backups antes da reversão e acompanhar o Pages.
