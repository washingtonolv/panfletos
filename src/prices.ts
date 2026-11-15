import type { Document, Side } from './block-model.ts'

export type PriceResult = { ok: true; cents: number | null; normalized: string } | { ok: false; message: string }
const formatHelp = 'Use um valor não negativo com até 2 casas decimais, como 19,90 ou 1.299,90.'

export function parsePrice(value: unknown, optional = false): PriceResult {
  if (typeof value !== 'string') return { ok: false, message: formatHelp }
  if (!value.trim()) return optional ? { ok: true, cents: null, normalized: '' } : { ok: false, message: 'Informe o preço Por.' }
  const clean = value.trim().replace(/^R\$\s*/, '')
  // A lone dot followed by three digits is a Brazilian thousands separator.
  // Decimal dots are accepted only with one or two fractional digits.
  let integer: string, fraction: string
  if (/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(clean)) {
    const parts = clean.split(','); integer = parts[0].replaceAll('.', ''); fraction = parts[1] ?? ''
  } else if (/^\d+\.\d{1,2}$/.test(clean)) {
    ;[integer, fraction] = clean.split('.')
  } else return { ok: false, message: formatHelp }
  // Work in integer cents: never round an invalid third decimal or use parseFloat.
  integer = integer.replace(/^0+(?=\d)/, '')
  if (integer.length > 14) return { ok: false, message: 'Preço acima do limite de precisão suportado.' }
  const cents = BigInt(integer) * 100n + BigInt(fraction.padEnd(2, '0'))
  if (cents > BigInt(Number.MAX_SAFE_INTEGER)) return { ok: false, message: 'Preço acima do limite de precisão suportado.' }
  const normalized = BigInt(integer).toLocaleString('pt-BR') + ',' + fraction.padEnd(2, '0')
  return { ok: true, cents: Number(cents), normalized }
}

export type PriceIssue = { side: Side; blockId: string; blockIndex: number; productIndex: number; field: 'de' | 'por'; message: string }
export function priceIssues(doc: Document, sides: Side[] = ['frente', 'verso']): PriceIssue[] {
  const issues: PriceIssue[] = []
  for (const side of sides) doc[side].forEach((block, blockIndex) => block.products?.forEach((product, productIndex) => {
    for (const field of ['de', 'por'] as const) {
      const result = parsePrice(product[field], field === 'de')
      if (!result.ok) issues.push({ side, blockId: block.id, blockIndex, productIndex, field, message: result.message })
    }
  }))
  return issues
}
