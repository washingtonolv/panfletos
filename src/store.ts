import { create } from 'zustand'
import { produce } from 'immer'

export const PAGE_W = 153 // mm
export const PAGE_H = 207 // mm

export type ElType = 'price' | 'text' | 'image'
export type BlockKind = 'row3' | 'row2' | 'hero'

const MARGIN = 8
const GAP = 4
export const BLOCKS: Record<BlockKind, { label: string; cols: number; h: number; fontPt: number }> = {
  row3: { label: 'Linha de 3', cols: 3, h: 48, fontPt: 20 },
  row2: { label: 'Linha de 2', cols: 2, h: 56, fontPt: 26 },
  hero: { label: 'Destaque', cols: 1, h: 70, fontPt: 40 },
}

function slotGeom(kind: BlockKind, slot: number, y0: number) {
  const b = BLOCKS[kind]
  const w = (PAGE_W - 2 * MARGIN - GAP * (b.cols - 1)) / b.cols
  return { x: +(MARGIN + slot * (w + GAP)).toFixed(2), y: y0, w: +w.toFixed(2), h: b.h }
}

export interface El {
  id: string
  type: ElType
  x: number // mm
  y: number // mm
  w: number // mm
  h: number // mm
  text: string // nome do produto / texto livre
  price: string
  sub: string // "de R$ ..." / linha menor
  fontPt: number // tamanho do preço (price) ou do texto (text), em pt
  color: string
  bg: string
  src?: string
  block?: { id: string; kind: BlockKind; slot: number; y0: number }
}

type Pages = El[][]

interface State {
  pages: Pages
  page: number
  sel: string | null
  past: Pages[]
  future: Pages[]
  select: (id: string | null) => void
  setPage: (n: number) => void
  update: (id: string, patch: Partial<El>) => void
  add: (el: Partial<El> & { type: ElType }) => void
  addBlock: (kind: BlockKind) => void
  resetBlock: (blockId: string) => void
  remove: (id: string) => void
  undo: () => void
  redo: () => void
}

let seq = 1
const uid = () => 'e' + Date.now().toString(36) + (seq++)

const initial: Pages = [
  [
    {
      id: uid(), type: 'text', x: 8, y: 8, w: 137, h: 18,
      text: 'OFERTAS DA SEMANA', price: '', sub: '', fontPt: 28, color: '#6A2C91', bg: 'transparent',
    },
    {
      id: uid(), type: 'price', x: 8, y: 34, w: 64, h: 52,
      text: 'Produto exemplo 200 ml', price: '39,90', sub: 'de R$ 59,90', fontPt: 26, color: '#C8102E', bg: '#C8102E',
    },
  ],
  [],
]

export const useDoc = create<State>((set, get) => {
  const commit = (fn: (p: Pages) => void) => {
    const { pages, past } = get()
    const next = produce(pages, fn)
    if (next === pages) return
    set({ pages: next, past: [...past.slice(-99), pages], future: [] })
  }
  return {
    pages: initial,
    page: 0,
    sel: null,
    past: [],
    future: [],
    select: (id) => set({ sel: id }),
    setPage: (n) => set({ page: n, sel: null }),
    update: (id, patch) =>
      commit((p) => {
        const el = p[get().page].find((e) => e.id === id)
        if (el) Object.assign(el, patch)
      }),
    add: (el) => {
      const id = uid()
      const base: El = {
        id, type: el.type, x: 20, y: 20, w: 60, h: 40, text: 'Texto', price: '', sub: '',
        fontPt: 14, color: '#222222', bg: 'transparent',
      }
      commit((p) => { p[get().page].push({ ...base, ...el, id }) })
      set({ sel: id })
    },
    addBlock: (kind) => {
      const b = BLOCKS[kind]
      const arr = get().pages[get().page]
      const bottom = arr.reduce((m, e) => Math.max(m, e.y + e.h), MARGIN - GAP)
      let y0 = +(bottom + GAP).toFixed(2)
      if (y0 + b.h > PAGE_H - MARGIN) y0 = Math.max(MARGIN, +(PAGE_H - MARGIN - b.h).toFixed(2))
      const id = uid()
      commit((p) => {
        for (let i = 0; i < b.cols; i++) {
          p[get().page].push({
            id: uid(), type: 'price', ...slotGeom(kind, i, y0),
            text: 'Nome do produto', price: '0,00', sub: 'de R$ 0,00', fontPt: b.fontPt,
            color: '#C8102E', bg: '#C8102E', block: { id, kind, slot: i, y0 },
          })
        }
      })
      set({ sel: null })
    },
    resetBlock: (blockId) =>
      commit((p) => {
        for (const e of p[get().page]) {
          if (e.block?.id === blockId) Object.assign(e, slotGeom(e.block.kind, e.block.slot, e.block.y0), { fontPt: BLOCKS[e.block.kind].fontPt })
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
      const { past, pages, future } = get()
      if (!past.length) return
      const np = past[past.length - 1]
      set({ pages: np, past: past.slice(0, -1), future: [pages, ...future], sel: np[get().page]?.some((e) => e.id === get().sel) ? get().sel : null })
    },
    redo: () => {
      const { future, pages, past } = get()
      if (!future.length) return
      const np = future[0]
      set({ pages: np, future: future.slice(1), past: [...past, pages], sel: np[get().page]?.some((e) => e.id === get().sel) ? get().sel : null })
    },
  }
})
