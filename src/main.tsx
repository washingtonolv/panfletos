import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

const root = document.getElementById('root')!

if (location.hash === '#livre') {
  // editor de elementos livres (versão anterior)
  void Promise.all([import('./styles.css'), import('./App')]).then(([, { default: App }]) => {
    createRoot(root).render(<StrictMode><App /></StrictMode>)
  })
} else {
  void Promise.all([import('./dc/runtime'), import('./dc/Main32.dc.html?raw')]).then(([{ mountDC }, src]) => {
    root.style.cssText = 'width:100vw;height:100vh'
    mountDC(root, src.default)
  })
}
