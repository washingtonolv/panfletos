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
  return <section className="ed-section ed-library" aria-label="Layouts prontos">
    <button type="button" className="ed-section-head" aria-expanded={open} aria-controls="layout-library-list" onClick={onToggle}>
      <span>Layouts prontos</span><span aria-hidden="true">{open ? '▾' : '▸'}</span>
    </button>
    {open && <>
      <p className="ed-hint">Clique para adicionar ou arraste para a página.</p>
      <ul id="layout-library-list" className="ed-layouts">
        {catalog.map((item, i) => <li key={i}>
          <button type="button" className="ed-layout" draggable onDragStart={e => onDragStart(e, `library:${i}`)} onClick={() => onInsert(i)} aria-label={`Adicionar ${item.name}`}>
            <Thumb item={item} /><span className="ed-layout-name">{item.name}</span>
          </button>
        </li>)}
      </ul>
    </>}
  </section>
}
