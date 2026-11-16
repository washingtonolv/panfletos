export type Entry = { wait: Promise<void>; svg?: string }
export const surfaces = new Map<HTMLElement,Entry>()
async function waitForSurface(root: HTMLElement) {
  const deadline=Date.now()+5000
  while(root.dataset.renderEngine==='dom-pending'&&Date.now()<deadline){
    const entry=surfaces.get(root);if(!entry)return
    let timer:ReturnType<typeof setTimeout>|undefined
    try { await Promise.race([entry.wait,new Promise(resolve=>{timer=setTimeout(resolve,Math.max(0,deadline-Date.now()))})]) }
    finally { clearTimeout(timer) }
  }
}
export async function prepareVectorPrint() {
  const roots=[...document.querySelectorAll<HTMLElement>('.print-document > .flyer-sheet')]
  await Promise.allSettled(roots.map(waitForSurface))
}
export async function visiblePageSvg(): Promise<{ svg: string; page: number } | undefined> {
  const area=document.querySelector('.canvas-area')?.getBoundingClientRect()
  const pages=[...document.querySelectorAll<HTMLElement>('.canvas-area .page-stage')]
  const chosen=pages.map((page,index)=>({page,index,visible:(()=>{const r=page.getBoundingClientRect();return area?Math.max(0,Math.min(r.bottom,area.bottom)-Math.max(r.top,area.top)):0})()})).sort((a,b)=>b.visible-a.visible)[0]
  const root=chosen?.page.querySelector<HTMLElement>('.flyer-sheet')
  if(root)await waitForSurface(root)
  const entry=root?surfaces.get(root):undefined
  return entry?.svg && root?.dataset.renderEngine==='rust-svg' ? {svg:entry.svg,page:chosen.index+1} : undefined
}

