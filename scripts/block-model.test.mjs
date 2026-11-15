import { test } from 'node:test'
import assert from 'node:assert/strict'
import seed from '../src/block-seed.json' with { type: 'json' }
import { parseProject, validateProject, ProjectImportError, MAX_PROJECT_BYTES } from '../src/project-import.ts'
import { parsePrice, priceIssues } from '../src/prices.ts'
import { initialDocument, loadDraft, resolveDraftRecovery, saveDraft, STORAGE, RECOVERY_PREFIX, minHeight, moveBlock, newBlock, normalize, paginate, priceParts, tags } from '../src/block-model.ts'
import { templates, createFromTemplate } from '../src/layout-templates.ts'
import { formats } from '../src/layout-settings.ts'
import { replaceDraft, listSavedDrafts, SAVED_PREFIX } from '../src/draft-library.ts'
import { imageTarget, applyImage } from '../src/editor-images.ts'
import { validLogoId } from '../src/logo-id.ts'

test('brand logos persist without changing brand names, support missing files and reject paths', () => {
 const doc=normalize(seed);doc.frente[1].products[0].brandLogo='Eudora - eudora_logo_preta.png'
 assert.deepEqual(parseProject(JSON.stringify(doc)),doc)
 assert.equal(normalize(doc).frente[1].products[0].brandLogo,doc.frente[1].products[0].brandLogo)
 assert.equal(normalize(doc).frente[1].products[0].brand,normalize(seed).frente[1].products[0].brand)
 for(const bad of ['../logo.png','https://a.com/logo.png','data:image/png;base64,AA==','a/b.png','a\\b.png','logo.html','..png',null,42]){assert.equal(validLogoId(bad),false);const invalid=structuredClone(doc);invalid.frente[1].products[0].brandLogo=bad;assert.throws(()=>validateProject(invalid),ProjectImportError)}
 delete doc.frente[1].products[0].brandLogo;assert.equal(parseProject(JSON.stringify(doc)).frente[1].products[0].brandLogo,undefined)
})

test('image framing round trips without changing block geometry and rejects unsafe values', () => {
 const doc=normalize(seed), heights=doc.frente.map(b=>b.h)
 doc.frente[0].imageAdjustment={scale:2,x:30,y:-20}
 doc.frente[1].products[0].photoAdjustment={scale:.25,x:-50,y:50}
 assert.deepEqual(parseProject(JSON.stringify(doc)),doc)
 assert.deepEqual(normalize(doc).frente.map(b=>b.h),heights)
 for(const value of [{scale:0,x:0,y:0},{scale:4,x:0,y:0},{scale:1,x:51,y:0},{scale:1,x:0,y:-51},{scale:'1',x:0,y:0},null,[]]) {
  const invalid=structuredClone(doc);invalid.frente[0].imageAdjustment=value;assert.throws(()=>validateProject(invalid),ProjectImportError)
  const invalidPhoto=structuredClone(doc);invalidPhoto.frente[1].products[0].photoAdjustment=value;assert.throws(()=>validateProject(invalidPhoto),ProjectImportError)
 }
})

test('header/footer artwork and fit survive JSON and drafts without losing their original text', () => {
  const doc = normalize(seed), image = 'data:image/png;base64,YQ=='
  for (const side of ['frente', 'verso']) {
    for (const block of doc[side].filter(b => ['header','footsite','footpay'].includes(b.kind))) {
      block.image = image; block.imageFit = 'cover'
    }
  }
  const imported = parseProject(JSON.stringify(doc))
  assert.deepEqual(imported, doc)
  assert.deepEqual(loadDraft({getItem:k=>k===STORAGE?JSON.stringify(doc):null}).document,doc)
  const header = imported.frente[0]; delete header.image
  assert.deepEqual(header.fields, normalize(seed).frente[0].fields)
  assert.equal(normalize(seed).frente[0].image,undefined)
})
test('invalid artwork URLs, fits and product-block artwork are rejected before import', () => {
  for (const image of ['javascript:alert(1)','data:image/svg+xml;base64,YQ==','data:image/png;base64,???','https://user:pass@example.com/a.png',42]) {
    const doc=normalize(seed);doc.frente[0].image=image
    assert.throws(()=>validateProject(doc),ProjectImportError)
  }
  for (const imageFit of [null,1,'stretch','url(x)']) {const doc=normalize(seed);doc.frente[0].imageFit=imageFit;assert.throws(()=>validateProject(doc),ProjectImportError)}
  const doc=normalize(seed);doc.frente[1].image='https://example.com/image.png';assert.throws(()=>validateProject(doc),ProjectImportError)
})
test('image application preserves unrelated edits and refuses stale or shifted targets', () => {
  const doc=normalize(seed), image='data:image/png;base64,YQ=='
  const header=imageTarget(doc,'frente',doc.frente[0].id)
  const product=imageTarget(doc,'frente',doc.frente[1].id,1)
  const unrelated=structuredClone(doc);unrelated.verso[0].fields[0].value='Outra edição'
  const withImage=applyImage(unrelated,header,image)
  assert.equal(withImage.frente[0].image,image);assert.equal(withImage.verso[0].fields[0].value,'Outra edição');assert.equal(doc.frente[0].image,undefined)
  assert.equal(applyImage(doc,product,image).frente[1].products[1].photo,image)
  for(const change of [d=>d.frente.splice(1,1),d=>d.frente[1].products.shift(),d=>d.frente[1].products[1].name='alterado',d=>d.frente[1].products[1].photo=image]) {
    const changed=structuredClone(doc);change(changed);assert.equal(applyImage(changed,product,image),undefined)
  }
  assert.equal(imageTarget(doc,'frente',doc.frente[1].id),undefined)
  assert.equal(imageTarget(doc,'frente',doc.frente[1].id,99),undefined)
})

