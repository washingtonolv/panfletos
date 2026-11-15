# Modelos editáveis — AIDF-005

## Origem
Arquivos fornecidos pelo usuário em 15/11/2026:
- modelo-layout-panfletos.json; SHA-256 `2abdab32728bd69ca66900c85d2833993e5d11f09718c2a238eb75eaeb6702df`.
- Modelo de layout — Panfleto D&D 15,3x20,7 (frente e verso) (1).html; SHA-256 `77adbf0552ed1e86bda845ca2cadfea05b1e3c55e74035b6fa1316395805df92`.

JSON forneceu produtos, preços, grupos e cores. HTML foi desempacotado como dados, sem executar os scripts, para consultar hierarquia, dimensões, orientação dos grupos e o destaque FHADER. A aplicação contém somente dados convertidos em src/layout-templates.json e componentes React. Nenhuma fonte, script, iframe, endereço de arquivo local ou HTML executável da referência é publicado.

## Catálogo
| Modelo | Fontes | Produtos frente/verso | Formato (mm) |
|---|---|---|---|
| D&D Aniversário | Main / Verso | 13 / 12 | 153 × 207 |
| Blitz | Blitz / BlitzVerso | 15 / 17 | 185 × 270 |
| Natura Tododia Verão | NaturaVeraoFrente / NaturaVeraoVerso | 12 / 15 | 185 × 270 |
| Natura Mês do Consumidor | NaturaConsumidorFrente / NaturaConsumidorVerso | 15 / 12 | 185 × 270 |
| Natura Economize | NaturaEconomizeFrente | 14 / 0 | 185 × 270 |
| MM Consumidor + Jequiti | MMConsumidorFrente / MMJequitiVerso | 11 / 18 | 185 × 270 |
| MM Consumidor + Ruby Rose | MMConsumidorFrente / MMRubyRoseVerso | 11 / 21 | 185 × 270 |
| Nordeste Verão | NordesteVeraoFrente / NordesteVeraoVerso | 12 / 16 | 153 × 207 |
| Nordeste Liquida | NordesteLiquida | 13 / 0 | 153 × 207 |

Fontes correspondem aos arquivos .dc.html identificados no JSON. A frente MM é compartilhada; isso utiliza todas as 15 páginas sem inventar versos ausentes. Não há fotografias reais no material: o editor permite enviar as fotos. Cabeçalhos/ornamentos/tipografia foram adaptados aos componentes existentes, sem promessa de reprodução pixel a pixel. Contatos, validade e condições são campos a preencher, evitando publicar dados comerciais desatualizados do exemplo.

## Dados e compatibilidade
- Document.layout opcional: format (153x207 ou 185x270), name, accent, priceColor, background.
- Block.appearance opcional: minHeight entre 60 e 300 px e vertical booleano.
- Product.badgeColor e label opcionais: cor hexadecimal e chamada promocional.
- Arquivos importados validam esses campos antes de normalizar. O histórico e os rascunhos preservam os metadados. Documentos antigos sem layout continuam no formato anterior.
- createFromTemplate clona o catálogo e gera IDs novos para blocos/campos. Edições nunca alteram o catálogo.
- Paginação usa a altura do formato; CSS @page e folhas imprimíveis recebem dimensões físicas correspondentes. Lados vazios não geram páginas extras na impressão.

## Rascunhos guardados
replaceDraft verifica que o armazenamento ainda corresponde à última gravação desta sessão, grava uma cópia sob panfletos:saved:<UUID>, relê e compara a cópia, verifica novamente o rascunho ativo e só então grava o próximo documento. Falhas impedem o commit no editor. Escrita de localStorage é atômica; falha de quota na gravação ativa mantém o valor anterior. Uma cópia concluída antes dessa falha pode continuar na biblioteca, sem remoção automática.

Cópias têm version: 1, nome, data e documento. Restauração guarda primeiro o trabalho atual e suporta rascunhos com preços ainda inválidos. Cópias ilegíveis são contabilizadas e preservadas. Não há exclusão automática, servidor ou sincronização. A checagem detecta conflitos observados na troca; não implementa edição colaborativa nem sincronização geral entre abas. Backups externos continuam recomendados.

## Testes reproduzíveis
`npm run test:model`, `npm run lint`, `npm run build`.

scripts/gallery.browser.mjs contém seis cenários de navegador. Requer Playwright disponível, Edge instalado (ou BROWSER_CHANNEL) e um build servido. GALLERY_TEST_URL define o alvo (padrão http://127.0.0.1:4176/panfletos/); PLAYWRIGHT_MODULE pode apontar para um módulo Playwright existente; GALLERY_SCREENSHOT_DIR opcional habilita screenshots. Não modifica perfis reais: cada cenário usa um contexto isolado. Executar com `node scripts/gallery.browser.mjs` após configurar essas variáveis. Dependências de produção e lockfile não foram alterados.
