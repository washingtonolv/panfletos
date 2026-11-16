import type { DragEvent } from 'react'
import type { Block } from './block-model'

type Props = {
  title: string
  blocks: Block[]
  selected: string | null
  over: string | null
  reorder: boolean
  onPick: (id: string) => void
  onMove?: (id: string, delta: number) => void
  onDragStart?: (event: DragEvent, value: string) => void
  onDragOver?: (id: string | null) => void
  onDrop?: (event: DragEvent, before?: string) => void
}

export default function PageStructure({ title, blocks, selected, over, reorder, onPick, onMove, onDragStart, onDragOver, onDrop }: Props) {
  return <section className="ed-section ed-structure" aria-label={title}>
    <h3 className="ed-section-title">{title}</h3>
    {!blocks.length && <p className="ed-hint">Nenhum bloco nesta folha. Escolha um layout pronto.</p>}
    <ol className="ed-blocklist">
      {blocks.map((b, i) => <li key={b.id} className={over === `list-${b.id}` ? 'drop-active' : ''}
        onDragOver={reorder ? e => { e.preventDefault(); onDragOver?.(`list-${b.id}`) } : undefined} onDrop={reorder ? e => onDrop?.(e, b.id) : undefined}>
        {reorder && <span className="ed-handle" draggable role="img" aria-label={`Arrastar bloco ${i + 1}`} onDragStart={e => onDragStart?.(e, `block:${b.id}`)}>⠿</span>}
        <button type="button" className={selected === b.id ? 'active' : ''} aria-pressed={selected === b.id} onClick={() => onPick(b.id)}><small>{i + 1}</small><span>{b.name}</span>{b.products?.length ? <em>{b.products.length}</em> : null}</button>
        {reorder && selected === b.id && <span className="ed-order-buttons">
          <button type="button" aria-label={`Subir ${b.name}`} disabled={i === 0} onClick={() => onMove?.(b.id, -1)}>↑</button>
          <button type="button" aria-label={`Descer ${b.name}`} disabled={i === blocks.length - 1} onClick={() => onMove?.(b.id, 1)}>↓</button>
        </span>}
      </li>)}
    </ol>
    {reorder && <div className="ed-order-end" onDragOver={e => e.preventDefault()} onDrop={e => onDrop?.(e)}>Solte aqui para mover ao final</div>}
  </section>
}
