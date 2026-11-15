import { useEffect, useMemo, useRef, useState } from 'react'
import Moveable from 'react-moveable'
import FloatBar from './FloatBar'
import Products from './Products'
import { ElContent } from './render'
import { BLOCKS, PAGE_H, PAGE_W, useDoc, type BlockKind, type El } from './store'

function ElView({ el, S, onDown }: { el: El; S: number; onDown: (id: string, e: MouseEvent) => void }) {
  return (
    <div
      data-el={el.id}
      style={{ position: 'absolute', left: el.x * S, top: el.y * S, width: el.w * S, height: el.h * S, boxSizing: 'border-box', overflow: 'hidden', cursor: 'move', userSelect: 'none' }}
      onMouseDown={(e) => { e.stopPropagation(); onDown(el.id, e.nativeEvent) }}
    >
      <ElContent el={el} S={S} />
    </div>
  )
}

function Field({ label, value, onChange, area }: { label: string; value: string; onChange: (v: string) => void; area?: boolean }) {
  return (
    <label>
      {label}
      {area ? <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} /> : <input value={value} onChange={(e) => onChange(e.target.value)} />}
    </label>
  )
}

export default function App() {
  const { pages, page, sel, past, future, select, setPage, update, add, addBlock, resetBlock, remove, undo, redo } = useDoc()
  const [zoom, setZoom] = useState(1)
  const S = 3.78 * zoom // px por mm
  const els = pages[page]
  const selEl = els.find((e) => e.id === sel) ?? null
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)
  const mvRef = useRef<Moveable>(null)
  const pending = useRef<MouseEvent | null>(null)
  const mouseDown = useRef(false)
  const outside = els.filter((e) => e.x < -0.01 || e.y < -0.01 || e.x + e.w > PAGE_W + 0.01 || e.y + e.h > PAGE_H + 0.01).length

  const onElDown = (id: string, e: MouseEvent) => {
    mouseDown.current = true
    if (useDoc.getState().sel !== id) pending.current = e
    select(id)
  }

  useEffect(() => {
    setTarget(sel ? (document.querySelector(`[data-el="${sel}"]`) as HTMLElement | null) : null)
  }, [sel, els, S, page])

  useEffect(() => { mvRef.current?.updateRect() }, [els, S, target])

  useEffect(() => {
    if (target && pending.current) {
      const ev = pending.current
      pending.current = null
      if (mouseDown.current) mvRef.current?.dragStart(ev)
    }
  }, [target])

  const guides = useMemo(
    () => (target ? (Array.from(document.querySelectorAll('[data-el]')).filter((n) => n !== target) as HTMLElement[]) : []),
    [target],
  )

  useEffect(() => {
    const up = () => { mouseDown.current = false }
    window.addEventListener('mouseup', up, true)
    return () => window.removeEventListener('mouseup', up, true)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return
      const k = e.key.toLowerCase()
      if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return }
      if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); redo(); return }
      const cur = useDoc.getState()
      const el = cur.pages[cur.page].find((x) => x.id === cur.sel)
      if (!el) return
      if (k === 'delete' || k === 'backspace') { e.preventDefault(); remove(el.id); return }
      if (k === 'escape') { select(null); return }
      const step = e.shiftKey ? 5 : 0.5
      const mv: Record<string, [number, number]> = { arrowleft: [-step, 0], arrowright: [step, 0], arrowup: [0, -step], arrowdown: [0, step] }
      if (mv[k]) { e.preventDefault(); update(el.id, { x: +(el.x + mv[k][0]).toFixed(2), y: +(el.y + mv[k][1]).toFixed(2) }) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, remove, update, select])

  const readImage = (f: File | undefined, cb: (src: string) => void) => {
    if (!f) return
    const r = new FileReader()
    r.onload = () => cb(String(r.result))
    r.readAsDataURL(f)
  }

  // barra flutuante: acima do elemento, ou abaixo se não houver espaço
  const barTop = selEl ? (selEl.y * S > 110 ? selEl.y * S - 104 : (selEl.y + selEl.h) * S + 10) : 0
  const barLeft = selEl ? Math.max(0, Math.min(selEl.x * S, PAGE_W * S - 380)) : 0

  return (
    <div className="app">
      <header className="bar">
        <strong>Panfletos</strong>
        <div className="grp">
          <button className={page === 0 ? 'on' : ''} onClick={() => setPage(0)}>Frente</button>
          <button className={page === 1 ? 'on' : ''} onClick={() => setPage(1)}>Verso</button>
        </div>
        <div className="grp">
          {(Object.keys(BLOCKS) as BlockKind[]).map((k) => (
            <button key={k} onClick={() => addBlock(k)}>+ {BLOCKS[k].label}</button>
          ))}
        </div>
        <div className="grp">
          <button onClick={() => add('price', { w: 44, h: 18 })}>+ Cartão de preço</button>
          <button onClick={() => add('text', { w: 80, h: 16 })}>+ Texto</button>
          <button onClick={() => fileRef.current?.click()}>+ Imagem</button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { readImage(e.target.files?.[0], (src) => add('image', { src, w: 60, h: 60 })); e.target.value = '' }} />
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
        {outside > 0 && <span className="warn">⚠ {outside} elemento(s) fora da folha</span>}
      </header>
      <div className="main">
        <div className="canvas" onMouseDown={() => select(null)}>
          <div className="page" style={{ width: PAGE_W * S, height: PAGE_H * S }}>
            {els.map((el) => <ElView key={el.id} el={el} S={S} onDown={onElDown} />)}
            {selEl && (
              <div style={{ position: 'absolute', left: barLeft, top: barTop, zIndex: 50 }}>
                <FloatBar key={selEl.id} el={selEl} />
              </div>
            )}
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
            <section>
              <h3>{{ product: 'Produto', price: 'Cartão de preço', text: 'Texto', image: 'Imagem' }[selEl.type]}</h3>
              {selEl.type === 'text' && <Field label="Texto" area value={selEl.text} onChange={(v) => update(selEl.id, { text: v })} />}
              {selEl.type === 'product' && (
                <>
                  <Field label="Marca" value={selEl.brand} onChange={(v) => update(selEl.id, { brand: v })} />
                  <Field label="Produto" area value={selEl.text} onChange={(v) => update(selEl.id, { text: v })} />
                </>
              )}
              {(selEl.type === 'product' || selEl.type === 'price') && (
                <>
                  <div className="two">
                    <Field label="De (R$)" value={selEl.de} onChange={(v) => update(selEl.id, { de: v })} />
                    <Field label="Por (R$)" value={selEl.price} onChange={(v) => update(selEl.id, { price: v })} />
                  </div>
                  <div className="two">
                    <Field label="Cada" value={selEl.cada} onChange={(v) => update(selEl.id, { cada: v })} />
                    {selEl.type === 'product' && <Field label="Selo" value={selEl.seal} onChange={(v) => update(selEl.id, { seal: v })} />}
                  </div>
                </>
              )}
              {selEl.type === 'product' && (
                <div className="row">
                  <button onClick={() => photoRef.current?.click()}>{selEl.src ? 'Trocar foto' : 'Foto do produto'}</button>
                  {selEl.src && <button className="ghost" onClick={() => update(selEl.id, { src: undefined })}>Tirar foto</button>}
                  <input ref={photoRef} type="file" accept="image/*" hidden onChange={(e) => { readImage(e.target.files?.[0], (src) => update(selEl.id, { src })); e.target.value = '' }} />
                </div>
              )}
              <div className="dim">{selEl.x.toFixed(1)}, {selEl.y.toFixed(1)} mm · {selEl.w.toFixed(1)} × {selEl.h.toFixed(1)} mm</div>
              {selEl.block && <button onClick={() => resetBlock(selEl.block!.id)}>Restaurar bloco ({BLOCKS[selEl.block.kind].label})</button>}
            </section>
          )}
          <Products />
        </aside>
      </div>
    </div>
  )
}
