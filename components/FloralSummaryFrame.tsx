'use client';
import {useId,type CSSProperties} from 'react';
/** Corner flowers and edge sprigs are independent, uniformly scaled artwork. */
export default function FloralSummaryFrame(){
 const id=useId().replace(/:/g,'');
 const artwork=(cell:number,key:string,className:string,style?:CSSProperties)=>{
  const x=cell%2*100+2,y=Math.floor(cell/2)*100+2,clip=`${id}-${key}`;
  return <svg key={key} className={className} style={style} viewBox={`${x} ${y} 96 96`} preserveAspectRatio="xMidYMid meet"><defs><clipPath id={clip}><rect x={x} y={y} width="96" height="96"/></clipPath></defs><image href="/brand/cottage-floral-frame-atlas-v1.png" width="200" height="200" clipPath={`url(#${clip})`}/></svg>;
 };
 return <span className="floral-summary-frame cottage-floral-frame" aria-hidden="true">{[23,43,63,80].map((left,i)=>artwork(2,`top-${i}`,'cottage-frame-sprig cottage-sprig-top',{left:left+'%',transform:`translateX(-50%) rotate(${i%2?5:-6}deg)`}))}{[27,49,70].map((left,i)=>artwork(2,`bottom-${i}`,'cottage-frame-sprig cottage-sprig-bottom',{left:left+'%',transform:`translateX(-50%) rotate(${i%2?176:184}deg)`}))}{artwork(0,'upper-left','cottage-frame-corner cottage-corner-upper-left')}{artwork(1,'upper-right','cottage-frame-corner cottage-corner-upper-right')}{artwork(1,'lower-left','cottage-frame-corner cottage-corner-lower-left')}{artwork(3,'lower-right','cottage-frame-corner cottage-corner-lower-right')}</span>;
}
