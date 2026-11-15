import { create } from 'zustand'
import { produce } from 'immer'

export const PAGE_W = 153 // mm
export const PAGE_H = 207 // mm

export type ElType = 'price' | 'text' | 'image'

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
