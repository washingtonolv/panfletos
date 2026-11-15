import seed from './block-seed.json' with { type: 'json' }
import { parsePrice } from './prices.ts'
import { readLayout, readAppearance, isColor } from './layout-settings.ts'
import type { Layout, Appearance } from './layout-settings.ts'

export type Tag = 'offer' | 'before' | 'pill' | 'wide' | 'progressive'
export type Product = { brand: string; name: string; de: string; por: string; cada: string; photo?: string; tag?: Tag; badgeColor?: string; label?: string }
export type Block = { id: string; kind: string; name: string; h: number; cols?: number; fields?: { key: string; label: string; value: string }[]; products?: Product[]; appearance?: Appearance; image?: string; imageFit?: 'contain' | 'cover' }
export type Document = { frente: Block[]; verso: Block[]; layout?: Layout }
export type Side = 'frente' | 'verso'
export const STORAGE = 'panfletos:montador:v3'
export const tags: { id: Tag; name: string }[] = [
  { id: 'offer', name: 'Por apenas' }, { id: 'before', name: 'De / Por' },
  { id: 'pill', name: 'D&D compacta' }, { id: 'wide', name: 'Etiqueta D&D' },
  { id: 'progressive', name: 'Leve 1, 2 e 3' },
]
export function priceParts(value: string) {
  const result = parsePrice(value)
  if (!result.ok) return { integer: '—', cents: '' }
  const [integer, cents] = result.normalized.split(',')
  return { integer, cents }
}
export const catalog = [
  { kind: 'header', name: 'Cabeçalho da campanha', cols: 0 },
  { kind: 'hero3', name: 'Destaque · Leve 1, 2 e 3', cols: 3 },
  { kind: 'hero2', name: 'Destaque duplo', cols: 2 },
  ...[2, 3, 4, 5].map(cols => ({ kind: 'row', name: `Linha · ${cols} produtos`, cols })),
  { kind: 'footsite', name: 'Rodapé · site e redes', cols: 0 },
  { kind: 'footpay', name: 'Rodapé · pagamento', cols: 0 },
]
export const uid = () => crypto.randomUUID()
export const blankProduct = (): Product => ({ brand: '', name: 'Nome do produto', de: '', por: '0,00', cada: '', tag: 'wide' })

export function normalize(value: unknown, upgradeHero = false): Document {
  if (!value || typeof value !== 'object') throw new Error('Documento inválido')
  const input = value as Record<string, unknown>
  const side = (key: Side): Block[] => {
    if (!Array.isArray(input[key])) throw new Error('Documento sem frente ou verso')
    return (input[key] as Block[]).map(b => {
      if (!b || !catalog.some(c => c.kind === b.kind)) throw new Error('Bloco inválido')
      const products = b.products?.map(p => ({
        brand: String(p.brand ?? ''), name: String(p.name ?? ''), de: String(p.de ?? ''),
        por: String(p.por ?? ''), cada: String(p.cada ?? ''),
        ...(p.badgeColor !== undefined ? { badgeColor: isColor(p.badgeColor) ? p.badgeColor : undefined } : {}),
        ...(typeof p.label === 'string' ? { label: p.label } : {}),
        photo: typeof p.photo === 'string' && /^(data:image\/(png|jpeg|webp);base64,|https?:\/\/)/.test(p.photo) ? p.photo : undefined,
        tag: b.kind === 'hero3' && (!p.tag || (upgradeHero && p.tag === 'wide')) ? 'progressive' as Tag
          : tags.some(t => t.id === p.tag) ? p.tag : 'wide' as Tag,
      }))
      return { id: typeof b.id === 'string' ? b.id : uid(), kind: b.kind, name: String(b.name), h: Number(b.h) || 130,
        cols: products?.length, products, fields: b.fields?.map(f => ({ key: String(f.key), label: String(f.label), value: String(f.value) })),
        ...(b.appearance !== undefined ? { appearance: readAppearance(b.appearance) } : {}),
        ...(typeof b.image === 'string' && /^(data:image\/(png|jpeg|webp);base64,|https?:\/\/)/.test(b.image) ? { image: b.image } : {}),
        ...(b.imageFit === 'contain' || b.imageFit === 'cover' ? { imageFit: b.imageFit } : {}) }
    })
  }
  return { frente: side('frente'), verso: side('verso'), ...(input.layout !== undefined ? { layout: readLayout(input.layout) } : {}) }
}
export type DraftStorage = Pick<Storage, 'getItem' | 'setItem'>
export type DraftFailure = { key: string; raw: string | null }
export type DraftLoad = { document: Document; sourceKey: string | null; failures: DraftFailure[]; canSave: boolean }
export const RECOVERY_PREFIX = 'panfletos:recovery:'
const draftKeys = [STORAGE, 'panfletos:montador:v2', 'panfletos:v1']
export function loadDraft(storage?: DraftStorage): DraftLoad {
  const failures: DraftFailure[] = []
  for (const key of draftKeys) {
    let raw: string | null
    try { raw = (storage ?? localStorage).getItem(key) }
    catch { failures.push({ key, raw: null }); break }
    if (raw === null) continue
    try {
      return { document: normalize(JSON.parse(raw), key !== STORAGE), sourceKey: key, failures, canSave: failures.length === 0 }
    } catch { failures.push({ key, raw }) }
  }
  return { document: normalize(seed), sourceKey: null, failures, canSave: failures.length === 0 }
}
export function initialDocument(): Document { return loadDraft().document }

