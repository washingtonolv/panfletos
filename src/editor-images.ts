import type { Document, Side } from './block-model.ts'

export type ImageTarget = { side: Side; blockId: string; productIndex?: number; signature: string }
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024
export function imageTarget(doc: Document, side: Side, blockId: string, productIndex?: number): ImageTarget | undefined {
  const block = doc[side].find(b => b.id === blockId)
  if (!block || (productIndex === undefined ? !['header', 'footsite', 'footpay'].includes(block.kind) : !block.products?.[productIndex])) return
  return { side, blockId, productIndex, signature: JSON.stringify(block) }
}
// Reject stale uploads, including product index shifts while decoding the file.
export function applyImage(doc: Document, target: ImageTarget, image: string): Document | undefined {
  const block = doc[target.side].find(b => b.id === target.blockId)
  if (!block || JSON.stringify(block) !== target.signature) return
  const next = structuredClone(doc), updated = next[target.side].find(b => b.id === target.blockId)!
  if (target.productIndex === undefined) updated.image = image
  else updated.products![target.productIndex].photo = image
  return next
}
