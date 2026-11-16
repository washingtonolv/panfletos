import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { initializeLayoutEngine, renderSvgScene, rustPageIndexes } from '../src/layout-engine.ts'
import { encodeScene } from '../src/render-scene.ts'

const bytes = await readFile(new URL('../src/generated/layout_engine.wasm', import.meta.url))
await initializeLayoutEngine(bytes)
const text = value => ({kind:'text',x:20,y:30,text:value,font:'Georgia, serif',size:18,weight:'700',italic:true,spacing:1,color:'#ffffff'})
const scene = () => ({width:578,height:782,assets:[],commands:[text('Perfume A&B <100 ml> — R$ 129,90 · CADA')]})

test('Rust composes real vectors and escapes Portuguese text and XML', () => {
  const svg=renderSvgScene(scene())
  assert.match(svg, /data-renderer="rust-svg"/)
  assert.match(svg, /<text[^>]*font-family="Georgia, serif"[^>]*font-size="18"/)
  assert.match(svg, /A&amp;B &lt;100 ml&gt; — R\$ 129,90 · CADA/)
  assert.doesNotMatch(svg, /foreignObject|<html|<script/)
})
test('all primitives, nested polygon/rounded clips and embedded photos survive composition', () => {
  const s=scene()
  s.assets=[{width:1,height:1,href:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII='}]
  s.commands=[{kind:'rect',x:0,y:0,w:578,h:782,radius:20,fill:'#ed214b'},
    {kind:'clip',x:10,y:10,w:100,h:100,radius:15},
    {kind:'clip',x:10,y:10,w:100,h:100,radius:0,points:[[10,10],[110,10],[110,110]]},
    {kind:'image',asset:0,x:10,y:10,w:100,h:100},{kind:'pop'},{kind:'pop'},
    {kind:'ellipse',cx:10,cy:10,rx:5,ry:6,fill:'rgb(1, 2, 3)',opacity:.5},
    {kind:'line',x:0,y:0,x2:10,y2:10,width:2,color:'#333333',dash:[3,2]},text('DE: R$ 159,90'),text('POR R$ 129,90')]
  const svg=renderSvgScene(s)
  for(const token of ['<rect','<clipPath','<polygon','<image','<use','<ellipse','<path','DE: R$ 159,90','POR R$ 129,90'])assert.ok(svg.includes(token),token)
  assert.equal((svg.match(/<image/g)||[]).length,1)
  assert.equal((svg.match(/<g /g)||[]).length,(svg.match(/<\/g>/g)||[]).length)
})
test('invalid scenes fail without corrupting Rust layout or subsequent renders', () => {
  const invalid=[{...scene(),width:NaN},{...scene(),commands:[{kind:'pop'}]},
    {...scene(),commands:[{kind:'image',asset:0,x:0,y:0,w:10,h:10}]},
    {...scene(),assets:[{width:1,height:1,href:'https://example.test/private.png'}]},
    {...scene(),commands:[{...text('x'),color:'url(https://example.test)'}]},
    {...scene(),commands:[{...text('x'),size:999}]},
    {...scene(),commands:[{kind:'clip',x:0,y:0,w:10,h:10,radius:0}]}]
  for(const bad of invalid){assert.equal(renderSvgScene(bad),undefined);assert.ok(renderSvgScene(scene()))}
  assert.deepEqual(rustPageIndexes([376,376,1],782),[0,0,1])
})
test('binary decoder rejects truncated, bad-version and trailing bytes', async () => {
  const {instance}=await WebAssembly.instantiate(bytes,{})
  const e=instance.exports, valid=encodeScene(scene())
  const candidates=[valid.slice(0,20),new Uint8Array([...valid,0]),Uint8Array.from(valid,(v,i)=>i===4?2:v)]
  for(const candidate of candidates){const p=e.render_allocate(candidate.length);new Uint8Array(e.memory.buffer,p,candidate.length).set(candidate);assert.equal(e.render_scene(p,candidate.length),0n);e.render_release(p,candidate.length)}
})
test('repeated image-heavy allocations release buffers and keep the runtime usable', () => {
  const s=scene();s.assets=[{width:300,height:300,href:'data:image/png;base64,'+'A'.repeat(256*1024)}]
  s.commands.push({kind:'image',asset:0,x:0,y:50,w:300,h:300})
  const expected=renderSvgScene(s)
  for(let i=0;i<150;i++)assert.equal(renderSvgScene(s),expected)
  assert.ok(renderSvgScene(scene()))
})
