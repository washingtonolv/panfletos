import type { CSSProperties } from 'react'

export const textFonts = ['Arial', 'Verdana', 'Trebuchet MS', 'Georgia', 'Times New Roman', 'Impact'] as const
export type TextStyle = {
  fontFamily?: (typeof textFonts)[number]
  fontSize?: number
  fontWeight?: 400 | 700 | 900
  fontStyle?: 'normal' | 'italic'
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  letterSpacing?: number
  lineHeight?: number
  color?: string
}
export type ProductTextStyles = Partial<Record<'name' | 'brand' | 'label', TextStyle>>
const limits = { fontSize: [6, 72], letterSpacing: [-2, 12], lineHeight: [.8, 3] } as const

export function readTextStyle(value: unknown): TextStyle | undefined {
  if (value === undefined) return undefined
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Propriedades de texto inválidas.')
  const v = value as Record<string, unknown>, result: Record<string, unknown> = {}
  const allowed = ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'textAlign', 'letterSpacing', 'lineHeight', 'color']
  for (const key of Object.keys(v)) if (!allowed.includes(key)) throw new Error('Propriedade de texto desconhecida.')
  for (const [key, range] of Object.entries(limits)) {
    const n = v[key]
    if (n === undefined) continue
    if (typeof n !== 'number' || !Number.isFinite(n) || n < range[0] || n > range[1]) throw new Error('Tamanho ou espaçamento do texto inválido.')
    result[key] = n
  }
  const enums = { fontFamily: textFonts, fontWeight: [400, 700, 900], fontStyle: ['normal', 'italic'], textAlign: ['left', 'center', 'right', 'justify'] }
  for (const [key, values] of Object.entries(enums)) {
    if (v[key] === undefined) continue
    if (!(values as readonly unknown[]).includes(v[key])) throw new Error('Fonte ou alinhamento do texto inválido.')
    result[key] = v[key]
  }
  if (v.color !== undefined) {
    if (typeof v.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(v.color)) throw new Error('Cor do texto inválida.')
    result.color = v.color
  }
  return result as TextStyle
}

export function readProductTextStyles(value: unknown): ProductTextStyles | undefined {
  if (value === undefined) return undefined
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Estilos de produto inválidos.')
  const result: ProductTextStyles = {}
  for (const [key, style] of Object.entries(value)) {
    if (!['name', 'brand', 'label'].includes(key)) throw new Error('Texto do produto desconhecido.')
    result[key as keyof ProductTextStyles] = readTextStyle(style)
  }
  return result
}

export function textCss(style?: TextStyle): CSSProperties | undefined {
  return style ? { ...style, ...(style.textAlign ? { display: 'block', width: '100%' } : {}), ...(style.letterSpacing !== undefined ? { letterSpacing: `${style.letterSpacing}px` } : {}) } : undefined
}
