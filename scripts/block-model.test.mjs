import { test } from 'node:test'
import assert from 'node:assert/strict'
import { initialDocument, minHeight, moveBlock, newBlock, normalize, paginate, priceParts, tags } from '../src/block-model.ts'

test('D&D preserves its products on both sides and fits the default page', () => {
  const doc = initialDocument()
  assert.equal(doc.frente.flatMap(b => b.products || []).length, 13)
  assert.equal(doc.verso.flatMap(b => b.products || []).length, 13)
  assert.equal(paginate(doc.frente).length, 1)
  assert.equal(paginate(doc.verso).length, 1)
})
test('legacy independent offsets are discarded without losing text, price or photo', () => {
  const doc = initialDocument()
  const p = doc.frente[1].products[0]
  p.photo = 'data:image/png;base64,YQ=='
  p.o = { price: { x: -100, y: 900, s: 12 } }
  const next = normalize(doc).frente[1].products[0]
  assert.equal(next.photo, p.photo)
  assert.equal(next.por, p.por)
  assert.equal(next.name, p.name)
  assert.equal(next.o, undefined)
})
test('drag reorder moves the whole block and preserves every product', () => {
  const blocks = initialDocument().frente
  const moved = moveBlock(blocks, 'f3', 'f1')
  assert.deepEqual(moved.map(b => b.id), ['f0', 'f3', 'f1', 'f2', 'f4', 'f5'])
  assert.deepEqual(moved[1].products, blocks[3].products)
  assert.equal(moveBlock(blocks, 'f1', 'f1'), blocks)
  assert.equal(moveBlock(blocks, 'missing'), blocks)
})
test('all four tag models paginate safely, including a large one-product tag', () => {
  for (const tag of tags) {
    const blocks = Array.from({ length: 15 }, () => newBlock(3))
    blocks.forEach(b => { b.products.forEach(p => { p.tag = tag.id }) })
    blocks[0].products.length = 1
    const pages = paginate(blocks)
    assert.equal(pages.flat().length, blocks.length)
    for (const page of pages) assert.ok(page.reduce((sum, b) => sum + minHeight(b) + 6, 0) <= 752)
  }
})
test('invalid projects are rejected instead of overwriting the active document', () => {
  assert.throws(() => normalize({frente: [], verso: 'wrong'}))
  assert.throws(() => normalize({frente: [{kind: 'unknown'}], verso: []}))
})

test('price layout separates the integer and raised cents without losing thousands', () => {
  assert.deepEqual(priceParts('19,99'), { integer: '19', cents: '99' })
  assert.deepEqual(priceParts('1.299,90'), { integer: '1.299', cents: '90' })
  assert.deepEqual(priceParts('129.90'), { integer: '129', cents: '90' })
  assert.deepEqual(priceParts(''), { integer: '0', cents: '00' })
})
