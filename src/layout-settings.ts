export const formats = {
  '153x207': { width: 578, height: 782, widthMm: 153, heightMm: 207, label: '15,3 × 20,7 cm' },
  '185x270': { width: 699, height: 1020, widthMm: 185, heightMm: 270, label: '18,5 × 27 cm' },
} as const
export type Layout = { format: keyof typeof formats; name: string; accent: string; priceColor: string; background: string }
export type Appearance = { minHeight: number; vertical: boolean }
export const isColor = (value: unknown): value is string => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
export function readLayout(value: unknown): Layout | undefined {
  if (value === undefined) return undefined
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Configuração do modelo inválida.')
  const v = value as Layout
  if (!Object.hasOwn(formats, v.format) || typeof v.name !== 'string' || v.name.length > 120 || !isColor(v.accent) || !isColor(v.priceColor) || !isColor(v.background)) throw new Error('Formato ou cores do modelo inválidos.')
  return { format: v.format, name: v.name, accent: v.accent, priceColor: v.priceColor, background: v.background }
}
export function readAppearance(value: unknown): Appearance | undefined {
  if (value === undefined) return undefined
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Aparência do bloco inválida.')
  const v = value as Appearance
  if (typeof v.minHeight !== 'number' || !Number.isFinite(v.minHeight) || v.minHeight < 60 || v.minHeight > 300 || typeof v.vertical !== 'boolean') throw new Error('Altura ou orientação do bloco inválida.')
  return { minHeight: v.minHeight, vertical: v.vertical }
}
