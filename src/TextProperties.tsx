import { useState } from 'react'
import { textFonts } from './text-style'
import type { TextStyle } from './text-style'
import ColorField from './ui/ColorField'

type Target = { id: string; label: string; style?: TextStyle; onChange: (style: TextStyle | undefined) => void }
function NumberField({ label, value, min, max, step = 1, onChange }: { label: string; value?: number; min: number; max: number; step?: number; onChange: (value: number | undefined) => void }) {
  return <label>{label}<input key={value ?? 'auto'} type="number" min={min} max={max} step={step} placeholder="Automático" defaultValue={value ?? ''}
    onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }} onBlur={e => {
      const raw = e.currentTarget.value.trim(), n = raw === '' ? undefined : Number(raw)
      if (e.currentTarget.validity.valid && (n === undefined || Number.isFinite(n) && n >= min && n <= max)) { if (n !== value) onChange(n) }
      else e.currentTarget.value = value === undefined ? '' : String(value)
    }} /></label>
}

export default function TextProperties({ targets }: { targets: Target[] }) {
  const [selected, setSelected] = useState(targets[0]?.id)
  const target = targets.find(t => t.id === selected) || targets[0]
  if (!target) return null
  const style = target.style || {}
  function update(patch: Partial<TextStyle>) {
    const next = { ...style, ...patch }
    for (const key of Object.keys(next) as (keyof TextStyle)[]) if (next[key] === undefined) delete next[key]
    target.onChange(Object.keys(next).length ? next : undefined)
  }
  return <section className="ed-group ed-text-properties" aria-label="Propriedades de texto">
    <h3>Texto e tipografia</h3>
    <label>Texto a formatar<select aria-label="Texto a formatar" value={target.id} onChange={e => setSelected(e.target.value)}>{targets.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
    <label>Fonte<select aria-label="Fonte do texto" value={style.fontFamily || ''} onChange={e => update({ fontFamily: e.target.value as TextStyle['fontFamily'] || undefined })}><option value="">Fonte do modelo</option>{textFonts.map(font => <option value={font} key={font}>{font}</option>)}</select></label>
    <div className="ed-two">
      <NumberField key={`${target.id}-size`} label="Tamanho (px)" value={style.fontSize} min={6} max={72} onChange={fontSize => update({ fontSize })} />
      <label>Peso<select aria-label="Peso do texto" value={style.fontWeight || ''} onChange={e => update({ fontWeight: e.target.value ? Number(e.target.value) as TextStyle['fontWeight'] : undefined })}><option value="">Do modelo</option><option value="400">Regular</option><option value="700">Negrito</option><option value="900">Extra forte</option></select></label>
    </div>
    <div className="ed-two">
      <label>Alinhamento<select aria-label="Alinhamento do texto" value={style.textAlign || ''} onChange={e => update({ textAlign: e.target.value as TextStyle['textAlign'] || undefined })}><option value="">Do modelo</option><option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option><option value="justify">Justificado</option></select></label>
      <label>Estilo<button type="button" aria-label="Itálico" aria-pressed={style.fontStyle === 'italic'} onClick={() => update({ fontStyle: style.fontStyle === 'italic' ? 'normal' : 'italic' })}><i>Itálico</i></button></label>
    </div>
    <div className="ed-two">
      <NumberField key={`${target.id}-letters`} label="Entre letras (px)" value={style.letterSpacing} min={-2} max={12} step={.1} onChange={letterSpacing => update({ letterSpacing })} />
      <NumberField key={`${target.id}-lines`} label="Entre linhas" value={style.lineHeight} min={.8} max={3} step={.05} onChange={lineHeight => update({ lineHeight })} />
    </div>
    <div className="ed-color-row"><ColorField label="Cor do texto" value={style.color || '#25202b'} onChange={hex => update({ color: hex })} />{!style.color && <small>Cor do modelo</small>}</div>
    <p className="ed-hint">Automático mantém o modelo. O texto respeita o espaço do bloco; use o zoom para conferir os detalhes.</p>
    <button type="button" disabled={!target.style || !Object.keys(target.style).length} onClick={() => target.onChange(undefined)}>Restaurar estilo deste texto</button>
  </section>
}
