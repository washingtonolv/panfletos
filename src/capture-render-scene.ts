import type { PaintCommand, RenderAsset, RenderScene } from './render-scene'

const resourceCache = new Map<string, Promise<string>>()
const skipSelector = '[data-rust-layer],.block-controls,.block-image-action,.photo-action-hint,.photo-placeholder'
const round = (n: number) => Math.round(n * 1000) / 1000
const transparent = (color: string) => color === 'transparent' || /rgba\([^)]*,\s*0\s*\)$/.test(color)
function base64(bytes: Uint8Array): string {
  let text = ''; for (let i=0;i<bytes.length;i+=32768) text += String.fromCharCode(...bytes.subarray(i,i+32768))
  return btoa(text)
}
async function embeddedSource(src: string): Promise<string> {
  if (src.startsWith('data:image/')) return src
  const cached = resourceCache.get(src); if (cached) return cached
  const promise = (async () => {
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 4000)
    try {
      const response = await fetch(src, { signal: controller.signal, credentials: 'same-origin' })
      if (!response.ok) throw new Error('Imagem indisponível para renderização.')
      const type = response.headers.get('content-type')?.split(';')[0] || 'image/png'
      if (!/^image\/(png|jpeg|webp|svg\+xml|gif)$/.test(type)) throw new Error('Tipo de imagem não incorporável.')
      return `data:${type};base64,${base64(new Uint8Array(await response.arrayBuffer()))}`
    } finally { clearTimeout(timeout) }
  })()
  if (resourceCache.size >= 64) resourceCache.delete(resourceCache.keys().next().value!)
  resourceCache.set(src,promise)
  return promise
}
function dimension(value: string, size: number): number {
  value = value.trim()
  if (value.endsWith('%')) return parseFloat(value) * size / 100
  if (value.startsWith('calc(')) {
    const match = /^calc\(([\d.]+)%\s*([-+])\s*([\d.]+)px\)$/.exec(value)
    if (!match) throw new Error('Recorte não suportado.')
    return Number(match[1]) * size / 100 + Number(match[3]) * (match[2] === '-' ? -1 : 1)
  }
  const result = parseFloat(value); if (!Number.isFinite(result)) throw new Error('Dimensão inválida.')
  return result
}
function polygon(value: string, box: { x: number; y: number; w: number; h: number }): [number,number][] | undefined {
  if (value === 'none') return undefined
  if (!value.startsWith('polygon(')) throw new Error('Recorte não suportado.')
  return value.slice(8,-1).split(',').map(pair => {
    const pieces = pair.trim().match(/calc\([^)]*\)|[^\s]+/g)
    if (pieces?.length !== 2) throw new Error('Recorte inválido.')
    return [round(box.x + dimension(pieces[0],box.w)),round(box.y + dimension(pieces[1],box.h))]
  })
}

