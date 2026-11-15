const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const url=process.env.GALLERY_TEST_URL||'http://127.0.0.1:4176/panfletos/'
const key='panfletos:montador:v3'
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL || 'msedge',headless:true})
const templates=JSON.parse(await readFile(new URL('../src/layout-templates.json',import.meta.url),'utf8'))
let passed=0
async function scenario(name,run,mobile=false){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1080},acceptDownloads:true})
 const page=await context.newPage(),errors=[]
 page.on('pageerror',e=>errors.push(String(e)))
 await page.addInitScript(()=>{window.__printCalls=0;window.print=()=>window.__printCalls++})
 try{await page.goto(url);await page.getByRole('button',{name:'+ Novo',exact:true}).waitFor();await run(page);assert.deepEqual(errors,[]);console.log('PASS',name);passed++}finally{await context.close()}
}
const raw=p=>p.evaluate(k=>localStorage.getItem(k),key)
async function gallery(p){await p.getByRole('button',{name:'+ Novo',exact:true}).click();await p.getByRole('dialog').waitFor()}
async function choose(p,name,accept=true){await p.getByRole('button',{name:'Ver modelo '+name,exact:true}).click();p.once('dialog',d=>accept?d.accept():d.dismiss());await p.getByRole('button',{name:'Usar este modelo',exact:true}).click()}
try{
await scenario('gallery filters, keyboard cancel and rejected choice preserve draft',async p=>{
 const before=await raw(p);await gallery(p);assert.equal(await p.locator('.template-card').count(),9)
 await p.getByLabel('Buscar modelo').fill('Natura');assert.equal(await p.locator('.template-card').count(),3)
 await p.getByRole('combobox',{name:/Tamanho/}).selectOption('153x207');assert.equal(await p.locator('.template-card').count(),0)
 await p.keyboard.press('Escape');await p.getByRole('dialog').waitFor({state:'hidden'});assert.equal(await p.getByRole('dialog').count(),0);assert.equal(await raw(p),before)
 assert.equal(await p.getByRole('button',{name:'+ Novo',exact:true}).evaluate(e=>e===document.activeElement),true)
 await gallery(p);await choose(p,templates[0].name,false);assert.equal(await raw(p),before);assert.equal(await p.getByRole('dialog').count(),1)
 await p.getByRole('button',{name:'← Todos os modelos'}).click();if(process.env.GALLERY_SCREENSHOT_DIR) await p.screenshot({path:process.env.GALLERY_SCREENSHOT_DIR+'/gallery-desktop.png'})
})
await scenario('new project archives, edits, undoes, reloads and restores without losing drafts',async p=>{
 await p.locator('.builder-app .product-card').first().click();await p.getByRole('textbox',{name:'Nome do produto',exact:true}).fill('MEU RASCUNHO ORIGINAL')
 const old=JSON.parse(await raw(p));await gallery(p);await choose(p,templates[1].name)
 assert.equal(await p.getByRole('dialog').count(),0);let next=JSON.parse(await raw(p));assert.equal(next.layout.format,'185x270')
 assert.equal(await p.locator('.builder-app .page-stage').count(),1)
 await p.getByRole('button',{name:'Desfazer',exact:true}).click();assert.deepEqual(JSON.parse(await raw(p)),old)
 await p.getByRole('button',{name:'Refazer',exact:true}).click();assert.equal(JSON.parse(await raw(p)).layout.format,'185x270')
 await p.locator('.builder-app .product-card').first().click();await p.getByRole('textbox',{name:'Nome do produto',exact:true}).fill('MODELO EDITADO')
 await p.reload();await gallery(p);await p.getByRole('button',{name:/Rascunhos guardados/}).click()
 assert.equal(await p.locator('.saved-drafts article').count(),1)
 const download=p.waitForEvent('download');await p.getByRole('button',{name:'Baixar cópia',exact:true}).click();const file=await download
 assert.deepEqual(JSON.parse(await readFile(await file.path(),'utf8')),old)
 p.once('dialog',d=>d.accept());await p.getByRole('button',{name:'Restaurar rascunho',exact:true}).click();assert.deepEqual(JSON.parse(await raw(p)),old)
 await gallery(p);await p.getByRole('button',{name:/Rascunhos guardados/}).click();assert.equal(await p.locator('.saved-drafts article').count(),2)
})
await scenario('quota failure and changed draft in another tab block replacement',async p=>{
 const before=await raw(p);await gallery(p)
 await p.evaluate(()=>{window.__set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith('panfletos:saved:'))throw new DOMException('quota','QuotaExceededError');return window.__set.call(this,k,v)}})
 await choose(p,templates[0].name);assert.equal(await raw(p),before);assert.match(await p.getByRole('alert').innerText(),/Não foi possível/)
 await p.evaluate(()=>{Storage.prototype.setItem=window.__set;localStorage.setItem('panfletos:montador:v3','other-tab')})
 p.once('dialog',d=>d.accept());await p.getByRole('button',{name:'Usar este modelo',exact:true}).click();assert.equal(await raw(p),'other-tab');assert.match(await p.getByRole('alert').innerText(),/outra aba/)
})
await scenario('all templates render one page, round trip JSON, and print the right physical size',async p=>{
 for(const t of templates){
  await gallery(p);await choose(p,t.name)
  const doc=JSON.parse(await raw(p));assert.equal(doc.layout.name,t.name)
  assert.equal(await p.locator('.builder-app .page-stage').count(),1)
  const size=await p.locator('.builder-app .flyer-sheet').evaluate(e=>({w:e.offsetWidth,h:e.offsetHeight,overflow:e.scrollHeight>e.clientHeight+1}))
  assert.deepEqual(size,doc.layout.format==='153x207'?{w:578,h:782,overflow:false}:{w:699,h:1020,overflow:false})
  if(doc.verso.length){await p.getByRole('button',{name:'Verso',exact:true}).click();assert.equal(await p.locator('.builder-app .page-stage').count(),1)}
  const dl=p.waitForEvent('download');await p.getByRole('button',{name:'Baixar projeto',exact:true}).click();const text=await readFile(await (await dl).path(),'utf8')
  await p.locator('input[accept=".json,application/json"]').setInputFiles({name:'roundtrip.json',mimeType:'application/json',buffer:Buffer.from(text)})
  await p.getByRole('status').filter({hasText:'Projeto aberto.'}).waitFor();assert.deepEqual(JSON.parse(await raw(p)),doc)
  await p.emulateMedia({media:'print'});const mm=await p.locator('.print-document .flyer-sheet').first().evaluate(e=>e.getBoundingClientRect().width*25.4/96)
  assert.ok(Math.abs(mm-(doc.layout.format==='153x207'?153:185))<.1)
  assert.equal(await p.locator('.print-document .flyer-sheet').count(),doc.verso.length?2:1)
  await p.emulateMedia({media:'screen'})
 }
 if(process.env.GALLERY_SCREENSHOT_DIR) await p.screenshot({path:process.env.GALLERY_SCREENSHOT_DIR+'/gallery-editor.png'})
})
await scenario('mobile gallery and detailed previews remain usable and keyboard focus stays inside',async p=>{
 await gallery(p)
 const bounds=await p.getByRole('dialog').evaluate(e=>({left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right,scroll:e.scrollWidth,width:e.clientWidth}))
 assert.ok(bounds.left>=0&&bounds.right<=390&&bounds.scroll<=bounds.width)
 for(let i=0;i<8;i++){await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>!!document.activeElement.closest('dialog')),true)}
 if(process.env.GALLERY_SCREENSHOT_DIR) await p.screenshot({path:process.env.GALLERY_SCREENSHOT_DIR+'/gallery-mobile.png'})
 await p.getByRole('button',{name:'Ver modelo '+templates[0].name,exact:true}).click()
 await p.getByRole('button',{name:'Usar este modelo',exact:true}).scrollIntoViewIfNeeded()
 assert.equal(await p.getByRole('button',{name:'Usar este modelo',exact:true}).isVisible(),true)
 await p.keyboard.press('Escape');await p.getByRole('dialog').waitFor({state:'hidden'});assert.equal(await p.getByRole('dialog').count(),0)
},true)
await scenario('template photos, header, colors and prices stay editable after reload',async p=>{
 await gallery(p);await choose(p,templates[0].name)
 await p.locator('.block-order button').first().click()
 await p.getByRole('textbox',{name:'Título',exact:true}).fill('MINHA CAMPANHA')
 await p.locator('.builder-app .product-card').first().click()
 const photo=await p.evaluate(()=>{const c=document.createElement('canvas');c.width=20;c.height=30;const ctx=c.getContext('2d');ctx.fillStyle='#8b4fe0';ctx.fillRect(0,0,20,30);return c.toDataURL('image/png').split(',')[1]})
 await p.locator('.upload-box input').setInputFiles({name:'photo.png',mimeType:'image/png',buffer:Buffer.from(photo,'base64')})
 await p.locator('.upload-box img').waitFor()
 await p.getByLabel('Cor da etiqueta',{exact:true}).fill('#123456')
 await p.getByRole('textbox',{name:/^Por \(R\$\)/}).fill('-12')
 await p.getByRole('button',{name:'Imprimir / PDF',exact:true}).click()
 assert.equal(await p.evaluate(()=>window.__printCalls),0)
 assert.equal(await p.locator('.print-document .flyer-sheet').count(),0)
 await p.getByRole('textbox',{name:/^Por \(R\$\)/}).fill('12,90')
 await p.getByRole('button',{name:'Imprimir / PDF',exact:true}).click()
 assert.equal(await p.evaluate(()=>window.__printCalls),1)
 await p.reload();await p.getByRole('button',{name:'+ Novo',exact:true}).waitFor()
 const doc=JSON.parse(await raw(p));assert.equal(doc.frente[0].fields[1].value,'MINHA CAMPANHA');assert.equal(doc.frente[1].products[0].badgeColor,'#123456');assert.match(doc.frente[1].products[0].photo,/^data:image\/webp/)
})
console.log('Gallery scenarios passed:',passed)
}finally{await browser.close()}


