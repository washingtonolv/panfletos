import wasmUrl from './generated/layout_engine.wasm?url'
import { initializeLayoutEngine } from './layout-engine'

export async function loadLayoutEngine(): Promise<boolean> {
  if (typeof WebAssembly === 'undefined') return false
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  try {
    const response = await fetch(wasmUrl, { signal: controller.signal })
    if (!response.ok) return false
    return await initializeLayoutEngine(await response.arrayBuffer())
  } catch { return false }
  finally { clearTimeout(timeout) }
}
