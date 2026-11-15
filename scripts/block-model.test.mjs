import { test } from 'node:test'
import assert from 'node:assert/strict'
import seed from '../src/block-seed.json' with { type: 'json' }
import { parseProject, validateProject, ProjectImportError, MAX_PROJECT_BYTES } from '../src/project-import.ts'
import { initialDocument, loadDraft, resolveDraftRecovery, saveDraft, STORAGE, RECOVERY_PREFIX, minHeight, moveBlock, newBlock, normalize, paginate, priceParts, tags } from '../src/block-model.ts'

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

function memoryStorage(entries = []) {
  const data = new Map(entries)
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }
}
const validDraft = () => JSON.stringify(initialDocument())

test('import accepts exported round trips, seed metadata, BOM and empty sides', () => {
  const doc = initialDocument()
  assert.deepEqual(parseProject(JSON.stringify(doc)), doc)
  assert.deepEqual(parseProject('\uFEFF' + JSON.stringify(seed)), normalize(seed))
  assert.deepEqual(validateProject({ frente: [], verso: [] }), { frente: [], verso: [] })
  const copy = structuredClone(doc.frente[0]); copy.id = 'duplicate-with-unique-id'
  doc.frente.push(copy) // Duplicated blocks legitimately reuse field keys across blocks.
  assert.doesNotThrow(() => validateProject(doc))
})

test('import preserves all editable product counts, tag models, photos and legacy offsets', () => {
  for (const count of [1, 2, 3, 4, 5]) for (const kind of ['row', 'hero2', 'hero3']) for (const tag of tags) {
    const p = { ...newBlock(3).products[0], tag: tag.id, photo: 'data:image/png;base64,YQ==', o: { x: 999 } }
    const doc = { frente: [{ id: 'a', kind, name: 'A', h: 130, cols: count, products: Array.from({ length: count }, () => ({ ...p })) }], verso: [] }
    const result = validateProject(doc)
    assert.equal(result.frente[0].products.length, count)
    assert.equal(result.frente[0].products[0].photo, p.photo)
    assert.equal(result.frente[0].products[0].tag, tag.id)
    assert.equal(result.frente[0].products[0].o, undefined)
    assert.equal(doc.frente[0].products[0].o.x, 999)
  }
})

test('invalid JSON and oversized input report controlled errors', () => {
  for (const raw of ['', '{bad', 'null', '[]', '{}']) assert.throws(() => parseProject(raw), ProjectImportError)
  assert.throws(() => parseProject(' '.repeat(MAX_PROJECT_BYTES + 1)), /50 MiB/)
})

test('invalid structures identify location without changing the input', () => {
  const cases = [
    d => { d.frente = null }, d => { delete d.verso }, d => { d.frente[0] = null },
    d => { d.frente[0].id = '' }, d => { d.frente[0].id = 7 },
    d => { d.frente[1].id = d.frente[0].id }, d => { d.verso[0].id = d.frente[0].id },
    d => { d.frente[0].kind = 'unknown' }, d => { d.frente[0].kind = {} },
    d => { d.frente[0].name = {} }, d => { delete d.frente[0].h },
    ...[0, -1, NaN, Infinity, '130'].map(h => d => { d.frente[0].h = h }),
    d => { d.frente[1].products = [] }, d => { delete d.frente[1].products },
    d => { d.frente[1].products = {} }, d => { d.frente[1].products.push(...d.frente[1].products) },
    d => { d.frente[1].products[0] = null }, d => { d.frente[1].cols = 5 },
    d => { d.frente[1].products[0].por = 19.9 }, d => { delete d.frente[1].products[0].name },
    d => { d.frente[1].products[0].tag = 'unknown' },
    d => { d.frente[0].fields = {} }, d => { d.frente[0].fields = [] },
    d => { d.frente[0].fields[0] = null }, d => { d.frente[0].fields[0].key = '' },
    d => { d.frente[0].fields[1].key = d.frente[0].fields[0].key },
    d => { d.frente[0].fields[0].label = false }, d => { d.frente[0].fields[0].value = {} },
    d => { d.frente[0].products = [d.frente[1].products[0]] }, d => { d.frente[0].cols = 2 },
  ]
  for (const mutate of cases) {
    const doc = initialDocument(); mutate(doc); const before = structuredClone(doc)
    assert.throws(() => validateProject(doc), error => error instanceof ProjectImportError && /frente|verso/.test(error.message))
    assert.deepEqual(doc, before)
  }
})

test('photo validation rejects unsafe or malformed URLs instead of discarding them', () => {
  for (const photo of ['javascript:alert(1)', 'data:image/svg+xml;base64,YQ==', 'data:image/png;base64,', 'data:image/png;base64,YQ=', 'https://', 'https://user:secret@example.com/a.png', ' https://example.com/a.png', null, {}]) {
    const doc = initialDocument(); doc.frente[1].products[0].photo = photo
    assert.throws(() => validateProject(doc), /foto/)
  }
  for (const photo of ['https://example.com/a.png?size=900', 'http://example.com/a.webp', 'data:image/webp;base64,' + 'YWFh'.repeat(250000)]) {
    const doc = initialDocument(); doc.frente[1].products[0].photo = photo
    assert.equal(validateProject(doc).frente[1].products[0].photo, photo)
  }
})

