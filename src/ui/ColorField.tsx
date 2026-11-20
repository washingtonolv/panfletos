import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Popover } from '@base-ui/react/popover'
import ModernSlider from './ModernSlider'

// AIDF-019: seletor de cor moderno (área saturação/brilho, matiz, amostras e hex).
const SWATCHES = ['#25202b', '#ffffff', '#e91d47', '#0c8ce9', '#3d63d9', '#22c55e', '#f59e0b', '#8b5cf6', '#111111', '#9ca3af']

function hexToHsv(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return [0, 0, 0]
  const n = parseInt(m[1], 16)
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let h = 0
  if (d) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60; if (h < 0) h += 360
  }
  return [h, max ? d / max : 0, max]
}

function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return '#' + [r, g, b].map(q => Math.round((q + m) * 255).toString(16).padStart(2, '0')).join('')
}

type Props = { label: string; value: string; onChange: (hex: string) => void }

export default function ColorField({ label, value, onChange }: Props) {
  // A matiz é guardada à parte: cinza e preto não têm matiz, então ela não pode voltar a 0.
  const [keptHue, setKeptHue] = useState(() => hexToHsv(value)[0])
  const area = useRef<HTMLDivElement>(null)
  const hex = /^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'
  const current = hexToHsv(hex)
  const hue = current[1] === 0 || current[2] === 0 ? keptHue : current[0]

  function commit(nh: number, ns: number, nv: number) {
    setKeptHue(nh)
    onChange(hsvToHex(nh, ns, nv))
  }
  function drag(e: ReactPointerEvent<HTMLDivElement>) {
    const box = area.current?.getBoundingClientRect()
    if (!box) return
    const ns = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width))
    const nv = Math.min(1, Math.max(0, 1 - (e.clientY - box.top) / box.height))
    commit(hue, ns, nv)
  }
  function press(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag(e)
  }

  return <div className="ed-color-field">
    <span className="ed-color-label">{label}</span>
    <Popover.Root>
      <Popover.Trigger className="ed-color-trigger" aria-label={`${label}: ${hex}`}>
        <span className="ed-swatch" style={{ background: hex }} aria-hidden="true" />
        <span>{hex.toUpperCase()}</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="start">
          <Popover.Popup className="ed-color-popup">
            <div ref={area} className="ed-color-area" style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hue} 100% 50%))` }}
              onPointerDown={press} onPointerMove={e => { if (e.buttons) drag(e) }} role="presentation">
              <span className="ed-color-cursor" style={{ left: `${current[1] * 100}%`, top: `${(1 - current[2]) * 100}%`, background: hex }} />
            </div>
            <ModernSlider label="Matiz" value={Math.round(hue)} min={0} max={360} onChange={nh => commit(nh, current[1], current[2])} />
            <div className="ed-swatches" role="list" aria-label="Cores de amostra">
              {SWATCHES.map(c => <button key={c} type="button" role="listitem" className="ed-swatch-btn" style={{ background: c }} aria-label={c} onClick={() => onChange(c)} />)}
            </div>
            <label className="ed-hex-input">Hex<input value={value} onChange={e => { if (/^#[0-9a-f]{6}$/i.test(e.target.value)) onChange(e.target.value) }} /></label>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  </div>
}
