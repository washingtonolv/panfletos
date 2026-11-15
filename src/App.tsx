import { useEffect, useMemo, useRef, useState } from 'react'
import Moveable from 'react-moveable'
import { PAGE_H, PAGE_W, useDoc, type El } from './store'

const PT_MM = 25.4 / 72 // 1 pt em mm
const SIZES = [6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48]

function nextSize(cur: number, dir: 1 | -1) {
  if (dir > 0) return SIZES.find((s) => s > cur) ?? cur
  return [...SIZES].reverse().find((s) => s < cur) ?? cur
}

function ElView({ el, S, selected, onDown }: { el: El; S: number; selected: boolean; onDown: (id: string, e: MouseEvent) => void }) {
  const base: React.CSSProperties = {
    position: 'absolute', left: el.x * S, top: el.y * S, width: el.w * S, height: el.h * S,
    boxSizing: 'border-box', overflow: 'hidden', cursor: 'move', userSelect: 'none',
    outline: selected ? 'none' : undefined,
  }
  const px = (pt: number) => pt * PT_MM * S
  let inner: React.ReactNode = null
  if (el.type === 'price') {
    const pad = 2.2 * S
    inner = (
      <div style={{ width: '100%', height: '100%', background: el.bg, borderRadius: 3 * S, padding: pad, display: 'flex', flexDirection: 'column', gap: pad }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: px(Math.max(6, el.fontPt * 0.4)), lineHeight: 1.15, textAlign: 'center' }}>{el.text}</div>
        <div style={{ flex: 1, background: '#fff', borderRadius: 2 * S, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
          {el.sub && <div style={{ color: '#777', fontSize: px(Math.max(6, el.fontPt * 0.38)), textDecoration: 'line-through' }}>{el.sub}</div>}
          <div style={{ color: el.color, fontWeight: 800, fontSize: px(el.fontPt), lineHeight: 1.05, whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: px(el.fontPt * 0.45), marginRight: px(1) }}>R$</span>{el.price}
          </div>
        </div>
      </div>
    )
  } else if (el.type === 'text') {
    inner = (
      <div style={{ width: '100%', height: '100%', color: el.color, background: el.bg, fontWeight: 800, fontSize: px(el.fontPt), lineHeight: 1.1, whiteSpace: 'pre-wrap' }}>{el.text}</div>
    )
  } else {
    inner = <img src={el.src} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
  }
  return (
    <div data-el={el.id} style={base} onMouseDown={(e) => { e.stopPropagation(); onDown(el.id, e.nativeEvent) }}>
      {inner}
    </div>
  )
}

export default function App() {
  const { pages, page, sel, past, future, select, setPage, update, add, remove, undo, redo } = useDoc()
  const [zoom, setZoom] = useState(1)
  const S = 3.78 * zoom // px por mm
  const els = pages[page]
  const selEl = els.find((e) => e.id === sel) ?? null
  const pageRef = useRef<HTMLDivElement>(null)
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const mvRef = useRef<Moveable>(null)
  const pending = useRef<MouseEvent | null>(null)
  const onElDown = (id: string, e: MouseEvent) => {
    if (useDoc.getState().sel !== id) pending.current = e
    select(id)
  }

  useEffect(() => {
    setTarget(sel ? (document.querySelector(`[data-el="${sel}"]`) as HTMLElement | null) : null)
  }, [sel, els, S, page])

  useEffect(() => {
    mvRef.current?.updateRect()
  }, [els, S, target])

  useEffect(() => {
    if (target && pending.current) {
      const ev = pending.current
      pending.current = null
      mvRef.current?.dragStart(ev)
    }
  }, [target])

  const guides = useMemo(
    () => (target ? (Array.from(document.querySelectorAll('[data-el]')).filter((n) => n !== target) as HTMLElement[]) : []),
    [target],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
      const k = e.key.toLowerCase()
      if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return }
      if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); redo(); return }
      const cur = useDoc.getState()
      const el = cur.pages[cur.page].find((x) => x.id === cur.sel)
      if (!el) return
      if (k === 'delete' || k === 'backspace') { e.preventDefault(); remove(el.id); return }
      const step = e.shiftKey ? 5 : 0.5
      const mv: Record<string, [number, number]> = { arrowleft: [-step, 0], arrowright: [step, 0], arrowup: [0, -step], arrowdown: [0, step] }
      if (mv[k]) { e.preventDefault(); update(el.id, { x: +(el.x + mv[k][0]).toFixed(2), y: +(el.y + mv[k][1]).toFixed(2) }) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, remove, update])

  const onFile = (f: File | undefined) => {
    if (!f) return
    const r = new FileReader()
    r.onload = () => add({ type: 'image', src: String(r.result), w: 60, h: 60 })
    r.readAsDataURL(f)
  }

  return (
    <div className="app">
      <header className="bar">
        <strong>Panfletos</strong>
        <div className="grp">
          <button className={page === 0 ? 'on' : ''} onClick={() => setPage(0)}>Frente</button>
          <button className={page === 1 ? 'on' : ''} onClick={() => setPage(1)}>Verso</button>
        </div>
        <div className="grp">
          <button onClick={() => add({ type: 'price', text: 'Nome do produto', price: '0,00', sub: 'de R$ 0,00', fontPt: 26, color: '#C8102E', bg: '#C8102E', w: 64, h: 52 })}>+ Card de preço</button>
          <button onClick={() => add({ type: 'text', text: 'Novo texto', fontPt: 20, color: '#222222', w: 80, h: 16 })}>+ Texto</button>
          <button onClick={() => fileRef.current?.click()}>+ Imagem</button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
        </div>
        <div className="grp">
          <button disabled={!past.length} onClick={undo}>Desfazer</button>
          <button disabled={!future.length} onClick={redo}>Refazer</button>
        </div>
        <div className="grp">
          <button onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.1).toFixed(2)))}>−</button>
          <span className="z">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))}>+</button>
        </div>
      </header>
      <div className="main">
        <div className="canvas" onMouseDown={() => select(null)}>
          <div ref={pageRef} className="page" style={{ width: PAGE_W * S, height: PAGE_H * S }}>
            {els.map((el) => <ElView key={el.id} el={el} S={S} selected={el.id === sel} onDown={onElDown} />)}
          </div>
          {target && selEl && (
            <Moveable
              ref={mvRef}
              target={target}
              draggable
              resizable
              throttleDrag={0}
              renderDirections={['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']}
              snappable
              snapThreshold={5}
              elementGuidelines={guides}
              verticalGuidelines={[0, (PAGE_W * S) / 2, PAGE_W * S]}
              horizontalGuidelines={[0, (PAGE_H * S) / 2, PAGE_H * S]}
              onDrag={(e) => { e.target.style.transform = e.transform }}
              onDragEnd={(e) => {
                e.target.style.transform = ''
                const t = e.lastEvent?.beforeTranslate
                if (t && (t[0] || t[1])) update(selEl.id, { x: +(selEl.x + t[0] / S).toFixed(2), y: +(selEl.y + t[1] / S).toFixed(2) })
              }}
              onResize={(e) => {
                e.target.style.width = `${e.width}px`
                e.target.style.height = `${e.height}px`
                e.target.style.transform = e.drag.transform
              }}
              onResizeEnd={(e) => {
                const l = e.lastEvent
                e.target.style.transform = ''
                if (!l) return
                update(selEl.id, {
                  x: +(selEl.x + l.drag.beforeTranslate[0] / S).toFixed(2),
                  y: +(selEl.y + l.drag.beforeTranslate[1] / S).toFixed(2),
                  w: Math.max(8, +(l.width / S).toFixed(2)),
                  h: Math.max(8, +(l.height / S).toFixed(2)),
                })
              }}
            />
          )}
        </div>
        <aside className="side" onMouseDown={(e) => e.stopPropagation()}>
          {!selEl && <p className="hint">Clique em um elemento para editar. Arraste para mover, use as alças para redimensionar. Setas movem 0,5 mm (Shift = 5 mm). Delete remove.</p>}
          {selEl && (
            <>
              <h3>{selEl.type === 'price' ? 'Card de preço' : selEl.type === 'text' ? 'Texto' : 'Imagem'}</h3>
              {selEl.type !== 'image' && (
                <label>{selEl.type === 'price' ? 'Produto' : 'Texto'}
                  <textarea rows={2} value={selEl.text} onChange={(e) => update(selEl.id, { text: e.target.value })} />
                </label>
              )}
              {selEl.type === 'price' && (
                <>
                  <label>Preço<input value={selEl.price} onChange={(e) => update(selEl.id, { price: e.target.value })} /></label>
                  <label>Preço "de"<input value={selEl.sub} onChange={(e) => update(selEl.id, { sub: e.target.value })} /></label>
                </>
              )}
              {selEl.type !== 'image' && (
                <div className="row">
                  <span>{selEl.type === 'price' ? 'Fonte do preço' : 'Fonte'}: {selEl.fontPt} pt</span>
                  <button onClick={() => update(selEl.id, { fontPt: nextSize(selEl.fontPt, -1) })}>A−</button>
                  <button onClick={() => update(selEl.id, { fontPt: nextSize(selEl.fontPt, 1) })}>A+</button>
                </div>
              )}
              {selEl.type !== 'image' && (
                <div className="row">
                  <label>Cor<input type="color" value={selEl.color} onChange={(e) => update(selEl.id, { color: e.target.value })} /></label>
                  {selEl.type === 'price' && <label>Cartão<input type="color" value={selEl.bg} onChange={(e) => update(selEl.id, { bg: e.target.value })} /></label>}
                </div>
              )}
              <div className="row dim">
                {selEl.x.toFixed(1)}, {selEl.y.toFixed(1)} mm · {selEl.w.toFixed(1)} × {selEl.h.toFixed(1)} mm
              </div>
              <button className="danger" onClick={() => remove(selEl.id)}>Excluir</button>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
