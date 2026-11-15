import type { CSSProperties, ReactNode } from 'react'
import type { El } from './store'

export const PT_MM = 25.4 / 72 // 1 pt em mm

export function rgba(hex: string, alpha: number) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return hex
  const n = parseInt(m[1], 16)
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${alpha / 100})`
}

const justify = { left: 'flex-start', center: 'center', right: 'flex-end' } as const

function PriceBadge({ el, S, fill }: { el: El; S: number; fill: boolean }) {
  const px = (pt: number) => pt * PT_MM * S
  const pt = el.fontPt
  const radius = el.radius != null ? el.radius * S : px(pt * 1.0)
  return (
    <div
      style={{
        background: rgba(el.color, el.alpha), borderRadius: radius, padding: `${px(pt * 0.3)}px ${px(pt * 0.5)}px`,
        display: 'flex', flexDirection: 'column', alignItems: justify[el.align], justifyContent: fill ? 'center' : 'flex-start',
        gap: px(pt * 0.27), boxSizing: 'border-box', flex: fill ? 1 : 'none', minHeight: 0, overflow: 'hidden',
        fontFamily: `'${el.font}', sans-serif`, width: '100%', height: fill ? '100%' : undefined,
      }}
    >
      {el.de && (
        <span style={{ background: '#fff', color: rgba(el.color, el.alpha), fontSize: px(pt * 0.46), fontWeight: 700, borderRadius: px(pt * 0.5), padding: '.28em .55em', whiteSpace: 'nowrap', lineHeight: 1.1 }}>
          DE: R$ {el.de}
        </span>
      )}
      <span style={{ color: '#fff', fontSize: px(pt * 1.15), fontWeight: el.bold ? 800 : 500, lineHeight: 1.1, whiteSpace: 'nowrap', textAlign: el.align }}>
        R$ {el.price}
        {el.cada && <span style={{ fontSize: px(pt * 0.5), fontWeight: 600, marginLeft: px(pt * 0.25) }}>{el.cada}</span>}
      </span>
    </div>
  )
}

export function ElContent({ el, S }: { el: El; S: number }): ReactNode {
  const px = (pt: number) => pt * PT_MM * S
  if (el.type === 'price') return <PriceBadge el={el} S={S} fill />
  if (el.type === 'text') {
    return (
      <div style={{ width: '100%', height: '100%', color: rgba(el.color, el.alpha), fontFamily: `'${el.font}', sans-serif`, fontWeight: el.bold ? 800 : 500, fontSize: px(el.fontPt), textAlign: el.align, lineHeight: 1.1, whiteSpace: 'pre-wrap' }}>
        {el.text}
      </div>
    )
  }
  if (el.type === 'image') {
    return <img src={el.src} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
  }
  // product: foto + marca + nome + cartão de preço
  const photo: CSSProperties = { flex: 1, minHeight: 0, position: 'relative', borderRadius: 2 * S, overflow: 'hidden', background: `hsl(${el.hue},55%,91%)`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 1.2 * S, fontFamily: `'${el.font}', sans-serif` }}>
      <div style={photo}>
        {el.src ? (
          <img src={el.src} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '22%', height: '70%', marginBottom: '6%', borderRadius: '4px 4px 3px 3px', background: `hsl(${el.hue},42%,60%)` }} />
        )}
        {el.brand && (
          <span style={{ position: 'absolute', left: 1.2 * S, top: 1.2 * S, background: '#6A2C91', color: '#fff', fontSize: px(6), fontWeight: 700, padding: '.2em .55em', borderRadius: 99, lineHeight: 1.1 }}>
            {el.brand}
          </span>
        )}
        {el.seal && (
          <span style={{ position: 'absolute', right: 1.2 * S, top: 1.2 * S, background: '#FFC400', color: '#1F1B24', fontSize: px(6.5), fontWeight: 800, width: 9 * S, height: 9 * S, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: 1 }}>
            {el.seal}
          </span>
        )}
      </div>
      <div style={{ color: '#1F1B24', fontSize: px(Math.max(6, el.fontPt * 0.62)), fontWeight: 600, lineHeight: 1.15, textAlign: el.align, maxHeight: '3.5em', overflow: 'hidden' }}>{el.text}</div>
      <PriceBadge el={el} S={S} fill={false} />
    </div>
  )
}
