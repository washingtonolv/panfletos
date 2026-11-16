import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { minHeight, newBlock, paginate } from '../src/block-model.ts'
import { templates } from '../src/layout-templates.ts'
import { formats } from '../src/layout-settings.ts'
import { initializeLayoutEngine, layoutEngineName, rustPageIndexes } from '../src/layout-engine.ts'

test('compiled Rust/WASM matches the existing editor across templates, boundaries and generated documents', async t => {
  assert.equal(layoutEngineName(), 'typescript')
  const wasm = globalThis.WebAssembly
  try {
    globalThis.WebAssembly = undefined
    assert.equal(await initializeLayoutEngine(new Uint8Array()), false)
    assert.equal(layoutEngineName(), 'typescript')
  } finally { globalThis.WebAssembly = wasm }
  assert.equal(await initializeLayoutEngine(new Uint8Array([0, 1, 2])), false)
  assert.equal(layoutEngineName(), 'typescript')
  const scenarios = []
  function capture(blocks, height) {
    scenarios.push({ blocks, height, heights: blocks.map(minHeight), pages: paginate(blocks, height) })
  }
  for (const template of templates) for (const side of ['frente', 'verso']) capture(structuredClone(template.document[side]), formats[template.document.layout.format].height)
  capture([], 782)
  let seed = 12345
  const random = n => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % n }
  for (let doc = 0; doc < 180; doc++) {
    const blocks = Array.from({ length: random(100) }, () => {
      const block = newBlock(random(9))
      if (block.products) {
        block.products.forEach(p => { p.tag = ['offer','before','wide','pill','progressive'][random(5)] })
        if (random(2)) block.products = block.products.slice(0, 1 + random(block.products.length))
      }
      if (random(3) === 0) block.appearance = { minHeight: 60 + random(481) / 2, vertical: !!random(2) }
      return block
    })
    capture(blocks, [782, 1020, 40, 300, 30 + blocks.slice(0, 2).reduce((sum, b) => sum + minHeight(b) + 6, 0)][random(5)])
  }
  capture(Array.from({ length: 10_000 }, () => newBlock(3)), 782)
  const snapshots = scenarios.map(s => JSON.stringify(s.blocks))
  const bytes = await readFile(new URL('../src/generated/layout_engine.wasm', import.meta.url))
  assert.equal(await initializeLayoutEngine(bytes), true)
  assert.equal(layoutEngineName(), 'rust-wasm')

  await t.test(`${scenarios.length} documents keep identical heights, pages and object identity`, () => {
    scenarios.forEach((s, index) => {
      assert.deepEqual(s.blocks.map(minHeight), s.heights, `heights at scenario ${index}`)
      const pages = paginate(s.blocks, s.height)
      assert.deepEqual(pages.map(p => p.map(b => b.id)), s.pages.map(p => p.map(b => b.id)), `pages at scenario ${index}`)
      assert.deepEqual(pages.flat(), s.blocks)
      assert.ok(pages.flat().every((b, i) => b === s.blocks[i]))
      assert.equal(JSON.stringify(s.blocks), snapshots[index])
    })
  })
  await t.test('repeated pagination remains stable and oversized batches fall back safely', () => {
    for (let i = 0; i < 1000; i++) assert.deepEqual(rustPageIndexes([376, 376, 1], 782), [0, 0, 1])
    assert.deepEqual(rustPageIndexes([], 782), [])
    assert.equal(rustPageIndexes([136], Number.NaN), undefined)
    assert.equal(rustPageIndexes(new Array(250_001).fill(136), 782), undefined)
    assert.equal(layoutEngineName(), 'rust-wasm')
    assert.deepEqual(rustPageIndexes([2000, 136], 782), [0, 1])
  })
  await t.test('ABI mismatch never installs an incompatible module', async () => {
    // A valid empty WASM module lacks the required exports.
    assert.equal(await initializeLayoutEngine(new Uint8Array([0,97,115,109,1,0,0,0])), false)
    assert.equal(layoutEngineName(), 'rust-wasm')
  })
  await t.test('a rejected runtime result restores the original engine without changing the document', async () => {
    assert.equal(rustPageIndexes([-1], 782), undefined)
    assert.equal(layoutEngineName(), 'typescript')
    const scenario = scenarios[0]
    assert.deepEqual(paginate(scenario.blocks, scenario.height), scenario.pages)
    assert.equal(JSON.stringify(scenario.blocks), snapshots[0])
    assert.equal(await initializeLayoutEngine(bytes), true)
    assert.equal(layoutEngineName(), 'rust-wasm')
  })
})
