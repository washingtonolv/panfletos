import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, DragEvent } from 'react'
import { blankProduct, catalog, loadDraft, resolveDraftRecovery, saveDraft, minHeight, moveBlock, newBlock, paginate, priceParts, tags, uid } from './block-model'
import type { ImageAdjustment, Block, Document, Product, Side } from './block-model'
import './block-editor.css'
import './brand-logo-styles.css'
import './editor-dark.css'
import { MAX_PROJECT_BYTES, parseProject, ProjectImportError } from './project-import'
import { parsePrice, priceIssues } from './prices'
import { formats } from './layout-settings'
import { replaceDraft } from './draft-library'
import TemplateGallery from './TemplateGallery'
import CanvasViewport from './CanvasViewport'
import { applyImage, imageTarget, MAX_IMAGE_BYTES } from './editor-images'
import type { ImageTarget } from './editor-images'
import BrandMark from './BrandMark'
import BrandLogoPicker from './BrandLogoPicker'

const EDITOR_THEME_KEY = 'panfletos:editor:theme'
function savedEditorTheme(): boolean {
  try { return localStorage.getItem(EDITOR_THEME_KEY) === 'dark' } catch { return false }
}

function imageStyle(a?: ImageAdjustment): CSSProperties { return { transform: `translate(${a?.x || 0}%, ${a?.y || 0}%) scale(${a?.scale || 1})`, transformOrigin: 'center' } }
function PriceTag({ product: p, index = 0 }: { product: Product; index?: number }) {
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

function FlyerBlock({ block: b, pick, selected, productIndex, imagePick, imageDrop }: { block: Block; pick?: (index?: number) => void; selected?: boolean; productIndex?: number; imagePick?: (index?: number) => void; imageDrop?: (file: File, index?: number) => void }) {
  const artwork = ['header', 'footsite', 'footpay'].includes(b.kind)
  const content = artwork && b.image ? <div className="block-artwork"><img src={b.image} alt={b.kind === 'header' ? 'Imagem do cabeçalho' : 'Imagem do rodapé'} draggable={false} style={{ ...imageStyle(b.imageAdjustment), objectFit: b.imageFit || 'contain' }} /></div>
    : b.kind === 'header' ? <div className="campaign"><small>{b.fields?.[0]?.value}</small><strong>{b.fields?.[1]?.value}</strong><span>✿</span></div>
    : b.kind.startsWith('foot') ? <div className="flyer-footer">{b.fields?.map(f => <span key={f.key}>{f.value}</span>)}</div>
    : <>{b.fields?.length ? <div className="block-title">{b.fields.map(f => f.value).filter(Boolean).join(' · ')}</div> : null}
      <div className="product-grid" style={{ gridTemplateColumns: `repeat(${b.products?.length || 1}, minmax(0, 1fr))` }}>
        {b.products?.map((p, i) => <button type="button" key={i} className={`product-card ${selected && productIndex === i ? 'is-picked' : ''}`}
          aria-label={`Editar produto ${i + 1}: ${p.name}`} onClick={e => { e.stopPropagation(); if ((e.target as HTMLElement).closest('.product-photo') && imagePick) imagePick(i); else pick?.(i) }}
          onDragOver={e => { if (imageDrop && e.dataTransfer.types.includes('Files')) { e.preventDefault(); e.stopPropagation() } }} onDrop={e => { const file = e.dataTransfer.files[0]; if (file && imageDrop) { e.preventDefault(); e.stopPropagation(); imageDrop(file, i) } }}>
          <span className="product-photo" title={imagePick ? (p.photo ? 'Clique para trocar a foto. Remova pelo painel de edição.' : 'Clique para adicionar foto') : undefined}>{p.photo ? <><img src={p.photo} alt={p.name} draggable={false} style={imageStyle(p.photoAdjustment)} />{imagePick && <span className="photo-action-hint">Trocar foto</span>}</> : <span className="photo-placeholder"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg></span>}</span>
          <span className="product-copy" title={`${p.brand} ${p.name}`}>{p.label && <em className="product-label">{p.label}</em>}<BrandMark logoId={p.brandLogo} brand={p.brand} /><span>{p.name}</span></span>
          <PriceTag product={p} index={i} />
        </button>)}
      </div></>
  const hasLargeTags = b.products?.some(p => p.tag === 'offer' || p.tag === 'before')
  return <div className={`flyer-block kind-${b.kind} ${b.kind !== 'hero3' && !b.appearance?.vertical ? 'side-by-side' : ''} ${b.appearance ? 'template-block' : ''} ${hasLargeTags ? 'has-large-tags' : ''} ${selected ? 'is-selected' : ''}`} onClick={() => pick?.()}
    onDragOver={e => { if (artwork && imageDrop && e.dataTransfer.types.includes('Files')) { e.preventDefault(); e.stopPropagation() } }}
    onDrop={e => { const file = e.dataTransfer.files[0]; if (artwork && file && imageDrop) { e.preventDefault(); e.stopPropagation(); imageDrop(file) } }}>
    {content}{artwork && imagePick && <button className="block-image-action" onClick={e => { e.stopPropagation(); imagePick() }}>{b.image ? 'Trocar imagem' : '＋ Adicionar imagem'}</button>}
  </div>
}

function sheetStyle(doc: Document): CSSProperties {
  const size = formats[doc.layout?.format || '153x207']
  return { '--sheet-width': `${size.width}px`, '--sheet-height': `${size.height}px`, '--sheet-width-mm': `${size.widthMm}mm`, '--sheet-height-mm': `${size.heightMm}mm`, ...(doc.layout ? { '--template-accent': doc.layout.accent, '--template-price': doc.layout.priceColor, '--template-background': doc.layout.background } : {}) } as CSSProperties
}
function templatePreview(doc: Document, side: Side, width: number) {
  const size = formats[doc.layout?.format || '153x207'], scale = width / size.width
  const page = paginate(doc[side], size.height)[0]
  return <div className="template-preview" style={{ width, height: size.height * scale }}><div className="flyer-sheet themed-sheet" style={{ ...sheetStyle(doc), transform: `scale(${scale})`, gridTemplateRows: page.map(b => `minmax(${minHeight(b)}px, ${Math.max(1, b.h)}fr)`).join(' ') }}>{page.map(b => <FlyerBlock key={b.id} block={b} />)}</div></div>
}

function downloadText(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
function download(data: Document) { downloadText(JSON.stringify(data, null, 2), 'panfleto-editavel.json') }

export default function BlockEditor() {
  const [darkMode, setDarkMode] = useState(savedEditorTheme)
  const [draft, setDraft] = useState(loadDraft)
  const [doc, setDoc] = useState(draft.document)
  const [recoveryError, setRecoveryError] = useState('')
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
  const [galleryOpen, setGalleryOpen] = useState(false)
  const lastSaved = useRef<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const latestDoc = useRef(doc)
  const importRequest = useRef(0)
  const pictureInput = useRef<HTMLInputElement>(null)
  const pictureTarget = useRef<ImageTarget | undefined>(undefined)
  const imageEpoch = useRef(0)
  const imageRequests = useRef(new Map<string, number>())
  const blocks = doc[side]
  const current = blocks.find(b => b.id === selected)
  const product = current?.products?.[productIndex]
  const size = formats[doc.layout?.format || '153x207']
  const pages = paginate(blocks, size.height)
  const issues = priceIssues(doc)
  const printIssues = priceIssues(doc, printSides === 'both' ? ['frente', 'verso'] : [printSides])
  const deResult = product ? parsePrice(product.de, true) : null
  const porResult = product ? parsePrice(product.por) : null
  useEffect(() => {
    document.documentElement.dataset.editorTheme = darkMode ? 'dark' : 'light'
    return () => { delete document.documentElement.dataset.editorTheme }
  }, [darkMode])
  function toggleDarkMode() {
    const next = !darkMode
    setDarkMode(next)
    try { localStorage.setItem(EDITOR_THEME_KEY, next ? 'dark' : 'light') } catch { setNotice('Tema aplicado nesta sessão. O navegador não permitiu salvar a preferência.') }
  }
  useEffect(() => { try { if (saveDraft(doc, draft)) { lastSaved.current = JSON.stringify(doc); setSaveError(false) } } catch { setSaveError(true) } }, [doc, draft])

  function recover(choice: 'recovered' | 'new') {
    const message = choice === 'new'
      ? 'Começar um novo documento com o modelo inicial? O original será guardado em uma cópia local de recuperação antes de salvar.'
      : 'Usar a versão anterior recuperada? O original que falhou será guardado em uma cópia local de recuperação antes de salvar.'
    if (!window.confirm(message)) return
    try {
      const next = resolveDraftRecovery(draft, choice)
      latestDoc.current = next.document; setDoc(next.document); setDraft(next); setRecoveryError('')
    } catch { setRecoveryError('Não foi possível guardar a cópia de recuperação. O salvamento continua bloqueado. Baixe os originais e tente novamente.') }
  }

  if (!draft.canSave) return <main className="draft-recovery" aria-labelledby="recovery-title">
    <h1 id="recovery-title">Precisamos recuperar seu rascunho</h1>
    <p role="alert">Não foi possível abrir o rascunho salvo. Nenhum original foi substituído. O salvamento automático está bloqueado.</p>
    <p>{draft.sourceKey ? 'Encontramos uma versão anterior que pode ser recuperada.' : 'Você pode tentar novamente ou começar com o modelo inicial após guardar uma cópia do original.'}</p>
    <div className="recovery-actions">{draft.failures.map((failure, i) => failure.raw !== null
      ? <button key={failure.key} onClick={() => downloadText(failure.raw!, `panfleto-original-${i + 1}.json`)}>Baixar original {i + 1}</button>
      : <p key={failure.key}>O navegador não permitiu ler o armazenamento. Não foi possível acessar o original para download.</p>)}</div>
    {recoveryError && <p role="alert">{recoveryError}</p>}
    <div className="recovery-actions">
      {draft.sourceKey && <button className="primary" onClick={() => recover('recovered')}>Usar versão recuperada</button>}
      <button onClick={() => recover('new')} disabled={draft.failures.some(f => f.raw === null)}>Começar novo documento</button>
      <button onClick={() => { const next = loadDraft(); latestDoc.current = next.document; setDoc(next.document); setDraft(next); setRecoveryError('') }}>Tentar novamente</button>
    </div>
    <p>Baixe o original antes de continuar para também ter uma cópia fora deste navegador. O arquivo pode precisar de reparo para abrir.</p>
  </main>

  function commit(next: Document) {
    const previous = latestDoc.current
    latestDoc.current = next
    setHistory(h => ({ past: [...h.past.slice(-19), previous], future: [] })); setDoc(next)
  }
  function useTemplate(next: Document) {
    try { replaceDraft(latestDoc.current, next, lastSaved.current) }
    catch (reason) {
      if (reason instanceof Error && reason.message.includes('outra aba')) throw reason
      throw new Error('Não foi possível guardar a cópia e salvar o novo projeto. Baixe o rascunho atual e libere espaço no navegador antes de tentar novamente.')
    }
    lastSaved.current = JSON.stringify(next)
    ++importRequest.current; ++imageEpoch.current
    commit(next); setSide('frente'); setSelected(null); setProductIndex(0); setPrintSides(next.verso.length ? 'both' : 'frente'); setGalleryOpen(false)
    setNotice('Projeto aberto. O anterior está em + Novo → Rascunhos guardados. Você também pode desfazer.')
  }
  async function importProject(input: HTMLInputElement) {
    const file = input.files?.[0]
    if (!file) return
    const request = ++importRequest.current
    const previous = latestDoc.current
    input.value = '' // The same invalid file can be selected again after repair.
    try {
      if (file.size > MAX_PROJECT_BYTES) throw new ProjectImportError('O arquivo excede o limite de 50 MiB.')
      const imported = parseProject(await file.text())
      if (request !== importRequest.current) return
      if (latestDoc.current !== previous) throw new ProjectImportError('O documento mudou durante a leitura. Abra o arquivo novamente para confirmar a substituição.')
      ++imageEpoch.current; commit(imported); setSelected(null); setNotice('Projeto aberto. Você pode desfazer para recuperar o anterior.')
    } catch (error) {
      if (request !== importRequest.current) return
      const reason = error instanceof ProjectImportError ? error.message : 'Não foi possível ler o arquivo. Tente novamente.'
      setNotice(`Projeto não aberto. ${reason} Seu documento foi mantido.`)
    }
  }
  function changeBlock(fn: (b: Block) => void) {
    if (!current) return
    const next = structuredClone(doc); fn(next[side].find(b => b.id === current.id)!); commit(next)
  }
  function changeProduct(patch: Partial<Product>) { changeBlock(b => { Object.assign(b.products![productIndex], patch) }) }
  function formatPrice(field: 'de' | 'por') {
    if (!product) return
    const result = parsePrice(product[field], field === 'de')
    if (result.ok && result.normalized !== product[field]) changeProduct({ [field]: result.normalized })
  }
  function reviewPrice() {
    const issue = issues[0]
    if (!issue) return
    setSide(issue.side); setSelected(issue.blockId); setProductIndex(issue.productIndex)
  }
  function printDocument() {
    if (printIssues.length) { setNotice('Corrija os preços inválidos dos lados escolhidos antes de imprimir.'); return }
    window.print()
  }
  function undo() {
    const previous = history.past.at(-1); if (!previous) return
    ++imageEpoch.current
    setHistory({ past: history.past.slice(0, -1), future: [doc, ...history.future] }); latestDoc.current = previous; setDoc(previous)
  }
  function redo() {
    const next = history.future[0]; if (!next) return
    ++imageEpoch.current
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
  function chooseImage(id: string, index?: number) {
    pictureTarget.current = imageTarget(latestDoc.current, side, id, index)
    if (!pictureTarget.current) return
    pick(id, index); pictureInput.current?.click()
  }
  function removeImage(isProduct: boolean) {
    ++imageEpoch.current
    if (isProduct) changeProduct({ photo: undefined })
    else changeBlock(b => { delete b.image })
    setNotice('Imagem removida. Use Desfazer para recuperá-la.')
  }
  async function upload(file: File | undefined, target = current ? imageTarget(latestDoc.current, side, current.id, product ? productIndex : undefined) : undefined) {
    if (!file || !target) return
    const key = `${target.side}:${target.blockId}:${target.productIndex ?? 'artwork'}`
    const request = (imageRequests.current.get(key) || 0) + 1, epoch = imageEpoch.current
    imageRequests.current.set(key, request)
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { setNotice('Escolha uma imagem PNG, JPG ou WebP.'); return }
    if (file.size > MAX_IMAGE_BYTES) { setNotice('A imagem excede o limite de 20 MiB. Escolha um arquivo menor.'); return }
    try {
      const bitmap = await createImageBitmap(file)
      const ratio = Math.min(1, (target.productIndex === undefined ? 1800 : 900) / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas'); canvas.width = Math.round(bitmap.width * ratio); canvas.height = Math.round(bitmap.height * ratio)
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close()
      const photo = canvas.toDataURL('image/webp', .86)
      if (epoch !== imageEpoch.current || imageRequests.current.get(key) !== request) return
      const next = applyImage(latestDoc.current, target, photo)
      if (!next) { setNotice('O conteúdo mudou durante a leitura da imagem. Selecione o arquivo novamente.'); return }
      commit(next); setNotice(target.productIndex === undefined ? 'Imagem aplicada. Você pode trocar ou remover pelo painel de edição.' : 'Foto encaixada. Você pode trocar ou remover pelo painel de edição.')
    } catch { if (epoch === imageEpoch.current && imageRequests.current.get(key) === request) setNotice('Não foi possível abrir a imagem. Tente outro arquivo.') }
  }

  return <>
    <div className="builder-app" onDragEnd={() => { setDragging(false); setOver(null) }}>
      <header className="app-header"><div className="app-brand"><span>▦</span><div><strong>Monta panfleto</strong><small>Escolha, arraste e edite.</small></div></div>
        <button className="primary new-project" onClick={() => setGalleryOpen(true)}>+ Novo</button>
        <nav aria-label="Lado do panfleto">{(['frente', 'verso'] as Side[]).map(s => <button key={s} aria-pressed={side === s} onClick={() => { setSide(s); setSelected(null) }}>{s === 'frente' ? 'Frente' : 'Verso'}</button>)}</nav>
        <span className={`save-state ${saveError ? 'error' : ''}`}>{saveError ? 'Não foi possível salvar. Baixe o projeto.' : '✓ Salvo neste navegador'}</span>
        <button className="theme-toggle" aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'} aria-pressed={darkMode} onClick={toggleDarkMode}>{darkMode ? '☀ Claro' : '☾ Escuro'}</button>
        <button onClick={() => download(doc)}>Baixar projeto</button><button onClick={() => fileInput.current?.click()}>Abrir projeto</button>
        <input ref={fileInput} hidden type="file" accept=".json,application/json" onChange={e => { void importProject(e.currentTarget) }} />
        <input ref={pictureInput} hidden type="file" accept="image/png,image/jpeg,image/webp" aria-label="Escolher imagem para o item" onChange={e => { void upload(e.currentTarget.files?.[0], pictureTarget.current); e.currentTarget.value = '' }} />
        <button className="primary" onClick={printDocument}>Imprimir / PDF</button>
      </header>
      {issues.length > 0 && <div className="price-warning" role="alert">{issues.length} preço(s) precisam de revisão. Os valores digitados foram mantidos para correção; a impressão dos lados afetados está bloqueada. <button onClick={reviewPrice}>Revisar preços</button></div>}
      <div className="builder-workspace">
        <aside className="block-library"><div className="panel-heading"><span className="step">1</span><div><h2>Escolha os blocos</h2><p>Clique para adicionar ou arraste para a página.</p></div></div>
          <div className="library-items">{catalog.map((item, i) => <button className="library-item" key={i} draggable onDragStart={e => beginDrag(e, `library:${i}`)} onClick={() => insert(i)}><span className="block-mini">{Array.from({ length: item.cols || 1 }, (_, k) => <i key={k} />)}</span><span>{item.name}</span><b>＋</b></button>)}</div>
          <h3>Ordem dos blocos</h3><p className="muted">Arraste pela alça ⠿. Também pode usar ↑ e ↓ no painel de edição.</p>
          <ol className="block-order">{blocks.map((b, i) => <li key={b.id} className={over === `list-${b.id}` ? 'drop-active' : ''} onDragOver={e => { e.preventDefault(); setOver(`list-${b.id}`) }} onDrop={e => drop(e, b.id)}><button className={selected === b.id ? 'active' : ''} onClick={() => pick(b.id)}><span draggable aria-label={`Arrastar bloco ${i + 1}`} onDragStart={e => beginDrag(e, `block:${b.id}`)}>⠿</span><small>{i + 1}</small>{b.name}</button></li>)}</ol>
          <div className="order-end" onDragOver={e => e.preventDefault()} onDrop={e => drop(e)}>Solte aqui para mover ao final</div>
        </aside>
        <CanvasViewport zoom={zoom} setZoom={setZoom} undo={undo} redo={redo} canUndo={!!history.past.length} canRedo={!!history.future.length}>
          <div className="status-line" role="status">{notice || `${pages.length} ${pages.length === 1 ? 'página' : 'páginas'} · ${size.widthMm} × ${size.heightMm} mm · encaixe automático`}</div>
          {pages.map((page, pi) => <section className="page-stage" key={pi} style={{ width: size.width * zoom, height: size.height * zoom }} aria-label={`Página ${pi + 1} da ${side}`}><div className={`flyer-sheet ${doc.layout ? 'themed-sheet' : ''}`} style={{ ...sheetStyle(doc), transform: `scale(${zoom})`, gridTemplateRows: page.map(b => `minmax(${minHeight(b)}px, ${Math.max(1, b.h)}fr)`).join(' ') }}>
            {page.map(b => <div key={b.id} data-block-id={b.id} className={`block-slot ${over === b.id ? 'drop-active' : ''}`} onDragOver={e => { e.preventDefault(); setOver(b.id) }} onDrop={e => drop(e, b.id)}>
              <div className="block-controls"><button draggable onDragStart={e => beginDrag(e, `block:${b.id}`)} aria-label={`Arrastar ${b.name}`}>⠿</button><button onClick={() => pick(b.id)}>{b.name}</button></div>
              <FlyerBlock block={b} selected={selected === b.id} productIndex={productIndex} pick={i => pick(b.id, i)} imagePick={i => chooseImage(b.id, i)} imageDrop={(file, i) => { pick(b.id, i); void upload(file, imageTarget(latestDoc.current, side, b.id, i)) }} />
            </div>)}
          </div></section>)}
          <div className={`canvas-end ${dragging ? 'ready' : ''}`} onDragOver={e => e.preventDefault()} onDrop={e => drop(e)}>＋ Solte um bloco aqui para adicionar ao final</div>
        </CanvasViewport>
        <aside className="edit-panel"><div className="panel-heading"><span className="step">3</span><div><h2>Edite o conteúdo</h2><p>Foto, nome e preço. O restante se encaixa.</p></div></div>
          {!current ? <div className="empty-panel"><span>↖</span><h3>Clique em um produto</h3><p>Ou selecione um bloco para editar o cabeçalho e o rodapé.</p><div className="auto-note">Tudo alinhado automaticamente.<br />Sem mover ou redimensionar etiquetas.</div></div> : <>
            <h3>{current.name}</h3><div className="block-actions"><button disabled={blocks.indexOf(current) === 0} onClick={() => move(-1)}>↑ Subir</button><button disabled={blocks.indexOf(current) === blocks.length - 1} onClick={() => move(1)}>↓ Descer</button><button onClick={() => { const copy = structuredClone(current); copy.id = uid(); const next = [...blocks]; next.splice(blocks.indexOf(current) + 1, 0, copy); commit({ ...doc, [side]: next }); pick(copy.id) }}>Duplicar</button><button className="danger" onClick={() => { commit({ ...doc, [side]: blocks.filter(b => b.id !== current.id) }); setSelected(null); setNotice('Bloco removido. Use Desfazer para recuperá-lo.') }}>Excluir bloco</button></div>
            {['header', 'footsite', 'footpay'].includes(current.kind) && <div className="artwork-editor"><label className="upload-box" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); void upload(e.dataTransfer.files[0]) }}>{current.image ? <img src={current.image} alt="Imagem do bloco selecionado" /> : <span>＋</span>}<b>{current.image ? 'Trocar imagem' : 'Adicionar imagem'}</b><small>PNG, JPG ou WebP · até 20 MiB</small><input type="file" aria-label="Imagem do cabeçalho ou rodapé" accept="image/png,image/jpeg,image/webp" onChange={e => { void upload(e.currentTarget.files?.[0]); e.currentTarget.value = '' }} /></label>
              {current.image && <><button className="danger full" onClick={() => removeImage(false)}>Remover imagem</button><label>Ajuste da imagem<select value={current.imageFit || 'contain'} onChange={e => changeBlock(b => { b.imageFit = e.target.value as 'contain' | 'cover' })}><option value="contain">Mostrar imagem inteira</option><option value="cover">Preencher espaço (corta bordas)</option></select></label><p>Os textos abaixo estão guardados e reaparecem ao remover a imagem.</p></>}
            </div>}
            {((product?.photo) || current.image) && <fieldset className="image-adjustments"><legend>Ajustar imagem</legend><p>A imagem fica recortada dentro do espaço reservado.</p>{(['scale', 'x', 'y'] as const).map(key => { const adjustment = (product ? product.photoAdjustment : current.imageAdjustment) || { scale: 1, x: 0, y: 0 }; return <label key={key}>{key === 'scale' ? 'Tamanho' : key === 'x' ? 'Posição horizontal' : 'Posição vertical'}<input type="range" min={key === 'scale' ? .25 : -50} max={key === 'scale' ? 3 : 50} step={key === 'scale' ? .05 : 1} value={adjustment[key]} onChange={e => { const next = { ...adjustment, [key]: Number(e.target.value) }; if (product) changeProduct({ photoAdjustment: next }); else changeBlock(b => { b.imageAdjustment = next }) }} /><output>{Math.round(adjustment[key] * (key === 'scale' ? 100 : 1))}%</output></label> })}<button onClick={() => { if (product) changeProduct({ photoAdjustment: undefined }); else changeBlock(b => { delete b.imageAdjustment }) }}>Restaurar enquadramento</button></fieldset>}
            {current.fields?.map((f, i) => <label key={f.key}>{f.label}<input value={f.value} onChange={e => changeBlock(b => { b.fields![i].value = e.target.value })} /></label>)}
            {current.products?.length ? <>
              <div className="product-tabs" aria-label="Escolher produto">{current.products.map((_, i) => <button key={i} aria-pressed={productIndex === i} onClick={() => setProductIndex(i)}>{i + 1}</button>)}<button aria-label="Adicionar produto" disabled={current.products.length >= 5} onClick={() => { const index = current.products!.length; changeBlock(b => { b.products!.push(blankProduct()); b.cols = b.products!.length }); setProductIndex(index) }}>＋</button></div>
              {product && <><label className="upload-box" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); void upload(e.dataTransfer.files[0]) }}>{product.photo ? <img src={product.photo} alt="Foto do produto selecionado" /> : <span>＋</span>}<b>{product.photo ? 'Trocar foto' : 'Adicionar foto'}</b><small>Arraste a foto aqui ou clique · PNG, JPG, WebP</small><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => { void upload(e.target.files?.[0]); e.target.value = '' }} /></label>
                {product.photo && <button className="danger full" onClick={() => removeImage(true)}>Remover foto</button>}
                <label>Marca<input value={product.brand} onChange={e => changeProduct({ brand: e.target.value })} /></label>
                <BrandLogoPicker value={product.brandLogo} onChange={logo => changeProduct({ brandLogo: logo?.id, ...(logo && !product.brand.trim() ? { brand: logo.name } : {}) })} />
                <label>Nome do produto<textarea rows={3} value={product.name} onChange={e => changeProduct({ name: e.target.value })} /></label>
                <div className="price-fields"><label>De (R$)<input inputMode="decimal" value={product.de} aria-invalid={deResult?.ok === false} aria-describedby="de-price-help" onChange={e => changeProduct({ de: e.target.value })} onBlur={() => formatPrice('de')} /><small id="de-price-help">{deResult?.ok === false ? deResult.message : 'Opcional. Ex.: 29,90'}</small></label><label>Por (R$)<input inputMode="decimal" value={product.por} aria-invalid={porResult?.ok === false} aria-describedby="por-price-help" onChange={e => changeProduct({ por: e.target.value })} onBlur={() => formatPrice('por')} /><small id="por-price-help">{porResult?.ok === false ? porResult.message : 'Obrigatório. Ex.: 19,90'}</small></label></div>
                <label>Complemento<input placeholder="Ex.: cada, unidade, kit" value={product.cada} onChange={e => changeProduct({ cada: e.target.value })} /></label>
                {doc.layout && <><label>Chamada promocional<input value={product.label || ''} onChange={e => changeProduct({ label: e.target.value })} /></label><label>Cor da etiqueta<input type="color" value={product.badgeColor || doc.layout.priceColor} onChange={e => changeProduct({ badgeColor: e.target.value })} /></label></>}
                <h3>Etiqueta de preço</h3><p className="muted">Escolha o formato da etiqueta.</p><div className="tag-options">{tags.map(t => <button key={t.id} aria-pressed={(product.tag || 'wide') === t.id} onClick={() => changeProduct({ tag: t.id })}><PriceTag product={{ ...product, tag: t.id, por: '129,90', de: '159,90', cada: 'cada' }} /><span>{t.name}</span></button>)}</div>
                <button className="full" onClick={() => changeBlock(b => { b.products!.forEach(p => { p.tag = product.tag || 'wide' }) })}>Aplicar etiqueta ao bloco</button>
                <button className="danger full" disabled={current.products.length <= 1} onClick={() => { changeBlock(b => { b.products!.splice(productIndex, 1); b.cols = b.products!.length }); setProductIndex(Math.max(0, productIndex - 1)) }}>Remover este produto</button>
              </>}
            </> : null}
          </>}
          {doc.layout && <details className="print-options"><summary>Cores do modelo</summary>{([['accent', 'Cor da campanha'], ['priceColor', 'Cor padrão das etiquetas'], ['background', 'Fundo do cabeçalho']] as const).map(([key, label]) => <label key={key}>{label}<input type="color" value={doc.layout![key]} onChange={e => commit({ ...doc, layout: { ...doc.layout!, [key]: e.target.value } })} /></label>)}</details>}
          <details className="print-options"><summary>Impressão / PDF</summary><label>Páginas para imprimir<select value={printSides} onChange={e => setPrintSides(e.target.value as typeof printSides)}><option value="both">Frente e verso</option><option value="frente">Só frente</option><option value="verso">Só verso</option></select></label><p>{size.label}. Escolha “Salvar como PDF”, escala 100%, sem margens e com gráficos de fundo na janela de impressão. Sem sangria.</p></details>
        </aside>
      </div>
    </div>
    {galleryOpen && <TemplateGallery onClose={() => setGalleryOpen(false)} onUse={useTemplate} onDownload={download} preview={templatePreview} />}
    <style>{`@media print { @page { size: ${size.widthMm}mm ${size.heightMm}mm; margin: 0; } }`}</style>
    <div className="print-document">{printIssues.length ? <p role="alert">Impressão bloqueada: corrija os preços inválidos dos lados escolhidos no editor.</p> : (['frente', 'verso'] as Side[]).filter(s => (printSides === 'both' || printSides === s) && doc[s].length).flatMap(s => paginate(doc[s], size.height).map((page, pi) => <div key={`${s}-${pi}`} className={`flyer-sheet ${doc.layout ? 'themed-sheet' : ''}`} style={{ ...sheetStyle(doc), gridTemplateRows: page.map(b => `minmax(${minHeight(b)}px, ${Math.max(1, b.h)}fr)`).join(' ') }}>{page.map(b => <FlyerBlock key={b.id} block={b} />)}</div>))}</div>
  </>
}
