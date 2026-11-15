# Panfletos — requisitos do produto

Status: baseline do código, sujeita à revisão. Data: 2026-11-15.
Objetivo confirmado: evoluir o editor de panfletos existente.

## Problema e público
O produto permite montar panfletos promocionais frente e verso com blocos, produtos, fotos e preços, e imprimir ou salvar em PDF.
Hipótese de público: responsáveis por materiais promocionais de lojas. Perfil, volume de uso e metas de negócio ainda precisam de confirmação.

## Capacidades atuais a preservar
| ID | Capacidade observada | Critério de regressão |
|---|---|---|
| FR-01 | Alternar frente e verso | Editar um lado não elimina o outro. |
| FR-02 | Inserir, ordenar, duplicar e excluir blocos | Conteúdo acompanha o bloco; operações podem ser desfeitas. |
| FR-03 | Editar foto, marca, nome, preços e complemento | Alterar o produto selecionado preserva os demais. |
| FR-04 | Cinco modelos de etiqueta | Preservar Por apenas, De/Por, D&D compacta, Etiqueta D&D e Leve 1, 2 e 3. |
| FR-05 | Persistência local e projeto JSON | Preservar rascunhos; importação inválida não substitui o documento ativo. |
| FR-06 | Paginação e impressão | Manter 153 × 207 mm e seleção de frente, verso ou ambos. |
| FR-07 | Modos anteriores | Preservar acesso direto a #livre e #avancado. |

São critérios derivados do código, não uma declaração de testes de navegador concluídos.

## Próxima evolução
A terceira melhoria aprovada é validar numericamente De/Por, com avisos na edição, validação de arquivos e bloqueio de impressão dos lados com erros, conforme tasks/AIDF-004.md. De é opcional; Por obrigatório; zero permitido. Relação entre os preços e outras regras comerciais dependem de decisão futura.
A segunda melhoria é validar integralmente a estrutura dos arquivos importados antes de substituir o documento, conforme tasks/AIDF-003.md. Erros mantêm o documento e o histórico intactos; a validação numérica foi acrescentada na AIDF-004.
A primeira melhoria aprovada é a recuperação segura dos rascunhos, descrita em tasks/AIDF-002.md: preservar originais ilegíveis, avisar, permitir download e exigir decisão explícita antes de novas gravações. Outras melhorias ainda precisam de tarefa definida.
Não incluir automaticamente novos serviços, login ou armazenamento remoto.

## Limites atuais
- Nenhum backend próprio foi identificado na árvore inspecionada.
- Rascunhos ficam no navegador; exportação JSON serve como cópia do projeto.
- Saída documentada: RGB, sem sangria ou marcas de corte.

## Decisões pendentes
- Qual melhoria entregar primeiro e qual exemplo comprovará o resultado?
- Quais navegadores, dispositivos e larguras precisam de suporte oficial?
- Quais referências visuais e métricas de sucesso serão adotadas?
