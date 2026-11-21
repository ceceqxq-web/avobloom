"use client";
import { useEffect, useRef, useState } from "react";
import { foodFromPhotoDraft, photoDraftFromText, type PhotoDraft } from "@/lib/photoNutrition";
import type { FoodNutrition } from "@/lib/foodNutrition";
type Props={selected:FoodNutrition|null;onImport:(food:FoodNutrition)=>void;onClose:()=>void};
export default function PhotoNutritionCapture({selected,onImport,onClose}:Props){
 const [file,setFile]=useState<File|null>(null),[preview,setPreview]=useState("");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[raw,setRaw]=useState("");
 const [column,setColumn]=useState<"first"|"last">("last"),[draft,setDraft]=useState<PhotoDraft|null>(null),[warning,setWarning]=useState("");
 const [available,setAvailable]=useState<boolean|null>(null);
 const controller=useRef<AbortController|null>(null),requestId=useRef(0);
 useEffect(()=>{const check=new AbortController();void fetch("/api/foods/photo",{signal:AbortSignal.any([check.signal,AbortSignal.timeout(5000)])}).then(r=>r.json()).then(data=>setAvailable(data.available===true)).catch(()=>setAvailable(false));return()=>{check.abort();controller.current?.abort()}},[]);
 function cancel(){requestId.current++;controller.current?.abort();setBusy(false)}
 const fileInput=useRef<HTMLInputElement>(null),cameraInput=useRef<HTMLInputElement>(null);
 useEffect(()=>{if(!file)return;const url=URL.createObjectURL(file);const timer=setTimeout(()=>setPreview(url),0);return()=>{clearTimeout(timer);URL.revokeObjectURL(url)}},[file]);
 function choose(next:File|undefined){if(!next)return;setError("");setRaw("");setDraft(null);setWarning("");if(next.size>8*1024*1024){setError("请选择 8 MB 以内的图片。");setFile(null);setPreview("");return}setFile(next)}
 async function recognize(){if(!file||busy||available!==true)return;const id=++requestId.current,requestController=new AbortController();controller.current=requestController;setBusy(true);setError("");setDraft(null);try{const form=new FormData();form.set("image",file);const response=await fetch("/api/foods/photo",{method:"POST",body:form,signal:AbortSignal.any([requestController.signal,AbortSignal.timeout(180000)])});const data=await response.json();if(id!==requestId.current)return;if(!response.ok)throw new Error(data.error||"识别失败");setRaw(data.text);setDraft(photoDraftFromText(data.text,column,selected?.name));setWarning(data.lowConfidence?"部分文字清晰度不足，请逐项核对；无法识别的字段已留空。":"请核对每份个数、克重、列顺序和小数点。留空字段保存后显示「暂无」。")}catch(e){if(id===requestId.current)setError(e instanceof Error?e.message:"识别失败，请重新拍摄。")}finally{if(id===requestId.current)setBusy(false)}}
 function update(key:keyof PhotoDraft,value:string){setDraft(d=>d?{...d,[key]:value}:null)}
 function save(){if(!draft)return;try{const id=selected&&draft.name.trim()===selected.name?selected.id:crypto.randomUUID();const food=foodFromPhotoDraft(draft,raw,id);onImport({...food,...(id===selected?.id?{imageUrl:selected.imageUrl,sourceUrl:selected.sourceUrl}:{})});onClose()}catch(e){setError(e instanceof Error?e.message:"保存失败")}}
 function field(key:keyof PhotoDraft,label:string,numeric=true){return <label key={key}>{label}<input aria-label={`照片识别${label}`} type={numeric?"number":"text"} min={numeric?"0":undefined} step={numeric?"any":undefined} placeholder="暂无" value={draft?.[key]||""} onChange={e=>update(key,e.target.value)}/></label>}
 return <section className="qh-photo-capture" aria-label="照片识别营养标签" onKeyDown={e=>{if(e.key==="Enter"&&e.target instanceof HTMLInputElement)e.preventDefault()}}><div className="qh-card-title"><h2>照片识别营养标签</h2><button type="button" onClick={()=>{cancel();onClose()}}>收起</button></div><p>拍清完整营养表和 Serving size，尤其是「20 g (3 crackers)」。照片在本机识别，无需 API 密钥。</p>
 <input ref={fileInput} hidden type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={e=>choose(e.target.files?.[0])}/><input ref={cameraInput} hidden type="file" accept="image/*" capture="environment" onChange={e=>choose(e.target.files?.[0])}/>
 {available!==true&&<p role="status">{available===null?"正在检查照片识别是否可用…":"当前网页版暂不支持照片识别，请切换到「粘贴标签」或「手动填写」。"}</p>}
 <div className="qh-photo-actions"><button type="button" disabled={busy||available!==true} onClick={()=>cameraInput.current?.click()}>◎ 拍摄标签</button><button type="button" disabled={busy||available!==true} onClick={()=>fileInput.current?.click()}>↥ 上传照片</button></div>
 {file&&preview&&<div className="qh-photo-preview">{
 // eslint-disable-next-line @next/next/no-img-element -- Local photo preview uses a temporary object URL.
 <img src={preview} alt="待识别的营养标签照片"/>}<small>{file.name}</small></div>}
 {file&&<button className="qh-import-button" type="button" disabled={busy} onClick={()=>void recognize()}>{busy?"正在本机识别…首次准备可能需要 1–2 分钟":"识别照片"}</button>}
 {busy&&<p role="status">识别完成后可核对结果。<button type="button" onClick={cancel}>取消识别</button></p>}
 {error&&<div className="qh-food-error" role="alert">{error}</div>}
 {draft&&<div className="qh-photo-review"><h3>核对识别结果</h3><p>{warning}</p>{field("name","商品名称",false)}<div className="qh-photo-grid"><label>每 100 的计量单位<select value={draft.unit} onChange={e=>update("unit",e.target.value)}><option value="g">g · 克</option><option value="mL">mL · 毫升</option></select></label><label>照片中的每 100 数值位置<select value={column} onChange={e=>{const col=e.target.value as "first"|"last";setColumn(col);setDraft(photoDraftFromText(raw,col,draft.name))}}><option value="last">最后一列</option><option value="first">第一列</option></select></label></div>
 <div className="qh-photo-grid">{field("energyKcal","每100热量（千卡）")}{field("protein","每100蛋白质（g）")}{field("carbs","每100碳水（g）")}{field("fat","每100脂肪（g）")}</div>
 <h3>每份 / Serving</h3>{field("servingDescription","每份规格原文",false)}<div className="qh-photo-grid">{field("quantity","每份个数")}{field("quantityUnit","个数单位",false)}{field("grams","每份克重（g）")}{field("millilitres","每份体积（mL）")}{field("servingsPerPack","每包装份数")}{field("servingEnergyKcal","每份热量（千卡）")}{field("servingProtein","每份蛋白质（g）")}{field("servingCarbs","每份碳水（g）")}{field("servingFat","每份脂肪（g）")}</div>
 <details><summary>查看 / 修正识别原文</summary><textarea aria-label="照片识别原文" value={raw} onChange={e=>setRaw(e.target.value)}/><button type="button" className="qh-count-toggle" onClick={()=>setDraft(photoDraftFromText(raw,column,draft.name))}>按原文重新提取</button></details><button className="qh-import-button" type="button" onClick={save}>确认并保存到商品库</button><p>只保存核对后的商品数据和识别文字，原照片临时文件会自动清理。</p></div>}
 </section>;
}
