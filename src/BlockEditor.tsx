import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, DragEvent } from 'react'
import { blankProduct, catalog, initialDocument, minHeight, moveBlock, newBlock, normalize, paginate, STORAGE, tags, uid } from './block-model'
import type { Block, Document, Product, Side } from './block-model'
import './block-editor.css'

function PriceTag({ product: p }: { product: Product }) {
  const tag = p.tag || 'wide'
  const priceSize = Math.min(tag === 'offer' || tag === 'before' ? 23 : 18, 88 / ((p.por || '0,00').length * .65 + 1.7))
  return <span className={`price-tag tag-${tag}`} style={{ '--price-font': `${priceSize}cqw` } as CSSProperties}>
    <span className="price-top">{tag === 'offer' ? 'Por Apenas' : p.de ? `De: R$ ${p.de}` : 'Por Apenas'}</span>
    {tag === 'before' && <span className="price-por">Por:</span>}
    <span className="price-value"><small>R$</small><strong>{p.por || '0,00'}</strong></span>
    {p.cada && <span className="price-unit">{p.cada}</span>}
  </span>
}

function FlyerBlock({ block: b, pick, selected, productIndex }: { block: Block; pick?: (index?: number) => void; selected?: boolean; productIndex?: number }) {
  const content = b.kind === 'header' ? <div className="campaign"><small>{b.fields?.[0]?.value}</small><strong>{b.fields?.[1]?.value}</strong><span>✿</span></div>
    : b.kind.startsWith('foot') ? <div className="flyer-footer">{b.fields?.map(f => <span key={f.key}>{f.value}</span>)}</div>
    : <>{b.fields?.length ? <div className="block-title">{b.fields.map(f => f.value).filter(Boolean).join(' · ')}</div> : null}
      <div className="product-grid" style={{ gridTemplateColumns: `repeat(${b.products?.length || 1}, minmax(0, 1fr))` }}>
        {b.products?.map((p, i) => <button type="button" key={i} className={`product-card ${selected && productIndex === i ? 'is-picked' : ''}`}
          aria-label={`Editar produto ${i + 1}: ${p.name}`} onClick={e => { e.stopPropagation(); pick?.(i) }}>
          <span className="product-photo">{p.photo ? <img src={p.photo} alt={p.name} /> : <span className="photo-placeholder">＋<small>Foto</small></span>}</span>
          <span className="product-copy" title={`${p.brand} ${p.name}`}><b>{p.brand}</b><span>{p.name}</span></span>
          <PriceTag product={p} />
        </button>)}
      </div></>
  return <div className={`flyer-block kind-${b.kind} ${selected ? 'is-selected' : ''}`} onClick={() => pick?.()}>{content}</div>
}

function download(data: Document) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const a = document.createElement('a'); a.href = url; a.download = 'panfleto-editavel.json'; a.click(); URL.revokeObjectURL(url)
}

