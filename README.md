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

O endereço principal abre o montador React: escolha um bloco na biblioteca, arraste os blocos pela alça e clique em um produto para editar foto, marca, nome e preços. Nas linhas e no destaque duplo, a foto fica à esquerda e o nome e a etiqueta à direita, como no panfleto de referência. Cada produto ocupa uma célula com alinhamento automático. O destaque progressivo mantém as fotos acima dos preços coloridos. Os modelos de etiqueta incluem Por apenas, De/Por, D&D compacta, Etiqueta D&D e Leve 1, 2 e 3.

Quando o conteúdo excede a folha de 153 × 207 mm, uma nova página é criada. As setas Subir/Descer também permitem ordenar sem arrastar. Desfazer e Refazer recuperam alterações, inclusive exclusões. Fotos PNG/JPG/WebP são reduzidas para armazenamento local.

O rascunho fica neste navegador. Use **Baixar projeto** para ter uma cópia JSON e **Abrir projeto** para recuperá-la. O editor importa o conteúdo do rascunho anterior, ignorando posições e escalas livres; os originais permanecem nas chaves anteriores. O novo rascunho usa `panfletos:montador:v3`, migrando uma vez os destaques antigos para o preço progressivo colorido. As etiquetas D&D usam cartão vermelho arredondado, faixa branca para o DE, inteiro grande e centavos elevados.

**Imprimir / PDF** imprime frente e verso, ou o lado selecionado nas opções do painel. Na janela de impressão, escolha Salvar como PDF, escala 100%, margens nenhuma e gráficos de fundo. A saída é RGB, sem sangria ou marcas de corte.

As versões anteriores continuam disponíveis nos endereços com `#avancado` (editor anterior e importação de planilha) e `#livre` (editor de elementos livres). Abra o endereço completo com o fragmento para carregá-las.

Validação: `npm run test:model` e `npm run build`. A publicação no GitHub Pages mantém `base: '/panfletos/'` e ocorre automaticamente pelo workflow `pages.yml` na branch `main`.
