import { useState } from 'react'
import type { CSSProperties } from 'react'
import { brandLogos } from './brand-logos'

export default function BrandMark({ logoId, brand, style }: { logoId?: string; brand: string; style?: CSSProperties }) {
  const [failed, setFailed] = useState<string | null>(null)
  const logo = brandLogos.find(item => item.id === logoId)
  return logo && failed !== logo.src ? <span className="product-brand-logo"><img src={logo.src} alt={brand || logo.name} draggable={false} onError={() => setFailed(logo.src)} /></span> : <b style={style}>{brand}</b>
}