// This guard is also used by the mounting effect: failed loads must never autosave.
export function saveDraft(document: Document, state: DraftLoad, storage?: DraftStorage): boolean {
  if (!state.canSave) return false
  ;(storage ?? localStorage).setItem(STORAGE, JSON.stringify(document))
  return true
}
export function resolveDraftRecovery(state: DraftLoad, choice: 'recovered' | 'new', storage?: DraftStorage): DraftLoad {
  if (state.canSave || (choice === 'recovered' && !state.sourceKey)) throw new Error('Recuperação indisponível.')
  const target = storage ?? localStorage
  // Do not replace a draft that changed in another tab while the decision was open.
  for (const failure of state.failures) {
    if (failure.raw === null || target.getItem(failure.key) !== failure.raw) throw new Error('O rascunho mudou ou não pôde ser lido. Tente novamente.')
  }
  const archive = JSON.stringify({ failures: state.failures, recoveredFrom: state.sourceKey })
  const key = RECOVERY_PREFIX + crypto.randomUUID()
  target.setItem(key, archive)
  if (target.getItem(key) !== archive) throw new Error('Não foi possível verificar a cópia de recuperação.')
  return { document: choice === 'new' ? normalize(seed) : state.document, sourceKey: state.sourceKey, failures: [], canSave: true }
}
export function newBlock(index: number): Block {
  const item = catalog[index]
  const fields = item.kind === 'header' ? [['Tema', 'TEMPO DE FLORESCER'], ['Título', 'ANIVERSÁRIO D&D']]
    : item.kind === 'hero3' ? [['Título', 'APROVEITE O DESCONTO PROGRESSIVO'], ['Marca parceira', '']]
    : item.kind === 'footsite' ? [['Site', 'dedcosmeticosonline.com.br'], ['Instagram', '@dedcosmeticosonline']]
    : item.kind === 'footpay' ? [['Parcelamento', 'Em até 6x sem juros'], ['Condições', 'Consulte as condições na loja.'], ['Pagamento', 'Visa · Master · Elo · Pix']] : []
  return { id: uid(), kind: item.kind, name: item.name, h: item.kind === 'hero3' ? 204 : 130,
    products: item.cols ? Array.from({ length: item.cols }, (_, i) => ({ ...blankProduct(), ...(item.kind === 'hero3' ? { tag: 'progressive' as Tag, brand: `Leve ${i + 1}` } : {}) })) : undefined, cols: item.cols,
    fields: fields.map(([label, value]) => ({ key: uid(), label, value })) }
}
export function minHeight(b: Block) {
  if (b.appearance) return b.appearance.minHeight
  if (b.kind === 'header') return 108
  if (b.kind.startsWith('foot')) return b.kind === 'footpay' ? 88 : 56
  const n = Math.max(1, b.products?.length || 1)
  const largeTag = b.products?.some(p => p.tag === 'offer' || p.tag === 'before')
  // The badge stays compact; reserve the extra height for the photo instead.
  const photoReserve = largeTag ? Math.max(24, Math.min(64, (554 / n - 10) * .24)) : 0
  return Math.ceil(58 + 72 + photoReserve + (b.fields?.length ? 24 : 0))
}
export function paginate(blocks: Block[], height = 782): Block[][] {
  const pages: Block[][] = [[]]
  let used = 0
  for (const b of blocks) {
    const blockHeight = minHeight(b) + 6
    if (used + blockHeight > height - 30 && pages[pages.length - 1].length) { pages.push([]); used = 0 }
    pages[pages.length - 1].push(b); used += blockHeight
  }
  return pages
}
export function moveBlock(blocks: Block[], id: string, before?: string) {
  if (id === before) return blocks
  const block = blocks.find(b => b.id === id)
  if (!block) return blocks
  const next = blocks.filter(b => b.id !== id)
  const index = before ? next.findIndex(b => b.id === before) : next.length
  next.splice(index < 0 ? next.length : index, 0, block)
  return next
}
