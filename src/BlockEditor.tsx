import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, DragEvent } from 'react'
import { blankProduct, catalog, loadDraft, resolveDraftRecovery, saveDraft, minHeight, moveBlock, newBlock, paginate, uid } from './block-model'
import type { Block, Document, Product, Side } from './block-model'
import './tailwind.css'
import './block-editor.css'
import './brand-logo-styles.css'
import './editor-dark.css'
import './flyer-background.css'
import './editor-shell.css'
import { MAX_PROJECT_BYTES, parseProject, ProjectImportError } from './project-import'
import { parsePrice, priceIssues } from './prices'
import { formats } from './layout-settings'
import { openBlankSession, replaceDraft } from './draft-library'
import TemplateGallery from './TemplateGallery'
import CanvasViewport from './CanvasViewport'
import type { CanvasTool, CanvasViewportHandle } from './CanvasViewport'
import EditorMenus from './EditorMenus'
import type { Menu } from './EditorMenus'
import LayoutLibrary from './LayoutLibrary'
import PageStructure from './PageStructure'
import Inspector from './Inspector'
import type { InspectorTab } from './Inspector'
import { applyImage, imageTarget, MAX_IMAGE_BYTES } from './editor-images'
import type { ImageTarget } from './editor-images'
import BrandMark from './BrandMark'
import { PriceTag } from './PriceTag'
import { imageStyle } from './image-style'
import { textCss } from './text-style'
import { layoutEngineName } from './layout-engine'
import RustRenderSurface from './RustRenderSurface'
import { prepareVectorPrint, visiblePageSvg } from './render-output'

const EDITOR_THEME_KEY = 'panfletos:editor:theme'
function savedEditorTheme(): boolean {
  try { return localStorage.getItem(EDITOR_THEME_KEY) !== 'light' } catch { return true }
}

function FlyerBlock({ block: b, pick, selected, productIndex, imagePick, imageDrop }: { block: Block; pick?: (index?: number) => void; selected?: boolean; productIndex?: number; imagePick?: (index?: number) => void; imageDrop?: (file: File, index?: number) => void }) {
  const artwork = ['header', 'footsite', 'footpay'].includes(b.kind)
  const content = artwork && b.image ? <div className="block-artwork"><img src={b.image} alt={b.kind === 'header' ? 'Imagem do cabeçalho' : 'Imagem do rodapé'} draggable={false} style={{ ...imageStyle(b.imageAdjustment), objectFit: b.imageFit || 'contain' }} /></div>
    : b.kind === 'header' ? <div className="campaign"><small style={textCss(b.fields?.[0]?.style)}>{b.fields?.[0]?.value}</small><strong style={textCss(b.fields?.[1]?.style)}>{b.fields?.[1]?.value}</strong><span>✿</span></div>
    : b.kind.startsWith('foot') ? <div className="flyer-footer">{b.fields?.map(f => <span key={f.key} style={textCss(f.style)}>{f.value}</span>)}</div>
    : <>{b.fields?.length ? <div className="block-title">{b.fields.filter(f => f.value).map((f, i) => <span key={f.key} style={textCss(f.style)}>{i > 0 ? ' · ' : ''}{f.value}</span>)}</div> : null}
      <div className="product-grid" style={{ gridTemplateColumns: `repeat(${b.products?.length || 1}, minmax(0, 1fr))` }}>
        {b.products?.map((p, i) => <button type="button" key={i} className={`product-card ${selected && productIndex === i ? 'is-picked' : ''}`}
          aria-label={`Editar produto ${i + 1}: ${p.name}`} onClick={e => { e.stopPropagation(); if ((e.target as HTMLElement).closest('.product-photo') && imagePick) imagePick(i); else pick?.(i) }}
          onDragOver={e => { if (imageDrop && e.dataTransfer.types.includes('Files')) { e.preventDefault(); e.stopPropagation() } }} onDrop={e => { const file = e.dataTransfer.files[0]; if (file && imageDrop) { e.preventDefault(); e.stopPropagation(); imageDrop(file, i) } }}>
          <span className="product-photo" title={imagePick ? (p.photo ? 'Clique para trocar a foto. Remova pelo painel de edição.' : 'Clique para adicionar foto') : undefined}>{p.photo ? <><img src={p.photo} alt={p.name} draggable={false} style={imageStyle(p.photoAdjustment)} />{imagePick && <span className="photo-action-hint">Trocar foto</span>}</> : <span className="photo-placeholder"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg></span>}</span>
          <span className="product-copy" title={`${p.brand} ${p.name}`}>{p.label && <em className="product-label" style={textCss(p.textStyles?.label)}>{p.label}</em>}<BrandMark logoId={p.brandLogo} brand={p.brand} style={textCss(p.textStyles?.brand)} /><span style={textCss(p.textStyles?.name)}>{p.name}</span></span>
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
  const color = doc.pageBackground
  const rgb = color ? [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16) / 255) : []
  const luminance = rgb.map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0)
  return { '--sheet-width': `${size.width}px`, '--sheet-height': `${size.height}px`, '--sheet-width-mm': `${size.widthMm}mm`, '--sheet-height-mm': `${size.heightMm}mm`, ...(color ? { '--sheet-background': color, '--sheet-ink': luminance > .179 ? '#17131d' : '#ffffff' } : {}), ...(doc.layout ? { '--template-accent': doc.layout.accent, '--template-price': doc.layout.priceColor, '--template-background': doc.layout.background } : {}) } as CSSProperties
}
function templatePreview(doc: Document, side: Side, width: number) {
  const size = formats[doc.layout?.format || '153x207'], scale = width / size.width
  const page = paginate(doc[side], size.height)[0]
  return <div className="template-preview" style={{ width, height: size.height * scale }}><div className={`flyer-sheet themed-sheet ${doc.pageBackground ? 'has-page-background' : ''}`} style={{ ...sheetStyle(doc), transform: `scale(${scale})`, gridTemplateRows: page.map(b => `minmax(${minHeight(b)}px, ${Math.max(1, b.h)}fr)`).join(' ') }}>{page.map(b => <FlyerBlock key={b.id} block={b} />)}</div></div>
}

