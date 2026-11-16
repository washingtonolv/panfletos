import { useState } from 'react'
import type { DragEvent } from 'react'
import { catalog } from './block-model'

type Item = (typeof catalog)[number]

function Thumb({ item }: { item: Item }) {
  const cols = item.cols || 1
  if (item.kind === 'header') return <span className="thumb thumb-header" aria-hidden="true"><i /><b /></span>
  if (item.kind === 'footsite') return <span className="thumb thumb-footer" aria-hidden="true"><i /><i /><i /></span>
  if (item.kind === 'footpay') return <span className="thumb thumb-footer thumb-pay" aria-hidden="true"><i /><i /><i /><i /></span>
  return <span className={`thumb thumb-products thumb-${item.kind}`} aria-hidden="true">
    {Array.from({ length: cols }, (_, k) => <span className="thumb-card" key={k}><i className="thumb-photo" /><i className="thumb-line" /><b className="thumb-price" /></span>)}
  </span>
}

type Props = {
  open: boolean
  onToggle: () => void
  onInsert: (index: number) => void
  onDragStart: (event: DragEvent, value: string) => void
}

export default function LayoutLibrary({ open, onToggle, onInsert, onDragStart }: Props) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('todos')
  const search = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const items = catalog.map((item, index) => ({ item, index })).filter(({ item }) =>
    (category === 'todos' || (category === 'produtos' ? item.cols > 0 : item.cols === 0)) && search(item.name).includes(search(query.trim())))
  return <section className={`ed-section ed-library ${open ? '' : 'is-collapsed'}`} aria-label="Layouts prontos">
    <button type="button" className="ed-section-head" aria-expanded={open} aria-controls="layout-library-list" onClick={onToggle}>
      <span>Layouts prontos</span><span aria-hidden="true">{open ? '▾' : '▸'}</span>
    </button>
    {open && <>
      <p className="ed-hint">Clique para adicionar ou arraste para a página.</p>
      <input className="ed-library-search" type="search" aria-label="Buscar blocos" placeholder="Buscar blocos…" value={query} onChange={e => setQuery(e.target.value)} />
      <div className="ed-library-filters" role="group" aria-label="Filtrar blocos">{[['todos', 'Todos'], ['produtos', 'Produtos'], ['estrutura', 'Estrutura']].map(([id, label]) => <button type="button" key={id} aria-pressed={category === id} onClick={() => setCategory(id)}>{label}</button>)}</div>
      <span className="ed-library-count" role="status">{items.length} {items.length === 1 ? 'bloco disponível' : 'blocos disponíveis'}</span>
      <div className="ed-library-scroll">
      <ul id="layout-library-list" className="ed-layouts">
        {items.map(({ item, index }) => <li key={index}>
          <button type="button" className="ed-layout" draggable onDragStart={e => onDragStart(e, `library:${index}`)} onClick={() => onInsert(index)} aria-label={`Adicionar ${item.name}`}>
            <Thumb item={item} /><span className="ed-layout-name">{item.name}</span>
          </button>
        </li>)}
      </ul>
      {!items.length && <p className="ed-library-empty">Nenhum bloco encontrado. Tente outro nome ou filtro.</p>}
      </div>
    </>}
  </section>
}
