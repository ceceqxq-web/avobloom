"use client";
import {useRef,useState} from 'react';
import type {FoodNutrition} from '@/lib/foodNutrition';
import type {HealthEntry} from '@/lib/foodRecord';
import {marketDepartment,marketDepartments} from '@/lib/gardenCategories';
import {sameLibraryFood} from '@/lib/foodLibrary';
import WoolworthsFoodSearch from './WoolworthsFoodSearch';

export default function FoodShelfSearch({catalog,entries,onConfirm}:{catalog:FoodNutrition[];entries:HealthEntry[];onConfirm:(food:FoodNutrition)=>void}){
 const [draft,setDraft]=useState<FoodNutrition|null>(null),[amount,setAmount]=useState(''),[quantity,setQuantity]=useState(''),[unit,setUnit]=useState('个'),[department,setDepartment]=useState('其他食物');
 const [estimateName,setEstimateName]=useState(''),[description,setDescription]=useState(''),[estimateUnit,setEstimateUnit]=useState<'g'|'mL'>('g');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const generation=useRef(0);
 function preview(food:FoodNutrition){
  generation.current++;setBusy(false);setDraft(food);setNotice('');setError('');setEstimateName('');
  setAmount(String((food.unit==='g'?food.serving?.grams:food.serving?.millilitres)||''));
  setQuantity(String(food.serving?.quantity||''));setUnit(food.serving?.quantityUnit||'个');setDepartment(food.marketDepartmentOverride||marketDepartment(food.name));
 }
 async function estimate(){
  if(busy||!estimateName.trim())return;
  const id=++generation.current;setBusy(true);setError('');
  try{const response=await fetch('/api/foods/estimate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:estimateName.trim(),description,unit:estimateUnit}),signal:AbortSignal.timeout(60000)});const result=await response.json();if(id!==generation.current)return;if(!response.ok)throw new Error(result.error||'估算失败，请重试');preview(result.food)}catch(e){if(id===generation.current)setError(e instanceof Error?e.message:'估算失败，请重试')}finally{if(id===generation.current)setBusy(false)}
 }
 const value=Number(amount),count=Number(quantity),valid=!!draft&&Number.isFinite(value)&&value>0&&value<=10000&&(!quantity.trim()||Number.isFinite(count)&&count>0&&!!unit.trim());
 function confirm(){
  if(!draft||!valid)return;
  const duplicate=catalog.find(f=>sameLibraryFood(f,draft));
  const portion={...draft.serving,grams:draft.unit==='g'?value:null,millilitres:draft.unit==='mL'?value:null,quantity:quantity.trim()?count:null,quantityUnit:quantity.trim()?unit.trim():null,quantitySource:'manual' as const,description:`${quantity.trim()?`${count}${unit.trim()} · `:''}${value} ${draft.unit}`};
  // A changed portion must never retain the original label's per-serving values.
  const food:FoodNutrition={...draft,id:duplicate?.id||draft.id,hiddenInKitchen:false,marketDepartmentOverride:department as FoodNutrition['marketDepartmentOverride'],serving:{...portion,lessThan:draft.lessThan,energyKcal:draft.energyKcal*value/100,protein:draft.protein*value/100,carbs:draft.carbs*value/100,fat:draft.fat*value/100}};
  onConfirm({...food,labelEvidence:`${food.labelEvidence||''}；用户确认的货架常用分量：${portion.description}。每份营养按每100${food.unit}换算。`});setDraft(null);setNotice(duplicate?'已更新已有食物卡及常用分量，没有重复添加。':'已确认添加到分类货架；这一步不会记为已吃。');
 }
 return <section className="food-shelf-search" aria-label="搜索添加食物卡">
  <p>先选商品，再核对分量并确认。找不到合适商品时可生成通用估算。</p>
  <WoolworthsFoodSearch staged saved={catalog} entries={entries} selected={draft} onSelect={preview} onImport={preview} onFallback={q=>{generation.current++;setBusy(false);setEstimateName(q);setDraft(null);setError('');setNotice('');setDescription('')}}/>
  {estimateName&&<div className="qh-label-import"><b>通用估算 · 非商品标签</b><label>食物名称<input value={estimateName} maxLength={120} onChange={e=>setEstimateName(e.target.value)}/></label><label>做法与口径（可选）<input placeholder="例如：水煮、熟重、去皮；品牌食品可补充口味" maxLength={1000} value={description} onChange={e=>setDescription(e.target.value)}/></label><label>估算单位<select value={estimateUnit} onChange={e=>setEstimateUnit(e.target.value as 'g'|'mL')}><option value="g">每 100 g</option><option value="mL">每 100 mL</option></select></label><button type="button" disabled={busy||!estimateName.trim()} onClick={()=>void estimate()}>{busy?'正在估算…':'生成估算预览'}</button><p>仅发送此处的食物名称和描述，不发送健康记录。结果需你确认后才会保存。</p></div>}
  {draft&&<div className="qh-label-import food-shelf-confirm"><h3>确认食物卡与常用分量</h3><label>食物名称<input maxLength={120} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></label><label>货架分区<select value={department} onChange={e=>setDepartment(e.target.value)}>{marketDepartments.map(d=><option key={d}>{d}</option>)}</select></label><label>每次点选的{draft.unit==='g'?'克数':'毫升数'}<input type="number" min="0.01" max="10000" step="any" placeholder="例如 50" value={amount} onChange={e=>setAmount(e.target.value)}/></label><label>对应个数（可选）<input type="number" min="0.01" step="any" placeholder="暂无" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label><label>个数单位<input maxLength={30} value={unit} onChange={e=>setUnit(e.target.value)} placeholder="个 / 片 / 杯"/></label><p>{valid?`${quantity.trim()?`${count}${unit} · `:''}${value} ${draft.unit} · ${Number((draft.energyKcal*value/100).toFixed(1))} 千卡`:'请补充每次点选的克数或毫升数；个数可留空。'}</p><p>{draft.source==='AI估算'?'通用估算，非商品标签。':''}{draft.labelEvidence}</p><button type="button" className="qh-import-button" disabled={!valid||!draft.name.trim()} onClick={confirm}>确认，生成食物卡</button><button type="button" onClick={()=>setDraft(null)}>取消</button></div>}
  {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
 </section>
}
