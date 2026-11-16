import type { CSSProperties } from 'react'
import { priceParts } from './block-model'
import type { Product } from './block-model'
import { parsePrice } from './prices'

export function PriceTag({ product: p, index = 0 }: { product: Product; index?: number }) {
  const tag = p.tag || 'wide'
  const parts = priceParts(p.por)
  const sale = parsePrice(p.por), before = parsePrice(p.de, true)
  if (!sale.ok || !before.ok) return <span className="price-tag invalid-price">Revisar preço</span>
  const priceSize = Math.min(40, 84 / (parts.integer.length * .65 + 1.3))
  return <span className={`price-tag tag-${tag}`} style={{ '--price-font': `${priceSize}cqw`, '--price-narrow-font': `${priceSize * .75}cqw`, '--promo-color': p.badgeColor || ['#244cff', '#29b52a', '#a02eef'][index % 3], ...(p.badgeColor ? { '--template-price': p.badgeColor } : {}) } as CSSProperties}>
    <span className="price-top">{tag === 'offer' ? 'Por Apenas' : before.normalized ? `DE: R$ ${before.normalized}` : 'POR APENAS'}</span>
    {tag === 'progressive' && <span className="price-quantity">LEVE {index + 1}</span>}
    <span className="price-value" aria-label={`Por R$ ${sale.normalized}${p.cada ? ' ' + p.cada : ''}`}>
      <small className="price-currency"><span>POR{tag === 'progressive' ? '' : ':'}</span><span>R$</span></small>
      <span className="price-number"><strong>{parts.integer}</strong><span className="price-fraction"><sup>,{parts.cents}</sup>{p.cada && <span className="price-unit">{p.cada}</span>}</span></span>
    </span>
  </span>
}
