'use client';
import {useState} from 'react';
import FoodIllustration from './FoodIllustration';
import {foodCalories,type HealthEntry} from '@/lib/foodRecord';
import {recordPortionText} from '@/lib/marketCatalog';
export default function SavedFoodTray({entries,onEdit,title='已经收好的食物'}:{entries:HealthEntry[];onEdit?:(entry:HealthEntry)=>void;title?:string}){
 const [expanded,setExpanded]=useState(false);
 const sorted=entries.map((entry,index)=>({entry,index})).sort((a,b)=>(b.entry.date+b.entry.time).localeCompare(a.entry.date+a.entry.time)||b.index-a.index).map(v=>v.entry),shown=expanded?sorted:sorted.slice(0,10);
 if(!entries.length)return null;
 return <section className="saved-food-tray" aria-label={title}><header><b>✓ {title}</b><small>{entries.length}项{entries.length>10&&!expanded?' · 最近10项':''}</small>{entries.length>10&&<button type="button" aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}>{expanded?'收起':`查看全部 ${entries.length}项`}</button>}</header><div className={`saved-food-strip ${expanded?'expanded':''}`}>{shown.map(e=><button type="button" key={e.id} className="saved-food-thumb" onClick={()=>onEdit?.(e)} disabled={!onEdit} aria-label={`查看已记录 ${e.name}`}><FoodIllustration name={e.name} fatPer100={e.foodLabel?.fat} amount={e.weightUnknown?100:e.amount}/><span><b>{e.name}</b><small>{e.meal||'未分类'} · {recordPortionText(e)}</small><strong>{foodCalories(e)==null?'热量待补全':Math.round(foodCalories(e)!)+' 大卡'}</strong></span></button>)}</div></section>
}
