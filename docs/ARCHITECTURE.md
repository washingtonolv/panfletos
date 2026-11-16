# Arquitetura — Panfletos

Baseline: 80c11f2d5a25d2fa57a6b1df7a654eac2c38a47c.

## Tecnologias observadas
O montador agora usa um motor Rust 1.100.0 compilado para WebAssembly nos cálculos de altura e paginação. React/TypeScript continuam responsáveis pela interface e pelos objetos do documento. Cargo compila o WASM antes de Vite; o GitHub Actions executa testes Rust, modelo e paridade WASM antes do deploy. A ponte possui fallback para as regras TypeScript existentes. Não há servidor, novo formato de dados ou chave de armazenamento. Detalhes em [RUST.md](RUST.md).

React + TypeScript + Vite; módulos ES; package-lock.json para instalação reproduzível com npm ci.
Faixas declaradas no package.json: React/React DOM ^19.3.1, Vite ^8.3.6, TypeScript ~7.0.2, Zustand ^5.1.0, Immer ^11.2.10, react-moveable ^0.56.0, morphdom ^2.7.8 e xlsx ^0.18.5.
Essas faixas não equivalem a versões instaladas. O workflow usa Node 22; o teste local desta adoção usou Node 24.22.1.

## Responsabilidades
| Arquivo | Responsabilidade |
|---|---|
| src/main.tsx | Seleciona montador, modo livre ou avançado pelo fragmento da URL. |
| src/BlockEditor.tsx | Interface principal, seleção, edição, histórico, fotos, JSON e impressão. |
| src/block-model.ts | Tipos, catálogo, normalização, migração, preços, ordenação e paginação. |
| src/block-seed.json | Conteúdo inicial do montador. |
| src/block-editor.css | Layout, etiquetas, adaptação de tela e impressão. |
| src/App.tsx e src/store.ts | Editor livre legado e estado com Zustand/Immer. |
| src/dc/runtime.ts e src/dc/Main32.dc.html | Modo avançado legado. |
| scripts/block-model.test.mjs | Seis testes do modelo na baseline. |

## Dados e persistência
AIDF-015 acrescenta `Product.textStyles` (name/brand/label) e `Block.fields[].style` opcionais. `text-style.ts` valida fontes permitidas, limites numéricos, alinhamentos e cor, e converte espaçamento em px para o CSS. Normalização, importação, histórico, rascunho, prévias e impressão preservam esses campos. TextProperties oferece formatação por alvo com restauração; BrandMark aplica a fonte apenas à marca textual. Sem nova chave de armazenamento ou migração obrigatória. A ausência dos campos conserva o CSS original do modelo.

Na AIDF-008, Product.brandLogo guarda um identificador de arquivo opcional. brand-logos.ts enumera assets em src/assets/brand-logos via Vite glob e resolve URLs com base de publicação. BrandLogoPicker oferece busca/seleção/remoção; BrandMark renderiza imagem contida na linha da marca, com fallback textual para arquivo ausente ou erro de rede. Marca textual permanece intacta (só recebe o nome da logo quando estava vazia). Identificadores importados não aceitam caminhos/URLs; logos desconhecidas válidas sobrevivem ao round trip. Sem novas chaves ou migração. Assets importados da pasta local fornecida pelo usuário: 50 imagens da seção de marcas revendidas sem arquivos antigos/acervo, seis variações D&D atuais e duas Franquia Natura atuais. Fontes, documentos, fotos de produtos e material antigo não entram na biblioteca.
Na AIDF-006, Block.image e Block.imageFit opcionais armazenam a arte de cabeçalhos/rodapés sem apagar fields. A importação valida a URL com as mesmas regras das fotos e aceita apenas contain/cover nos tipos de bloco apropriados. editor-images.ts captura o bloco alvo e recusa aplicar resultados quando o bloco mudou durante a leitura (incluindo deslocamento dos índices dos produtos). BlockEditor usa sequência por alvo e época de documento para descartar uploads atrasados após remoção, undo/redo, importação ou troca de modelo. Arquivos de até 20 MiB são decodificados e reduzidos para WebP: 900 px produtos, 1800 px cabeçalhos/rodapés.

CanvasViewport.tsx gerencia mão/seleção, captura de ponteiro, rolagem e atalhos. Ctrl/Cmd+wheel usa listener não passivo no canvas e compensação de scroll após o layout para manter a âncora do cursor; padding lateral garante espaço de navegação. Zoom fica em estado de interface, sem modificar modelo ou folhas de impressão. Inputs/contenteditable e galeria aberta não recebem atalhos globais.

Modelos em src/layout-templates.json são validados por src/layout-templates.ts e clonados com novos IDs. TemplateGallery.tsx contém galeria modal/busca/filtro/prévias e biblioteca local. layout-settings.ts define os dois tamanhos e valida metadados opcionais. draft-library.ts arquiva e verifica o documento anterior antes da troca; localStorage panfletos:saved:<UUID> usa registros versionados, sem exclusão ou migração das chaves existentes. Consulte LAYOUT_TEMPLATES.md.
src/prices.ts fornece parsePrice e priceIssues, compartilhados entre importação e montador. Centavos são montados com BigInt e limitados ao inteiro seguro antes de conversão para number; não se usa ponto flutuante para interpretar dinheiro. Dados de rascunhos não passam por migração numérica: texto inválido permanece editável, sinalizado e excluído das ofertas imprimíveis. O campo válido é formatado ao perder foco; a impressão valida apenas os lados escolhidos.

Importação de arquivos passa por parseProject/validateProject em src/project-import.ts antes de qualquer commit no editor. Essa etapa valida estrutura, tipos, ids, produtos, campos, etiquetas e sintaxe das fotos; somente então chama normalize. A leitura de rascunhos mantém o fluxo anterior para compatibilidade de migração. Arquivos acima de 50 MiB são rejeitados antes da leitura. O editor também descarta respostas de seleções antigas e recusa substituir um documento alterado durante a leitura.

loadDraft retorna documento, origem, falhas com conteúdo original e permissão de salvamento. saveDraft recusa gravação enquanto houver falha não resolvida. resolveDraftRecovery verifica que o original não mudou, grava e relê uma cópia em panfletos:recovery:<UUID> antes de liberar a decisão explícita de usar a versão anterior ou o modelo inicial. O download dos originais não depende de conseguir gravar a cópia local. Chaves e formatos dos documentos existentes permanecem iguais.

O documento principal contém frente e verso, com blocos e produtos. Estado e histórico do montador ficam em React; não presumir que o montador usa o store legado.
O rascunho usa panfletos:montador:v3. A inicialização também tenta ler panfletos:montador:v2 e panfletos:v1; registros antigos são preservados.
Projetos são importados/exportados em JSON. Fotos PNG/JPEG/WebP enviadas ao montador são limitadas a 900 px no maior lado e convertidas em WebP.

## Serviços e publicação
Nenhum backend próprio, autenticação ou banco remoto foi identificado na árvore inspecionada; isso não é auditoria de segurança completa.
vite.config.ts usa base /panfletos/. O workflow .github/workflows/pages.yml instala, testa, compila e publica após push na main, além de aceitar execução manual.
Preparar alterações em branch e PR. Merge ou push na main exige autorização explícita para publicar a aplicação.

## Riscos e reversão
Persistência/migração, paginação, etiquetas estreitas e impressão exigem regressões relevantes. Preservar cópias JSON antes de testar migrações: reverter código não recupera dados automaticamente.
