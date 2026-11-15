import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { templates, createFromTemplate } from './layout-templates'
import { formats } from './layout-settings'
import { listSavedDrafts } from './draft-library'
import type { Document, Side } from './block-model'

type Props = { onClose: () => void; onUse: (document: Document) => void; onDownload: (document: Document) => void; preview: (document: Document, side: Side, width: number) => ReactNode }
export default function TemplateGallery({ onClose, onUse, onDownload, preview }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [tab, setTab] = useState<'models' | 'saved'>('models')
  const [query, setQuery] = useState('')
  const [format, setFormat] = useState('all')
  const [selected, setSelected] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [saved] = useState(() => { try { return listSavedDrafts() } catch { return { drafts: [], unreadable: 1 } } })
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const element = dialog.current!
    element.showModal()
    return () => { element.close(); previous?.focus() }
  }, [])
  const chosen = templates.find(t => t.id === selected)
  const visible = templates.filter(t => t.name.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')) && (format === 'all' || t.document.layout?.format === format))
  function openDocument(next: Document) {
    if (!window.confirm('Guardar uma cópia do rascunho atual e abrir este projeto? Você poderá recuperar o anterior em “Rascunhos guardados” ou usar Desfazer.')) return
    try { onUse(next) } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível guardar o rascunho. Baixe o projeto e tente novamente.')
    }
  }
  return <dialog ref={dialog} className="template-gallery" aria-labelledby="gallery-title" onCancel={e => { e.preventDefault(); onClose() }} onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); onClose() } }}>
    <header className="gallery-header"><div><small>NOVO PANFLETO</small><h1 id="gallery-title">Escolha um modelo e comece a editar</h1><p>Produtos, fotos, preços e textos editáveis. Seu trabalho atual será guardado antes da troca.</p></div><button onClick={onClose} aria-label="Fechar galeria">✕</button></header>
    <nav className="gallery-tabs" aria-label="Conteúdo da galeria"><button aria-pressed={tab === 'models'} onClick={() => { setTab('models'); setError('') }}>Modelos prontos · {templates.length}</button><button aria-pressed={tab === 'saved'} onClick={() => { setTab('saved'); setSelected(null); setError('') }}>Rascunhos guardados · {saved.drafts.length}</button></nav>
    {error && <p className="gallery-error" role="alert">{error} O projeto aberto foi mantido.</p>}
    <div className="gallery-body">
      {tab === 'models' && !chosen && <>
        <div className="gallery-filters"><label>Buscar modelo<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Ex.: Natura, verão, D&D" /></label><label>Tamanho<select value={format} onChange={e => setFormat(e.target.value)}><option value="all">Todos os tamanhos</option>{Object.entries(formats).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}</select></label><span role="status">{visible.length} modelos</span></div>
        <div className="template-grid">{visible.map(template => <article className="template-card" key={template.id}>
          <div className="template-thumbnail" inert aria-hidden="true">{preview(template.document, 'frente', 215)}</div>
          <div className="template-card-copy"><h2>{template.name}</h2><p>{formats[template.document.layout!.format].label} · {template.description}</p><button className="primary" onClick={() => { setSelected(template.id); setError('') }}>Ver modelo {template.name}</button></div>
        </article>)}</div>
        {!visible.length && <p className="gallery-empty">Nenhum modelo encontrado. Tente outro nome ou tamanho.</p>}
      </>}
      {tab === 'models' && chosen && <section className="template-detail" aria-label={`Prévia de ${chosen.name}`}>
        <div className="template-detail-heading"><button onClick={() => setSelected(null)}>← Todos os modelos</button><div><h2>{chosen.name}</h2><p>{formats[chosen.document.layout!.format].label} · {chosen.description}</p></div><button className="primary" onClick={() => openDocument(createFromTemplate(chosen.id))}>Usar este modelo</button></div>
        <p>Layout adaptado para edição. Fotos são espaços reservados; revise preços, contatos e validade antes de imprimir.</p>
        <div className="template-spread">{(['frente', 'verso'] as Side[]).map(side => <div key={side}><h3>{side === 'frente' ? 'Frente' : 'Verso'}</h3>{chosen.document[side].length ? <div inert aria-hidden="true">{preview(chosen.document, side, 360)}</div> : <p className="gallery-empty">Este modelo tem somente frente. O verso fica livre para adicionar blocos.</p>}</div>)}</div>
      </section>}
      {tab === 'saved' && <section className="saved-drafts" aria-label="Rascunhos guardados">
        <p>Cópias neste navegador. Baixe seus projetos para também ter uma cópia fora dele.</p>
        {saved.unreadable > 0 && <p role="alert">{saved.unreadable} cópia(s) não puderam ser lidas. Os registros foram preservados.</p>}
        {!saved.drafts.length && <p className="gallery-empty">Ao escolher um modelo, seu rascunho atual aparecerá aqui.</p>}
        {saved.drafts.map(item => <article key={item.key}><div><h2>{item.name}</h2><p>{new Date(item.createdAt).toLocaleString('pt-BR')}</p></div><button onClick={() => onDownload(item.document)}>Baixar cópia</button><button className="primary" onClick={() => openDocument(structuredClone(item.document))}>Restaurar rascunho</button></article>)}
      </section>}
    </div>
    <footer className="gallery-footer"><span>O rascunho só muda quando você confirma a escolha.</span><button onClick={onClose}>Continuar no rascunho atual</button></footer>
  </dialog>
}
