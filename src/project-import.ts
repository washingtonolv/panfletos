import { normalize, tags, readAdjustment } from './block-model.ts'
import type { Document } from './block-model.ts'
import { parsePrice } from './prices.ts'
import { readLayout, readAppearance, isColor } from './layout-settings.ts'
import { validLogoId } from './logo-id.ts'
import { readTextStyle, readProductTextStyles } from './text-style.ts'

export const MAX_PROJECT_BYTES = 50 * 1024 * 1024

export class ProjectImportError extends Error {}

function fail(path: string, reason: string): never {
  throw new ProjectImportError(`${path}: ${reason}`)
}
function record(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, 'esperado um objeto.')
  return value as Record<string, unknown>
}
function text(value: unknown, path: string): string {
  if (typeof value !== 'string') fail(path, 'esperado um texto.')
  return value
}
function identifier(value: unknown, path: string, used: Set<string>) {
  const id = text(value, path)
  if (!id.trim()) fail(path, 'identificador vazio.')
  if (used.has(id)) fail(path, 'identificador repetido.')
  used.add(id)
}
function validPhoto(value: unknown, path: string) {
  const photo = text(value, path)
  const data = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(photo)
  if (data && data[2].length % 4 === 0) {
    try { atob(data[2]); return } catch { /* Invalid base64. */ }
  }
  try {
    const url = new URL(photo)
    if (/^https?:\/\/[^\s]+$/.test(photo) && url.hostname && !url.username && !url.password) return
  } catch { /* Report a validation error, never silently discard the photo. */ }
  fail(path, 'use uma foto PNG/JPEG/WebP em base64 ou um endereço HTTP/HTTPS válido sem credenciais.')
}

// Validate the complete file before normalization or any editor/storage mutation.
// Extra historical metadata is ignored by normalize; known fields are never coerced.
export function validateProject(value: unknown): Document {
  const input = record(value, 'Projeto')
  try { readLayout(input.layout) } catch (error) { fail('Projeto', (error as Error).message) }
  if (input.pageBackground !== undefined && !isColor(input.pageBackground)) fail('Projeto', 'cor de fundo do panfleto inválida.')
  const ids = new Set<string>()
  for (const side of ['frente', 'verso'] as const) {
    const blocks = input[side]
    if (!Array.isArray(blocks)) fail(side, 'esperada uma lista de blocos.')
    blocks.forEach((value, index) => {
      const path = `${side}, bloco ${index + 1}`
      const block = record(value, path)
      try { readAppearance(block.appearance) } catch (error) { fail(path, (error as Error).message) }
      try { readAdjustment(block.imageAdjustment) } catch { fail(path, 'ajuste de imagem inválido.') }
      identifier(block.id, `${path}, id`, ids)
      if (typeof block.kind !== 'string' || !['header', 'hero3', 'hero2', 'row', 'footsite', 'footpay'].includes(block.kind)) fail(path, 'tipo de bloco desconhecido.')
      if (block.image !== undefined) {
        if (!['header', 'footsite', 'footpay'].includes(block.kind)) fail(path, 'imagem de bloco só é permitida em cabeçalhos e rodapés.')
        validPhoto(block.image, `${path}, imagem`)
      }
      if (block.imageFit !== undefined && (!['header', 'footsite', 'footpay'].includes(block.kind) || !['contain', 'cover'].includes(block.imageFit as string))) fail(path, 'ajuste da imagem inválido.')
      text(block.name, `${path}, nome`)
      if (typeof block.h !== 'number' || !Number.isFinite(block.h) || block.h <= 0) fail(path, 'altura deve ser um número positivo e finito.')
      const hasProducts = ['hero3', 'hero2', 'row'].includes(block.kind as string)
      if (hasProducts) {
        if (!Array.isArray(block.products) || block.products.length < 1 || block.products.length > 5) fail(path, 'o bloco deve conter de 1 a 5 produtos.')
        if (block.cols !== undefined && (!Number.isInteger(block.cols) || block.cols !== block.products.length)) fail(path, 'a quantidade de colunas deve corresponder aos produtos.')
        block.products.forEach((value, pi) => {
          const pp = `${path}, produto ${pi + 1}`
          const product = record(value, pp)
          try { readProductTextStyles(product.textStyles) } catch (error) { fail(pp, (error as Error).message) }
          if (product.brandLogo !== undefined && !validLogoId(product.brandLogo)) fail(pp, 'identificador da logo inválido.')
          try { readAdjustment(product.photoAdjustment) } catch { fail(pp, 'ajuste de foto inválido.') }
          if (product.badgeColor !== undefined && !isColor(product.badgeColor)) fail(pp, 'cor da etiqueta inválida.')
          if (product.label !== undefined) text(product.label, `${pp}, chamada`)
          for (const [key, label] of [['brand', 'marca'], ['name', 'nome'], ['de', 'preço de'], ['por', 'preço por'], ['cada', 'complemento']]) text(product[key], `${pp}, ${label}`)
          for (const field of ['de', 'por'] as const) {
            const price = parsePrice(product[field], field === 'de')
            if (!price.ok) fail(`${pp}, preço ${field === 'de' ? 'De' : 'Por'}`, price.message)
          }
          if (product.tag !== undefined && !tags.some(tag => tag.id === product.tag)) fail(pp, 'modelo de etiqueta desconhecido.')
          if (product.photo !== undefined) validPhoto(product.photo, `${pp}, foto`)
        })
      } else {
        if (block.products !== undefined && (!Array.isArray(block.products) || block.products.length !== 0)) fail(path, 'cabeçalhos e rodapés não podem conter produtos.')
        if (block.cols !== undefined && block.cols !== 0) fail(path, 'cabeçalhos e rodapés não podem conter colunas de produtos.')
      }
      if (block.fields !== undefined) {
        if (!Array.isArray(block.fields)) fail(path, 'os campos devem ser uma lista.')
        const keys = new Set<string>()
        block.fields.forEach((value, fi) => {
          const fp = `${path}, campo ${fi + 1}`
          const field = record(value, fp)
          try { readTextStyle(field.style) } catch (error) { fail(fp, (error as Error).message) }
          identifier(field.key, `${fp}, chave`, keys)
          text(field.label, `${fp}, rótulo`)
          text(field.value, `${fp}, valor`)
        })
      }
      if (!hasProducts && (!Array.isArray(block.fields) || block.fields.length < (block.kind === 'header' ? 2 : 1))) fail(path, 'faltam campos de texto do cabeçalho ou rodapé.')
    })
  }
  return normalize(input)
}

export function parseProject(text: string): Document {
  if (text.length > MAX_PROJECT_BYTES || new TextEncoder().encode(text).byteLength > MAX_PROJECT_BYTES) throw new ProjectImportError('O arquivo excede o limite de 50 MiB.')
  let value: unknown
  try { value = JSON.parse(text.replace(/^\uFEFF/, '')) }
  catch { throw new ProjectImportError('O arquivo não contém um JSON válido.') }
  return validateProject(value)
}
