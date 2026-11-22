"use client";
import {useEffect,useRef,useState} from 'react';
import type {FoodNutrition} from '@/lib/foodNutrition';
import type {HealthEntry} from '@/lib/foodRecord';
import {marketDepartment,marketDepartments} from '@/lib/gardenCategories';
import {sameLibraryFood} from '@/lib/foodLibrary';
import WoolworthsFoodSearch from './WoolworthsFoodSearch';
import FoodIllustration from './FoodIllustration';
import {commonReference} from '@/lib/marketCatalog';
import './food-add.css';
import FoodArtworkPicker from './FoodArtworkPicker';
import {foodLabelBasisNote} from '@/lib/foodLookup';

export default function FoodShelfSearch({catalog,entries,onConfirm,onReveal}:{catalog:FoodNutrition[];entries:HealthEntry[];onConfirm:(food:FoodNutrition)=>void;onReveal?:(food:FoodNutrition)=>void}){
 const [draft,setDraft]=useState<FoodNutrition|null>(null),[amount,setAmount]=useState(''),[quantity,setQuantity]=useState(''),[unit,setUnit]=useState('个'),[department,setDepartment]=useState('其他食物');
 const [estimateName,setEstimateName]=useState(''),[description,setDescription]=useState(''),[estimateUnit,setEstimateUnit]=useState<'g'|'mL'>('g');
 const [lastAdded,setLastAdded]=useState<FoodNutrition|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const generation=useRef(0),controller=useRef<AbortController|null>(null);
 useEffect(()=>()=>{controller.current?.abort()},[]);
 function cancelEstimate(){generation.current++;controller.current?.abort();setBusy(false)}
 function preview(food:FoodNutrition){
  cancelEstimate();setDraft(food);setNotice('');setError('');setEstimateName('');
  setAmount(String((food.unit==='g'?food.serving?.grams:food.serving?.millilitres)||commonReference(food.name)?.amount||100));
  setQuantity(String(food.serving?.quantity||''));setUnit(food.serving?.quantityUnit||'个');setDepartment(food.marketDepartmentOverride&&food.marketDepartmentOverride!=='其他食物'&&!(food.marketDepartmentOverride==='水果'&&/果酱|\bjam\b|marmalade/i.test(food.name))?food.marketDepartmentOverride:marketDepartment(food.name));
 }
 async function estimate(){
  if(busy||!estimateName.trim())return;
  const id=++generation.current,requestController=new AbortController();controller.current=requestController;setBusy(true);setError('');
  try{const response=await fetch('/api/foods/estimate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:estimateName.trim(),description,unit:estimateUnit}),signal:AbortSignal.any([requestController.signal,AbortSignal.timeout(60000)])});const result=await response.json();if(id!==generation.current)return;if(!response.ok)throw new Error(result.error||'估算失败，请重试');preview(result.food)}catch(e){if(id===generation.current)setError(e instanceof Error&&e.name!=='TimeoutError'?e.message:'估算超时，请重试或手动填写标签。')}finally{if(id===generation.current)setBusy(false)}
 }
 const value=Number(amount),count=Number(quantity),valid=!!draft&&Number.isFinite(value)&&value>0&&value<=10000&&(!quantity.trim()||Number.isFinite(count)&&count>0&&!!unit.trim());
 function confirm(){
  if(!draft||!valid||!draft.name.trim())return;
  const duplicate=catalog.find(f=>sameLibraryFood(f,draft));
  const portion={...draft.serving,grams:draft.unit==='g'?value:null,millilitres:draft.unit==='mL'?value:null,quantity:quantity.trim()?count:null,quantityUnit:quantity.trim()?unit.trim():null,quantitySource:'manual' as const,description:`${quantity.trim()?`${count}${unit.trim()} · `:''}${value} ${draft.unit}`};
  const food:FoodNutrition={...draft,id:duplicate?.id||draft.id,hiddenInKitchen:false,marketDepartmentOverride:department as FoodNutrition['marketDepartmentOverride'],serving:{...portion,lessThan:draft.lessThan,energyKcal:draft.energyKcal*value/100,protein:draft.protein*value/100,carbs:draft.carbs*value/100,fat:draft.fat*value/100}};
  onConfirm({...food,labelEvidence:`${food.labelEvidence||''}；用户确认的货架常用分量：${portion.description}。每份营养按每100${food.unit}换算。`});setDraft(null);setLastAdded(food);setNotice(duplicate?'已更新已有食物卡和常用分量。':'已添加到分类货架。');
 }
 return <section className="food-shelf-search food-add" aria-label="搜索添加食物卡">
  <header className="food-add-heading"><div><h3>添加食物</h3><p>{draft?'核对营养和常用分量后添加':'搜索商品，或直接录入包装标签'}</p></div><span>{draft?'核对并添加':'选择添加方式'}</span></header>
  <div hidden={!!draft||!!estimateName}><WoolworthsFoodSearch onSearchStart={()=>{setNotice("");setLastAdded(null)}} compact staged saved={catalog} entries={entries} selected={draft} onSelect={preview} onImport={preview} onFallback={(q,details,referenceUnit)=>{cancelEstimate();setEstimateName(q);setDraft(null);setError('');setNotice('');setDescription(details||'');setEstimateUnit(referenceUnit||'g')}}/></div>
  {estimateName&&<div className="food-add-estimate"><button type="button" className="food-add-back" onClick={()=>{cancelEstimate();setEstimateName('');setError('')}}>返回搜索</button><h4>通用估算</h4><p>找不到包装标签时使用，结果会标记为估算。</p><label>食物名称<input value={estimateName} maxLength={120} onChange={e=>setEstimateName(e.target.value)}/></label><label>做法与称重状态<input placeholder="例如：生重、去皮、水煮" maxLength={1000} value={description} onChange={e=>setDescription(e.target.value)}/></label><label>参考单位<select value={estimateUnit} onChange={e=>setEstimateUnit(e.target.value as 'g'|'mL')}><option value="g">每100g</option><option value="mL">每100mL</option></select></label><div className="food-add-actions"><button type="button" className="food-add-primary" disabled={busy||!estimateName.trim()} onClick={()=>void estimate()}>{busy?'正在估算…':'生成预览'}</button>{busy&&<button type="button" onClick={cancelEstimate}>取消等待</button>}</div></div>}
  {draft&&<div className="food-add-review"><button type="button" className="food-add-back" onClick={()=>setDraft(null)}>返回修改标签</button><div className="food-add-product"><FoodIllustration name={draft.name} artworkName={draft.artworkName} imageUrl={draft.imageUrl}/><div><strong>{draft.name}</strong><small>{draft.source} · 每100{draft.unit}</small></div></div>
   {draft.source==='AI估算'&&<p className="food-add-basis"><b>通用估算，非商品标签</b><span>本次口径：{draft.labelEvidence?.split('口径：')[1]?.split('；假设：')[0]||'请展开营养依据核对食物形态和称重状态。'}</span></p>}
   {foodLabelBasisNote(draft)&&<p className="food-add-basis" role="note"><b>请核对这份已保存标签的计量口径</b><span>{foodLabelBasisNote(draft)}</span></p>}
   <FoodArtworkPicker name={draft.name} value={draft.artworkName} imageUrl={draft.imageUrl} onChange={value=>setDraft({...draft,artworkName:value})}/>
   <div className="food-add-nutrients" aria-label="每100营养预览">{([['energyKcal','热量','千卡'],['protein','蛋白质','g'],['carbs','碳水','g'],['fat','脂肪','g']] as const).map(([key,title,suffix])=><div key={key}><small>{title}</small><b>{draft.lessThan?.[key]?'< ':''}{Number(draft[key].toFixed(1))}<em>{suffix}</em></b></div>)}</div>
   <div className="food-add-fields"><label className="food-add-name">食物名称<input maxLength={120} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></label><label>分类<select value={department} onChange={e=>setDepartment(e.target.value)}>{marketDepartments.map(d=><option key={d}>{d}</option>)}</select></label><label>每次添加的分量（{draft.unit}）<input type="number" min="0.01" max="10000" step="any" value={amount} onChange={e=>setAmount(e.target.value)}/></label></div>
   <details className="food-add-details"><summary>按个数添加（可选）</summary><div className="food-add-fields"><label>对应个数<input type="number" min="0.01" step="any" placeholder="例如 1" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label><label>个数单位<input maxLength={30} value={unit} onChange={e=>setUnit(e.target.value)} placeholder="个 / 片 / 杯"/></label></div></details>
   <details className="food-add-details"><summary>营养依据与来源</summary><p>{draft.labelEvidence||'依据录入的包装营养标签，请与包装核对。'}</p>{draft.sourceUrl&&<a href={draft.sourceUrl} target="_blank" rel="noreferrer">查看原始来源</a>}</details>
   <div className="food-add-actions"><div><b>{valid?`${value}${draft.unit} · ${Number((draft.energyKcal*value/100).toFixed(1))}千卡`:'请填写有效分量'}</b><small>添加到货架，不会记为已吃</small></div><button type="button" className="food-add-primary" disabled={!valid||!draft.name.trim()} onClick={confirm}>确认添加</button></div>
  </div>}
  {error&&<p role="alert" className="qh-food-error">{error}</p>}{notice&&<p role="status" className="food-add-success">✓ {notice} 可继续添加下一种。{lastAdded&&onReveal&&<button type="button" onClick={()=>onReveal(lastAdded)}>查看食物卡 →</button>}</p>}
 </section>
}
