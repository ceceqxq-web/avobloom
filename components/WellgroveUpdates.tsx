"use client";
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
export default function WellgroveUpdates(){
 const pathname=usePathname();
 const [available,setAvailable]=useState(false);
 useEffect(()=>{if(pathname==='/demo'||!('serviceWorker' in navigator))return;let stopped=false;const previous=!!navigator.serviceWorker.controller;
 const changed=()=>{if(previous&&!stopped)setAvailable(true)};
 navigator.serviceWorker.addEventListener('controllerchange',changed);
 const update=async()=>{try{const registration=await navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'});await registration.update()}catch{/* The app remains usable if service workers are unavailable. */}};
 void update();const focus=()=>void update();window.addEventListener('focus',focus);return()=>{stopped=true;navigator.serviceWorker.removeEventListener('controllerchange',changed);window.removeEventListener('focus',focus)};
 },[pathname]);
 return available?<div role="status" style={{position:'fixed',top:12,left:'50%',transform:'translateX(-50%)',zIndex:300,background:'#fffef8',border:'1px solid #cdddbd',borderRadius:12,padding:'12px 16px',boxShadow:'0 4px 20px #29473120',fontSize:12,color:'#4e7040',maxWidth:'90vw'}}><span>Avobloom 新版本已就绪。</span><button type="button" style={{marginLeft:12,border:0,background:'#397e60',color:'white',borderRadius:7,padding:'7px 12px',cursor:'pointer'}} onClick={()=>window.location.reload()}>保存当前输入后更新</button></div>:null;
}