function downloadText(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
function download(data: Document) { downloadText(JSON.stringify(data, null, 2), 'panfleto-editavel.json') }

export default function BlockEditor() {
  const [darkMode, setDarkMode] = useState(savedEditorTheme)
  const [draft, setDraft] = useState(() => openBlankSession(loadDraft()))
  const [doc, setDoc] = useState(draft.document)
  const [recoveryError, setRecoveryError] = useState('')
  const [side, setSide] = useState<Side>('frente')
  const [selected, setSelected] = useState<string | null>(null)
  const [productIndex, setProductIndex] = useState(0)
  const [notice, setNotice] = useState('')
  const [saveError, setSaveError] = useState(false)
  const [zoom, setZoom] = useState(.85)
  const viewport = useRef<CanvasViewportHandle>(null)
  const [dragging, setDragging] = useState(false)
  const [over, setOver] = useState<string | null>(null)
  const [history, setHistory] = useState<{ past: Document[]; future: Document[] }>({ past: [], future: [] })
  const [printSides, setPrintSides] = useState<'both' | Side>('both')
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [tool, setTool] = useState<CanvasTool>('select')
  const [tab, setTab] = useState<InspectorTab>('produto')
  const [libraryOpen, setLibraryOpen] = useState(() => !window.matchMedia('(max-width: 780px)').matches)
  // AIDF-019: trilho de ícones à esquerda (estilo Canva) escolhe um painel por vez.
  const [leftPanel, setLeftPanel] = useState<'blocos' | 'camadas'>('blocos')
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
  async function printDocument() {
    if (printIssues.length) { setNotice('Corrija os preços inválidos dos lados escolhidos antes de imprimir.'); return }
    const printing = latestDoc.current
    await prepareVectorPrint()
    if (printing !== latestDoc.current) { setNotice('O projeto mudou durante a preparação. Clique em imprimir novamente.'); return }
    window.print()
  }
  async function exportSvg() {
    const exporting = latestDoc.current
    const result = await visiblePageSvg()
    if (!result || exporting !== latestDoc.current) { setNotice('Não foi possível preparar o SVG desta página. O projeto continua disponível para editar e imprimir.'); return }
    const url=URL.createObjectURL(new Blob([result.svg],{type:'image/svg+xml;charset=utf-8'}))
    const link=document.createElement('a');link.href=url;link.download=`panfleto-${side}-${result.page}.svg`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
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
  function duplicateBlock() {
    if (!current) return
    const copy = structuredClone(current); copy.id = uid()
    const next = [...blocks]; next.splice(blocks.indexOf(current) + 1, 0, copy)
    commit({ ...doc, [side]: next }); pick(copy.id); setNotice('Bloco duplicado.')
  }
  function deleteBlock() {
    if (!current) return
    commit({ ...doc, [side]: blocks.filter(b => b.id !== current.id) }); setSelected(null)
    setNotice('Bloco removido. Use Desfazer para recuperá-lo.')
  }
  function addProduct() {
    if (!current?.products || current.products.length >= 5) return
    const index = current.products.length
    changeBlock(b => { b.products!.push(blankProduct()); b.cols = b.products!.length }); setProductIndex(index)
  }
  function removeProduct() {
    if (!current?.products || current.products.length <= 1) return
    changeBlock(b => { b.products!.splice(productIndex, 1); b.cols = b.products!.length }); setProductIndex(Math.max(0, productIndex - 1))
  }
  function applyTagToBlock() {
    if (!product) return
    const tag = product.tag || 'wide'
    changeBlock(b => { b.products!.forEach(p => { p.tag = tag }) }); setNotice('Etiqueta aplicada a todos os produtos do bloco.')
  }
  function moveById(id: string, delta: number) {
    const at = blocks.findIndex(b => b.id === id), target = at + delta
    if (at < 0 || target < 0 || target >= blocks.length) return
    const next = [...blocks]; [next[at], next[target]] = [next[target], next[at]]; commit({ ...doc, [side]: next })
  }
  function focusField(id: string) {
    if (!current?.products?.length) return
    setTab('produto'); setTimeout(() => document.getElementById(id)?.focus(), 0)
  }
  function changeSide(next: Side) { setSide(next); setSelected(null) }
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

  const canPickImage = !!current && (!!current.products?.length || ['header', 'footsite', 'footpay'].includes(current.kind))
  const at = current ? blocks.indexOf(current) : -1
  const floatingTools = <div className="ed-rail" role="toolbar" aria-orientation="horizontal" aria-label="Ferramentas">
          <button type="button" title="Selecionar (V)" aria-label="Selecionar (V)" aria-pressed={tool === 'select'} onClick={() => setTool('select')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 3 14 10-7 1-3 7Z" /></svg></button>
          <button type="button" title="Mão (H) · segure Espaço para usar temporariamente" aria-label="Mão (H)" aria-pressed={tool === 'hand'} onClick={() => setTool('hand')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 12V5a2 2 0 0 1 4 0v6-7a2 2 0 0 1 4 0v7-5a2 2 0 0 1 4 0v9c0 5-3 7-7 7-3 0-5-2-7-5l-3-5c-1-2 1-3 3-1l2 2Z" /></svg></button>
          <span className="ed-rail-divider" />
          <button type="button" title="Propriedades de texto" aria-label="Propriedades de texto" disabled={!current || (!product && !current.fields?.length)} onClick={() => { setTab(product ? 'produto' : 'bloco'); setTimeout(() => { const panel = document.querySelector<HTMLElement>('.ed-text-properties'); panel?.scrollIntoView({ block: 'start' }); panel?.querySelector<HTMLSelectElement>('select')?.focus({ preventScroll: true }) }) }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14M12 5v15M8 20h8M5 5v3m14-3v3" /></svg></button>
          <button type="button" title="Foto do item selecionado" aria-label="Foto do item selecionado" disabled={!canPickImage} onClick={() => current && chooseImage(current.id, product ? productIndex : undefined)}><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m4 18 5-5 4 4 3-3 4 4" /></svg></button>
          <button type="button" title="Duplicar bloco" aria-label="Duplicar bloco" disabled={!current} onClick={duplicateBlock}><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg></button>
          <button type="button" title="Excluir bloco" aria-label="Excluir bloco" disabled={!current} onClick={deleteBlock}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2m-7 0 1 12h8l1-12" /></svg></button>
        </div>
  const menus: Menu[] = [
    { id: 'arquivo', label: 'Arquivo', items: [
      { label: 'Novo / modelos…', onSelect: () => setGalleryOpen(true) },
      { label: 'Abrir projeto…', onSelect: () => fileInput.current?.click() },
      { label: 'Baixar projeto (JSON)', onSelect: () => download(doc) },
      { label: 'Exportar página visível (SVG)', disabled: !blocks.length, onSelect: () => { void exportSvg() } },
      'separator',
      { label: 'Imprimir / PDF', onSelect: printDocument },
    ] },
    { id: 'editar', label: 'Editar', items: [
      { label: 'Desfazer', shortcut: 'Ctrl+Z', disabled: !history.past.length, onSelect: undo },
      { label: 'Refazer', shortcut: 'Ctrl+Shift+Z', disabled: !history.future.length, onSelect: redo },
      'separator',
      { label: 'Duplicar bloco', disabled: !current, onSelect: duplicateBlock },
      { label: 'Excluir bloco', disabled: !current, onSelect: deleteBlock },
    ] },
    { id: 'visualizar', label: 'Visualizar', items: [
      { label: 'Ajustar à tela', shortcut: 'Ctrl+0', onSelect: () => viewport.current?.fitToView() },
      { label: 'Aumentar zoom', disabled: zoom >= 2.5, onSelect: () => viewport.current?.chooseZoom(Math.min(2.5, Math.round((zoom + .25) * 100) / 100)) },
      { label: 'Diminuir zoom', disabled: zoom <= .25, onSelect: () => viewport.current?.chooseZoom(Math.max(.25, Math.round((zoom - .25) * 100) / 100)) },
      { label: 'Zoom 100%', disabled: zoom === 1, onSelect: () => viewport.current?.chooseZoom(1) },
      'separator',
      { label: 'Ferramenta Selecionar', shortcut: 'V', checked: tool === 'select', onSelect: () => setTool('select') },
      { label: 'Ferramenta Mão', shortcut: 'H', checked: tool === 'hand', onSelect: () => setTool('hand') },
      'separator',
      { label: 'Tema grafite', checked: darkMode, onSelect: () => { if (!darkMode) toggleDarkMode() } },
      { label: 'Tema claro', checked: !darkMode, onSelect: () => { if (darkMode) toggleDarkMode() } },
    ] },
    { id: 'organizar', label: 'Organizar', items: [
      { label: 'Subir bloco', disabled: !current || at === 0, onSelect: () => move(-1) },
      { label: 'Descer bloco', disabled: !current || at === blocks.length - 1, onSelect: () => move(1) },
      'separator',
      { label: 'Ver frente', checked: side === 'frente', onSelect: () => changeSide('frente') },
      { label: 'Ver verso', checked: side === 'verso', onSelect: () => changeSide('verso') },
    ] },
  ]

  return <>
    <div className="builder-app" data-layout-engine={layoutEngineName()} onDragEnd={() => { setDragging(false); setOver(null) }}>
      <header className="ed-menubar">
        <div className="ed-brand"><span aria-hidden="true">▦</span><strong>Monta panfleto</strong></div>
        <EditorMenus menus={menus} />
        <span className="ed-spacer" />
        <button type="button" className="theme-toggle" aria-label={darkMode ? 'Ativar tema claro' : 'Ativar tema grafite'} aria-pressed={darkMode} onClick={toggleDarkMode}>{darkMode ? '☀ Tema claro' : '☾ Tema grafite'}</button>
        <input ref={fileInput} hidden type="file" accept=".json,application/json" onChange={e => { void importProject(e.currentTarget) }} />
        <input ref={pictureInput} hidden type="file" accept="image/png,image/jpeg,image/webp" aria-label="Escolher imagem para o item" onChange={e => { void upload(e.currentTarget.files?.[0], pictureTarget.current); e.currentTarget.value = '' }} />
      </header>
      <div className="ed-docbar">
        <div className="ed-doc-tab"><strong>{doc.layout?.name || 'Panfleto'}</strong><small>{size.label}</small></div>
        <div className="ed-doc-actions">
          <button type="button" className="ed-primary new-project" onClick={() => setGalleryOpen(true)}>+ Novo</button>
          <button type="button" aria-label="Desfazer" title="Desfazer (Ctrl + Z)" disabled={!history.past.length} onClick={undo}>↶ Desfazer</button>
          <button type="button" aria-label="Refazer" title="Refazer (Ctrl + Shift + Z)" disabled={!history.future.length} onClick={redo}>↷ Refazer</button>
          <button type="button" onClick={() => download(doc)}>Baixar projeto</button>
          <button type="button" onClick={() => fileInput.current?.click()}>Abrir projeto</button>
          <button type="button" className="ed-primary" onClick={printDocument}>Imprimir / PDF</button>
        </div>
      </div>
      {issues.length > 0 && <div className="price-warning" role="alert">{issues.length} preço(s) precisam de revisão. Os valores digitados foram mantidos para correção; a impressão dos lados afetados está bloqueada. <button type="button" onClick={reviewPrice}>Revisar preços</button></div>}
      <div className="builder-workspace">
        <div className="ed-leftwrap">
          <nav className="ed-iconrail" aria-label="Painéis do editor">
            <button type="button" aria-pressed={leftPanel === 'blocos'} onClick={() => setLeftPanel('blocos')}><span aria-hidden="true">▦</span>Blocos</button>
            <button type="button" aria-pressed={leftPanel === 'camadas'} onClick={() => setLeftPanel('camadas')}><span aria-hidden="true">☰</span>Camadas</button>
            <button type="button" onClick={() => setGalleryOpen(true)}><span aria-hidden="true">✦</span>Modelos</button>
          </nav>
          <aside className="ed-left" aria-label={leftPanel === 'blocos' ? 'Biblioteca de blocos' : 'Camadas da página'}>
            {leftPanel === 'blocos'
              ? <LayoutLibrary open={libraryOpen} onToggle={() => setLibraryOpen(v => !v)} onInsert={i => insert(i)} onDragStart={beginDrag} />
              : <PageStructure title={`Estrutura da página · ${side === 'frente' ? 'frente' : 'verso'}`} blocks={blocks} selected={selected} over={over} reorder onPick={id => pick(id)} onMove={moveById} onDragStart={beginDrag} onDragOver={setOver} onDrop={drop} />}
          </aside>
        </div>
        <div className="ed-stage">
          <div className="ed-stagebar">
            <div className="ed-sides" role="group" aria-label="Lado do panfleto">{(['frente', 'verso'] as Side[]).map((s, i) => <button type="button" key={s} aria-pressed={side === s} onClick={() => changeSide(s)}>{`0${i + 1} · ${s === 'frente' ? 'Frente' : 'Verso'}`}</button>)}</div>
            <div className="ed-context" role="toolbar" aria-label="Edição rápida do bloco selecionado">
              <span className="ed-context-name">{current ? current.name : 'Selecione um bloco ou produto'}</span>
              <button type="button" disabled={!canPickImage} onClick={() => current && chooseImage(current.id, product ? productIndex : undefined)}>Foto</button>
              <button type="button" disabled={!current?.products?.length} onClick={() => focusField('field-name')}>Nome</button>
              <button type="button" disabled={!current?.products?.length} onClick={() => focusField('field-por')}>Preço</button>
              <button type="button" disabled={!current} onClick={duplicateBlock}>Duplicar bloco</button>
            </div>
          </div>
          <CanvasViewport toolbar={floatingTools} ref={viewport} pageWidth={size.width} pageHeight={size.height} zoom={zoom} setZoom={setZoom} undo={undo} redo={redo} tool={tool} setTool={setTool}>
            {pages.map((page, pi) => <section className="page-stage" key={pi} style={{ width: size.width * zoom, height: size.height * zoom }} aria-label={`Página ${pi + 1} da ${side}`} onDragOver={!blocks.length ? e => { e.preventDefault(); setOver('empty') } : undefined} onDragLeave={!blocks.length ? () => setOver(null) : undefined} onDrop={!blocks.length ? e => drop(e) : undefined}>
              {!blocks.length && <div className={`ed-sheet-empty ${over === 'empty' ? 'drop-active' : ''}`}><span className="ed-sheet-icon" aria-hidden="true">▦</span><strong>Seu próximo panfleto começa aqui</strong><p>Arraste um bloco da biblioteca ou comece com um modelo completo.</p><button type="button" onClick={() => setGalleryOpen(true)}>Escolher modelo pronto</button><small>Depois, é só trocar as fotos, os nomes e os preços.</small></div>}
              <div className={`flyer-sheet ${doc.layout ? 'themed-sheet' : ''} ${doc.pageBackground ? 'has-page-background' : ''}`} style={{ ...sheetStyle(doc), transform: `scale(${zoom})`, gridTemplateRows: page.map(b => `minmax(${minHeight(b)}px, ${Math.max(1, b.h)}fr)`).join(' ') }}>
              {page.map(b => <div key={b.id} data-block-id={b.id} className={`block-slot ${over === b.id ? 'drop-active' : ''}`} onDragOver={e => { e.preventDefault(); setOver(b.id) }} onDrop={e => drop(e, b.id)}>
                <div className="block-controls"><button draggable onDragStart={e => beginDrag(e, `block:${b.id}`)} aria-label={`Arrastar ${b.name}`}>⠿</button><button onClick={() => pick(b.id)}>{b.name}</button></div>
                <FlyerBlock block={b} selected={selected === b.id} productIndex={productIndex} pick={i => pick(b.id, i)} imagePick={i => chooseImage(b.id, i)} imageDrop={(file, i) => { pick(b.id, i); void upload(file, imageTarget(latestDoc.current, side, b.id, i)) }} />
              </div>)}
              <RustRenderSurface revision={doc} />
            </div></section>)}
            <div className={`canvas-end ${dragging ? 'ready' : ''}`} onDragOver={e => e.preventDefault()} onDrop={e => drop(e)}>＋ Solte um layout aqui para adicionar ao final</div>
          </CanvasViewport>
        </div>
        <div className="ed-right">
          <Inspector doc={doc} side={side} blocks={blocks} current={current} product={product} productIndex={productIndex} setProductIndex={setProductIndex} tab={tab} setTab={setTab}
            deResult={deResult} porResult={porResult} size={size} printSides={printSides} setPrintSides={setPrintSides} changeBlock={changeBlock} changeProduct={changeProduct} commit={commit}
            upload={file => { void upload(file) }} removeImage={removeImage} formatPrice={formatPrice} move={move} duplicateBlock={duplicateBlock} deleteBlock={deleteBlock}
            addProduct={addProduct} removeProduct={removeProduct} applyTagToBlock={applyTagToBlock} download={() => download(doc)} openProject={() => fileInput.current?.click()} printDocument={printDocument} />
          <PageStructure title="Blocos / camadas" blocks={blocks} selected={selected} over={over} reorder={false} onPick={id => pick(id)} />
        </div>
      </div>
      <footer className="ed-status">
        <span role="status" className="ed-status-message">{notice || (blocks.length ? 'Pronto. Clique em um produto para editar.' : 'Folha em branco.')}</span>
        <span className="ed-status-info">{pages.length} {pages.length === 1 ? 'página' : 'páginas'} · {size.widthMm} × {size.heightMm} mm · {Math.round(zoom * 100)}% · Encaixe automático</span>
        <span className={`save-state ${saveError ? 'error' : ''}`}>{saveError ? 'Não foi possível salvar. Baixe o projeto.' : '✓ Salvo neste navegador'}</span>
      </footer>
    </div>
    {galleryOpen && <TemplateGallery onClose={() => setGalleryOpen(false)} onUse={useTemplate} onDownload={download} preview={templatePreview} />}
    <style>{`@media print { @page { size: ${size.widthMm}mm ${size.heightMm}mm; margin: 0; } }`}</style>
    <div className="print-document rust-print-document">{printIssues.length ? <p role="alert">Impressão bloqueada: corrija os preços inválidos dos lados escolhidos no editor.</p> : (['frente', 'verso'] as Side[]).filter(s => (printSides === 'both' || printSides === s) && doc[s].length).flatMap(s => paginate(doc[s], size.height).map((page, pi) => <div key={`${s}-${pi}`} className={`flyer-sheet ${doc.layout ? 'themed-sheet' : ''} ${doc.pageBackground ? 'has-page-background' : ''}`} style={{ ...sheetStyle(doc), gridTemplateRows: page.map(b => `minmax(${minHeight(b)}px, ${Math.max(1, b.h)}fr)`).join(' ') }}>{page.map(b => <FlyerBlock key={b.id} block={b} />)}<RustRenderSurface revision={doc} /></div>))}</div>
  </>
}
