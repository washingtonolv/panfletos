import { useState } from 'react'
import { brandLogos } from './brand-logos'

export default function BrandMark({ logoId, brand }: { logoId?: string; brand: string }) {
  const [failed, setFailed] = useState<string | null>(null)
  const logo = brandLogos.find(item => item.id === logoId)
  return logo && failed !== logo.src ? <span className="product-brand-logo"><img src={logo.src} alt={brand || logo.name} draggable={false} onError={() => setFailed(logo.src)} /></span> : <b>{brand}</b>
}
