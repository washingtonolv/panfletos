import morphdom from 'morphdom'

/* Motor mínimo para rodar o esboço (.dc.html): template com {{ }}, <sc-for>, <sc-if>
   e uma classe Component com renderVals() e setState(). */

type Scope = Record<string, unknown>
type Handler = (e: Event) => void

export class DCLogic {
  state: Record<string, unknown> = {}
  _render: (() => void) | null = null
  setState(p: Record<string, unknown> | ((s: Record<string, unknown>) => Record<string, unknown>)) {
    const patch = typeof p === 'function' ? p(this.state) : p
    this.state = { ...this.state, ...patch }
    this._render?.()
  }
}

const WHOLE = /^\s*\{\{\s*([\w.]+)\s*\}\}\s*$/
const PART = /\{\{\s*([\w.]+)\s*\}\}/g
const BOOL_ATTRS = new Set(['disabled', 'checked', 'selected', 'hidden', 'readonly', 'required'])
const EVENTS: Record<string, string> = { onclick: 'click', onmousedown: 'mousedown', oninput: 'input', onchange: 'change', ondblclick: 'dblclick' }

function resolve(path: string, scope: Scope, vals: Scope): unknown {
  const parts = path.trim().split('.')
  let cur: unknown = parts[0] in scope ? scope[parts[0]] : vals[parts[0]]
  for (let i = 1; i < parts.length; i++) {
    if (cur == null) return undefined
    cur = (cur as Record<string, unknown>)[parts[i]]
  }
  return cur
}

const interp = (s: string, scope: Scope, vals: Scope) =>
  s.replace(PART, (_, p: string) => {
    const v = resolve(p, scope, vals)
    return v == null || v === false ? '' : String(v)
  })

export function mountDC(host: HTMLElement, source: string) {
  const tplHtml = source.slice(source.indexOf('<x-dc>') + 6, source.indexOf('</x-dc>'))
  const code = /<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/.exec(source)![1]
  const Component = new Function('DCLogic', code + '\nreturn Component;')(DCLogic) as new () => DCLogic & { renderVals(): Scope }
  const doc = new DOMParser().parseFromString('<body>' + tplHtml + '</body>', 'text/html')

  doc.querySelectorAll('helmet link, helmet style').forEach((n) => document.head.appendChild(n.cloneNode(true)))

  let handlers: Handler[] = []

  const build = (node: Node, scope: Scope, vals: Scope): Node | null => {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(interp(node.textContent ?? '', scope, vals))
    if (node.nodeType !== Node.ELEMENT_NODE) return null
    const src = node as Element
    const tag = src.localName
    if (tag === 'helmet') return null
    if (tag === 'sc-if') {
      const m = WHOLE.exec(src.getAttribute('value') ?? '')
      const frag = document.createDocumentFragment()
      if (m && resolve(m[1], scope, vals)) src.childNodes.forEach((c) => { const b = build(c, scope, vals); if (b) frag.appendChild(b) })
      return frag
    }
    if (tag === 'sc-for') {
      const m = WHOLE.exec(src.getAttribute('list') ?? '')
      const as = src.getAttribute('as') ?? 'item'
      const list = (m ? resolve(m[1], scope, vals) : []) as unknown[] | undefined
      const frag = document.createDocumentFragment()
      ;(list ?? []).forEach((item, i) => {
        const sc = { ...scope, [as]: item, [as + 'Index']: i }
        src.childNodes.forEach((c) => { const b = build(c, sc, vals); if (b) frag.appendChild(b) })
      })
      return frag
    }
    const el = document.createElementNS(src.namespaceURI, src.localName)
    let valueProp: unknown = undefined
    for (const a of Array.from(src.attributes)) {
      const name = a.name
      if (name.startsWith('hint-placeholder')) continue
      const lname = name.toLowerCase()
      const whole = WHOLE.exec(a.value)
      if (EVENTS[lname]) {
        const fn = whole ? resolve(whole[1], scope, vals) : undefined
        if (typeof fn === 'function') el.setAttribute('data-h-' + EVENTS[lname], String(handlers.push(fn as Handler) - 1))
        continue
      }
      if (whole) {
        const v = resolve(whole[1], scope, vals)
        if (BOOL_ATTRS.has(lname)) { if (v) el.setAttribute(name, ''); continue }
        if (name.startsWith('aria-') && typeof v === 'boolean') { el.setAttribute(name, String(v)); continue }
        if (v == null || v === false) continue
        if (lname === 'value') valueProp = v
        el.setAttribute(name, String(v))
      } else {
        el.setAttribute(name, interp(a.value, scope, vals))
      }
    }
    src.childNodes.forEach((c) => { const b = build(c, scope, vals); if (b) el.appendChild(b) })
    if (valueProp !== undefined && 'value' in el) (el as unknown as HTMLInputElement).value = String(valueProp)
    return el
  }

  const comp = new Component()
  let current: Element | null = null
  let queued = false

  const render = () => {
    queued = false
    const vals = comp.renderVals()
    handlers = []
    const frag = document.createDocumentFragment()
    doc.body.childNodes.forEach((c) => { const b = build(c, {}, vals); if (b) frag.appendChild(b) })
    const next = Array.from(frag.childNodes).find((n) => n.nodeType === Node.ELEMENT_NODE) as Element
    if (!current) { host.replaceChildren(next); current = next; return }
    morphdom(current, next, {
      onBeforeElUpdated(from, to) {
        const a = document.activeElement
        if (from === a && (from.tagName === 'INPUT' || from.tagName === 'TEXTAREA')) (to as HTMLInputElement).value = (from as HTMLInputElement).value
        return true
      },
    })
  }
  comp._render = () => {
    if (queued) return
    queued = true
    requestAnimationFrame(render)
  }

  // delegação de eventos com bubbling manual (respeita stopPropagation dos handlers)
  for (const type of new Set(Object.values(EVENTS))) {
    host.addEventListener(type, (ev) => {
      let stopped = false
      const orig = ev.stopPropagation.bind(ev)
      ev.stopPropagation = () => { stopped = true; orig() }
      let el = ev.target as Element | null
      while (el && el !== host.parentElement) {
        const id = el.getAttribute?.('data-h-' + type)
        if (id != null) {
          handlers[+id]?.(ev)
          if (stopped) break
        }
        el = el.parentElement
      }
    })
  }

  render()
}
