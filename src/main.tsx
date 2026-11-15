import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

const root = document.getElementById('root')!

if (location.hash !== '#livre' && location.hash !== '#avancado') {
  void import('./BlockEditor').then(({ default: BlockEditor }) => {
    createRoot(root).render(<StrictMode><BlockEditor /></StrictMode>)
  })
} else if (location.hash === '#livre') {
  // editor de elementos livres (versão anterior)
  void Promise.all([import('./styles.css'), import('./App')]).then(([, { default: App }]) => {
    createRoot(root).render(<StrictMode><App /></StrictMode>)
  })
} else {
  ;(window as unknown as { __loadXLSX: () => Promise<unknown> }).__loadXLSX = () => import('xlsx')
  const st = document.createElement('style')
  st.textContent = `@media print{@page{size:153mm 207mm;margin:0}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}html,body,#root{height:207mm!important;overflow:hidden!important;margin:0!important}body *{visibility:hidden!important}[data-flyer],[data-flyer] *{visibility:visible!important}[data-flyer]{position:fixed!important;left:0!important;top:0!important;box-shadow:none!important}[data-zoomwrap]{transform:none!important}[data-np]{display:none!important}}`
  document.head.appendChild(st)
  void Promise.all([import('./dc/runtime'), import('./dc/Main32.dc.html?raw')]).then(([{ mountDC }, src]) => {
    root.style.cssText = 'width:100vw;height:100vh'
    mountDC(root, src.default)
  })
}