test('valid current draft opens and saves without recovery or touching legacy data', () => {
  const raw = validDraft()
  const storage = memoryStorage([[STORAGE, raw], ['panfletos:montador:v2', 'legacy-original']])
  const state = loadDraft(storage)
  assert.equal(state.canSave, true)
  assert.equal(state.sourceKey, STORAGE)
  assert.equal(saveDraft(state.document, state, storage), true)
  assert.equal(storage.getItem('panfletos:montador:v2'), 'legacy-original')
})

test('corrupt current draft survives loading twice, mount autosave and later edits', () => {
  for (const raw of ['{broken', '', JSON.stringify({ frente: [], verso: 'bad' })]) {
    const storage = memoryStorage([[STORAGE, raw]])
    const state = loadDraft(storage)
    loadDraft(storage) // React StrictMode may initialize twice.
    assert.equal(state.canSave, false)
    assert.equal(state.failures[0].raw, raw)
    assert.equal(saveDraft(state.document, state, storage), false)
    assert.equal(saveDraft({ frente: [], verso: [] }, state, storage), false)
    assert.equal(storage.getItem(STORAGE), raw)
    assert.equal(storage.data.size, 1)
  }
})

test('a valid legacy fallback cannot overwrite corrupt v3 until explicitly recovered', () => {
  const raw = '{original broken v3'
  const legacy = validDraft()
  const storage = memoryStorage([[STORAGE, raw], ['panfletos:montador:v2', legacy]])
  const state = loadDraft(storage)
  assert.equal(state.sourceKey, 'panfletos:montador:v2')
  assert.equal(saveDraft(state.document, state, storage), false)
  const next = resolveDraftRecovery(state, 'recovered', storage)
  assert.equal(storage.getItem(STORAGE), raw) // Resolving archives first; does not write the active draft.
  const archive = [...storage.data].find(([key]) => key.startsWith(RECOVERY_PREFIX))
  assert.equal(JSON.parse(archive[1]).failures[0].raw, raw)
  assert.equal(saveDraft(next.document, next, storage), true)
  assert.equal(loadDraft(storage).canSave, true)
  assert.equal(storage.getItem('panfletos:montador:v2'), legacy)
})

test('starting new preserves every failed original before allowing saves', () => {
  const storage = memoryStorage([[STORAGE, '{bad v3'], ['panfletos:montador:v2', '{bad v2']])
  const state = loadDraft(storage)
  assert.throws(() => resolveDraftRecovery(state, 'recovered', storage))
  const next = resolveDraftRecovery(state, 'new', storage)
  const archive = JSON.parse([...storage.data].find(([key]) => key.startsWith(RECOVERY_PREFIX))[1])
  assert.deepEqual(archive.failures.map(f => f.raw), ['{bad v3', '{bad v2'])
  assert.equal(saveDraft(next.document, next, storage), true)
  assert.equal(storage.getItem('panfletos:montador:v2'), '{bad v2')
})

test('backup quota or verification failures keep autosave blocked and original intact', () => {
  for (const mode of ['throw', 'discard']) {
    const storage = memoryStorage([[STORAGE, '{bad']])
    const state = loadDraft(storage)
    storage.setItem = () => { if (mode === 'throw') throw new Error('QuotaExceededError') }
    assert.throws(() => resolveDraftRecovery(state, 'new', storage))
    assert.equal(saveDraft(state.document, state, storage), false)
    assert.equal(storage.getItem(STORAGE), '{bad')
  }
})

test('unreadable storage cannot be treated as a missing draft or replaced', () => {
  let writes = 0
  const storage = { getItem: () => { throw new Error('SecurityError') }, setItem: () => { writes++ } }
  const state = loadDraft(storage)
  assert.equal(state.canSave, false)
  assert.equal(state.failures[0].raw, null)
  assert.equal(saveDraft(state.document, state, storage), false)
  assert.throws(() => resolveDraftRecovery(state, 'new', storage))
  assert.equal(writes, 0)
})

test('fresh browser and both readable legacy versions retain normal startup', () => {
  assert.equal(loadDraft(memoryStorage()).canSave, true)
  for (const key of ['panfletos:montador:v2', 'panfletos:v1']) {
    const raw = validDraft()
    const storage = memoryStorage([[key, raw]])
    const state = loadDraft(storage)
    assert.equal(state.sourceKey, key)
    assert.equal(state.canSave, true)
    assert.equal(saveDraft(state.document, state, storage), true)
    assert.equal(storage.getItem(key), raw)
    assert.equal(loadDraft(storage).sourceKey, STORAGE)
  }
})

test('recovery refuses to overwrite an original changed in another tab', () => {
  const storage = memoryStorage([[STORAGE, '{bad']])
  const state = loadDraft(storage)
  storage.setItem(STORAGE, validDraft())
  const changed = storage.getItem(STORAGE)
  assert.throws(() => resolveDraftRecovery(state, 'new', storage))
  assert.equal(saveDraft(state.document, state, storage), false)
  assert.equal(storage.getItem(STORAGE), changed)
})
