import { create } from 'zustand'
import { produce } from 'immer'

export const PAGE_W = 153 // mm
export const PAGE_H = 207 // mm

export type ElType = 'text' | 'image' | 'price' | 'product'
export type Scope = 'one' | 'line' | 'page'
export type Align = 'left' | 'center' | 'right'
export type BlockKind = 'row5' | 'row4' | 'row3' | 'row2' | 'hero'

export const FONTS = ['Inter', 'Montserrat', 'Poppins', 'Roboto', 'Oswald', 'Playfair Display']
export const PALETTE = ['#D4153B', '#6A2C91', '#1F1B24', '#0B5C6B', '#B4520E', '#FFFFFF']

export interface Style {
  font: string
  fontPt: number
  align: Align
  bold: boolean
  color: string // cor do texto (texto) ou do cartão de preço (price/product)
  alpha: number // 0-100
  radius: number | null // mm; null = automático
}
export const STYLE_KEYS: (keyof Style)[] = ['font', 'fontPt', 'align', 'bold', 'color', 'alpha', 'radius']

export interface Product {
  brand: string
  name: string
  de: string
  por: string
  cada: string
}

export interface El extends Style {
  id: string
  type: ElType
  x: number
  y: number
  w: number
  h: number
  text: string // texto livre, ou nome do produto
  brand: string
  de: string
  price: string
  cada: string
  seal: string
  hue: number
  src?: string
  base: Style
  block?: { id: string; kind: BlockKind; slot: number; y0: number }
}

const MARGIN = 8
const GAP = 4
const HUES = [330, 200, 150, 40, 270, 20, 180, 300]

export const BLOCKS: Record<BlockKind, { label: string; cols: number; h: number; pt: number }> = {
  row5: { label: 'Linha de 5', cols: 5, h: 44, pt: 9 },
  row4: { label: 'Linha de 4', cols: 4, h: 50, pt: 10 },
  row3: { label: 'Linha de 3', cols: 3, h: 58, pt: 11 },
  row2: { label: 'Linha de 2', cols: 2, h: 76, pt: 14 },
  hero: { label: 'Destaque', cols: 1, h: 96, pt: 18 },
}

let seq = 1
const uid = () => 'e' + Date.now().toString(36) + (seq++)
const DEF_PT: Record<ElType, number> = { text: 20, image: 12, price: 11, product: 11 }

function pickStyle(o: Partial<El>): Partial<Style> {
  const r: Partial<Style> = {}
  for (const k of STYLE_KEYS) if (o[k] !== undefined) (r as Record<string, unknown>)[k] = o[k]
  return r
}

export function mk(type: ElType, o: Partial<El> = {}): El {
  const style: Style = {
    font: 'Inter', fontPt: DEF_PT[type], align: 'center', bold: true,
    color: type === 'text' ? '#6A2C91' : '#D4153B', alpha: 100, radius: null,
    ...pickStyle(o),
  }
  return {
    id: uid(), type, x: 20, y: 20, w: 60, h: 40,
    text: type === 'text' ? 'Novo texto' : 'Nome do produto',
    brand: '', de: '', price: '0,00', cada: '', seal: '', hue: 330,
    ...o, ...style, base: style,
  }
}

function slotGeom(kind: BlockKind, slot: number, y0: number) {
  const b = BLOCKS[kind]
  const w = (PAGE_W - 2 * MARGIN - GAP * (b.cols - 1)) / b.cols
  return { x: +(MARGIN + slot * (w + GAP)).toFixed(2), y: y0, w: +w.toFixed(2), h: b.h }
}

function buildBlock(kind: BlockKind, y0: number, prods?: Product[]): El[] {
  const b = BLOCKS[kind]
  const id = uid()
  const out: El[] = []
  for (let i = 0; i < b.cols; i++) {
    const p = prods?.[i]
    out.push(mk('product', {
      ...slotGeom(kind, i, y0), fontPt: b.pt, hue: HUES[i % HUES.length],
      brand: p?.brand ?? 'MARCA', text: p?.name ?? 'Nome do produto', de: p?.de ?? '', price: p?.por ?? '0,00', cada: p?.cada ?? '',
      block: { id, kind, slot: i, y0 },
    }))
  }
  return out
}

const famOf = (t: ElType) => (t === 'price' || t === 'product' ? 'price' : t)

function targetsOf(arr: El[], el: El, scope: Scope): El[] {
  if (scope === 'one') return [el]
  const fam = famOf(el.type)
  if (scope === 'line') {
    if (el.block) return arr.filter((e) => e.block?.id === el.block!.id)
    const cy = el.y + el.h / 2
    return arr.filter((e) => famOf(e.type) === fam && Math.abs(e.y + e.h / 2 - cy) < Math.max(e.h, el.h) / 2)
  }
  return arr.filter((e) => famOf(e.type) === fam)
}

type Pages = El[][]

interface State {
  pages: Pages
  page: number
  sel: string | null
  scope: Scope
  products: Product[]
  past: Pages[]
  future: Pages[]
  select: (id: string | null) => void
  setPage: (n: number) => void
  setScope: (s: Scope) => void
  update: (id: string, patch: Partial<El>) => void
  style: (id: string, patch: Partial<Style>) => void
  resetStyle: (id: string) => void
  add: (type: ElType, over?: Partial<El>) => void
  addBlock: (kind: BlockKind) => void
  resetBlock: (blockId: string) => void
  remove: (id: string) => void
  undo: () => void
  redo: () => void
  setProducts: (p: Product[]) => void
  fillPage: () => { filled: number; left: number }
  addBlocksForRest: () => void
}

