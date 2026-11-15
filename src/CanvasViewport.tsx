import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Dispatch, PointerEvent, ReactNode, SetStateAction } from 'react'

type Props = { children: ReactNode; zoom: number; setZoom: Dispatch<SetStateAction<number>>; undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean }
const clampZoom = (value: number) => Math.max(.25, Math.min(2.5, value))
export default function CanvasViewport({ children, zoom, setZoom, undo, redo, canUndo, canRedo }: Props) {
  const area = useRef<HTMLElement>(null)
  const [tool, setTool] = useState<'select' | 'hand'>('select')
  const [space, setSpace] = useState(false)
  const [panning, setPanning] = useState(false)
  const pan = useRef<{ pointer: number; x: number; y: number; left: number; top: number } | null>(null)
  const suppressClick = useRef(false)
  const anchor = useRef<{ page: HTMLElement; x: number; y: number; clientX: number; clientY: number } | null>(null)
  const hand = tool === 'hand' || space

  useLayoutEffect(() => {
    const element = area.current!
    element.scrollLeft = (element.scrollWidth - element.clientWidth) / 2
    element.scrollTop = 102
  }, [])

  const rememberAnchor = useCallback((clientX: number, clientY: number) => {
    const pages = Array.from(area.current!.querySelectorAll<HTMLElement>('.page-stage'))
    const page = pages.find(p => { const r = p.getBoundingClientRect(); return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom }) || pages[0]
    if (!page) return
    const rect = page.getBoundingClientRect()
    anchor.current = { page, x: (clientX - rect.left) / zoom, y: (clientY - rect.top) / zoom, clientX, clientY }
  }, [zoom])
  useLayoutEffect(() => {
    const a = anchor.current, element = area.current
    if (!a || !element || !a.page.isConnected) return
    const rect = a.page.getBoundingClientRect()
    element.scrollLeft += rect.left + a.x * zoom - a.clientX
    element.scrollTop += rect.top + a.y * zoom - a.clientY
    anchor.current = null
  }, [zoom])
  useEffect(() => {
    const element = area.current!
    function wheel(event: WheelEvent) {
      if (!(event.ctrlKey || event.metaKey) || document.querySelector('dialog[open]')) return
      event.preventDefault()
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientHeight : 1)
      if (!delta) return
      rememberAnchor(event.clientX, event.clientY)
      setZoom(previous => clampZoom(previous * Math.exp(Math.max(-1, Math.min(1, -delta * .002)))))
    }
    element.addEventListener('wheel', wheel, { passive: false })
    return () => element.removeEventListener('wheel', wheel)
  }, [rememberAnchor, setZoom])
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (document.querySelector('dialog[open]') || target?.isContentEditable || target?.closest('input, textarea, select')) return
      const key = event.key.toLowerCase()
      if (event.ctrlKey || event.metaKey) {
        if (key === 'z') { event.preventDefault(); if (event.shiftKey) redo(); else undo() }
        else if (key === 'y') { event.preventDefault(); redo() }
        return
      }
      if (event.altKey) return
      if (key === 'v') { event.preventDefault(); setTool('select') }
      if (key === 'h') { event.preventDefault(); setTool('hand') }
      if (event.code === 'Space' && !target?.closest('button, a, summary')) { event.preventDefault(); setSpace(true) }
    }
    function keyup(event: KeyboardEvent) { if (event.code === 'Space') setSpace(false) }
    function blur() { setSpace(false); pan.current = null; setPanning(false) }
    window.addEventListener('keydown', keydown); window.addEventListener('keyup', keyup); window.addEventListener('blur', blur)
    return () => { window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup); window.removeEventListener('blur', blur) }
  }, [undo, redo])
  function startPan(event: PointerEvent<HTMLElement>) {
    suppressClick.current = false
    if ((!hand && event.button !== 1) || (event.button !== 0 && event.button !== 1)) return
    event.preventDefault(); event.stopPropagation()
    const element = area.current!
    pan.current = { pointer: event.pointerId, x: event.clientX, y: event.clientY, left: element.scrollLeft, top: element.scrollTop }
    suppressClick.current = true; element.setPointerCapture(event.pointerId); setPanning(true); element.focus({ preventScroll: true })
  }
  function endPan(event: PointerEvent<HTMLElement>) {
    if (pan.current?.pointer !== event.pointerId) return
    pan.current = null; setPanning(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  function chooseZoom(value: number) {
    if (value === zoom) return
    const rect = area.current!.getBoundingClientRect()
    rememberAnchor(rect.left + rect.width / 2, rect.top + rect.height / 2); setZoom(clampZoom(value))
  }
  return <div className="canvas-shell">
    <main ref={area} className={`canvas-area ${hand ? 'tool-hand' : 'tool-select'} ${panning ? 'is-panning' : ''}`} aria-label="Área de edição do panfleto" tabIndex={0}
      onPointerDownCapture={startPan} onPointerMove={event => { const p = pan.current; if (!p || p.pointer !== event.pointerId) return; event.preventDefault(); event.currentTarget.scrollLeft = p.left - (event.clientX - p.x); event.currentTarget.scrollTop = p.top - (event.clientY - p.y) }}
      onPointerUp={endPan} onPointerCancel={endPan} onLostPointerCapture={() => { pan.current = null; setPanning(false) }}
      onClickCapture={event => { if (hand || suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false } }}
      onDragStartCapture={event => { if (hand || pan.current) event.preventDefault() }}>
      <div className="canvas-content">{children}</div>
    </main>
    <div className="canvas-hint">{hand ? 'Arraste para navegar' : 'Clique para selecionar · clique na foto para trocar'} · Ctrl + rolagem para zoom</div>
    <div className="floating-tools" role="toolbar" aria-label="Ferramentas do editor">
      <button title="Selecionar (V)" aria-label="Selecionar (V)" aria-pressed={!hand} onClick={() => setTool('select')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 3 14 10-7 1-3 7Z" /></svg></button>
      <button title="Mão (H) · segure Espaço para usar temporariamente" aria-label="Mão (H)" aria-pressed={hand} onClick={() => setTool('hand')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 12V5a2 2 0 0 1 4 0v6-7a2 2 0 0 1 4 0v7-5a2 2 0 0 1 4 0v9c0 5-3 7-7 7-3 0-5-2-7-5l-3-5c-1-2 1-3 3-1l2 2Z" /></svg></button>
      <span className="tool-divider" />
      <button title="Desfazer (Ctrl + Z)" aria-label="Desfazer" disabled={!canUndo} onClick={undo}>↶</button>
      <button title="Refazer (Ctrl + Shift + Z)" aria-label="Refazer" disabled={!canRedo} onClick={redo}>↷</button>
      <span className="tool-divider" />
      <select aria-label="Zoom do canvas" value={zoom} onChange={e => chooseZoom(Number(e.target.value))}>
        <option value={zoom}>{Math.round(zoom * 100)}%</option>
        {[.25,.5,.75,1,1.25,1.5,2,2.5].filter(v => v !== zoom).map(v => <option value={v} key={v}>{v * 100}%</option>)}
      </select>
    </div>
  </div>
}
