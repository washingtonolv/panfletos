const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const url=process.env.EDITOR_TEST_URL||'http://127.0.0.1:4177/panfletos/'
const key='panfletos:montador:v3'
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true})
let passed=0
async function scenario(name,run,mobile=false){
 if(process.env.EDITOR_SCENARIO && !name.includes(process.env.EDITOR_SCENARIO))return
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1397,height:929},acceptDownloads:true})
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)))
 try {await page.goto(url);await page.getByRole('toolbar',{name:'Ferramentas do editor'}).waitFor();await run(page);assert.deepEqual(errors,[]);passed++;console.log('PASS',name)} finally {await context.close()}
}
const raw=p=>p.evaluate(k=>localStorage.getItem(k),key)
const saved=async p=>JSON.parse(await raw(p))
async function fixture(p,color='#7841ae'){
 const base64=await p.evaluate(color=>{const c=document.createElement('canvas');c.width=1000;c.height=240;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#fff';ctx.font='bold 70px Arial';ctx.fillText('NOVA CAMPANHA',70,145);return c.toDataURL('image/png').split(',')[1]},color)
 return {name:'campaign.png',mimeType:'image/png',buffer:Buffer.from(base64,'base64')}
}
async function directUpload(p,selector,file){const chooser=p.waitForEvent('filechooser');await p.locator(selector).first().click();await(await chooser).setFiles(file);await p.getByRole('status').filter({hasText:/Imagem aplicada|Foto encaixada/}).waitFor()}
async function screenshot(p,name){if(process.env.EDITOR_SCREENSHOT_DIR)await p.screenshot({path:process.env.EDITOR_SCREENSHOT_DIR+'/'+name+'.png'})}
try{
await scenario('direct product photo upload, replacement, removal, history, reload and backup',async p=>{
 const file=await fixture(p);await directUpload(p,'.builder-app .product-photo',file)
 const first=(await saved(p)).frente[1].products[0].photo;assert.match(first,/^data:image\/webp/)
 await p.getByRole('button',{name:'Remover foto',exact:true}).click();assert.equal((await saved(p)).frente[1].products[0].photo,undefined)
 await p.getByRole('button',{name:'Desfazer',exact:true}).click();assert.equal((await saved(p)).frente[1].products[0].photo,first)
 await p.getByRole('button',{name:'Refazer',exact:true}).click();assert.equal((await saved(p)).frente[1].products[0].photo,undefined)
 await directUpload(p,'.builder-app .product-photo',await fixture(p,'#b32650'))
 assert.notEqual((await saved(p)).frente[1].products[0].photo,first)
 await p.reload();await p.locator('.builder-app .product-photo img').first().waitFor()
 const download=p.waitForEvent('download');await p.getByRole('button',{name:'Baixar projeto',exact:true}).click();const filePath=await(await download).path()
 assert.deepEqual(JSON.parse(await readFile(filePath,'utf8')),await saved(p))
})
await scenario('header/footer images preserve text and survive both sides, JSON, print and removal',async p=>{
 const before=await saved(p),file=await fixture(p)
 for(const side of ['Frente','Verso']){
  await p.getByRole('button',{name:side,exact:true}).click()
  await directUpload(p,'.builder-app .kind-header .block-image-action',file)
  await p.getByRole('combobox',{name:/Ajuste da imagem/}).selectOption('cover')
  await directUpload(p,'.builder-app .kind-footsite .block-image-action, .builder-app .kind-footpay .block-image-action',file)
 }
 assert.equal(await p.locator('.print-document .block-artwork img').count(),4)
 const doc=await saved(p);assert.deepEqual(doc.frente[0].fields,before.frente[0].fields);assert.equal(doc.frente[0].imageFit,'cover')
 await p.emulateMedia({media:'print'});assert.equal(await p.getByRole('toolbar',{name:'Ferramentas do editor'}).isVisible(),false)
 const width=await p.locator('.print-document .flyer-sheet').first().evaluate(e=>e.getBoundingClientRect().width*25.4/96);assert.ok(Math.abs(width-153)<.1)
 await p.emulateMedia({media:'screen'})
 await p.locator('input[accept=".json,application/json"]').setInputFiles({name:'images.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(doc))})
 await p.getByRole('status').filter({hasText:'Projeto aberto.'}).waitFor();assert.deepEqual(await saved(p),doc)
 await p.reload();await p.locator('.builder-app .kind-header .block-artwork img').waitFor()
 await p.locator('.block-order button').first().click();await p.getByRole('button',{name:'Remover imagem',exact:true}).click()
 assert.equal(await p.locator('.builder-app .kind-header .campaign').count(),1)
 await p.getByRole('button',{name:'Desfazer',exact:true}).click();await p.locator('.builder-app .kind-header .block-artwork img').waitFor()
 await screenshot(p,'editor-images')
})
await scenario('bad image type, decode failure, oversize and cancelled file keep the document',async p=>{
 await p.locator('.block-order button').first().click();const input=p.getByLabel('Imagem do cabeçalho ou rodapé',{exact:true}),before=await raw(p)
 await input.setInputFiles({name:'bad.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg/>')});await p.getByRole('status').filter({hasText:'Escolha uma imagem'}).waitFor();assert.equal(await raw(p),before)
 await input.setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('not png')});await p.getByRole('status').filter({hasText:'Não foi possível abrir'}).waitFor();assert.equal(await raw(p),before)
 await input.setInputFiles({name:'large.png',mimeType:'image/png',buffer:Buffer.alloc(20*1024*1024+1)});await p.getByRole('status').filter({hasText:'20 MiB'}).waitFor();assert.equal(await raw(p),before)
 await input.setInputFiles([]);assert.equal(await raw(p),before)
})
await scenario('late uploads cannot restore removed images, overwrite edits or beat newer uploads',async p=>{
 const file=await fixture(p);await directUpload(p,'.builder-app .kind-header .block-image-action',file)
 const input=p.getByLabel('Imagem do cabeçalho ou rodapé',{exact:true})
 async function delayNext(){await p.evaluate(()=>{window.__nativeBitmap=window.__nativeBitmap||window.createImageBitmap;window.__waiting=false;window.createImageBitmap=(...args)=>{window.createImageBitmap=window.__nativeBitmap;window.__waiting=true;return new Promise(resolve=>{window.__resolveImage=async()=>resolve(await window.__nativeBitmap(...args))})}})}
 await delayNext();await input.setInputFiles(await fixture(p,'#cc3300'));await p.waitForFunction(()=>window.__waiting)
 await p.getByRole('button',{name:'Remover imagem',exact:true}).click();await p.evaluate(()=>window.__resolveImage());await p.waitForTimeout(150);assert.equal((await saved(p)).frente[0].image,undefined)
 await delayNext();await input.setInputFiles(file);await p.waitForFunction(()=>window.__waiting)
 await p.getByRole('textbox',{name:/^Título/}).fill('EDITADO DURANTE UPLOAD');await p.evaluate(()=>window.__resolveImage());await p.getByRole('status').filter({hasText:'conteúdo mudou'}).waitFor();assert.equal((await saved(p)).frente[0].image,undefined)
 await delayNext();await input.setInputFiles(file);await p.waitForFunction(()=>window.__waiting)
 await input.setInputFiles(await fixture(p,'#0055bb'));await p.getByRole('status').filter({hasText:'Imagem aplicada'}).waitFor();const newest=(await saved(p)).frente[0].image
 await p.evaluate(()=>window.__resolveImage());await p.waitForTimeout(150);assert.equal((await saved(p)).frente[0].image,newest)
 await delayNext();await input.setInputFiles(file);await p.waitForFunction(()=>window.__waiting)
 await p.getByRole('button',{name:'Desfazer',exact:true}).click();const undone=await raw(p);await p.evaluate(()=>window.__resolveImage());await p.waitForTimeout(150);assert.equal(await raw(p),undone)
 await delayNext();await input.setInputFiles(file);await p.waitForFunction(()=>window.__waiting)
 const sameDocument=await raw(p)
 await p.locator('input[accept=".json,application/json"]').setInputFiles({name:'same.json',mimeType:'application/json',buffer:Buffer.from(sameDocument)})
 await p.getByRole('status').filter({hasText:'Projeto aberto.'}).waitFor();await p.evaluate(()=>window.__resolveImage());await p.waitForTimeout(150);assert.equal(await raw(p),sameDocument)
 await p.locator('.block-order button').first().click();await delayNext();await input.setInputFiles(file);await p.waitForFunction(()=>window.__waiting)
 await p.getByRole('button',{name:'+ Novo',exact:true}).click();await p.getByRole('button',{name:'Ver modelo Blitz de ofertas',exact:true}).click();p.once('dialog',d=>d.accept());await p.getByRole('button',{name:'Usar este modelo',exact:true}).click()
 const newProject=await raw(p);await p.evaluate(()=>window.__resolveImage());await p.waitForTimeout(150);assert.equal(await raw(p),newProject)
})
await scenario('Ctrl wheel zoom stays anchored, ordinary scrolling and hand pan do not edit the document',async p=>{
 assert.equal(await p.locator('.canvas-toolbar').count(),0)
 const area=p.getByRole('main',{name:'Área de edição do panfleto'}),box=await area.boundingBox(),stage=p.locator('.builder-app .page-stage').first()
 const before=await raw(p),toolbar=await p.getByRole('toolbar',{name:'Ferramentas do editor'}).boundingBox()
 const x=box.x+box.width*.55,y=box.y+box.height*.5
 const start=await stage.boundingBox();const anchor={x:(x-start.x)/.85,y:(y-start.y)/.85},dpr=await p.evaluate(()=>devicePixelRatio)
 await p.mouse.move(x,y);await p.keyboard.down('Control');await p.mouse.wheel(0,-150);await p.keyboard.up('Control')
 await p.waitForFunction(()=>Number(document.querySelector('[aria-label="Zoom do canvas"]').value)>.85)
 const zoom=Number(await p.getByRole('combobox',{name:'Zoom do canvas'}).inputValue()),after=await stage.boundingBox()
 assert.ok(Math.abs(after.x+anchor.x*zoom-x)<2);assert.ok(Math.abs(after.y+anchor.y*zoom-y)<2);assert.equal(await p.evaluate(()=>devicePixelRatio),dpr)
 await p.mouse.wheel(0,200);await p.waitForTimeout(100);assert.equal(Number(await p.getByRole('combobox',{name:'Zoom do canvas'}).inputValue()),zoom)
 await p.getByRole('combobox',{name:'Zoom do canvas'}).selectOption('2')
 await p.getByRole('button',{name:'Mão (H)',exact:true}).click()
 const scroll=await area.evaluate(e=>({x:e.scrollLeft,y:e.scrollTop}))
 await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x-90,y-100,{steps:8});await p.mouse.up()
 const moved=await area.evaluate(e=>({x:e.scrollLeft,y:e.scrollTop}));assert.ok(moved.x>scroll.x+50);assert.ok(moved.y>scroll.y+50)
 assert.equal(await raw(p),before);assert.equal(await p.getByRole('button',{name:'Desfazer',exact:true}).isDisabled(),true)
 const toolbarAfter=await p.getByRole('toolbar',{name:'Ferramentas do editor'}).boundingBox();assert.ok(Math.abs(toolbarAfter.y-toolbar.y)<1)
 await p.getByRole('button',{name:'Selecionar (V)',exact:true}).click();await p.getByRole('combobox',{name:'Zoom do canvas'}).selectOption('0.5')
 assert.equal(await raw(p),before)
 await screenshot(p,'editor-tools')
})
await scenario('keyboard tools and history ignore text fields and the open gallery',async p=>{
 const area=p.getByRole('main',{name:'Área de edição do panfleto'});await area.focus();await p.keyboard.press('h');assert.equal(await p.getByRole('button',{name:'Mão (H)',exact:true}).getAttribute('aria-pressed'),'true')
 await p.keyboard.press('v');assert.equal(await p.getByRole('button',{name:'Selecionar (V)',exact:true}).getAttribute('aria-pressed'),'true')
 await p.keyboard.down('Space');assert.equal(await p.getByRole('button',{name:'Mão (H)',exact:true}).getAttribute('aria-pressed'),'true');await p.keyboard.up('Space')
 await p.locator('.block-order button').first().click();const title=p.getByRole('textbox',{name:/^Título/}),old=await title.inputValue();await title.fill('hv TESTE');await title.press('h');assert.equal(await p.getByRole('button',{name:'Mão (H)',exact:true}).getAttribute('aria-pressed'),'false')
 await area.focus();await p.keyboard.press('Control+z');await p.keyboard.press('Control+z');assert.equal((await saved(p)).frente[0].fields[1].value,old)
 await p.keyboard.press('Control+Shift+z');assert.equal((await saved(p)).frente[0].fields[1].value,'hv TESTE')
 await p.getByRole('button',{name:'+ Novo',exact:true}).click();const before=await raw(p);await p.getByLabel('Buscar modelo').fill('hv');await p.keyboard.press('Control+z');assert.equal(await raw(p),before);assert.equal(await p.getByRole('dialog').count(),1)
})
await scenario('mobile floating tools fit the viewport and remain separate from print',async p=>{
 const area=p.getByRole('main',{name:'Área de edição do panfleto'});await area.scrollIntoViewIfNeeded()
 const tools=p.getByRole('toolbar',{name:'Ferramentas do editor'}),box=await tools.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=390)
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
 await p.getByRole('button',{name:'Mão (H)',exact:true}).click();await p.getByRole('combobox',{name:'Zoom do canvas'}).selectOption('0.5')
 await screenshot(p,'editor-mobile-tools')
 await p.emulateMedia({media:'print'});assert.equal(await tools.isVisible(),false)
},true)
console.log('Editor tools scenarios passed:',passed)
}finally{await browser.close()}

