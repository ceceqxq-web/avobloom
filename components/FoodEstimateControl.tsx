"use client";
import {useState} from 'react';
import type {FoodNutrition} from '@/lib/foodNutrition';
export default function FoodEstimateControl({name,unit,onEstimate}:{name:string;unit:'g'|'mL';onEstimate:(food:FoodNutrition)=>void}){
 const [description,setDescription]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 return <div className="qh-edit-product"><b>重新估算营养</b><p>按食物名称及做法逐次请求AI估算；只发送食物名称、描述和单位，不发送体重或个人资料。结果为估算，保存修改后生效。</p><label>生熟状态 / 做法 / 品牌补充<input aria-label="营养估算补充描述" value={description} onChange={e=>setDescription(e.target.value)} placeholder="例如：泡发煮熟、无额外用油；或干重" maxLength={1000}/></label><button type="button" className="qh-soft-button" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{const response=await fetch('/api/foods/estimate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,description,unit}),signal:AbortSignal.timeout(50000)});const data=await response.json();if(!response.ok)throw new Error(data.error||'估算失败');onEstimate(data.food)}catch(e){setError(e instanceof Error?e.message:'估算失败')}finally{setBusy(false)}}}>{busy?'正在估算…':'根据当前描述重新估算'}</button>{error&&<p role="status">{error}</p>}</div>;
}
