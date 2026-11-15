# Panfletos

Editor de panfletos 153 × 207 mm (frente e verso). Elementos em milímetros, mover/redimensionar com react-moveable, desfazer/refazer com Zustand + Immer.

```
npm install
npm run dev
```

## Montador visual

O endereço principal abre o montador React: escolha um bloco na biblioteca, arraste os blocos pela alça e clique em um produto para editar foto, marca, nome e preços. As etiquetas e as fotos ficam dentro de células, sem posições livres. Há quatro etiquetas editáveis baseadas nas referências: Por apenas, De/Por, compacta e larga.

Quando o conteúdo excede a folha de 153 × 207 mm, uma nova página é criada. As setas Subir/Descer também permitem ordenar sem arrastar. Desfazer e Refazer recuperam alterações, inclusive exclusões. Fotos PNG/JPG/WebP são reduzidas para armazenamento local.

O rascunho fica neste navegador. Use **Baixar projeto** para ter uma cópia JSON e **Abrir projeto** para recuperá-la. O novo editor importa o conteúdo do rascunho anterior, ignorando posições e escalas livres; o original permanece na chave `panfletos:v1`. O novo rascunho usa `panfletos:montador:v2`.

**Imprimir / PDF** imprime frente e verso, ou o lado selecionado nas opções do painel. Na janela de impressão, escolha Salvar como PDF, escala 100%, margens nenhuma e gráficos de fundo. A saída é RGB, sem sangria ou marcas de corte.

As versões anteriores continuam disponíveis nos endereços com `#avancado` (editor anterior e importação de planilha) e `#livre` (editor de elementos livres). Abra o endereço completo com o fragmento para carregá-las.

Validação: `npm run test:model` e `npm run build`. A publicação no GitHub Pages mantém `base: '/panfletos/'` e ocorre automaticamente pelo workflow `pages.yml` na branch `main`.
