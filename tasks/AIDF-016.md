# AIDF-016 — Motor de layout em Rust/WebAssembly

Pedido: utilizar Rust no editor existente. Premissa: integrar Rust aos cálculos de montagem no navegador, mantendo React/TypeScript para a interface e GitHub Pages como hospedagem. Não reescrever a interface nem adicionar servidor.

## Escopo e plano
1. Crate Rust sem dependências externas, com a mesma regra de altura mínima e paginação já usada pelo modelo. ABI pequena para WebAssembly, testes Rust e controle explícito de memória.
2. Ponte TypeScript com validação da ABI e inicialização antes do montador. Se o arquivo não carregar ou o navegador não suportar WebAssembly, usar as regras atuais em TypeScript; nunca alterar dados.
3. Build automático do módulo WASM pelo Cargo, integrado a dev/build e ao GitHub Actions. Manter base /panfletos/ e modos #livre/#avancado.
4. Comparar resultados dos dois motores em modelos reais, limites, grandes documentos e casos gerados; conferir navegador, impressão e fallback.

Arquivos: rust/layout-engine, rust-toolchain.toml, scripts/build-rust.mjs, ponte/carregador TypeScript, block-model/main/BlockEditor, scripts de teste, package.json, workflow e documentação.

## Aceitação e riscos
- O editor publicado efetivamente executa o WASM compilado de Rust.
- Mesmas alturas, quantidade/ordem de páginas e identidade dos blocos em todos os casos comparados. Fotos, tipografia, etiquetas, JSON, rascunhos e impressão preservados.
- Rust não recebe conteúdo pessoal: só alturas, quantidades e indicadores de layout, no próprio navegador. Nenhum backend ou migração.
- Falha de download/ABI/WASM preserva o editor via fallback, com limite de espera no carregamento.
- Riscos: asset ausente sob /panfletos/, memória da ponte e divergência numérica. Mitigar com build obrigatório, parity tests, limites e finally para liberar buffers.
- Instalação local do compilador isolada em work/rust-tools, sem mudar o PATH global. Rust 1.100.0 fixado para builds reproduzíveis.

Reversão: reverter o commit; o formato de documento permanece igual. Publicação continua o trabalho já autorizado no editor.

## Evidências
- Build Rust/TypeScript/Vite aprovado; WASM real com 18.008 bytes e asset com hash sob /panfletos/. Cargo.lock e toolchain fixados, sem dependências Rust externas.
- 39 testes de modelo e cinco testes de integração WASM/Node aprovados. Comparação exata em 200 documentos: todos os nove modelos/frente e verso, casos gerados, limites exatos, alturas fracionárias e documento de 10.000 blocos. Identidade e JSON dos blocos preservados. Repetição, entrada rejeitada, ABI inválida, ambiente sem WebAssembly e fallback verificados.
- Quatro testes Rust passaram pelo target wasm32-wasip1 executado no Node/WASI local. cargo test nativo Windows não executou por falta de link.exe; o pipeline usa Linux para esse comando. Não foi instalado Visual Studio/SDK global.
- Navegador local: engine rust-wasm ativo; editar nome/preço/fonte; seis blocos da frente em duas páginas e cabeçalho no verso em uma. Impressão emulada com três folhas, interface oculta, largura física correta e tipografia preservada.
- Falha de carregamento simulada retirando temporariamente o asset apenas do build local: engine typescript, documento/páginas/nome/Verdana preservados, inserção/undo funcionais. Asset restaurado e reload voltou a Rust. Sem erros JavaScript observados após restauração.
- Lint aprovado sem erros e com cinco avisos já existentes. Nenhum teste de impressão física ou alegação de aceleração.
- Publicação segue a autorização anterior para atualizar o editor. Reversão não exige converter documentos.
