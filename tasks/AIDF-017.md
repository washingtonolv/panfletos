# AIDF-017 — Renderização vetorial em Rust

Pedido: implementar motor de renderização Rust, preservando layouts, fotos, textos e etiquetas.

## Plano e limites
- Rust gera SVG de uma cena vetorial: formas, bordas, recortes, imagens incorporadas e linhas de texto. Sem foreignObject ou serialização de HTML como desenho.
- O navegador mede o layout CSS e as linhas tipográficas existentes; Rust compõe os comandos de desenho. Assim os nove modelos, as cinco etiquetas e a formatação continuam usando suas regras atuais.
- React mantém dados, seleção, fotos, arraste e controles; o desenho vetorial ocupa a folha. O HTML continua como camada semântica/interativa e fallback. Seleção e controles não entram na arte final.
- Rust recebe a cena somente na memória do navegador; fotos e logos são incorporadas. Sem backend, nova chave ou mudança no JSON.
- Preparar a impressão com o mesmo desenho vetorial; fallback HTML quando recursos externos não puderem ser incorporados. Falhas nunca escondem o documento.
- Arquivos: render.rs e ABI WASM, captura da cena/recursos, componente React de superfície, CSS/BlockEditor, testes e docs. Protocolo binário versionado, sem novas crates ou dependências de produção.

## Aceitação e riscos
- Motor rust-svg ativo, com imagens/textos/etiquetas em SVG real. Mesmas posições e dimensões do layout, preços/centavos e estilos editáveis preservados.
- Testar todos os modelos de etiqueta, fotos/logos, cabeçalho/rodapé, imagens contain/cover/ajuste, ambos os formatos, zoom, seleção, arraste, edição e undo/redo.
- Comparar desenho vetorial com a camada DOM nas mesmas condições; conferir impressão e fallback de módulo/recurso indisponível. Testes Rust/WASM/modelo, lint e build aprovados.
- Riscos: CORS de imagens externas, fonte/linha truncada, resultado assíncrono obsoleto e recortes. Incorporar recursos com cache, validar cena, descartar respostas antigas, manter DOM até o SVG carregar e liberar URLs/buffers.

Reversão por commit, sem migração dos documentos. Publicação continua o editor já autorizado na conversa.

## Evidências locais
- Build TypeScript/Vite e WASM aprovados. Rust sem crates externos; WASM ~86 KiB, incluindo paginação.
- 6 testes Rust passaram via WASI no Windows, sem SDK C++; CI executa nativamente no Linux.
- 49 testes Node aprovados: 39 de modelo/arquivos, 5 de paginação Rust (200 documentos, incluindo 10.000 blocos), 5 do compositor SVG.
- Alocação repetida: 150 cenas com recurso de 256 KiB, rejeição de cenas inválidas e renderização posterior. O buffer de entrada usa explicitamente u8.
- Nove modelos importados pela interface com fotos WebP em todos os produtos: folhas de tela e impressão reportaram rust-svg. Formatos 153×207 e 185×270 mm.
- Foto inserida pela interface; nome, preço, Georgia, justificação, espaçamento e enquadramento editados. Logo Fhader incorporado; troca das cinco etiquetas com rust-svg ativo. Arraste via mouse reordenou linha inteira; desfazer/refazer preservou produtos e fotos.
- Cabeçalho e rodapé receberam fotos; contain/cover e remoção via histórico verificados. Mídia print com duas folhas rust-svg e dimensões físicas preservadas.
- SVG baixado e aberto fora do editor: 156 textos vetoriais, 2 recursos incorporados reutilizados em 14 imagens, sem foreignObject. Comparação visual com DOM na mesma página/foto/zoom; recortes, textos, fotos e preços alinhados. Seleção e controles ficaram fora do SVG.
- WASM temporariamente indisponível: paginação TypeScript e dom-fallback mantiveram 13 fotos e texto editado visíveis. Artefato restaurado.
- Revisão React: cleanup de observadores/eventos/URLs, revisão e tickets contra resultados obsoletos, SVG aria-hidden e controles semânticos preservados. Utilitários separados para não adicionar avisos de Fast Refresh.
- Limites conhecidos: layout/fontes medidos pelo navegador e rasterização SVG pelo navegador. Recursos externos sem CORS mantêm HTML. Sem alegação de motor de fontes/GPU independente ou ganho de desempenho.
