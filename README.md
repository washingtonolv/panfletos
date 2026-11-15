# Panfletos

## Desenvolvimento com AIDF 1.0

O projeto usa o AIDF para orientar a evolução do editor existente. Comece por [AGENTS.md](AGENTS.md) e pelo [contexto inicial](docs/AIDF_BASELINE.md).

- [Requisitos](docs/PRD.md), [arquitetura](docs/ARCHITECTURE.md), [contrato visual](docs/DESIGN_SYSTEM.md) e [fluxos](docs/USER_FLOWS.md).
- [Plano e evidências de verificação](docs/TEST_PLAN.md).
- Use `templates/EXISTING_PROJECT.md` e `templates/TASK.md` para especificar a próxima melhoria; os prompts de planejamento, implementação, revisão e correção ficam em `prompts/`.
- Os guias em `integrations/` são opcionais; não indicam serviços configurados.
- Alterações na `main` publicam automaticamente no GitHub Pages. Prepare mudanças em branch e PR; não faça merge sem autorização para publicar.

O próximo recurso ainda será definido. A adoção do AIDF não altera o funcionamento do editor.

Editor de panfletos 153 × 207 mm (frente e verso). Elementos em milímetros, mover/redimensionar com react-moveable, desfazer/refazer com Zustand + Immer.

```
npm install
npm run dev
```

## Montador visual

**Preços:** informe valores não negativos com até duas casas, como `19`, `19,90`, `19.90` ou `1.299,90`. O campo **De** é opcional; **Por** é obrigatório e aceita zero. Ao sair do campo válido, o valor ganha formatação brasileira. Letras, negativos, casas excedentes e valores incompletos são sinalizados, sem apagar o texto do rascunho. Use **Revisar preços** para localizar pendências. A importação rejeita preços inválidos; a impressão dos lados afetados fica bloqueada até corrigir. Baixar projeto continua disponível para preservar o trabalho incompleto.

**Abrir projeto** valida o arquivo inteiro antes de substituir o documento. Se houver erro, a mensagem indica o motivo e o bloco/campo, mantendo o trabalho atual e o histórico. São aceitos projetos de até 50 MiB, com frente e verso, identificadores únicos, campos consistentes e de um a cinco produtos por bloco de produtos. Arquivos válidos continuam podendo ser desfeitos/refeitos após a importação. Se você editar enquanto o arquivo estiver sendo lido, será necessário abri-lo novamente para substituir o documento.

Se o rascunho não puder ser aberto, o editor bloqueia o salvamento e mostra as opções de recuperação. Use **Baixar original** para guardar o conteúdo sem alterações. Você pode tentar novamente, usar uma versão anterior encontrada ou confirmar o início de um novo documento com o modelo inicial. Antes de liberar o salvamento, o editor guarda e verifica uma cópia local dos originais que falharam. Se faltar espaço para essa cópia, os originais continuam protegidos; libere espaço e tente novamente. A recuperação não repara automaticamente arquivos inválidos.

O endereço principal abre o montador React: escolha um bloco na biblioteca, arraste os blocos pela alça e clique em um produto para editar foto, marca, nome e preços. Nas linhas e no destaque duplo, a foto fica à esquerda e o nome e a etiqueta à direita, como no panfleto de referência. Cada produto ocupa uma célula com alinhamento automático. O destaque progressivo mantém as fotos acima dos preços coloridos. Os modelos de etiqueta incluem Por apenas, De/Por, D&D compacta, Etiqueta D&D e Leve 1, 2 e 3.

Quando o conteúdo excede a folha de 153 × 207 mm, uma nova página é criada. As setas Subir/Descer também permitem ordenar sem arrastar. Desfazer e Refazer recuperam alterações, inclusive exclusões. Fotos PNG/JPG/WebP são reduzidas para armazenamento local.

O rascunho fica neste navegador. Use **Baixar projeto** para ter uma cópia JSON e **Abrir projeto** para recuperá-la. O editor importa o conteúdo do rascunho anterior, ignorando posições e escalas livres; os originais permanecem nas chaves anteriores. O novo rascunho usa `panfletos:montador:v3`, migrando uma vez os destaques antigos para o preço progressivo colorido. As etiquetas D&D usam cartão vermelho arredondado, faixa branca para o DE, inteiro grande e centavos elevados.

**Imprimir / PDF** imprime frente e verso, ou o lado selecionado nas opções do painel. Na janela de impressão, escolha Salvar como PDF, escala 100%, margens nenhuma e gráficos de fundo. A saída é RGB, sem sangria ou marcas de corte.

As versões anteriores continuam disponíveis nos endereços com `#avancado` (editor anterior e importação de planilha) e `#livre` (editor de elementos livres). Abra o endereço completo com o fragmento para carregá-las.

Validação: `npm run test:model` e `npm run build`. A publicação no GitHub Pages mantém `base: '/panfletos/'` e ocorre automaticamente pelo workflow `pages.yml` na branch `main`.
