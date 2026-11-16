/** Rust owns pagination and SVG composition; React keeps document objects. */
import { encodeScene } from './render-scene.ts'
import type { RenderScene } from './render-scene.ts'
type LayoutWasm = {
  memory: WebAssembly.Memory
  abi_version: () => number
  minimum_height: (kind: number, products: number, large: number, title: number, custom: number) => number
  allocate: (length: number) => number
  paginate: (pointer: number, length: number, height: number) => number
  release: (pointer: number, length: number) => void
  renderer_version?: () => number
  render_allocate?: (length: number) => number
  render_scene?: (pointer: number, length: number) => bigint
  render_release?: (pointer: number, length: number) => void
}

export function renderSvgScene(scene: RenderScene): string | undefined {
  const runtime = engine
  if (!runtime?.render_allocate || !runtime.render_scene || !runtime.render_release || runtime.renderer_version?.() !== 1) return undefined
  let input = 0, output = 0, length = 0, outputLength = 0
  try {
    const bytes = encodeScene(scene); length = bytes.length
    input = runtime.render_allocate(length) >>> 0
    if (!input) return undefined
    new Uint8Array(runtime.memory.buffer, input, length).set(bytes)
    const packed = runtime.render_scene(input, length)
    output = Number(packed & 0xffffffffn); outputLength = Number(packed >> 32n)
    if (!output || !outputLength || outputLength > 128 * 1024 * 1024) return undefined
    return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(runtime.memory.buffer, output, outputLength))
  } catch { return undefined }
  finally {
    try { if (output) runtime.render_release(output, outputLength) } catch { /* Keep the DOM fallback available after a WASM trap. */ }
    try { if (input) runtime.render_release(input, length) } catch { /* Keep the DOM fallback available after a WASM trap. */ }
  }
}
let engine: LayoutWasm | null = null
const MAX_BLOCKS = 250_000
export function layoutEngineName(): 'rust-wasm' | 'typescript' { return engine ? 'rust-wasm' : 'typescript' }

export async function initializeLayoutEngine(bytes: BufferSource): Promise<boolean> {
  try {
    if (typeof WebAssembly === 'undefined') return false
    const { instance } = await WebAssembly.instantiate(bytes, {})
    const candidate = instance.exports as unknown as LayoutWasm
    if (!(candidate.memory instanceof WebAssembly.Memory) || !['abi_version', 'minimum_height', 'allocate', 'paginate', 'release'].every(key => typeof instance.exports[key] === 'function')) return false
    if (candidate.abi_version() !== 1 || candidate.minimum_height(0, 0, 0, 0, 0) !== 108) return false
    engine = candidate
    return true
  } catch { return false }
}

export function rustMinimumHeight(kind: number, products: number, large: boolean, title: boolean, custom: number): number | undefined {
  if (!engine) return undefined
  try {
    const value = engine.minimum_height(kind, products, Number(large), Number(title), custom)
    if (!Number.isFinite(value) || value <= 0) throw new Error('Invalid Rust layout height')
    return value
  } catch { engine = null; return undefined }
}

export function rustPageIndexes(heights: number[], height: number): number[] | undefined {
  const runtime = engine
  if (!runtime || !Number.isFinite(height) || heights.length > MAX_BLOCKS) return undefined
  if (!heights.length) return []
  let pointer = 0
  try {
    pointer = runtime.allocate(heights.length) >>> 0
    if (!pointer) throw new Error('Rust layout allocation failed')
    const buffer = runtime.memory.buffer
    if (pointer % 8 || pointer + heights.length * 8 > buffer.byteLength) throw new Error('Invalid Rust layout buffer')
    const slots = new Float64Array(buffer, pointer, heights.length)
    slots.set(heights)
    const count = runtime.paginate(pointer, heights.length, height)
    if (count < 1 || count > heights.length) throw new Error('Invalid Rust page count')
    const pages = Array.from(slots)
    let previous = 0
    for (const page of pages) {
      if (!Number.isInteger(page) || page < previous || page > previous + 1 || page >= count) throw new Error('Invalid Rust page index')
      previous = page
    }
    if (pages[0] !== 0 || previous !== count - 1) throw new Error('Invalid Rust page sequence')
    return pages
  } catch { engine = null; return undefined }
  finally { if (pointer) { try { runtime.release(pointer, heights.length) } catch { engine = null } } }
}
