import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { useDoc, type Product } from './store'

const norm = (s: unknown) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')
const COLS: Record<keyof Product, string[]> = {
  brand: ['marca', 'brand'],
  name: ['produto', 'nome', 'descricao', 'item'],
  de: ['de', 'precode', 'precooriginal', 'precocheio'],
  por: ['por', 'precopor', 'preco', 'valor', 'promocao'],
  cada: ['cada', 'obs', 'observacao'],
}

function money(v: unknown): string {
  if (typeof v === 'number') return v.toFixed(2).replace('.', ',')
  return String(v ?? '').replace(/R\$\s*/gi, '').trim()
}

export function parseSheet(buf: ArrayBuffer): Product[] {
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '', raw: true })
  const out: Product[] = []
  for (const r of rows) {
    const byKey: Record<string, unknown> = {}
    for (const k of Object.keys(r)) byKey[norm(k)] = r[k]
    const get = (f: keyof Product) => {
      for (const alias of COLS[f]) if (alias in byKey) return byKey[alias]
      return ''
    }
    const p: Product = { brand: String(get('brand')).trim(), name: String(get('name')).trim(), de: money(get('de')), por: money(get('por')), cada: String(get('cada')).trim() }
    if (p.name || p.por) out.push(p)
  }
  return out
}

export default function Products() {
  const { products, setProducts, fillPage, addBlocksForRest } = useDoc()
  const ref = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  const onFile = async (f?: File) => {
    if (!f) return
    try {
      const list = parseSheet(await f.arrayBuffer())
      setProducts(list)
      setMsg(list.length ? `${list.length} produtos lidos de ${f.name}.` : 'Nenhum produto encontrado. Confira os nomes das colunas (Marca, Produto, De, Por, Cada).')
    } catch {
      setMsg('Não consegui ler esse arquivo. Use .xlsx ou .csv.')
    }
  }
  const template = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Marca', 'Produto', 'De', 'Por', 'Cada'],
      ['EUDORA', 'H Colônia Masculina 100ml', 124.9, 74.99, 'cada'],
      ['AVON', 'Supershock Máscara de Cílios 10ml', 29.99, 14.99, ''],
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Produtos')
    XLSX.writeFile(wb, 'modelo-produtos.xlsx')
  }

  return (
    <section className="prod">
      <h3>Produtos (planilha)</h3>
      <div className="row">
        <button onClick={() => ref.current?.click()}>Importar planilha</button>
        <button className="ghost" onClick={template}>Baixar modelo</button>
        <input ref={ref} type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = '' }} />
      </div>
      {msg && <p className="hint">{msg}</p>}
      {products.length > 0 && (
        <>
          <div className="plist">
            {products.map((p, i) => (
              <div key={i} className="pitem">
                <b>{p.brand || '—'}</b> {p.name}
                <span>{p.de ? `de ${p.de} · ` : ''}por {p.por}</span>
              </div>
            ))}
          </div>
          <div className="row">
            <button onClick={() => { const r = fillPage(); setMsg(`${r.filled} cards preenchidos.${r.left ? ` Sobraram ${r.left} produtos sem card.` : ''}`) }}>Preencher cards da página</button>
          </div>
          <div className="row">
            <button className="ghost" onClick={() => { addBlocksForRest(); setMsg('Cards e blocos criados para todos os produtos.') }}>Criar blocos para os que sobram</button>
          </div>
        </>
      )}
    </section>
  )
}
