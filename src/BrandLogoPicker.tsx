import { useState } from 'react'
import { brandLogos } from './brand-logos'
import type { BrandLogo } from './brand-logos'

export default function BrandLogoPicker({ value, onChange }: { value?: string; onChange: (logo?: BrandLogo) => void }) {
  const [query, setQuery] = useState('')
  const chosen = brandLogos.find(logo => logo.id === value)
  const visible = brandLogos.filter(logo => logo.name.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')))
  return <fieldset className="brand-logo-picker"><legend>Logo da marca</legend>
    {chosen && <div className="chosen-logo"><img src={chosen.src} alt={chosen.name} /><span>{chosen.name}</span></div>}
    {value && !chosen && <p role="status">Esta logo não está disponível na biblioteca. O nome da marca será exibido.</p>}
    {value && <button type="button" className="danger full" onClick={() => onChange()}>Remover logo</button>}
    {brandLogos.length ? <><label>Buscar logo<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Nome da marca" /></label>
      <div className="brand-logo-options" role="group" aria-label="Logos disponíveis">{visible.map(logo => <button type="button" key={logo.id} aria-label={`Usar logo ${logo.name}`} aria-pressed={value === logo.id} onClick={() => onChange(logo)}><img src={logo.src} alt="" loading="lazy" /><span>{logo.name}</span></button>)}</div>
      {!visible.length && <p role="status">Nenhuma logo encontrada.</p>}
    </> : <p role="status">As logos aparecerão aqui quando a pasta de marcas for adicionada à biblioteca.</p>}
    <p>Sem logo, o panfleto mostra o nome da marca.</p>
  </fieldset>
}
