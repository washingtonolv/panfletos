import { useLayoutEffect, useRef, useState } from 'react'
import { captureRenderScene } from './capture-render-scene'
import { renderSvgScene } from './layout-engine'
import './rust-renderer.css'

import { surfaces } from './render-output'
import type { Entry } from './render-output'

type Mark = { x:number;y:number;w:number;h:number;kind:'block'|'product'|'photo'|'focus' }
export default function RustRenderSurface({ revision }: { revision: unknown }) {
  const host=useRef<HTMLDivElement>(null), generation=useRef(0), ticket=useRef(0)
  const [vector,setVector]=useState<{ url:string;generation:number;ticket:number }>()
  const [marks,setMarks]=useState<Mark[]>([])
  useLayoutEffect(()=>{
    const root=host.current!.parentElement!,current=++generation.current
    if(new URLSearchParams(location.search).get('renderer')==='dom'){root.dataset.renderEngine='dom';return()=>{delete root.dataset.renderEngine}}
    let active=true, frame=0, url:string|undefined, settle=()=>{}, running=false, dirty=false
    const entry:Entry={wait:Promise.resolve()}
    surfaces.set(root,entry);root.dataset.renderEngine='dom-pending'
    function selection() {
      if(!active)return
      const r=root.getBoundingClientRect(),sx=r.width/parseFloat(getComputedStyle(root).width),sy=r.height/parseFloat(getComputedStyle(root).height)
      if(!sx||!sy)return
      const elements=[...root.querySelectorAll<HTMLElement>('.flyer-block.is-selected,.product-card.is-picked,.product-photo')]
      if(document.activeElement instanceof HTMLElement && root.contains(document.activeElement) && document.activeElement.matches('.product-card'))elements.push(document.activeElement)
      setMarks(elements.flatMap(element=>{
        const photo=element.classList.contains('product-photo')
        if(photo&&element.querySelector('img'))return []
        const b=element.getBoundingClientRect()
        return [{x:(b.left-r.left)/sx,y:(b.top-r.top)/sy,w:b.width/sx,h:b.height/sy,kind:photo?'photo':element.matches('.is-picked')?'product':element.matches('.flyer-block')?'block':'focus'} as Mark]
      }))
    }
    async function paint() {
      frame=0
      if(!active)return
      if(running){dirty=true;return}
      running=true
      const paintTicket=ticket.current
      try {
        const scene=await captureRenderScene(root)
        if(!active)return
        if(paintTicket!==ticket.current){dirty=true;return}
        const svg=renderSvgScene(scene)
        if(!svg)throw new Error('Renderizador indisponível.')
        if(url)URL.revokeObjectURL(url)
        url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}))
        entry.svg=svg;setVector({url,generation:current,ticket:paintTicket});selection()
      } catch(error) {
        console.warn('Desenho vetorial: usando desenho de compatibilidade.',error instanceof Error?error.message:'Falha de renderização')
        if(active){root.dataset.renderEngine='dom-fallback';entry.svg=undefined;settle()}
      } finally {
        running=false
        if(active&&dirty){dirty=false;schedule()}
      }
    }
    function schedule() {
      if(!active)return
      ticket.current++
      root.dataset.renderEngine='dom-pending'
      settle();entry.wait=new Promise(resolve=>{settle=resolve})
      if(!frame)frame=requestAnimationFrame(()=>{void paint()})
    }
    function onReady(event: Event) {
      const target=event.target as HTMLElement
      if(!target.closest('[data-rust-layer]'))schedule()
    }
    function vectorReady() { if(active){root.dataset.renderEngine='rust-svg';selection();settle()} }
    function vectorError() { if(active){root.dataset.renderEngine='dom-fallback';entry.svg=undefined;settle()} }
    const observer=new MutationObserver(records=>{
      if(records.some(record=>record.target instanceof Element && !record.target.closest('[data-rust-layer]') && record.target!==root))schedule()
    })
    observer.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','style','src']})
    const resize=new ResizeObserver(schedule);resize.observe(root)
    root.addEventListener('load',onReady,true);root.addEventListener('error',onReady,true)
    root.addEventListener('focusin',selection);root.addEventListener('focusout',selection)
    root.addEventListener('rust-vector-ready',vectorReady);root.addEventListener('rust-vector-error',vectorError)
    schedule()
    return()=>{
      active=false;settle();cancelAnimationFrame(frame);observer.disconnect();resize.disconnect()
      root.removeEventListener('load',onReady,true);root.removeEventListener('error',onReady,true)
      root.removeEventListener('focusin',selection);root.removeEventListener('focusout',selection)
      root.removeEventListener('rust-vector-ready',vectorReady);root.removeEventListener('rust-vector-error',vectorError)
      surfaces.delete(root);delete root.dataset.renderEngine;if(url)URL.revokeObjectURL(url)
    }
  },[revision])
  return <div ref={host} data-rust-layer="surface" className="rust-vector-layer" aria-hidden="true">
    {vector&&<img className="rust-vector-image" src={vector.url} alt="" draggable={false} onLoad={()=>{if(vector.generation===generation.current&&vector.ticket===ticket.current)host.current?.parentElement?.dispatchEvent(new Event('rust-vector-ready'))}} onError={()=>{if(vector.generation===generation.current&&vector.ticket===ticket.current)host.current?.parentElement?.dispatchEvent(new Event('rust-vector-error'))}} />}
    {marks.map((mark,i)=><span key={i} className={`rust-render-mark rust-mark-${mark.kind}`} style={{left:mark.x,top:mark.y,width:mark.w,height:mark.h}}>{mark.kind==='photo'?'＋':null}</span>)}
  </div>
}