const samples: Product[] = [
  { brand: 'EUDORA', name: 'H Colônia Masculina 100ml', de: '124,90', por: '74,99', cada: 'cada' },
  { brand: 'EUDORA', name: 'Pulse Colônia Masculina 100ml', de: '94,95', por: '69,99', cada: 'cada' },
  { brand: 'EUDORA', name: 'Chic Retrô Colônia Feminina 95ml', de: '109,90', por: '79,99', cada: 'cada' },
]

const initial: Pages = [
  [mk('text', { x: 8, y: 8, w: 137, h: 18, text: 'OFERTAS DA SEMANA', fontPt: 28, align: 'left' }), ...buildBlock('row3', 34, samples)],
  [],
]

export const useDoc = create<State>((set, get) => {
  const commit = (fn: (p: Pages) => void) => {
    const { pages, past } = get()
    const next = produce(pages, fn)
    if (next === pages) return
    set({ pages: next, past: [...past.slice(-99), pages], future: [] })
  }
  const nextY = (kind: BlockKind) => {
    const b = BLOCKS[kind]
    const arr = get().pages[get().page]
    const bottom = arr.reduce((m, e) => Math.max(m, e.y + e.h), MARGIN - GAP)
    let y0 = +(bottom + GAP).toFixed(2)
    if (y0 + b.h > PAGE_H - MARGIN) y0 = Math.max(MARGIN, +(PAGE_H - MARGIN - b.h).toFixed(2))
    return y0
  }
  return {
    pages: initial, page: 0, sel: null, scope: 'one', products: [], past: [], future: [],
    select: (id) => set({ sel: id }),
    setPage: (n) => set({ page: n, sel: null }),
    setScope: (scope) => set({ scope }),
    update: (id, patch) =>
      commit((p) => {
        const el = p[get().page].find((e) => e.id === id)
        if (el) Object.assign(el, patch)
      }),
    style: (id, patch) =>
      commit((p) => {
        const arr = p[get().page]
        const el = arr.find((e) => e.id === id)
        if (!el) return
        for (const t of targetsOf(arr, el, get().scope)) Object.assign(t, patch)
      }),
    resetStyle: (id) =>
      commit((p) => {
        const arr = p[get().page]
        const el = arr.find((e) => e.id === id)
        if (!el) return
        for (const t of targetsOf(arr, el, get().scope)) Object.assign(t, t.base)
      }),
    add: (type, over = {}) => {
      const e = mk(type, over)
      commit((p) => { p[get().page].push(e) })
      set({ sel: e.id })
    },
    addBlock: (kind) => {
      const els = buildBlock(kind, nextY(kind))
      commit((p) => { p[get().page].push(...els) })
      set({ sel: null })
    },
    resetBlock: (blockId) =>
      commit((p) => {
        for (const e of p[get().page]) {
          if (e.block?.id === blockId) Object.assign(e, slotGeom(e.block.kind, e.block.slot, e.block.y0))
        }
      }),
    remove: (id) => {
      commit((p) => {
        const arr = p[get().page]
        const i = arr.findIndex((e) => e.id === id)
        if (i >= 0) arr.splice(i, 1)
      })
      set({ sel: null })
    },
    undo: () => {
      const { past, pages, future, sel, page } = get()
      if (!past.length) return
      const np = past[past.length - 1]
      set({ pages: np, past: past.slice(0, -1), future: [pages, ...future], sel: np[page]?.some((e) => e.id === sel) ? sel : null })
    },
    redo: () => {
      const { future, pages, past, sel, page } = get()
      if (!future.length) return
      const np = future[0]
      set({ pages: np, future: future.slice(1), past: [...past, pages], sel: np[page]?.some((e) => e.id === sel) ? sel : null })
    },
    setProducts: (products) => set({ products }),
    fillPage: () => {
      const prods = get().products
      const order = (arr: El[]) => arr.filter((e) => e.type === 'product' || e.type === 'price').sort((a, b) => a.y - b.y || a.x - b.x)
      const total = order(get().pages[get().page]).length
      const n = Math.min(total, prods.length)
      commit((p) => {
        const cards = order(p[get().page])
        for (let i = 0; i < n; i++) {
          const c = cards[i], pr = prods[i]
          Object.assign(c, { brand: pr.brand, text: pr.name, de: pr.de, price: pr.por, cada: pr.cada })
        }
      })
      return { filled: n, left: Math.max(0, prods.length - n) }
    },
    addBlocksForRest: () => {
      const prods = get().products
      const have = get().pages[get().page].filter((e) => e.type === 'product' || e.type === 'price').length
      let i = have
      commit((p) => {
        const arr = p[get().page]
        while (i < prods.length) {
          const bottom = arr.reduce((m, e) => Math.max(m, e.y + e.h), MARGIN - GAP)
          const y0 = +(bottom + GAP).toFixed(2)
          const els = buildBlock('row3', y0, prods.slice(i, i + 3))
          const used = Math.min(3, prods.length - i)
          arr.push(...els.slice(0, used))
          i += used
        }
      })
    },
  }
})
