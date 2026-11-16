import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'

export type MenuItem = { label: string; onSelect: () => void; disabled?: boolean; shortcut?: string; checked?: boolean } | 'separator'
export type Menu = { id: string; label: string; items: MenuItem[] }

export default function EditorMenus({ menus }: { menus: Menu[] }) {
  const [open, setOpen] = useState<string | null>(null)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    function away(event: MouseEvent) { if (!root.current?.contains(event.target as Node)) setOpen(null) }
    function key(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      const trigger = root.current?.querySelector<HTMLElement>(`[data-menu="${open}"]`)
      setOpen(null); trigger?.focus()
    }
    document.addEventListener('mousedown', away); document.addEventListener('keydown', key)
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', key) }
  }, [open])
  function move(event: ReactKeyboardEvent<HTMLElement>) {
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role^=menuitem]:not(:disabled)'))
    const at = items.indexOf(document.activeElement as HTMLElement)
    if (event.key === 'ArrowDown') { event.preventDefault(); items[(at + 1) % items.length]?.focus() }
    if (event.key === 'ArrowUp') { event.preventDefault(); items[(at - 1 + items.length) % items.length]?.focus() }
  }
  return <nav className="ed-menus" ref={root} aria-label="Menus do editor">
    {menus.map(menu => <div className="ed-menu" key={menu.id}>
      <button type="button" data-menu={menu.id} aria-haspopup="menu" aria-expanded={open === menu.id}
        onClick={() => setOpen(open === menu.id ? null : menu.id)} onMouseEnter={() => { if (open) setOpen(menu.id) }}
        onKeyDown={e => { if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(menu.id); setTimeout(() => root.current?.querySelector<HTMLElement>(`#menu-${menu.id} [role^=menuitem]:not(:disabled)`)?.focus()) } }}>{menu.label}</button>
      {open === menu.id && <div className="ed-menu-list" id={`menu-${menu.id}`} role="menu" aria-label={menu.label} onKeyDown={move}>
        {menu.items.map((item, i) => item === 'separator'
          ? <hr key={i} role="separator" />
          : <button type="button" role={item.checked === undefined ? 'menuitem' : 'menuitemcheckbox'} aria-checked={item.checked} key={i} disabled={item.disabled}
            onClick={() => { setOpen(null); item.onSelect() }}><span>{item.checked ? '✓ ' : ''}{item.label}</span>{item.shortcut && <kbd>{item.shortcut}</kbd>}</button>)}
      </div>}
    </div>)}
  </nav>
}
