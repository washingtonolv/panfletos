import { useState } from 'react'
import { FONTS, PALETTE, useDoc, type El, type Scope, type Style } from './store'

const SIZES = [6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64]
const nextSize = (cur: number, dir: 1 | -1) =>
  dir > 0 ? SIZES.find((s) => s > cur) ?? cur : [...SIZES].reverse().find((s) => s < cur) ?? cur

const SCOPES: [Scope, string][] = [['one', 'Item'], ['line', 'Linha'], ['page', 'Página']]

export default function FloatBar({ el }: { el: El }) {
  const { scope, setScope, style, resetStyle, remove } = useDoc()
  const [mode, setMode] = useState<'text' | 'shape'>('text')
  const isPrice = el.type === 'price' || el.type === 'product'
  const st = (p: Partial<Style>) => style(el.id, p)
  const m = isPrice ? mode : 'text'
  const [hex, setHex] = useState(el.color)
  const hexVal = /^#[0-9a-f]{6}$/i.test(hex) ? hex : el.color

  return (
    <div className="fbar" onMouseDown={(e) => e.stopPropagation()}>
      <div className="fb-row">
        {isPrice && (
          <div className="seg">
            <button className={m === 'text' ? 'on' : ''} onClick={() => setMode('text')}>Texto</button>
            <button className={m === 'shape' ? 'on' : ''} onClick={() => setMode('shape')}>Forma</button>
          </div>
        )}
        <span className="lbl">Aplicar a</span>
        <div className="seg">
          {SCOPES.map(([k, l]) => (
            <button key={k} className={scope === k ? 'on' : ''} onClick={() => setScope(k)}>{l}</button>
          ))}
        </div>
        <button className="ghost" onClick={() => resetStyle(el.id)}>Restaurar</button>
        <button className="ghost danger" onClick={() => remove(el.id)}>Excluir</button>
      </div>
      {el.type !== 'image' && m === 'text' && (
        <div className="fb-row">
          <select value={el.font} onChange={(e) => st({ font: e.target.value })} style={{ fontFamily: `'${el.font}'` }}>
            {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <div className="seg">
            <button onClick={() => st({ fontPt: nextSize(el.fontPt, -1) })}>A−</button>
            <input className="num" type="number" min={4} max={120} value={el.fontPt} onChange={(e) => { const v = +e.target.value; if (v >= 4 && v <= 120) st({ fontPt: v }) }} />
            <button onClick={() => st({ fontPt: nextSize(el.fontPt, 1) })}>A+</button>
          </div>
          <button className={'tg' + (el.bold ? ' on' : '')} onClick={() => st({ bold: !el.bold })} title="Negrito"><b>B</b></button>
          <div className="seg">
            {(['left', 'center', 'right'] as const).map((a) => (
              <button key={a} className={el.align === a ? 'on' : ''} onClick={() => st({ align: a })} title={a}>{a === 'left' ? '⇤' : a === 'center' ? '↔' : '⇥'}</button>
            ))}
          </div>
        </div>
      )}
      {el.type !== 'image' && (m === 'shape' || el.type === 'text') && (
        <div className="fb-row">
          <span className="lbl">{el.type === 'text' ? 'Cor do texto' : 'Cor do cartão'}</span>
          {PALETTE.map((c) => (
            <button key={c} className="sw" style={{ background: c }} title={c} onClick={() => { setHex(c); st({ color: c }) }} />
          ))}
          <input type="color" value={hexVal} onChange={(e) => { setHex(e.target.value); st({ color: e.target.value }) }} />
          <input className="hex" value={hex} onChange={(e) => { setHex(e.target.value); if (/^#[0-9a-f]{6}$/i.test(e.target.value)) st({ color: e.target.value }) }} />
          <input className="num" type="number" min={0} max={100} value={el.alpha} onChange={(e) => st({ alpha: Math.max(0, Math.min(100, +e.target.value)) })} title="Opacidade %" />
          <span className="lbl">%</span>
          {isPrice && m === 'shape' && (
            <>
              <span className="lbl">Cantos</span>
              <input className="num" type="number" min={0} max={20} step={0.5} value={el.radius ?? ''} placeholder="auto" onChange={(e) => st({ radius: e.target.value === '' ? null : Math.max(0, +e.target.value) })} />
              <span className="lbl">mm</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
