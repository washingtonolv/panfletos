# Fluxos atuais — Panfletos

Derivados do README e do código; revisão no navegador pendente.

Fluxo AIDF-005 verificado: + Novo → buscar/filtrar → Ver modelo → conferir frente/verso → Usar este modelo → confirmar → guardar cópia e abrir no editor. Cancelar/Escape não alteram o projeto. + Novo → Rascunhos guardados permite baixar ou restaurar; restaurar guarda o trabalho ativo antes de substituir. Quota e conflito de outra aba bloqueiam a troca.

Fluxos AIDF-006: clicar na foto → escolher arquivo → editar/remover no painel. Cabeçalho/rodapé → Adicionar imagem → ajustar entre inteira/preencher → remover para recuperar textos. Arrastar arquivos sobre produtos/cabeçalhos/rodapés ou painel também funciona. Cancelamentos/falhas preservam o conteúdo; resultados de uploads com alvo alterado são descartados.

Navegação: Selecionar/V para editar, Mão/H para arrastar a visualização, Espaço temporário, Ctrl/Cmd+rolagem para zoom no cursor. Barra flutuante inclui histórico e porcentagem. Atalhos de histórico respeitam digitação nativa e galeria; visualização não entra no histórico do documento nem muda a impressão.

| ID | Passos | Resultado esperado | Regressões |
|---|---|---|---|
| UF-01 | Abrir a URL principal | Carregar rascunho ou documento inicial | v3, migração v2/v1, registro ilegível, armazenamento indisponível. |
| UF-02 | Escolher lado; inserir e ordenar blocos por arraste ou Subir/Descer | Ordem escolhida e paginação automática | Início/fim, conteúdo preservado, muitas páginas. |
| UF-03 | Selecionar produto; editar texto, preços e foto | Atualizar o produto selecionado | Texto longo, cinco produtos, imagem inválida, seleção durante upload. |
| UF-04 | Escolher etiqueta; aplicar ao produto ou bloco | Alterar somente o escopo escolhido | Cinco modelos, milhares, complemento longo. |
| UF-05 | Duplicar/excluir/editar; Desfazer/Refazer | Recuperar o documento | Frente/verso, exclusão, nova edição após desfazer. |
| UF-06 | Baixar projeto; Abrir projeto JSON | Recuperar conteúdo válido | JSON inválido preserva documento; importação pode ser desfeita. |
| UF-07 | Selecionar ambos/frente/verso; Imprimir/PDF | Imprimir somente os lados escolhidos | Escala 100%, sem margens, gráficos de fundo, várias páginas. |
| UF-08 | Abrir URL completa com #livre ou #avancado | Carregar o modo legado | Preservar importação de planilha e modelos de dados próprios. |

Não há fluxo de login no estado inspecionado. Persistência local não equivale a sincronização entre dispositivos. Novos fluxos e regras precisam de tarefa definida.
