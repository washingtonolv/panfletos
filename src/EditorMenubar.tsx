import { Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger } from './toolcraft/ui/components/composites/menubar'
import type { Menu } from './EditorMenus'

// AIDF-019 etapa B: barra de menus com o componente Menubar do toolcraft.
// Mesmos dados (`Menu[]`) da versão anterior; só a apresentação e o foco mudam.
export default function EditorMenubar({ menus }: { menus: Menu[] }) {
  return <Menubar className="h-auto p-0" aria-label="Menus do editor">
    {menus.map(menu => <MenubarMenu key={menu.id}>
      <MenubarTrigger>{menu.label}</MenubarTrigger>
      <MenubarContent>
        {menu.items.map((item, i) => {
          if (item === 'separator') return <MenubarSeparator key={i} />
          if (item.checked !== undefined) return <MenubarCheckboxItem key={i} checked={item.checked} disabled={item.disabled} onCheckedChange={() => item.onSelect()}>
            {item.label}{item.shortcut && <MenubarShortcut>{item.shortcut}</MenubarShortcut>}
          </MenubarCheckboxItem>
          return <MenubarItem key={i} disabled={item.disabled} onClick={item.onSelect}>
            {item.label}{item.shortcut && <MenubarShortcut>{item.shortcut}</MenubarShortcut>}
          </MenubarItem>
        })}
      </MenubarContent>
    </MenubarMenu>)}
  </Menubar>
}
