import { Slider } from '@base-ui/react/slider'

// AIDF-019: slider moderno sobre o Base UI (já instalado). Substitui os inputs range nativos.
type Props = {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  format?: (value: number) => string
}

export default function ModernSlider({ label, value, min, max, step = 1, onChange, format }: Props) {
  return <div className="ed-mslider">
    <div className="ed-mslider-head"><span>{label}</span><output>{format ? format(value) : value}</output></div>
    <Slider.Root value={value} min={min} max={max} step={step} aria-label={label}
      onValueChange={next => onChange(Array.isArray(next) ? next[0] : next)}>
      <Slider.Control className="ed-mslider-control">
        <Slider.Track className="ed-mslider-track">
          <Slider.Indicator className="ed-mslider-fill" />
          <Slider.Thumb className="ed-mslider-thumb" aria-label={label} />
        </Slider.Track>
      </Slider.Control>
    </Slider.Root>
  </div>
}
