import type { Dispatch, SetStateAction } from 'react'
import { tags } from './block-model'
import type { Block, Document, Product, Side } from './block-model'
import { formats } from './layout-settings'
import type { PriceResult } from './prices'
import BrandLogoPicker from './BrandLogoPicker'
import { PriceTag } from './PriceTag'
import TextProperties from './TextProperties'
import type { ProductTextStyles } from './text-style'

export type InspectorTab = 'produto' | 'bloco' | 'documento'

type Props = {
  doc: Document
  side: Side
  blocks: Block[]
  current?: Block
  product?: Product
  productIndex: number
  setProductIndex: (index: number) => void
  tab: InspectorTab
  setTab: (tab: InspectorTab) => void
  deResult: PriceResult | null
  porResult: PriceResult | null
  size: (typeof formats)[keyof typeof formats]
  printSides: 'both' | Side
  setPrintSides: Dispatch<SetStateAction<'both' | Side>>
  changeBlock: (fn: (block: Block) => void) => void
  changeProduct: (patch: Partial<Product>) => void
  commit: (next: Document) => void
  upload: (file: File | undefined) => void
  removeImage: (isProduct: boolean) => void
  formatPrice: (field: 'de' | 'por') => void
  move: (delta: number) => void
  duplicateBlock: () => void
  deleteBlock: () => void
  addProduct: () => void
  removeProduct: () => void
  applyTagToBlock: () => void
  download: () => void
  openProject: () => void
  printDocument: () => void
}

const adjustmentLabels = { scale: 'Tamanho', x: 'Posição horizontal', y: 'Posição vertical' } as const