export default function BlockEditor() {
  const [doc, setDoc] = useState(initialDocument)
  const [side, setSide] = useState<Side>('frente')
  const [selected, setSelected] = useState<string | null>(null)
  const [productIndex, setProductIndex] = useState(0)
  const [notice, setNotice] = useState('')
  const [saveError, setSaveError] = useState(false)
  const [zoom, setZoom] = useState(.85)
  const [dragging, setDragging] = useState(false)
  const [over, setOver] = useState<string | null>(null)
  const [history, setHistory] = useState<{ past: Document[]; future: Document[] }>({ past: [], future: [] })
  const [printSides, setPrintSides] = useState<'both' | Side>('both')
  const fileInput = useRef<HTMLInputElement>(null)
  const latestDoc = useRef(doc)
  const blocks = doc[side]
  const current = blocks.find(b => b.id === selected)
  const product = current?.products?.[productIndex]
  const pages = paginate(blocks)
  useEffect(() => { try { localStorage.setItem(STORAGE, JSON.stringify(doc)); setSaveError(false) } catch { setSaveError(true) } }, [doc])

  function commit(next: Document) {
    const previous = latestDoc.current
    latestDoc.current = next
    setHistory(h => ({ past: [...h.past.slice(-19), previous], future: [] })); setDoc(next)
  }
  function changeBlock(fn: (b: Block) => void) {
    if (!current) return
    const next = structuredClone(doc); fn(next[side].find(b => b.id === current.id)!); commit(next)
  }
  function changeProduct(patch: Partial<Product>) { changeBlock(b => { Object.assign(b.products![productIndex], patch) }) }
  function undo() {
    const previous = history.past.at(-1); if (!previous) return
    setHistory({ past: history.past.slice(0, -1), future: [doc, ...history.future] }); latestDoc.current = previous; setDoc(previous)
  }
  function redo() {
    const next = history.future[0]; if (!next) return
    setHistory({ past: [...history.past, doc], future: history.future.slice(1) }); latestDoc.current = next; setDoc(next)
  }
  function pick(id: string, index = 0) { setSelected(id); setProductIndex(index); setNotice('') }
  function insert(index: number, before?: string) {
    if (!Number.isInteger(index) || !catalog[index]) return
    const block = newBlock(index); const next = [...blocks]
    const at = before ? next.findIndex(b => b.id === before) : current ? next.findIndex(b => b.id === current.id) + 1 : next.length
    next.splice(at < 0 ? next.length : at, 0, block); commit({ ...doc, [side]: next }); pick(block.id)
    setNotice('Bloco adicionado. O conteúdo se encaixa automaticamente nas páginas.')
  }
  function beginDrag(e: DragEvent, value: string) { e.dataTransfer.setData('text/plain', value); e.dataTransfer.effectAllowed = 'move'; setDragging(true) }
  function drop(e: DragEvent, before?: string) {
    e.preventDefault(); const value = e.dataTransfer.getData('text/plain'); setDragging(false); setOver(null)
    if (value.startsWith('library:')) insert(Number(value.slice(8)), before)
    else if (value.startsWith('block:')) { commit({ ...doc, [side]: moveBlock(blocks, value.slice(6), before) }); setNotice('Ordem dos blocos atualizada.') }
  }
  function move(delta: number) {
    if (!current) return
    const at = blocks.indexOf(current); const target = at + delta
    if (target < 0 || target >= blocks.length) return
    const next = [...blocks]; [next[at], next[target]] = [next[target], next[at]]; commit({ ...doc, [side]: next })
  }
  async function upload(file: File | undefined) {
    if (!file || !current || !product) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { setNotice('Escolha uma imagem PNG, JPG ou WebP.'); return }
    const id = current.id, index = productIndex, targetSide = side
    try {
      const bitmap = await createImageBitmap(file)
      const ratio = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas'); canvas.width = Math.round(bitmap.width * ratio); canvas.height = Math.round(bitmap.height * ratio)
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close()
      const photo = canvas.toDataURL('image/webp', .86)
      // Use the latest document if the user keeps editing while the image decodes.
      const next = structuredClone(latestDoc.current); const p = next[targetSide].find(b => b.id === id)?.products?.[index]
      if (!p) return
      p.photo = photo; commit(next)
      setNotice('Foto encaixada no espaço do produto.')
    } catch { setNotice('Não foi possível abrir a imagem. Tente outro arquivo.') }
  }

  return <>
    <div className="builder-app" onDragEnd={() => { setDragging(false); setOver(null) }}>
      <header className="app-header"><div className="app-brand"><span>▦</span><div><strong>Monta panfleto</strong><small>Escolha, arraste e edite.</small></div></div>
        <nav aria-label="Lado do panfleto">{(['frente', 'verso'] as Side[]).map(s => <button key={s} aria-pressed={side === s} onClick={() => { setSide(s); setSelected(null) }}>{s === 'frente' ? 'Frente' : 'Verso'}</button>)}</nav>
        <span className={`save-state ${saveError ? 'error' : ''}`}>{saveError ? 'Não foi possível salvar. Baixe o projeto.' : '✓ Salvo neste navegador'}</span>
        <button onClick={() => download(doc)}>Baixar projeto</button><button onClick={() => fileInput.current?.click()}>Abrir projeto</button>
        <input ref={fileInput} hidden type="file" accept=".json,application/json" onChange={async e => { const f = e.target.files?.[0]; if (!f) return; try { const imported = normalize(JSON.parse(await f.text())); commit(imported); setSelected(null); setNotice('Projeto aberto. Você pode desfazer para recuperar o anterior.') } catch { setNotice('Arquivo inválido. Escolha um projeto JSON do editor.') } e.target.value = '' }} />
        <button className="primary" onClick={() => window.print()}>Imprimir / PDF</button>
      </header>
      <div className="builder-workspace">
        <aside className="block-library"><div className="panel-heading"><span className="step">1</span><div><h2>Escolha os blocos</h2><p>Clique para adicionar ou arraste para a página.</p></div></div>
          <div className="library-items">{catalog.map((item, i) => <button className="library-item" key={i} draggable onDragStart={e => beginDrag(e, `library:${i}`)} onClick={() => insert(i)}><span className="block-mini">{Array.from({ length: item.cols || 1 }, (_, k) => <i key={k} />)}</span><span>{item.name}</span><b>＋</b></button>)}</div>
          <h3>Ordem dos blocos</h3><p className="muted">Arraste pela alça ⠿. Também pode usar ↑ e ↓ no painel de edição.</p>
          <ol className="block-order">{blocks.map((b, i) => <li key={b.id} className={over === `list-${b.id}` ? 'drop-active' : ''} onDragOver={e => { e.preventDefault(); setOver(`list-${b.id}`) }} onDrop={e => drop(e, b.id)}><button className={selected === b.id ? 'active' : ''} onClick={() => pick(b.id)}><span draggable aria-label={`Arrastar bloco ${i + 1}`} onDragStart={e => beginDrag(e, `block:${b.id}`)}>⠿</span><small>{i + 1}</small>{b.name}</button></li>)}</ol>
          <div className="order-end" onDragOver={e => e.preventDefault()} onDrop={e => drop(e)}>Solte aqui para mover ao final</div>
        </aside>
        <main className="canvas-area"><div className="canvas-toolbar"><span><b>2</b> Arraste para organizar · clique para editar</span><div><button aria-label="Desfazer" disabled={!history.past.length} onClick={undo}>↶</button><button aria-label="Refazer" disabled={!history.future.length} onClick={redo}>↷</button><button aria-label="Diminuir zoom" onClick={() => setZoom(z => Math.max(.5, z - .1))}>−</button><output>{Math.round(zoom * 100)}%</output><button aria-label="Aumentar zoom" onClick={() => setZoom(z => Math.min(1.5, z + .1))}>＋</button></div></div>
          <div className="status-line" role="status">{notice || `${pages.length} ${pages.length === 1 ? 'página' : 'páginas'} · 153 × 207 mm · encaixe automático`}</div>
          {pages.map((page, pi) => <section className="page-stage" key={pi} style={{ width: 578 * zoom, height: 782 * zoom }} aria-label={`Página ${pi + 1} da ${side}`}><div className="flyer-sheet" style={{ transform: `scale(${zoom})`, gridTemplateRows: page.map(b => `minmax(${minHeight(b)}px, ${Math.max(1, b.h)}fr)`).join(' ') }}>
            {page.map(b => <div key={b.id} data-block-id={b.id} className={`block-slot ${over === b.id ? 'drop-active' : ''}`} onDragOver={e => { e.preventDefault(); setOver(b.id) }} onDrop={e => drop(e, b.id)}>
              <div className="block-controls"><button draggable onDragStart={e => beginDrag(e, `block:${b.id}`)} aria-label={`Arrastar ${b.name}`}>⠿</button><button onClick={() => pick(b.id)}>{b.name}</button></div>
              <FlyerBlock block={b} selected={selected === b.id} productIndex={productIndex} pick={i => pick(b.id, i)} />
            </div>)}
          </div></section>)}
          <div className={`canvas-end ${dragging ? 'ready' : ''}`} onDragOver={e => e.preventDefault()} onDrop={e => drop(e)}>＋ Solte um bloco aqui para adicionar ao final</div>
        </main>
        <aside className="edit-panel"><div className="panel-heading"><span className="step">3</span><div><h2>Edite o conteúdo</h2><p>Foto, nome e preço. O restante se encaixa.</p></div></div>
          {!current ? <div className="empty-panel"><span>↖</span><h3>Clique em um produto</h3><p>Ou selecione um bloco para editar o cabeçalho e o rodapé.</p><div className="auto-note">Tudo alinhado automaticamente.<br />Sem mover ou redimensionar etiquetas.</div></div> : <>
            <h3>{current.name}</h3><div className="block-actions"><button disabled={blocks.indexOf(current) === 0} onClick={() => move(-1)}>↑ Subir</button><button disabled={blocks.indexOf(current) === blocks.length - 1} onClick={() => move(1)}>↓ Descer</button><button onClick={() => { const copy = structuredClone(current); copy.id = uid(); const next = [...blocks]; next.splice(blocks.indexOf(current) + 1, 0, copy); commit({ ...doc, [side]: next }); pick(copy.id) }}>Duplicar</button><button className="danger" onClick={() => { commit({ ...doc, [side]: blocks.filter(b => b.id !== current.id) }); setSelected(null); setNotice('Bloco removido. Use Desfazer para recuperá-lo.') }}>Excluir bloco</button></div>
            {current.fields?.map((f, i) => <label key={f.key}>{f.label}<input value={f.value} onChange={e => changeBlock(b => { b.fields![i].value = e.target.value })} /></label>)}
            {current.products?.length ? <>
              <div className="product-tabs" aria-label="Escolher produto">{current.products.map((_, i) => <button key={i} aria-pressed={productIndex === i} onClick={() => setProductIndex(i)}>{i + 1}</button>)}<button aria-label="Adicionar produto" disabled={current.products.length >= 5} onClick={() => { const index = current.products!.length; changeBlock(b => { b.products!.push(blankProduct()); b.cols = b.products!.length }); setProductIndex(index) }}>＋</button></div>
              {product && <><label className="upload-box" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); void upload(e.dataTransfer.files[0]) }}>{product.photo ? <img src={product.photo} alt="Foto do produto selecionado" /> : <span>＋</span>}<b>{product.photo ? 'Trocar foto' : 'Adicionar foto'}</b><small>Arraste a foto aqui ou clique · PNG, JPG, WebP</small><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => { void upload(e.target.files?.[0]); e.target.value = '' }} /></label>
                {product.photo && <button onClick={() => changeProduct({ photo: undefined })}>Remover foto</button>}
                <label>Marca<input value={product.brand} onChange={e => changeProduct({ brand: e.target.value })} /></label>
                <label>Nome do produto<textarea rows={3} value={product.name} onChange={e => changeProduct({ name: e.target.value })} /></label>
                <div className="price-fields"><label>De (R$)<input inputMode="decimal" value={product.de} onChange={e => changeProduct({ de: e.target.value })} /></label><label>Por (R$)<input inputMode="decimal" value={product.por} onChange={e => changeProduct({ por: e.target.value })} /></label></div>
                <label>Complemento<input placeholder="Ex.: cada, unidade, kit" value={product.cada} onChange={e => changeProduct({ cada: e.target.value })} /></label>
                <h3>Etiqueta de preço</h3><p className="muted">Os quatro modelos das suas referências.</p><div className="tag-options">{tags.map(t => <button key={t.id} aria-pressed={(product.tag || 'wide') === t.id} onClick={() => changeProduct({ tag: t.id })}><PriceTag product={{ ...product, tag: t.id, por: '129,90', de: '159,90', cada: 'cada' }} /><span>{t.name}</span></button>)}</div>
                <button className="full" onClick={() => changeBlock(b => { b.products!.forEach(p => { p.tag = product.tag || 'wide' }) })}>Aplicar etiqueta ao bloco</button>
                <button className="danger full" disabled={current.products.length <= 1} onClick={() => { changeBlock(b => { b.products!.splice(productIndex, 1); b.cols = b.products!.length }); setProductIndex(Math.max(0, productIndex - 1)) }}>Remover este produto</button>
              </>}
            </> : null}
          </>}
          <details className="print-options"><summary>Impressão / PDF</summary><label>Páginas para imprimir<select value={printSides} onChange={e => setPrintSides(e.target.value as typeof printSides)}><option value="both">Frente e verso</option><option value="frente">Só frente</option><option value="verso">Só verso</option></select></label><p>Escolha “Salvar como PDF”, escala 100%, sem margens e com gráficos de fundo na janela de impressão. Sem sangria.</p></details>
        </aside>
      </div>
    </div>
    <div className="print-document">{(['frente', 'verso'] as Side[]).filter(s => printSides === 'both' || printSides === s).flatMap(s => paginate(doc[s]).map((page, pi) => <div key={`${s}-${pi}`} className="flyer-sheet" style={{ gridTemplateRows: page.map(b => `minmax(${minHeight(b)}px, ${Math.max(1, b.h)}fr)`).join(' ') }}>{page.map(b => <FlyerBlock key={b.id} block={b} />)}</div>))}</div>
  </>
}