test('all reference models have unique editable copies, valid prices and one page per populated side', () => {
  assert.equal(templates.length, 9)
  assert.equal(new Set(templates.flatMap(t => t.sources)).size, 15)
  const counts = [[13,12],[15,17],[12,15],[15,12],[14,0],[11,18],[11,21],[12,16],[13,0]]
  for (const [index, template] of templates.entries()) {
    const first = createFromTemplate(template.id), second = createFromTemplate(template.id)
    assert.equal(priceIssues(first).length, 0)
    const ids = [...first.frente, ...first.verso, ...second.frente, ...second.verso].map(b => b.id)
    assert.equal(new Set(ids).size, ids.length)
    for (const [si, side] of ['frente', 'verso'].entries()) {
      assert.equal(first[side].flatMap(b => b.products || []).length, counts[index][si])
      assert.equal(paginate(first[side], formats[first.layout.format].height).length, 1)
      assert.ok(first[side].reduce((n,b) => n + minHeight(b) + 6, 0) <= formats[first.layout.format].height - 30)
    }
    first.frente[0].fields[0].value = 'Alterado'
    assert.notEqual(second.frente[0].fields[0].value, 'Alterado')
    assert.deepEqual(parseProject(JSON.stringify(second)), normalize(second))
  }
  assert.throws(() => createFromTemplate('missing'))
})

test('new layout metadata is preserved through draft loading and rejected when malformed on import', () => {
  const doc = createFromTemplate('natura-verao')
  doc.frente[1].products[0].label = 'LANÇAMENTO'
  const saved = JSON.stringify(doc)
  assert.deepEqual(loadDraft({ getItem: k => k === STORAGE ? saved : null }).document, normalize(doc))
  for (const mutate of [
    d => { d.layout.format = '__proto__' }, d => { d.layout.format = 'A4' },
    d => { d.layout.accent = 'url(javascript:alert(1))' }, d => { d.layout = [] },
    d => { d.frente[0].appearance.minHeight = -1 }, d => { d.frente[0].appearance.minHeight = 301 },
    d => { d.frente[0].appearance.vertical = 'yes' }, d => { d.frente[0].appearance = null },
    d => { d.frente[1].products[0].badgeColor = '#fff;display:none' },
    d => { d.frente[1].products[0].label = 1 },
  ]) { const invalid = structuredClone(doc); mutate(invalid); assert.throws(() => validateProject(invalid), ProjectImportError) }
  assert.equal(normalize(seed).layout, undefined)
})

function libraryStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return { get length() { return values.size }, key: i => [...values.keys()][i] ?? null, getItem: k => values.get(k) ?? null, setItem: (k,v) => values.set(k,v), values }
}
test('replacing and restoring archives the exact current draft, including invalid editable prices', () => {
  const old = normalize(seed); old.frente[1].products[0].por = 'rascunho'
  const raw = JSON.stringify(old), next = createFromTemplate('blitz')
  const storage = libraryStorage({ [STORAGE]: raw, 'panfletos:montador:v2': 'legacy' })
  const snapshot = replaceDraft(old, next, raw, storage)
  assert.equal(storage.getItem(STORAGE), JSON.stringify(next))
  assert.deepEqual(JSON.parse(storage.getItem(snapshot.key)).document, JSON.parse(raw))
  const library = listSavedDrafts(storage)
  assert.equal(library.drafts.length, 1); assert.equal(library.unreadable, 0)
  replaceDraft(next, library.drafts[0].document, JSON.stringify(next), storage)
  assert.equal(JSON.parse(storage.getItem(STORAGE)).frente[1].products[0].por, 'rascunho')
  assert.equal(listSavedDrafts(storage).drafts.length, 2)
  assert.equal(storage.getItem('panfletos:montador:v2'), 'legacy')
})
test('archive quota, verification, active-write failure and concurrent edits never replace originals', () => {
  const old = normalize(seed), raw = JSON.stringify(old), next = createFromTemplate('blitz')
  for (const failure of ['archive-quota','verification','active-quota','conflict','late-conflict']) {
    const storage = libraryStorage({ [STORAGE]: raw })
    const originalSet = storage.setItem
    storage.setItem = (key,value) => {
      if (failure === 'archive-quota' || (failure === 'active-quota' && key === STORAGE)) throw new Error('quota')
      if (failure === 'verification' && key.startsWith(SAVED_PREFIX)) return
      originalSet(key,value)
      if (failure === 'late-conflict' && key.startsWith(SAVED_PREFIX)) originalSet(STORAGE, 'other-tab')
    }
    if (failure === 'conflict') originalSet(STORAGE,'other-tab')
    assert.throws(() => replaceDraft(old,next,raw,storage))
    assert.equal(storage.getItem(STORAGE), failure.includes('conflict') ? 'other-tab' : raw)
    assert.equal(old.layout, undefined)
  }
})
test('unreadable archived copies are reported and preserved alongside readable copies', () => {
  const old = normalize(seed), raw = JSON.stringify(old)
  const storage = libraryStorage({ [STORAGE]:raw, [SAVED_PREFIX+'broken']:'broken' })
  replaceDraft(old,createFromTemplate('blitz'),raw,storage)
  assert.equal(listSavedDrafts(storage).unreadable,1)
  assert.equal(listSavedDrafts(storage).drafts.length,1)
  assert.equal(storage.getItem(SAVED_PREFIX+'broken'),'broken')
})

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
  assert.deepEqual(priceParts(''), { integer: '—', cents: '' })
})

test('prices accept BRL formats and preserve integer cents without rounding', () => {
  for (const [raw, cents, normalized] of [
    ['0', 0, '0,00'], ['19', 1900, '19,00'], ['19,9', 1990, '19,90'], ['19.90', 1990, '19,90'],
    ['1.299,90', 129990, '1.299,90'], ['1299.90', 129990, '1.299,90'], ['1.299', 129900, '1.299,00'],
    [' R$ 0019,99 ', 1999, '19,99'], ['0,01', 1, '0,01'], ['90.071.992.547.409,91', Number.MAX_SAFE_INTEGER, '90.071.992.547.409,91'],
  ]) assert.deepEqual(parsePrice(raw), { ok: true, cents, normalized })
})

test('prices reject nonnumeric, negative, ambiguous, incomplete and imprecise values', () => {
  for (const raw of ['', ' ', 'R$', 'abc', '-10', '+10', '1e3', 'NaN', 'Infinity', '12,345', '12.3456', '1,299.90', '1.23.45', '19,', '19.', ',90', '.90', '1 299,90', '90.071.992.547.409,92', '999999999999999999999', 19.9, null, {}]) {
    assert.equal(parsePrice(raw).ok, false, String(raw))
  }
  assert.deepEqual(parsePrice('  ', true), { ok: true, cents: null, normalized: '' })
  assert.equal(parsePrice('-1', true).ok, false)
  assert.equal(parsePrice('0', true).ok, true)
  assert.deepEqual(priceParts('abc'), { integer: '—', cents: '' })
  assert.deepEqual(priceParts('1299.90'), { integer: '1.299', cents: '90' })
})

test('JSON rejects invalid prices at the right product without mutating the input', () => {
  for (const field of ['de', 'por']) for (const raw of ['abc', '-10', '12,345', '1e3', '9999999999999999999']) {
    const doc = initialDocument(); doc.verso[1].products[0][field] = raw
    const before = structuredClone(doc)
    assert.throws(() => parseProject(JSON.stringify(doc)), error => error instanceof ProjectImportError && /verso, bloco 2, produto 1, preço/.test(error.message))
    assert.deepEqual(doc, before)
  }
  const doc = initialDocument(); doc.frente[1].products[0].de = ''; doc.frente[1].products[0].por = '0,00'
  assert.doesNotThrow(() => validateProject(doc))
  doc.frente[1].products[0].por = ''
  assert.throws(() => validateProject(doc), /Informe o preço Por/)
})

test('price issues cover both sides, support print-side filtering and keep old drafts editable', () => {
  const doc = initialDocument()
  doc.frente[1].products[0].de = 'bad'; doc.verso[1].products[0].por = ''
  const storage = memoryStorage([[STORAGE, JSON.stringify(doc)]])
  const state = loadDraft(storage)
  assert.equal(state.canSave, true)
  assert.equal(state.document.frente[1].products[0].de, 'bad')
  assert.deepEqual(priceIssues(doc).map(i => [i.side, i.field]), [['frente', 'de'], ['verso', 'por']])
  assert.equal(priceIssues(doc, ['frente']).length, 1)
  doc.frente[1].products[0].de = ''
  assert.equal(priceIssues(doc, ['frente']).length, 0)
  assert.equal(priceIssues(doc).length, 1)
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
