# Rust no montador

O motor de altura mínima, paginação e composição vetorial roda em Rust compilado para WebAssembly. Rust gera SVG das folhas com textos, formas, recortes, fotos e logos incorporadas. A interface continua em React/TypeScript. Não há servidor Rust nem migração dos projetos: JSON, fotos, tipografia e rascunhos continuam com o mesmo formato.

## Desenvolvimento

Instale [Rust pelo rustup](https://rust-lang.org/tools/install/). `rust-toolchain.toml` fixa Rust 1.100.0, perfil minimal e target `wasm32-unknown-unknown`. O compilador/target são necessários na máquina de desenvolvimento e no CI; usuários do site não instalam nada.

```sh
npm ci
npm run build:rust
npm run dev
```

`dev` e `build` compilam o Rust automaticamente. Após editar o crate com o servidor já aberto, execute `npm run build:rust` e recarregue o navegador. A compilação usa Cargo sem crates externos. O arquivo gerado `src/generated/layout_engine.wasm` e `rust/layout-engine/target` não são versionados. Vite publica o WASM com hash sob a base `/panfletos/`.

```sh
cargo test --manifest-path rust/layout-engine/Cargo.toml --locked
npm run test:model
npm run build
npm run test:rust
npm run test:renderer
npm run lint
```

`cargo test` exige o linker nativo da plataforma (no Windows/MSVC, Visual Studio Build Tools com C++). A compilação WASM usa o linker incluído no Rust e funciona sem instalar esse SDK. O workflow executa os testes nativos no Linux, além dos testes do WASM real no Node.

## Arquitetura

- `rust/layout-engine/src/lib.rs`: alturas e limites de página idênticos às regras anteriores. O caminho de paginação recebe somente números e indicadores de layout.
- `src/layout-engine.ts`: valida ABI 1, gerencia buffers `f64`, copia os índices das páginas e libera cada alocação em `finally`. Os índices são validados antes de reconstruir páginas com os objetos originais.
- `src/layout-engine-loader.ts`: carrega o arquivo do próprio site antes do montador; timeout de 5 segundos para download. Carregamento por bytes dispensa exigência de MIME específica.
- `src/block-model.ts`: usa Rust quando disponível e preserva as regras TypeScript como fallback. Impressão e galeria compartilham esse modelo. Os modos legados não carregam o WASM.
- `data-layout-engine` na raiz `.builder-app` permite verificar `rust-wasm` ou `typescript` nas ferramentas do navegador, sem poluir a interface.

O limite da ponte é 250.000 blocos por lote. Lotes maiores seguem pela implementação TypeScript. Erro de download, navegador sem WebAssembly, ABI inválida ou falha de execução mantém o editor disponível no fallback. Nenhum erro de carregamento autoriza alterar ou descartar um rascunho.

## Renderização das folhas

- `rust/layout-engine/src/render.rs` recebe comandos pelo protocolo binário RSVG 1 e compõe SVG real (`text`, `rect`, `path`, `ellipse`, `image`, `use` e `clipPath`). Sem `foreignObject`, HTML serializado ou bitmap da página.
- `src/capture-render-scene.ts` mede o CSS existente, as linhas de texto e o enquadramento das fotos. O navegador continua responsável pela composição tipográfica e pela rasterização do SVG. Este é um compositor vetorial Rust, sem implementação própria de fontes/GPU.
- Fotos e logos do site são incorporadas em base64 uma vez por recurso na folha. Imagens HTTP externas dependem de CORS; se não puderem ser incorporadas, a folha mantém o desenho HTML. Não há envio de fotos para servidor.
- `src/render-scene.ts` codifica o protocolo. Rust valida limites, números, recursos, XML e pilha de recortes. Limites: 64 MiB de entrada, 128 MiB de saída, 20.000 comandos e 2.000 recursos por folha; excedê-los mantém o desenho HTML.
- `src/layout-engine.ts` gerencia entrada/saída e ABI independente `renderer_version = 1`, liberando cada alocação. Falha na composição não desativa a paginação válida.
- `src/RustRenderSurface.tsx` mantém o HTML como camada semântica e interativa. O SVG assume o desenho depois de carregar; seleção, foco, botões e arraste ficam fora da arte. Revisões/tickets descartam resultados antigos após edição, zoom, histórico ou troca de documento. Observadores, buffers e URLs são liberados.
- `src/render-output.ts` prepara impressão e exporta a página mais visível. **Arquivo → Exportar página visível (SVG)** baixa o mesmo desenho, sem controles. JSON continua como arquivo editável. As fontes referenciam fontes do sistema, sem conversão em curvas.
- `.flyer-sheet[data-render-engine]` informa `rust-svg`, `dom-pending` ou `dom-fallback`. `?renderer=dom` permite comparação visual com o desenho anterior sem mudar o documento. Galeria e modos legados mantêm as superfícies anteriores.
- Folhas de impressão são preparadas fora da tela nas dimensões físicas exatas. A impressão continua disponível com HTML se o vetor falhar.

## Verificação e reversão

Os testes comparam as mesmas instâncias de blocos antes/depois de ativar o WASM: nove modelos, frente/verso, alturas fracionárias, limites exatos, blocos maiores que a página, documentos gerados e 10.000 blocos. Também verificam repetição, ABI inválida e recuperação após resultado rejeitado. Testes adicionais cobrem primitivas vetoriais, Unicode/XML, fotos, recortes, entradas truncadas e 150 renderizações repetidas com imagens. Evidências em `tasks/AIDF-016.md` e `tasks/AIDF-017.md`.

Reverter o commit restaura o motor anterior, sem converter arquivos. Não há alegação de ganho de desempenho: a integração foi feita para utilizar Rust preservando o comportamento existente.

Referência: [target Rust para WebAssembly](https://doc.rust-lang.org/rustc/platform-support/wasm32-unknown-unknown.html).
