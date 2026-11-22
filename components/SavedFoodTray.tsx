'use client';
import {useState} from 'react';
import type {FoodNutrition} from '@/lib/foodNutrition';
import FoodIllustration from './FoodIllustration';
import {foodCalories,type HealthEntry} from '@/lib/foodRecord';
import {recordPortionText} from '@/lib/marketCatalog';
export default function SavedFoodTray({entries,onEdit,title='已经收好的食物',groupByMeal=false,catalog=[]}:{entries:HealthEntry[];onEdit?:(entry:HealthEntry)=>void;title?:string;groupByMeal?:boolean;catalog?:FoodNutrition[]}){
 const [expanded,setExpanded]=useState(false);
 const sorted=entries.map((entry,index)=>({entry,index})).sort((a,b)=>(b.entry.date+b.entry.time).localeCompare(a.entry.date+a.entry.time)||b.index-a.index).map(v=>v.entry),shown=expanded?sorted:sorted.slice(0,10);
 if(groupByMeal){const slots=['早餐','午餐','晚餐',...(['加餐','未分类'].filter(slot=>entries.some(e=>(e.meal||'未分类')===slot)))];return <div className="meal-record-groups">{slots.map(slot=>{const records=entries.filter(e=>(e.meal||'未分类')===slot),unknown=records.some(e=>foodCalories(e)==null),energy=records.reduce((n,e)=>n+(foodCalories(e)||0),0);return <section className="meal-record-group" key={slot}><h3>{slot}<small>{records.length}项 · {Math.round(energy)} 千卡{unknown?'（已知）':''}</small></h3>{records.length?<SavedFoodTray catalog={catalog} entries={records} onEdit={onEdit} title={`${slot}已记录`}/>:<p>暂无记录</p>}</section>})}</div>}
 if(!entries.length)return null;
 return <section className="saved-food-tray" aria-label={title}><header><b>✓ {title}</b><small>{entries.length}项{entries.length>10&&!expanded?' · 最近10项':''}</small>{entries.length>10&&<button type="button" aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}>{expanded?'收起':`查看全部 ${entries.length}项`}</button>}</header><div className={`saved-food-strip ${expanded?'expanded':''}`}>{shown.map(e=><button type="button" key={e.id} className="saved-food-thumb" onClick={()=>onEdit?.(e)} disabled={!onEdit} aria-label={`查看已记录 ${e.name}`}><FoodIllustration name={e.name} artworkName={catalog.find(f=>f.id===e.foodLabel?.id)?.artworkName??e.foodLabel?.artworkName} imageUrl={e.foodLabel?.imageUrl} fatPer100={e.foodLabel?.fat} amount={e.weightUnknown?100:e.amount}/><span><b>{e.name}</b><small>{e.meal||'未分类'} · {recordPortionText(e)}</small><strong>{foodCalories(e)==null?'热量待补全':Math.round(foodCalories(e)!)+' 大卡'}</strong></span></button>)}</div></section>
}
