export type RenderAsset = { href: string; width: number; height: number }
type Box = { x: number; y: number; w: number; h: number }
export type PaintCommand =
  | Box & { kind: 'rect'; radius: number; fill: string; opacity?: number }
  | { kind: 'line'; x: number; y: number; x2: number; y2: number; width: number; color: string; dash?: number[] }
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number; fill: string; opacity?: number }
  | { kind: 'text'; x: number; y: number; text: string; font: string; size: number; weight: string; italic: boolean; spacing: number; color: string }
  | Box & { kind: 'image'; asset: number }
  | Box & { kind: 'clip'; radius: number; points?: [number, number][] }
  | { kind: 'pop' }
export type RenderScene = { width: number; height: number; assets: RenderAsset[]; commands: PaintCommand[] }

/** RSVG v1: little-endian numbers and length-prefixed UTF-8; no HTML payload. */
export function encodeScene(scene: RenderScene): Uint8Array<ArrayBuffer> {
  const chunks: Uint8Array[] = [], encoder = new TextEncoder()
  let size = 0
  const push = (bytes: Uint8Array) => { size += bytes.length; if (size > 64 * 1024 * 1024) throw new Error('A arte excede o limite do renderizador.'); chunks.push(bytes) }
  const byte = (v: number) => push(Uint8Array.of(v))
  const u32 = (v: number) => { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, v, true); push(b) }
  const numbers = (...values: number[]) => { const b = new Uint8Array(values.length * 8), v = new DataView(b.buffer); values.forEach((n,i) => v.setFloat64(i * 8, n, true)); push(b) }
  const string = (s: string) => { const bytes = encoder.encode(s); u32(bytes.length); push(bytes) }
  if (scene.commands.length > 20_000 || scene.assets.length > 2000) throw new Error('A arte excede o limite de elementos.')
  push(encoder.encode('RSVG')); u32(1); numbers(scene.width, scene.height); u32(scene.assets.length); u32(scene.commands.length)
  for (const a of scene.assets) { numbers(a.width,a.height); string(a.href) }
  for (const c of scene.commands) switch (c.kind) {
    case 'rect': byte(0); numbers(c.x,c.y,c.w,c.h,c.radius,c.opacity ?? 1); string(c.fill); break
    case 'line': byte(1); numbers(c.x,c.y,c.x2,c.y2,c.width); string(c.color); u32(c.dash?.length || 0); numbers(...c.dash || []); break
    case 'ellipse': byte(2); numbers(c.cx,c.cy,c.rx,c.ry,c.opacity ?? 1); string(c.fill); break
    case 'text': byte(3); numbers(c.x,c.y,c.size,c.spacing); byte(Number(c.italic)); string(c.text); string(c.font); string(c.weight); string(c.color); break
    case 'image': byte(4); u32(c.asset); numbers(c.x,c.y,c.w,c.h); break
    case 'clip': byte(5); numbers(c.x,c.y,c.w,c.h,c.radius); u32(c.points?.length || 0); for (const point of c.points || []) numbers(...point); break
    case 'pop': byte(6); break
  }
  const result = new Uint8Array(size); let at = 0
  for (const c of chunks) { result.set(c,at); at += c.length }
  return result
}
