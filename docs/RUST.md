# Rust no montador

O motor de altura mínima e paginação roda em Rust compilado para WebAssembly. A interface continua em React/TypeScript. Não há servidor Rust nem migração dos projetos: JSON, fotos, tipografia e rascunhos continuam com o mesmo formato.

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
npm run lint
```

`cargo test` exige o linker nativo da plataforma (no Windows/MSVC, Visual Studio Build Tools com C++). A compilação WASM usa o linker incluído no Rust e funciona sem instalar esse SDK. O workflow executa os testes nativos no Linux, além dos testes do WASM real no Node.

## Arquitetura

- `rust/layout-engine/src/lib.rs`: alturas e limites de página idênticos às regras anteriores. Não recebe nomes, preços, fotos ou textos: somente números e indicadores de layout.
- `src/layout-engine.ts`: valida ABI 1, gerencia buffers `f64`, copia os índices das páginas e libera cada alocação em `finally`. Os índices são validados antes de reconstruir páginas com os objetos originais.
- `src/layout-engine-loader.ts`: carrega o arquivo do próprio site antes do montador; timeout de 5 segundos para download. Carregamento por bytes dispensa exigência de MIME específica.
- `src/block-model.ts`: usa Rust quando disponível e preserva as regras TypeScript como fallback. Impressão e galeria compartilham esse modelo. Os modos legados não carregam o WASM.
- `data-layout-engine` na raiz `.builder-app` permite verificar `rust-wasm` ou `typescript` nas ferramentas do navegador, sem poluir a interface.

O limite da ponte é 250.000 blocos por lote. Lotes maiores seguem pela implementação TypeScript. Erro de download, navegador sem WebAssembly, ABI inválida ou falha de execução mantém o editor disponível no fallback. Nenhum erro de carregamento autoriza alterar ou descartar um rascunho.

## Verificação e reversão

Os testes comparam as mesmas instâncias de blocos antes/depois de ativar o WASM: nove modelos, frente/verso, alturas fracionárias, limites exatos, blocos maiores que a página, documentos gerados e 10.000 blocos. Também verificam repetição, ABI inválida e recuperação após resultado rejeitado. Evidências em `tasks/AIDF-016.md`.

Reverter o commit restaura o motor anterior, sem converter arquivos. Não há alegação de ganho de desempenho: a integração foi feita para utilizar Rust preservando o comportamento existente.

Referência: [target Rust para WebAssembly](https://doc.rust-lang.org/rustc/platform-support/wasm32-unknown-unknown.html).
