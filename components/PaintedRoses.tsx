'use client';
import RoseVine from './RoseVine';
import {useEffect,useRef,useState} from 'react';
export default function PaintedRoses({place='left'}:{place?:'left'|'right'}){
 const last=useRef(0),next=useRef(0);const [petals,setPetals]=useState<{id:number;variant:number}[]>([]);
 useEffect(()=>{
  function flutter(e:PointerEvent){
   const near=place==='left'?e.clientX<90:e.clientX>window.innerWidth-90;
   if(!near||e.clientY<window.innerHeight*.2||window.matchMedia('(prefers-reduced-motion: reduce)').matches||Date.now()-last.current<8500)return;
   last.current=Date.now();setPetals(Array.from({length:2},(_,variant)=>({id:++next.current,variant})));
  }
  window.addEventListener('pointermove',flutter,{passive:true});return()=>window.removeEventListener('pointermove',flutter);
 },[place]);
 return <span className={`painted-roses roses-${place}`} aria-hidden="true"><span className="rose-border-tail"><RoseVine direction="vertical"/></span><span className="rose-border-art"><span className="rose-border-vertical"/><span className="rose-border-horizontal"/><span className="rose-border-corner"/></span>{petals.map(p=><span key={p.id} className={`rose-petal petal-${p.variant}`} onAnimationEnd={()=>setPetals(v=>v.filter(x=>x.id!==p.id))}/>)}</span>;
}