export default function Inspector(p: Props) {
  const { doc, current, product, blocks } = p
  const hasProducts = !!current?.products?.length
  const artwork = !!current && ['header', 'footsite', 'footpay'].includes(current.kind)
  const tab: InspectorTab = p.tab === 'produto' && !hasProducts ? (current ? 'bloco' : 'documento') : p.tab === 'bloco' && !current ? 'documento' : p.tab
  const tabs: { id: InspectorTab; label: string; disabled: boolean }[] = [
    { id: 'produto', label: 'Produto', disabled: !hasProducts }, { id: 'bloco', label: 'Bloco', disabled: !current }, { id: 'documento', label: 'Documento', disabled: false },
  ]
  const position = current ? blocks.indexOf(current) : -1
  const adjustment = (product ? product.photoAdjustment : current?.imageAdjustment) || { scale: 1, x: 0, y: 0 }
  const hasImage = !!(product?.photo || current?.image)

  const imageEditor = hasImage && <fieldset className="ed-fieldset"><legend>Ajustar imagem</legend>
    <p className="ed-hint">A imagem fica recortada dentro do espaço reservado.</p>
    {(['scale', 'x', 'y'] as const).map(key => <label key={key} className="ed-range">{adjustmentLabels[key]}
      <input type="range" min={key === 'scale' ? .25 : -50} max={key === 'scale' ? 3 : 50} step={key === 'scale' ? .05 : 1} value={adjustment[key]}
        onChange={e => { const next = { ...adjustment, [key]: Number(e.target.value) }; if (product) p.changeProduct({ photoAdjustment: next }); else p.changeBlock(b => { b.imageAdjustment = next }) }} />
      <output>{Math.round(adjustment[key] * (key === 'scale' ? 100 : 1))}{key === 'scale' ? '%' : ''}</output></label>)}
    <button type="button" onClick={() => { if (product) p.changeProduct({ photoAdjustment: undefined }); else p.changeBlock(b => { delete b.imageAdjustment }) }}>Restaurar enquadramento</button>
  </fieldset>

  return <aside className="ed-inspector" aria-label="Propriedades">
    <div className="ed-inspector-head">
      <h2>Propriedades</h2>
      {current ? <p>{current.name}{hasProducts ? ` · produto ${p.productIndex + 1} de ${current.products!.length}` : ''}</p> : <p>Nenhum bloco selecionado</p>}
    </div>
    <div className="ed-tabs" role="tablist" aria-label="Seções das propriedades">
      {tabs.map(t => <button type="button" role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`panel-${t.id}`} key={t.id} disabled={t.disabled} onClick={() => p.setTab(t.id)}>{t.label}</button>)}
    </div>
    <div className="ed-inspector-body" role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
      {tab === 'produto' && current && product && <>
        <div className="ed-product-picker" role="group" aria-label="Escolher produto">
          {current.products!.map((_, i) => <button type="button" key={i} aria-pressed={p.productIndex === i} aria-label={`Produto ${i + 1}`} onClick={() => p.setProductIndex(i)}>{i + 1}</button>)}
          <button type="button" aria-label="Adicionar produto" title="Adicionar produto (máximo 5)" disabled={current.products!.length >= 5} onClick={p.addProduct}>＋</button>
        </div>
        <section className="ed-group" aria-label="Foto e identificação"><h3>Foto e identificação</h3>
          <label className="ed-upload" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); p.upload(e.dataTransfer.files[0]) }}>
            {product.photo ? <img src={product.photo} alt="Foto do produto selecionado" /> : <span aria-hidden="true">＋</span>}
            <b>{product.photo ? 'Trocar imagem' : 'Adicionar imagem'}</b><small>Arraste aqui ou clique · PNG, JPG, WebP até 20 MiB</small>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => { p.upload(e.target.files?.[0]); e.target.value = '' }} />
          </label>
          {product.photo && <button type="button" className="ed-danger" onClick={() => p.removeImage(true)}>Remover foto</button>}
          {imageEditor}
          <label>Marca<input id="field-brand" value={product.brand} onChange={e => p.changeProduct({ brand: e.target.value })} /></label>
          <details className="ed-logo-details" key={`${p.productIndex}-${current.id}`} open={!!product.brandLogo}><summary>Logo da marca (opcional)</summary>
            <BrandLogoPicker value={product.brandLogo} onChange={logo => p.changeProduct({ brandLogo: logo?.id, ...(logo && !product.brand.trim() ? { brand: logo.name } : {}) })} /></details>
          <label>Nome do produto<textarea id="field-name" rows={3} value={product.name} onChange={e => p.changeProduct({ name: e.target.value })} /></label>
        </section>
        <TextProperties key={`${current.id}-${p.productIndex}`} targets={(['name', ...(!product.brandLogo ? ['brand'] : []), ...(product.label ? ['label'] : [])] as (keyof ProductTextStyles)[]).map(id => ({ id, label: id === 'name' ? 'Nome do produto' : id === 'brand' ? 'Marca (texto)' : 'Chamada promocional', style: product.textStyles?.[id], onChange: style => {
          const next = { ...product.textStyles }; if (style) next[id] = style; else delete next[id]
          p.changeProduct({ textStyles: Object.keys(next).length ? next : undefined })
        } }))} />
        <section className="ed-group" aria-label="Preço e etiqueta"><h3>Preço e etiqueta</h3>
          <div className="ed-two">
            <label>De (R$)<input id="field-de" inputMode="decimal" value={product.de} aria-invalid={p.deResult?.ok === false} aria-describedby="de-price-help" onChange={e => p.changeProduct({ de: e.target.value })} onBlur={() => p.formatPrice('de')} /><small id="de-price-help">{p.deResult?.ok === false ? p.deResult.message : 'Opcional. Ex.: 29,90'}</small></label>
            <label>Por (R$)<input id="field-por" inputMode="decimal" value={product.por} aria-invalid={p.porResult?.ok === false} aria-describedby="por-price-help" onChange={e => p.changeProduct({ por: e.target.value })} onBlur={() => p.formatPrice('por')} /><small id="por-price-help">{p.porResult?.ok === false ? p.porResult.message : 'Obrigatório. Ex.: 19,90'}</small></label>
          </div>
          <label>Complemento<input placeholder="Ex.: cada, unidade, kit" value={product.cada} onChange={e => p.changeProduct({ cada: e.target.value })} /></label>
          {doc.layout && <div className="ed-two"><label>Chamada promocional<input value={product.label || ''} onChange={e => p.changeProduct({ label: e.target.value })} /></label><label>Cor da etiqueta<input type="color" value={product.badgeColor || doc.layout.priceColor} onChange={e => p.changeProduct({ badgeColor: e.target.value })} /></label></div>}
          <h4>Formato da etiqueta</h4>
          <div className="ed-tags">{tags.map(t => <button type="button" key={t.id} aria-pressed={(product.tag || 'wide') === t.id} onClick={() => p.changeProduct({ tag: t.id })}><PriceTag product={{ ...product, tag: t.id, por: '129,90', de: '159,90', cada: 'cada' }} /><span>{t.name}</span></button>)}</div>
          <button type="button" onClick={p.applyTagToBlock}>Aplicar ao bloco inteiro</button>
        </section>
        <div className="ed-row-actions">
          <button type="button" disabled={current.products!.length >= 5} onClick={p.addProduct}>＋ Produto</button>
          <button type="button" className="ed-danger" disabled={current.products!.length <= 1} onClick={p.removeProduct}>Remover produto</button>
        </div>
      </>}

      {tab === 'bloco' && current && <>
        <section className="ed-group" aria-label="Posição do bloco"><h3>Bloco {position + 1} de {blocks.length}</h3>
          <p className="ed-hint">{current.name}</p>
          <div className="ed-row-actions">
            <button type="button" disabled={position === 0} onClick={() => p.move(-1)}>↑ Subir</button>
            <button type="button" disabled={position === blocks.length - 1} onClick={() => p.move(1)}>↓ Descer</button>
          </div>
          <div className="ed-row-actions"><button type="button" onClick={p.duplicateBlock}>Duplicar</button><button type="button" className="ed-danger" onClick={p.deleteBlock}>Excluir bloco</button></div>
        </section>
        {artwork && <section className="ed-group" aria-label="Imagem do bloco"><h3>Imagem</h3>
          <label className="ed-upload" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); p.upload(e.dataTransfer.files[0]) }}>
            {current.image ? <img src={current.image} alt="Imagem do bloco selecionado" /> : <span aria-hidden="true">＋</span>}
            <b>{current.image ? 'Trocar imagem' : 'Adicionar imagem'}</b><small>PNG, JPG ou WebP · até 20 MiB</small>
            <input type="file" aria-label="Imagem do cabeçalho ou rodapé" accept="image/png,image/jpeg,image/webp" onChange={e => { p.upload(e.currentTarget.files?.[0]); e.currentTarget.value = '' }} />
          </label>
          {current.image && <>
            <button type="button" className="ed-danger" onClick={() => p.removeImage(false)}>Remover imagem</button>
            <label>Ajuste da imagem<select value={current.imageFit || 'contain'} onChange={e => p.changeBlock(b => { b.imageFit = e.target.value as 'contain' | 'cover' })}><option value="contain">Mostrar imagem inteira</option><option value="cover">Preencher espaço (corta bordas)</option></select></label>
            <p className="ed-hint">Os textos abaixo estão guardados e reaparecem ao remover a imagem.</p>
            {imageEditor}
          </>}
        </section>}
        {!!current.fields?.length && <section className="ed-group" aria-label="Textos do bloco"><h3>Textos</h3>
          {current.fields.map((f, i) => <label key={f.key}>{f.label}<input value={f.value} onChange={e => p.changeBlock(b => { b.fields![i].value = e.target.value })} /></label>)}
        </section>}
        {!!current.fields?.length && <TextProperties key={current.id} targets={current.fields.map((field, index) => ({ id: field.key, label: field.label, style: field.style, onChange: style => p.changeBlock(block => { if (style) block.fields![index].style = style; else delete block.fields![index].style }) }))} />}
        {hasProducts && <p className="ed-hint">{current.products!.length} {current.products!.length === 1 ? 'produto' : 'produtos'} neste bloco. Use a aba Produto para editar foto, nome e preço.</p>}
      </>}

      {tab === 'documento' && <>
        <section className="ed-group" aria-label="Documento"><h3>Documento</h3>
          <p className="ed-hint">Tamanho {p.size.label}. Frente: {doc.frente.length} {doc.frente.length === 1 ? 'bloco' : 'blocos'} · Verso: {doc.verso.length} {doc.verso.length === 1 ? 'bloco' : 'blocos'}.</p>
          <label>Páginas para imprimir<select value={p.printSides} onChange={e => p.setPrintSides(e.target.value as typeof p.printSides)}><option value="both">Frente e verso</option><option value="frente">Só frente</option><option value="verso">Só verso</option></select></label>
          <button type="button" className="ed-primary" onClick={p.printDocument}>Imprimir / PDF</button>
          <p className="ed-hint">Escolha “Salvar como PDF”, escala 100%, sem margens e com gráficos de fundo na janela de impressão. Sem sangria.</p>
          <div className="ed-row-actions"><button type="button" onClick={p.download}>Baixar projeto</button><button type="button" onClick={p.openProject}>Abrir projeto</button></div>
        </section>
        <section className="ed-group" aria-label="Fundo do panfleto"><h3>Fundo do panfleto</h3>
          <label>Cor de fundo (frente e verso)<input type="color" value={doc.pageBackground || '#ffffff'} onChange={e => p.commit({ ...doc, pageBackground: e.target.value })} /></label>
          {doc.pageBackground && <button type="button" onClick={() => { const next = structuredClone(doc); delete next.pageBackground; p.commit(next) }}>Restaurar branco</button>}
        </section>
        {doc.layout && <section className="ed-group" aria-label="Cores do modelo"><h3>Cores do modelo</h3>
          {([['accent', 'Cor da campanha'], ['priceColor', 'Cor padrão das etiquetas'], ['background', 'Fundo do cabeçalho']] as const).map(([key, label]) => <label key={key}>{label}<input type="color" value={doc.layout![key]} onChange={e => p.commit({ ...doc, layout: { ...doc.layout!, [key]: e.target.value } })} /></label>)}
        </section>}
      </>}
    </div>
  </aside>
}
