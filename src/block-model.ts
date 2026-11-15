import seed from './block-seed.json' with { type: 'json' }

export type Tag = 'offer' | 'before' | 'pill' | 'wide'
export type Product = { brand: string; name: string; de: string; por: string; cada: string; photo?: string; tag?: Tag }
export type Block = { id: string; kind: string; name: string; h: number; cols?: number; fields?: { key: string; label: string; value: string }[]; products?: Product[] }
export type Document = { frente: Block[]; verso: Block[] }
export type Side = keyof Document
export const STORAGE = 'panfletos:montador:v2'
export const tags: { id: Tag; name: string }[] = [
  { id: 'offer', name: 'Por apenas' }, { id: 'before', name: 'De / Por' },
  { id: 'pill', name: 'Etiqueta compacta' }, { id: 'wide', name: 'Etiqueta larga' },
]
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

export function normalize(value: unknown): Document {
  if (!value || typeof value !== 'object') throw new Error('Documento inválido')
  const input = value as Record<string, unknown>
  const side = (key: Side): Block[] => {
    if (!Array.isArray(input[key])) throw new Error('Documento sem frente ou verso')
    return (input[key] as Block[]).map(b => {
      if (!b || !catalog.some(c => c.kind === b.kind)) throw new Error('Bloco inválido')
      const products = b.products?.map(p => ({
        brand: String(p.brand ?? ''), name: String(p.name ?? ''), de: String(p.de ?? ''),
        por: String(p.por ?? ''), cada: String(p.cada ?? ''),
        photo: typeof p.photo === 'string' && /^(data:image\/(png|jpeg|webp);base64,|https?:\/\/)/.test(p.photo) ? p.photo : undefined,
        tag: tags.some(t => t.id === p.tag) ? p.tag : 'wide' as Tag,
      }))
      return { id: typeof b.id === 'string' ? b.id : uid(), kind: b.kind, name: String(b.name), h: Number(b.h) || 130,
        cols: products?.length, products, fields: b.fields?.map(f => ({ key: String(f.key), label: String(f.label), value: String(f.value) })) }
    })
  }
  return { frente: side('frente'), verso: side('verso') }
}
export function initialDocument(): Document {
  for (const key of [STORAGE, 'panfletos:v1']) {
    try { const saved = localStorage.getItem(key); if (saved) return normalize(JSON.parse(saved)) } catch { /* Keep the original save untouched when it cannot be read. */ }
  }
  return normalize(seed)
}
export function newBlock(index: number): Block {
  const item = catalog[index]
  const fields = item.kind === 'header' ? [['Tema', 'TEMPO DE FLORESCER'], ['Título', 'ANIVERSÁRIO D&D']]
    : item.kind === 'hero3' ? [['Título', 'APROVEITE O DESCONTO PROGRESSIVO'], ['Marca parceira', '']]
    : item.kind === 'footsite' ? [['Site', 'dedcosmeticosonline.com.br'], ['Instagram', '@dedcosmeticosonline']]
    : item.kind === 'footpay' ? [['Parcelamento', 'Em até 6x sem juros'], ['Condições', 'Consulte as condições na loja.'], ['Pagamento', 'Visa · Master · Elo · Pix']] : []
  return { id: uid(), kind: item.kind, name: item.name, h: item.kind === 'hero3' ? 204 : 130,
    products: item.cols ? Array.from({ length: item.cols }, blankProduct) : undefined, cols: item.cols,
    fields: fields.map(([label, value]) => ({ key: uid(), label, value })) }
}
export function minHeight(b: Block) {
  if (b.kind === 'header') return 108
  if (b.kind.startsWith('foot')) return b.kind === 'footpay' ? 88 : 56
  const n = Math.max(1, b.products?.length || 1)
  const largeTag = b.products?.some(p => p.tag === 'offer' || p.tag === 'before')
  // The badge stays compact; reserve the extra height for the photo instead.
  const photoReserve = largeTag ? Math.max(24, Math.min(64, (554 / n - 10) * .24)) : 0
  return Math.ceil(58 + 72 + photoReserve + (b.fields?.length ? 24 : 0))
}
export function paginate(blocks: Block[]): Block[][] {
  const pages: Block[][] = [[]]
  let used = 0
  for (const b of blocks) {
    const height = minHeight(b) + 6
    if (used + height > 752 && pages[pages.length - 1].length) { pages.push([]); used = 0 }
    pages[pages.length - 1].push(b); used += height
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