/** Read CSS geometry and text shaping; Rust is responsible for the paint output. */
export async function captureRenderScene(root: HTMLElement): Promise<RenderScene> {
  await document.fonts.ready
  const images = [...root.querySelectorAll<HTMLImageElement>('img')].filter(img => !img.closest(skipSelector))
  const loaded = await Promise.all(images.map(async img => {
    if (!img.complete || !img.naturalWidth) await Promise.race([img.decode(),new Promise<never>((_,reject) => setTimeout(() => reject(new Error('Imagem ainda indisponível.')),4000))])
    if (!img.naturalWidth) throw new Error('Imagem inválida.')
    return { element: img, src: img.currentSrc || img.src, href: await embeddedSource(img.currentSrc || img.src), width: img.naturalWidth, height: img.naturalHeight }
  }))
  if (!root.isConnected) throw new Error('Folha substituída.')
  const style = getComputedStyle(root), width = parseFloat(style.width), height = parseFloat(style.height), bounds = root.getBoundingClientRect()
  const sx = bounds.width / width, sy = bounds.height / height
  if (!sx || !sy || !width || !height) throw new Error('Folha não mensurável.')
  const scene: RenderScene = { width, height, assets: [], commands: [] }
  const assetIds = new Map<string,number>(), imageIds = new Map<Element,number>()
  function addAsset(key: string, asset: RenderAsset) {
    let id = assetIds.get(key)
    if (id === undefined) { id=scene.assets.length; assetIds.set(key,id); scene.assets.push(asset) }
    return id
  }
  loaded.forEach(image => imageIds.set(image.element, addAsset(image.src,image)))
  const canvas = document.createElement('canvas'), metrics = canvas.getContext('2d')!
  const segmenter = new Intl.Segmenter('pt-BR', { granularity: 'grapheme' })
  const box = (element: Element) => {
    const r = element.getBoundingClientRect()
    return { x:round((r.left-bounds.left)/sx), y:round((r.top-bounds.top)/sy), w:round(r.width/sx), h:round(r.height/sy) }
  }
  const command = (paint: PaintCommand) => { if(scene.commands.length >= 20_000) throw new Error('Folha muito complexa.'); scene.commands.push(paint) }
  const radius = (s: CSSStyleDeclaration, b: {w:number;h:number}) => Math.max(0,Math.min(dimension(s.borderTopLeftRadius.split(' ')[0] || '0',Math.min(b.w,b.h)),b.w/2,b.h/2))
  function background(b: ReturnType<typeof box>, s: CSSStyleDeclaration, opacity: number, element?: Element) {
    let fill = s.backgroundColor
    if (element?.classList.contains('product-card')) fill = root.classList.contains('has-page-background') ? 'transparent' : '#ffffff'
    if (!transparent(fill)) command({ kind:'rect',...b,radius:radius(s,b),fill,opacity })
    for (const edge of ['Top','Right','Bottom','Left'] as const) {
      const size = parseFloat(s[`border${edge}Width`]), ink = s[`border${edge}Color`], type = s[`border${edge}Style`]
      if (!size || type === 'none' || transparent(ink)) continue
      const horizontal = edge === 'Top' || edge === 'Bottom'
      const x = b.x + (edge === 'Right' ? b.w-size/2 : edge === 'Left' ? size/2 : 0)
      const y = b.y + (edge === 'Bottom' ? b.h-size/2 : edge === 'Top' ? size/2 : 0)
      command({kind:'line',x,y,x2:x+(horizontal?b.w:0),y2:y+(horizontal?0:b.h),width:size,color:ink,...(type==='dashed'?{dash:[size*3,size*3]}:type==='dotted'?{dash:[size,size]}:{})})
    }
  }
  function text(node: Text, parent: HTMLElement, s: CSSStyleDeclaration) {
    const content = node.textContent || ''
    if (!content.trim()) return
    if (content.length > 10_000) throw new Error('Texto muito longo para a cena.')
    const size = parseFloat(s.fontSize), spacing = s.letterSpacing === 'normal' ? 0 : parseFloat(s.letterSpacing)
    metrics.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`
    const range = document.createRange(), parentBox=box(parent)
    const lines: {value:string;x:number;y:number;h:number;right:number}[] = []
    for (const part of segmenter.segment(content)) {
      range.setStart(node,part.index); range.setEnd(node,part.index+part.segment.length)
      const r = range.getBoundingClientRect()
      if (!r.width || !r.height) continue
      const x=(r.left-bounds.left)/sx, y=(r.top-bounds.top)/sy, h=r.height/sy
      const value = /^(normal|nowrap)$/.test(s.whiteSpace) ? part.segment.replace(/\s/g,' ') : part.segment
      const last=lines.at(-1)
      const justifiedWord=s.textAlign==='justify' && last && /\s$/.test(last.value) && !/^\s/.test(value)
      if (last && !justifiedWord && Math.abs(last.y-y)<.5 && Math.abs(last.h-h)<1) { last.value+=value;last.x=Math.min(last.x,x);last.right=Math.max(last.right,x+r.width/sx) }
      else lines.push({value,x,y,h,right:x+r.width/sx})
    }
    range.detach()
    const clamp = parseInt(s.webkitLineClamp), visible = lines.filter(line=>line.y + line.h*.5 < parentBox.y + parentBox.h + .5)
    if (clamp > 0 && lines.length > visible.length && visible.length) {
      const last=visible.at(-1)!, available=parentBox.x+parentBox.w-last.x
      while (last.value.length && metrics.measureText(last.value+'…').width+spacing*last.value.length>available) last.value=last.value.slice(0,-1)
      last.value=last.value.trimEnd()+'…'
    }
    for (const line of clamp>0 ? visible : lines) {
      const value = s.textTransform === 'uppercase' ? line.value.toLocaleUpperCase('pt-BR') : s.textTransform === 'lowercase' ? line.value.toLocaleLowerCase('pt-BR') : line.value
      const m = metrics.measureText(value), ascent = m.fontBoundingBoxAscent ?? size*.8
      command({kind:'text',x:round(line.x),y:round(line.y+ascent),text:value,font:s.fontFamily,size,weight:s.fontWeight,italic:s.fontStyle!=='normal',spacing,color:s.color})
    }
  }
  function pseudo(element: HTMLElement, name: '::before'|'::after', opacity: number) {
    const s=getComputedStyle(element,name)
    if (s.content==='none'||s.content==='normal'||s.display==='none') return
    if (s.content!=='""' && s.content!=="''") throw new Error('Ornamento não suportado.')
    if (transparent(s.backgroundColor)) return
    const b=box(element), w=parseFloat(s.width),h=parseFloat(s.height)
    if (!Number.isFinite(w)||!Number.isFinite(h)) return
    const x=b.x+(s.left!=='auto'?parseFloat(s.left):b.w-parseFloat(s.right)-w),y=b.y+(s.top!=='auto'?parseFloat(s.top):b.h-parseFloat(s.bottom)-h)
    command({kind:'rect',x,y,w,h,radius:radius(s,{w,h}),fill:s.backgroundColor,opacity:opacity*Number(s.opacity)})
  }
  function walk(element: Element, opacity: number) {
    if (element.matches(skipSelector) || element.closest('[data-rust-layer]')) return
    const s=getComputedStyle(element)
    if(s.display==='none') return
    const b=box(element)
    if(b.w<=0||b.h<=0) return
    const sourceRoot = element.parentElement?.classList.contains('flyer-block') && !element.classList.contains('block-image-action')
    const alpha=opacity*(sourceRoot?1:Number(s.opacity))
    const points=polygon(s.clipPath,b)
    const clipped=!!points || ['hidden','clip','auto','scroll'].includes(s.overflowX) || ['hidden','clip','auto','scroll'].includes(s.overflowY)
    if(clipped) command({kind:'clip',...b,radius:radius(s,b),...(points?{points}:{})})
    background(b,s,alpha,element)
    if(element instanceof HTMLImageElement) {
      const id=imageIds.get(element), asset=id===undefined?undefined:scene.assets[id]
      if(id===undefined||!asset) throw new Error('Imagem mudou durante o desenho.')
      const fit=s.objectFit, scale=fit==='cover'?Math.max(b.w/asset.width,b.h/asset.height):fit==='fill'?0:Math.min(b.w/asset.width,b.h/asset.height)
      const w=scale?asset.width*scale:b.w,h=scale?asset.height*scale:b.h
      const position=s.objectPosition.split(' '), px=dimension(position[0] || '50%',1),py=dimension(position[1] || '50%',1)
      command({kind:'clip',...b,radius:0})
      command({kind:'image',asset:id,x:round(b.x+(b.w-w)*px),y:round(b.y+(b.h-h)*py),w:round(w),h:round(h)})
      command({kind:'pop'})
    } else if(element instanceof SVGSVGElement) {
      const clone=element.cloneNode(true) as SVGSVGElement
      clone.setAttribute('xmlns','http://www.w3.org/2000/svg');clone.style.color=s.color
      const markup=new XMLSerializer().serializeToString(clone).replace(/currentColor/g,s.color)
      const href=`data:image/svg+xml;base64,${base64(new TextEncoder().encode(markup))}`
      const id=addAsset(markup,{href,width:b.w,height:b.h})
      command({kind:'image',asset:id,...b})
    } else {
      const nodes=[...element.childNodes].map((node,index)=>({node,index,z:node instanceof Element?Number(getComputedStyle(node).zIndex)||0:0}))
      const before=getComputedStyle(element,'::before'),after=getComputedStyle(element,'::after')
      const paints=[...nodes.map(n=>({...n,pseudo:undefined as '::before'|'::after'|undefined})),{node:element,index:-1,z:Number(before.zIndex)||0,pseudo:'::before' as const},{node:element,index:nodes.length,z:Number(after.zIndex)||0,pseudo:'::after' as const}].sort((a,b)=>a.z-b.z||a.index-b.index)
      for(const paint of paints) {
        if(paint.pseudo) pseudo(element as HTMLElement,paint.pseudo,alpha)
        else if(paint.node instanceof Text) text(paint.node,element as HTMLElement,s)
        else if(paint.node instanceof Element) walk(paint.node,alpha)
      }
    }
    if(clipped) command({kind:'pop'})
  }
  walk(root,1)
  return scene
}
