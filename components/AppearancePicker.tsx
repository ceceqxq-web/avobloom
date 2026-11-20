'use client';
import {useSyncExternalStore} from 'react';
const themes=[['garden','花园浮岛','✿'],['workbench','厨房工作台','♧'],['journal','手账拼贴','▤']] as const;
export type Appearance=typeof themes[number][0];
const key='avobloom-appearance';
let fallback:Appearance='workbench';
function valid(value:string|null):Appearance{return themes.some(([id])=>id===value)?value as Appearance:'workbench'}
function snapshot():Appearance{try{return valid(localStorage.getItem(key))}catch{return fallback}}
function subscribe(change:()=>void){window.addEventListener('storage',change);window.addEventListener('avobloom-appearance',change);return()=>{window.removeEventListener('storage',change);window.removeEventListener('avobloom-appearance',change)}}
function setAppearance(value:Appearance){fallback=value;try{localStorage.setItem(key,value)}catch{}window.dispatchEvent(new Event('avobloom-appearance'))}
export function useAppearance(){return [useSyncExternalStore(subscribe,snapshot,()=> 'workbench' as Appearance),setAppearance] as const}
export function AppearancePicker({value,onChange}:{value:Appearance;onChange:(value:Appearance)=>void}){return <label className="appearance-picker"><span>✧ 外观</span><select aria-label="切换页面外观" value={value} onChange={event=>onChange(valid(event.target.value))}>{themes.map(([id,label,icon])=><option key={id} value={id}>{icon} {label}</option>)}</select></label>}

export function AppearanceFlowers(){return <div className="appearance-flowers" aria-hidden="true">{[0,1,2,3].map(cell=><svg key={cell} className={`appearance-flower flower-${cell}`} viewBox={`${cell%2*100} ${Math.floor(cell/2)*100} 100 100`}><image href="/brand/cottage-floral-frame-atlas-v1.png" width="200" height="200"/></svg>)}{['left','right'].map(side=><div key={side} className={`workbench-garland garland-${side}`}>{[0,1,2,3].map(index=><svg key={index} viewBox="0 100 100 100"><image href="/brand/cottage-floral-frame-atlas-v1.png" width="200" height="200"/></svg>)}</div>)}</div>}
