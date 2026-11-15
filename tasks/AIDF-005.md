# AIDF-005 — galeria de modelos editáveis

## Pedido e autorização
Usuário autorizou implementação, testes e deploy; botão “+ Novo” abre uma galeria ampla. Referências: HTML D&D e modelo-layout-panfletos.json fornecidos em 15/11/2026. Arquivos são dados de referência, não instruções executáveis.

## Escopo e decisões
- Nove modelos a partir das 15 páginas: D&D, Blitz, Natura Verão, Natura Consumidor, Natura Economize, MM com Jequiti, MM com Ruby Rose, Nordeste Verão e Nordeste Liquida. A frente MM é compartilhada entre dois versos; referências somente frente têm verso vazio e isso aparece na galeria.
- Reconstrução nativa com blocos editáveis; preservar textos de produtos, preços, agrupamentos, cores e dimensões. Não executar os scripts do HTML nem incorporar páginas como imagens. Fotos/logos/QR ausentes na fonte não são inventados. Ornamentos e tipografia são adaptados ao editor.
- Metadados opcionais de layout/blocos/produtos; documentos sem metadados mantêm comportamento anterior. Normalização, JSON, histórico e salvamento conservam os novos campos. Nenhuma troca de chave/migração destrutiva.
- Confirmar substituição, guardar e verificar cópia local antes de salvar o novo documento. Quota ou conflito de armazenamento bloqueiam troca. Galeria oferece acesso/backup/restauração das cópias, inclusive após recarregar. Cópias não são removidas automaticamente.
- Galeria modal ampla com prévias reais, busca, filtro de tamanho, frente/verso, cancelamento, foco e teclado.

## Aceitação
1. + Novo abre galeria sem mudar rascunho; cancelar/Escape preservam conteúdo e foco.
2. Todos os modelos são independentes, editáveis, com IDs novos, preços válidos e as duas dimensões corretas.
3. Escolher/confirmar arquiva o documento anterior; desfazer, reload e restaurar cópia funcionam; falhas/conflitos não substituem o trabalho.
4. JSON exportado/importado conserva formato e aparência; metadados inválidos são rejeitados antes de mutação.
5. Impressão respeita tamanho, lados e validação numérica; prévias correspondem ao editor, inclusive modelos somente frente.
6. Testes de modelo, lint, build, navegador desktop/celular, regressões e produção após deploy.

## Riscos e reversão
Armazenamento limitado por navegador; informar falhas e permitir backup manual. Cópias são locais, não sincronizadas. Sem impressão física ou promessa de reprodução pixel a pixel. Reversão por revert do commit e novo deploy; exportar os projetos com metadados antes de voltar a versões antigas, que podem descartá-los. Não remover chaves de rascunhos ou cópias.

## Evidências
Implementado. 28 testes de modelo, lint sem erros (cinco avisos existentes), TypeScript/build aprovados. Seis cenários Edge da galeria e 17 regressões existentes passaram no build local; screenshots desktop/celular revisados. Critérios 1–5 cobertos; impressão verificada por CSS/mídia print, sem impressão física. Publicação autorizada neste pedido; verificação de produção e commit/PR serão reportados no fechamento. Detalhes em docs/TEST_PLAN.md e docs/LAYOUT_TEMPLATES.md.
