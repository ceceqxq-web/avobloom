"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {rankedLibrary,libraryUsage,mergeLibraryFood} from "@/lib/foodLibrary";
import type {HealthEntry} from "@/lib/foodRecord";
import FoodIllustration from "./FoodIllustration";
import {commonFoodReferences} from "@/lib/commonFoodReferences";
import PhotoNutritionCapture from "./PhotoNutritionCapture";
import { parseNutritionLabel, servingFromLabel, woolworthsProductId, type FoodNutrition } from "@/lib/foodNutrition";
type SearchProduct = { id: string; name: string; url: string; imageUrl?: string | null; nutrition?: FoodNutrition | null };
type Props = { compact?:boolean; onFallback?:(query:string)=>void;entries?:HealthEntry[];onCache?:(food:FoodNutrition)=>void; staged?:boolean; saved: FoodNutrition[]; selected: FoodNutrition | null; onSelect: (food: FoodNutrition) => void; onImport: (food: FoodNutrition) => void };
export default function WoolworthsFoodSearch({ saved, selected, onSelect, onImport, staged=false,entries=[],onCache,onFallback,compact=false }: Props) {
  const [showPhoto,setShowPhoto]=useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [searched, setSearched] = useState(false);
  const [showLabel, setShowLabel] = useState(false), [label, setLabel] = useState("");
  const [name, setName] = useState(""), [sourceUrl, setSourceUrl] = useState(""), [unit, setUnit] = useState<"g" | "mL">("g");
  const [column, setColumn] = useState<"last" | "first">("last");
  const [manual, setManual] = useState(false), [energyUnit, setEnergyUnit] = useState("kJ");
  const [energy, setEnergy] = useState(""), [protein, setProtein] = useState(""), [carbs, setCarbs] = useState(""), [fat, setFat] = useState("");
  const [editingCount,setEditingCount] = useState(false), [servingCount,setServingCount] = useState(""), [servingCountUnit,setServingCountUnit] = useState("crackers");
  const [countError,setCountError] = useState("");
  const [libraryNotice,setLibraryNotice]=useState("");
  const localFoods=useMemo(()=>rankedLibrary(saved,entries,query),[saved,entries,query]),allFoods=useMemo(()=>rankedLibrary(saved,entries),[saved,entries]);
  const references=useMemo(()=>commonFoodReferences(query),[query]);
  const controller=useRef<AbortController|null>(null);
  useEffect(()=>()=>{controller.current?.abort()},[]);
  function cancelSearch(){requestId.current++;controller.current?.abort();setBusy(false)}
  function method(next:'search'|'paste'|'manual'|'photo'){cancelSearch();setError('');setShowLabel(next==='paste'||next==='manual');setManual(next==='manual');setShowPhoto(next==='photo')}
  const activeMethod=showPhoto?'photo':showLabel?(manual?'manual':'paste'):'search';
  function cacheFood(food:FoodNutrition){if(!onCache)return;onCache(mergeLibraryFood(saved.find(p=>p.id===food.id),food));setLibraryNotice("已提交到本地商品库，保存状态见页面顶部；无需保存饮食记录，下次可直接选择。")}
  function saveServingCount() {
    if (!selected) return;
    if (!servingCount.trim() || !Number.isFinite(Number(servingCount)) || Number(servingCount)<=0 || !servingCountUnit.trim()) {setCountError("请填写大于 0 的每份个数和单位，例如 3 crackers。");return;}
    onImport({...selected,serving:{...selected.serving,quantity:Number(servingCount),quantityUnit:servingCountUnit.trim(),quantitySource:"manual"}});
    setEditingCount(false);setCountError("");
  }
  const requestId = useRef(0);
  const searchUrl = `https://www.woolworths.com.au/shop/search/products?searchTerm=${encodeURIComponent(query.trim())}`;
  async function search(value = query,forceOnline=false) {
    if (!value.trim() || busy) return;
    if(!forceOnline&&(rankedLibrary(saved,entries,value).length||commonFoodReferences(value).length)){setError("");setLibraryNotice(commonFoodReferences(value).length?"已找到通用营养参考，请按实际品种选择。需要品牌商品时可继续联网搜索。":"已找到本地商品，无需联网。若需要更多结果，请点击「联网搜索 / 更新标签」。");setProducts([]);setSearched(false);return}
    controller.current?.abort();const requestController=new AbortController();controller.current=requestController;
    const id = ++requestId.current;
    setBusy(true); setError(""); setProducts([]); setSearched(false);
    try {
      const response = await fetch(`/api/foods/woolworths?q=${encodeURIComponent(value.trim())}${forceOnline?"&refresh=1":""}`, { signal: AbortSignal.any([requestController.signal,AbortSignal.timeout(20000)]) });
      const data = await response.json();
      if (id !== requestId.current) return;
      if (!response.ok) throw new Error(data.error || "查询失败，请稍后重试。");
      if (data.product) { setEditingCount(false); onImport(data.product); setName(data.product.name); }
      else { setProducts(data.products || []); setSearched(true); }
    } catch (e) {
      if (id !== requestId.current) return;
      setError(e instanceof Error && e.name !== "TimeoutError" ? e.message : "查询超时。可打开官网复制营养表导入。");
      if(!compact)setShowLabel(true);
    } finally { if (id === requestId.current) setBusy(false); }
  }
  function importLabel() {
    setError("");
    try {
      if (!name.trim()) throw new Error("请填写商品名称，方便下次查找。");
      const productId = sourceUrl.trim() ? woolworthsProductId(sourceUrl.trim()) : null;
      if (sourceUrl.trim() && !productId) throw new Error("来源链接需为 Woolworths 商品详情页，也可以留空。");
      let nutrition: Pick<FoodNutrition,"energyKcal"|"protein"|"carbs"|"fat"|"lessThan">;
      if (manual) {
        if ([energy, protein, carbs, fat].some(v => !v.trim() || !Number.isFinite(Number(v)) || Number(v) < 0)) throw new Error("请填写完整且非负的标签数值。");
        nutrition = { energyKcal: energyUnit === "kJ" ? Number(energy) / 4.184 : Number(energy), protein: Number(protein), carbs: Number(carbs), fat: Number(fat) };
        if (nutrition.energyKcal > 1000 || [nutrition.protein,nutrition.carbs,nutrition.fat].some(v=>v>100)) throw new Error("数值超出每 100 g / mL 范围，请核对标签。");
      } else nutrition = parseNutritionLabel(label, column, true);
      const food: FoodNutrition = { ...nutrition, labelEvidence:nutrition.lessThan?"标签含小于值，保留 < 标记；营养统计按上限估计，并非精确含量。":undefined, serving: manual ? undefined : servingFromLabel(label, column), id: productId ? `woolworths-${productId}` : crypto.randomUUID(), name: name.trim(), unit, source: "标签导入", sourceUrl: productId ? `https://www.woolworths.com.au/shop/productdetails/${productId}` : undefined, importedAt: new Date().toISOString() };
      onImport(food); if(!compact)setShowLabel(false);
    } catch (e) { setError(e instanceof Error ? e.message : "标签识别失败，请检查格式。"); }
  }
  return <section className={`qh-woolworths ${compact?"food-add-compact":""}`} aria-label="Woolworths 商品搜索与导入">
    {compact&&<div className="food-add-methods" role="tablist" aria-label="添加食品方式">{([['search','搜索商品'],['paste','粘贴标签'],['manual','手动填写'],['photo','拍照识别']] as const).map(([key,title])=><button key={key} type="button" role="tab" aria-selected={activeMethod===key} onClick={()=>method(key)}>{title}</button>)}</div>}
    {!compact&&<div className="qh-wool-title"><span className="qh-wool-logo">W</span><div><b>Woolworths 商品</b><small>搜索商品 · 导入包装营养标签</small></div></div>}
    {(!compact||activeMethod==='search')&&<><div className="qh-search-field"><input aria-label="Woolworths 商品关键词或链接" placeholder={compact?"食物中英文名、品牌或商品链接":"商品英文名、编号或商品链接"} value={query} maxLength={300} onChange={e=>{cancelSearch();setError("");setQuery(e.target.value);setProducts([]);setSearched(false);setLibraryNotice("")}} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();void search()}}}/><button type="button" disabled={busy||!query.trim()} onClick={()=>void search()}>{busy?"查询中…":"查询"}</button></div>
    <div className="qh-search-links"><a href={searchUrl} target="_blank" rel="noreferrer">在 Woolworths 官网搜索 ↗</a>{!compact&&<button type="button" onClick={()=>method(showLabel?"search":"paste")}>粘贴 / 手填营养标签</button>}</div>
    </>}{!compact&&<button className="qh-photo-entry" type="button" onClick={()=>method(showPhoto?"search":"photo")}>◎ 拍照 / 上传营养标签识别</button>}
    {showPhoto&&<PhotoNutritionCapture selected={selected} onImport={onImport} onClose={()=>setShowPhoto(false)}/>}
    {libraryNotice&&<p className="qh-search-hint" role="status">{libraryNotice}</p>}
    {(!compact||activeMethod==='search')&&saved.length>0&&(!references.length||localFoods.length>0)&&<div className="qh-library-local"><div className="qh-library-heading"><b>{query.trim()?`本地匹配 · ${localFoods.length} 项`:"常用食物 · 本地优先"}</b><small>置顶 → 记录次数 → 最近使用</small></div>{localFoods.slice(0,query.trim()?12:compact?3:6).map(p=>{const usage=libraryUsage(p,entries);return <div className="qh-library-row" key={p.id}><ProductThumbnail src={p.imageUrl} name={p.name}/><button type="button" className="qh-library-use" aria-label={`使用本地商品 ${p.name}`} onClick={()=>{setEditingCount(false);onSelect(p)}}><b>{p.name}</b><small>{p.pinned?"★ 已置顶 · ":""}已记录 {usage.count} 次 · 本地标签</small></button>{onCache&&<button type="button" className="qh-library-pin" aria-label={`${p.pinned?"取消置顶":"置顶"} ${p.name}`} onClick={()=>onCache({...p,pinned:!p.pinned})}>{p.pinned?"★":"☆"}</button>}</div>})}{query.trim()&&!localFoods.length&&<p className="qh-search-hint">本地没有匹配商品，点击「查询」联网搜索。</p>}{query.trim()&&<button type="button" className="qh-library-online" disabled={busy} onClick={()=>void search(query,true)}>联网搜索 / 更新标签 ↗</button>}</div>}
    {(!compact||activeMethod==='search')&&references.length>0&&<section className="food-reference-results" aria-label="通用食物营养参考"><header><b>通用食物 · USDA参考</b><small>生重可食部分，按实际品种选择</small></header>{references.map(food=><div className="food-reference-row" key={food.id}><ProductThumbnail name={food.name}/><div><b>{food.name}</b><small>每100g · {food.energyKcal}千卡 · 蛋白质{food.protein}g</small></div><button type="button" aria-label={`预览${food.name}`} onClick={()=>{cancelSearch();setError('');setEditingCount(false);onSelect(food)}}>预览</button></div>)}<button type="button" className="qh-library-online" disabled={busy} onClick={()=>void search(query,true)}>继续搜索 Woolworths 品牌商品</button></section>}
    {!compact&&<p className="qh-search-hint">联网查询仅发送商品关键词或链接，不发送健康记录。官网若限制访问，可使用标签导入。</p>}{busy&&<div className="food-add-progress" role="status">正在查询，最多等待20秒<button type="button" onClick={cancelSearch}>取消查询</button></div>}
    {error&&<div role="alert" className="qh-food-error">{error}{compact&&<button type="button" className="food-add-back" onClick={()=>{if(!name.trim())setName(query.trim());method("paste")}}>改用粘贴标签</button>}</div>}
    {searched&&products.length===0&&<p className="qh-search-hint">没有找到商品。试试英文名称，或打开官网查询。</p>}
    {(!compact||activeMethod==='search')&&products.length>0&&<div className="qh-search-results">{products.map(p=><div key={p.id}><ProductThumbnail key={`${p.id}-${p.imageUrl}`} src={p.imageUrl} name={p.name}/><span>{p.name}<a href={p.url} target="_blank" rel="noreferrer">查看商品 ↗</a></span>{p.nutrition&&onCache&&<button type="button" disabled={busy} onClick={()=>cacheFood(p.nutrition!)}>{saved.some(f=>f.id===p.nutrition!.id)?"更新本地":"保存本地"}</button>}<button type="button" disabled={busy} onClick={()=>{setName(p.name);setSourceUrl(p.url);if(p.nutrition){setEditingCount(false);setError("");onImport(p.nutrition);setProducts([]);setSearched(false);setShowLabel(false)}else{void search(p.url,true)}}}>{p.nutrition?"预览标签":"读取完整标签"}</button></div>)}</div>}
    {(!compact||activeMethod==='search')&&onFallback&&query.trim()&&!references.length&&<button type="button" className="qh-import-button" disabled={busy} onClick={()=>onFallback(query.trim())}>没有合适商品？用「{query.trim()}」生成通用估算</button>}
    {showLabel&&sourceUrl&&<button type="button" className="qh-library-online" disabled={busy} onClick={()=>void search(sourceUrl,true)}>重试读取此商品的完整标签</button>}
    {showLabel&&<div className="qh-label-import">
      <label>商品名称<input value={name} onChange={e=>setName(e.target.value)} maxLength={120} placeholder="例如 Woolworths Full Cream Milk 3L"/></label>
      <details className="food-add-source"><summary>来源链接（可选）</summary><label>商品来源链接（可选）<input value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)} placeholder="https://www.woolworths.com.au/shop/productdetails/…"/></label></details>
      {!compact&&<div className="qh-import-switch"><button className={!manual?"active":""} type="button" onClick={()=>setManual(false)}>粘贴自动识别</button><button className={manual?"active":""} type="button" onClick={()=>setManual(true)}>手动填写标签</button></div>}
      {!manual?<><label>完整营养表<textarea rows={4} aria-label="完整营养表" value={label} onChange={e=>setLabel(e.target.value)} maxLength={20000} placeholder={'粘贴完整营养表，包含 Per 100g / 100mL 表头和单位'}/></label><label>每100数值列<select value={column} onChange={e=>setColumn(e.target.value as "last"|"first")}><option value="last">{compact?"最后一列":"最后一列（Woolworths 常见顺序）"}</option><option value="first">第一列</option></select></label></>:<><div className="qh-label-energy"><label>每 100 g / mL 热量<input type="number" min="0" step="any" value={energy} onChange={e=>setEnergy(e.target.value)}/></label><label>热量单位<select value={energyUnit} onChange={e=>setEnergyUnit(e.target.value)}><option>kJ</option><option>kcal</option></select></label></div><div className="qh-custom-macros">{[["蛋白质",protein,setProtein],["碳水",carbs,setCarbs],["脂肪",fat,setFat]].map(([key,value,setter])=><label key={String(key)}>{String(key)}（g）<input type="number" min="0" max="100" step="any" value={String(value)} onChange={e=>(setter as (v:string)=>void)(e.target.value)}/></label>)}</div></>}
      <label>标签计量单位<select value={unit} onChange={e=>setUnit(e.target.value as "g"|"mL")}><option value="g">{compact?"每100g":"每 100 g · 按重量记录"}</option><option value="mL">{compact?"每100mL":"每 100 mL · 按体积记录"}</option></select></label>
      <p className="qh-search-hint">先预览核对，再确认添加。缺失值不会填成0。</p><button className="qh-import-button" type="button" onClick={importLabel}>{manual?"预览营养数值":"识别并预览"}</button>
    </div>}
    {(!compact||activeMethod==='search')&&saved.length>0&&<details className="food-add-library"><summary>全部商品库（{saved.length}）</summary><label>我的商品库<select aria-label="已导入商品" value={selected?.id||""} onChange={e=>{const item=saved.find(p=>p.id===e.target.value);if(item){setEditingCount(false);onSelect(item)}}}><option value="" disabled>选择已导入的商品</option>{allFoods.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label></details>}
    {selected&&!compact&&<div className="qh-nutrition-preview">
      {onCache&&<button type="button" className="qh-import-button" onClick={()=>cacheFood(selected)}>↓ {saved.some(p=>p.id===selected.id)?"保存 / 更新本地商品标签":"保存到本地商品库"}</button>}
      <div className="qh-selected-product"><ProductThumbnail key={`${selected.id}-${selected.imageUrl}`} src={selected.imageUrl} name={selected.name}/><div><b>{selected.name}</b><small>{selected.source}{selected.sourceUrl&&<> · <a href={selected.sourceUrl} target="_blank" rel="noreferrer">查看来源 ↗</a></>}</small></div></div>
      <div className="qh-serving-details">
        <div><span>每份规格 / Serving size</span><b>{selected.serving?.grams != null ? `${selected.serving.grams} g` : selected.serving?.millilitres != null ? `${selected.serving.millilitres} mL` : selected.serving?.description || "暂无"} · {selected.serving?.quantity != null ? `${selected.serving.quantity} ${selected.serving.quantityUnit || "个"}` : "个数暂无"}</b></div>
        <div><span>每份包含多少个{selected.serving?.quantitySource==="manual"?"（手动补充）":""}</span><b>{selected.serving?.quantity != null ? `${selected.serving.quantity} ${selected.serving.quantityUnit || ""}` : "暂无"}</b></div>
        <div><span>每份重量</span><b>{displayNutrition(selected.serving?.grams, "g")}</b></div>
        <div><span>每份体积</span><b>{displayNutrition(selected.serving?.millilitres, "mL")}</b></div>
        <div><span>每包装份数</span><b>{displayNutrition(selected.serving?.servingsPerPack, "份")}</b></div>
      </div>
      <button className="qh-count-toggle" type="button" onClick={()=>{setEditingCount(!editingCount);setServingCount(selected.serving?.quantity==null?"":String(selected.serving.quantity));setServingCountUnit(selected.serving?.quantityUnit||"crackers");setCountError("")}}>{selected.serving?.quantity==null?"＋ 补充每份个数":"修改每份个数"}</button>
      {editingCount&&<div className="qh-count-editor"><p>包装上如果写「每份 20 g，3 crackers」，填写 3 和 crackers。仅补充个数，营养标签数值不变。</p><div><label>每份个数<input type="number" min="0.1" step="any" value={servingCount} onChange={e=>setServingCount(e.target.value)}/></label><label>数量单位<input maxLength={30} value={servingCountUnit} onChange={e=>setServingCountUnit(e.target.value)} placeholder="crackers / 片 / 个"/></label></div>{countError&&<p role="alert">{countError}</p>}<button type="button" className="qh-import-button" onClick={saveServingCount}>{staged?"应用每份个数":"保存每份个数"}</button></div>}
      {selected.lessThan&&<p className="qh-search-hint">标签含“小于”值，已保留 &lt; 标记；营养合计按上限估计，不表示精确含量。</p>}
      <table className="qh-label-table"><thead><tr><th>营养标签</th><th>每 100 {selected.unit}</th><th>每份 / Serving</th></tr></thead><tbody>
        <tr><th>能量</th><td>{selected.lessThan?.energyKcal?"< ":""}{displayNutrition(selected.energyKcal*4.184,"kJ")}</td><td>{selected.serving?.lessThan?.energyKcal?"< ":""}{displayNutrition(selected.serving?.energyKcal == null ? null : selected.serving.energyKcal*4.184,"kJ")}</td></tr>
        <tr><th>热量</th><td>{selected.lessThan?.energyKcal?"< ":""}{displayNutrition(selected.energyKcal,"千卡")}</td><td>{selected.serving?.lessThan?.energyKcal?"< ":""}{displayNutrition(selected.serving?.energyKcal,"千卡")}</td></tr>
        <tr><th>蛋白质</th><td>{selected.lessThan?.protein?"< ":""}{displayNutrition(selected.protein,"g")}</td><td>{selected.serving?.lessThan?.protein?"< ":""}{displayNutrition(selected.serving?.protein,"g")}</td></tr>
        <tr><th>碳水</th><td>{selected.lessThan?.carbs?"< ":""}{displayNutrition(selected.carbs,"g")}</td><td>{selected.serving?.lessThan?.carbs?"< ":""}{displayNutrition(selected.serving?.carbs,"g")}</td></tr>
        <tr><th>脂肪</th><td>{selected.lessThan?.fat?"< ":""}{displayNutrition(selected.fat,"g")}</td><td>{selected.serving?.lessThan?.fat?"< ":""}{displayNutrition(selected.serving?.fat,"g")}</td></tr>
      </tbody></table>
      <small>未标注或未识别的数据均显示「暂无」，不从每 100 {selected.unit} 推算标签每份值。{staged?"当前为预览；确认后才会更新商品库或饮食记录。":"已保存到本机商品库。"}</small>
    </div>}
  </section>;
}

function displayNutrition(value: number | null | undefined, unit: string) {
  return value == null || !Number.isFinite(value) ? "暂无" : `${Number(value.toFixed(1))} ${unit}`;
}
function ProductThumbnail({src,name}:{src?: string|null; name:string}) {
  const [failed,setFailed] = useState(false);
  return <span className="qh-product-thumbnail">{src&&!failed?
    // eslint-disable-next-line @next/next/no-img-element -- Small official catalog thumbnails use their original remote URL.
    <img src={src} alt={name} width={48} height={48} loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>:<FoodIllustration name={name}/>}</span>;
}
