'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import type {MouseEvent as ReactMouseEvent} from 'react';
import {createPortal} from 'react-dom';
import {gardenFoods,gardenRecord,type GardenFood} from '@/lib/foodGarden';
import {foodCalories,type HealthEntry} from '@/lib/foodRecord';
import type {FoodNutrition} from '@/lib/foodNutrition';
import './food-garden.css';
import FloralSummaryFrame from './FloralSummaryFrame';
import FoodArtworkPicker from './FoodArtworkPicker';
import {plateLayout,restorePlateSelection} from '@/lib/plateLayout';
import './plate-layout.css';
import SavedFoodTray from './SavedFoodTray';
import FoodShelfSearch from './FoodShelfSearch';
import FoodIllustration from './FoodIllustration';
import {marketDepartment,normalizeMarketDepartment} from '@/lib/gardenCategories';
import {prepareMarketFoods,foodBadges,marketPortionText,withMarketServing} from '@/lib/marketCatalog';
import {gardenNutrition} from '@/lib/gardenNutrition';
import {marketDisplayOrder,marketPage,marketDepartmentPage} from '@/lib/marketPagination';


const tabs=['全部','常吃','爱吃','每日清单','灵感'] as const;
const tabIcon:Record<(typeof tabs)[number],string>={'全部':'🧺','常吃':'⭐','爱吃':'💗','每日清单':'☀️','灵感':'🌱'};

/* ---------- little game effects (all skipped when the viewer prefers reduced motion) ---------- */
function motionOK(){return typeof window!=='undefined'&&!!document.body.animate&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches}
function tapCalories(f:GardenFood){return f.template?foodCalories(f.template):f.label.energyKcal*f.amount/100}
function hopInto(from:HTMLElement,to:HTMLElement|null,icon:string){
 if(!to||!motionOK())return;
 const a=from.getBoundingClientRect(),b=to.getBoundingClientRect(),el=document.createElement('div');
 el.className='fg-flyer';const art=from.querySelector(".watercolor-art,svg");if(art)el.appendChild(art.cloneNode(true));else el.textContent=icon;el.style.left=`${a.left+a.width/2-22}px`;el.style.top=`${a.top+14}px`;document.body.appendChild(el);
 const dx=b.left+b.width/2-(a.left+a.width/2),dy=b.top+b.height/2-(a.top+36);
 el.animate([{transform:'translate(0,0) scale(1) rotate(0)'},{transform:`translate(${dx*.45}px,${Math.min(dy*.45,0)-170}px) scale(1.2) rotate(-14deg)`,offset:.45},{transform:`translate(${dx}px,${dy}px) scale(.55) rotate(8deg)`}],{duration:850,easing:'cubic-bezier(.33,.66,.4,1)'}).onfinish=()=>{el.remove();to.animate([{transform:'scale(1)'},{transform:'scale(1.05,.94)'},{transform:'scale(.98,1.03)'},{transform:'scale(1)'}],{duration:360,easing:'ease-out'})};
}
function sparklePick(target:HTMLElement){
 if(!motionOK())return;
 target.animate([{filter:'brightness(1)'},{filter:'brightness(1.12)',offset:.4},{filter:'brightness(1)'}],{duration:700,easing:'ease-out'});
 for(let i=0;i<4;i++){
  const star=document.createElement('span');star.className='garden-pick-sparkle';star.setAttribute('aria-hidden','true');star.style.left=[8,82,70,20][i]+'%';star.style.top=[15,22,76,68][i]+'%';target.appendChild(star);
  star.animate([{opacity:0,transform:'scale(.2) rotate(-25deg)'},{opacity:1,transform:'scale(1.2) rotate(0)',offset:.35},{opacity:0,transform:'translateY(-12px) scale(.3) rotate(35deg)'}],{duration:850,delay:i*110,easing:'ease-out'}).onfinish=()=>star.remove();
 }
}
function popText(tile:HTMLElement,text:string){
 const s=document.createElement('span');s.className='fg-pop';s.textContent=text;tile.appendChild(s);
 if(!motionOK()){setTimeout(()=>s.remove(),600);return}
 s.animate([{transform:'translate(-50%,0) scale(.7)',opacity:0},{transform:'translate(-50%,-14px) scale(1.1)',opacity:1,offset:.25},{transform:'translate(-50%,-44px) scale(1)',opacity:0}],{duration:900,easing:'ease-out'}).onfinish=()=>s.remove();
}
function leafShower(rect:DOMRect){
 if(!motionOK())return;
 const bits=['🍃','🌸','✨','🍀','🌼'];
 for(let i=0;i<16;i++){
  const el=document.createElement('div');el.className='fg-confetti';el.textContent=bits[i%bits.length];
  el.style.left=`${rect.left+rect.width*(.2+Math.random()*.6)}px`;el.style.top=`${rect.top}px`;document.body.appendChild(el);
  const dx=(Math.random()-.5)*260,up=-90-Math.random()*130,spin=(Math.random()-.5)*540;
  el.animate([{transform:'translate(0,0) rotate(0) scale(.6)',opacity:1},{transform:`translate(${dx*.6}px,${up}px) rotate(${spin*.5}deg) scale(1.1)`,opacity:1,offset:.4},{transform:`translate(${dx}px,${up+220}px) rotate(${spin}deg) scale(.9)`,opacity:0}],{duration:1300+Math.random()*500,easing:'cubic-bezier(.2,.6,.4,1)'}).onfinish=()=>el.remove();
 }
}

export default function FoodGarden({entries,catalog,date,meal,onSave,onLabel,onText,onEdit,active=true}:{active?:boolean;entries:HealthEntry[];catalog:FoodNutrition[];date:string;meal:string;onSave:(entries:HealthEntry[])=>void;onLabel:(food:FoodNutrition)=>void;onText:()=>void;onEdit?:(entry:HealthEntry)=>void}){
 const [searchOpen,setSearchOpen]=useState(false);
 const [plateSize,setPlateSize]=useState({width:600,height:104});
 const [revealId,setRevealId]=useState('');
 const [clearedBasket,setClearedBasket]=useState<Record<string,number>|null>(null);
 const [pendingList,setPendingList]=useState(false);
 const pendingListRef=useRef<HTMLElement>(null);
 const [inspected,setInspected]=useState<string|null>(null);
 const portionTrigger=useRef<HTMLElement|null>(null);
 const [servingAmount,setServingAmount]=useState(''),[servingError,setServingError]=useState('');
 const portionRef=useRef<HTMLElement>(null);
 function openPortion(food:GardenFood){if(!pendingList)portionTrigger.current=document.activeElement as HTMLElement;setPendingList(false);setInspected(null);setSelected(food.id);setServingAmount(String(food.amount));setServingError('');}
 const recorded=entries.filter(e=>e.type==='food'&&e.date===date&&e.meal===meal);

 const [shelfRemoved,setShelfRemoved]=useState<FoodNutrition|null>(null),[shelfDragging,setShelfDragging]=useState<string|null>(null),[shelfDragPosition,setShelfDragPosition]=useState<{x:number;y:number}|null>(null),[shelfTrashHot,setShelfTrashHot]=useState(false),[recoveryOpen,setRecoveryOpen]=useState(false);
 const shelfTrash=useRef<HTMLDivElement>(null),shelfPointer=useRef<{id:string;x:number;y:number;moved:boolean}|null>(null);
 const foods=useMemo(()=>prepareMarketFoods(gardenFoods(entries,catalog)),[entries,catalog]);
 const [tab,setTab]=useState<typeof tabs[number]>('全部'),[basket,setBasket]=useState<Record<string,number>>({}),[selected,setSelected]=useState<string|null>(null),[error,setError]=useState('');
 useEffect(()=>{if(!selected&&!pendingList)return;const before=document.body.style.overflow;document.body.style.overflow='hidden';(selected?portionRef:pendingListRef).current?.querySelector<HTMLElement>('button')?.focus();return()=>{document.body.style.overflow=before;portionTrigger.current?.focus()}},[selected,pendingList]);
 const [dragged,setDragged]=useState<string|null>(null),[dropHot,setDropHot]=useState(false),[dragPosition,setDragPosition]=useState<{x:number;y:number}|null>(null),[removed,setRemoved]=useState<{id:string;ratio:number}|null>(null);
 const trashRef=useRef<HTMLDivElement>(null),pointerDrag=useRef<{id:string;x:number;y:number;moved:boolean}|null>(null);
 const [activeDepartment,setActiveDepartment]=useState('');
 const [page,setPage]=useState(0),[shelfQuery,setShelfQuery]=useState('');
 const pendingDepartment=useRef<string|null>(null);
 const aisleRef=useRef<HTMLDivElement>(null),manualNavigation=useRef(false),centerTracker=useRef<()=>void>(()=>{});
 const shelfAnchor=(name:string)=>shelfRefs.current[name]?.querySelector<HTMLElement>('.fg-tile');
 const submitted=useRef(false),plateRef=useRef<HTMLDivElement>(null),shelfRefs=useRef<Record<string,HTMLElement|null>>({});
 useEffect(()=>{const el=plateRef.current;if(!el)return;const observer=new ResizeObserver(([entry])=>setPlateSize({width:entry.contentRect.width,height:entry.contentRect.height}));observer.observe(el);return()=>observer.disconnect()},[]);
 useEffect(()=>{if(!revealId)return;const el=aisleRef.current?.querySelector<HTMLElement>(`[data-food-id="${CSS.escape(revealId)}"]`);if(el){el.scrollIntoView({block:'center',behavior:'smooth'});setRevealId('')}},[revealId,foods]);
 const chosen=foods.find(f=>f.id===selected),items=foods.filter(f=>basket[f.id]>0),shown=foods.filter(f=>!f.label.hiddenInKitchen).filter(f=>tab==='全部'||tab==='常吃'&&f.frequency>0||tab==='爱吃'&&f.label.pinned||tab==='每日清单'&&f.label.dailyPick||tab==='灵感'&&f.id.startsWith('garden-'));
 const positions=plateLayout(plateSize.width,plateSize.height,items.length);
 const allDepartments=marketDisplayOrder.map(name=>({name,foods:shown.filter(f=>f.name.toLocaleLowerCase().includes(shelfQuery.trim().toLocaleLowerCase())).filter(f=>(normalizeMarketDepartment(f.label.marketDepartmentOverride)||marketDepartment(f.name))===name)})).filter(d=>d.foods.length);
 const pagination=marketPage(allDepartments,page),departments=pagination.groups;
 const currentDepartment=departments.some(d=>d.name===activeDepartment)?activeDepartment:departments[0]?.name;
 useEffect(()=>{const name=pendingDepartment.current;if(!name)return;pendingDepartment.current=null;shelfAnchor(name)?.scrollIntoView({block:'center',behavior:'auto'});},[pagination.page]);
 function visitDepartment(name:string){const target=marketDepartmentPage(allDepartments,name);setActiveDepartment(name);manualNavigation.current=true;window.setTimeout(()=>{manualNavigation.current=false},900);if(target===pagination.page)shelfAnchor(name)?.scrollIntoView({block:'center',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});else {pendingDepartment.current=name;setPage(target)}}
 useEffect(()=>{
  let frame=0;
  const track=()=>{
   if(frame)return;
   frame=window.requestAnimationFrame(()=>{
    frame=0;const root=aisleRef.current;if(!root||manualNavigation.current)return;
    const r=root.getBoundingClientRect(),top=Math.max(0,r.top),bottom=Math.min(window.innerHeight,r.bottom);
    if(!r.width||bottom<=top)return;
    const x=Math.max(r.left,Math.min(window.innerWidth/2,r.right)),y=Math.max(top,Math.min(window.innerHeight/2,bottom));
    let nearest='',distance=Infinity;
    for(const card of root.querySelectorAll<HTMLElement>('.fg-tile[data-department]')){
     const box=card.getBoundingClientRect();if(box.bottom<top||box.top>bottom)continue;
     const dx=Math.max(box.left-x,0,x-box.right),dy=Math.max(box.top-y,0,y-box.bottom),score=dx*dx+dy*dy;
     if(score<distance){distance=score;nearest=card.dataset.department||'';}
    }
    if(nearest)setActiveDepartment(current=>current===nearest?current:nearest);
   });
  };
  centerTracker.current=track;window.addEventListener('scroll',track,{passive:true});window.addEventListener('resize',track);
  return()=>{window.cancelAnimationFrame(frame);window.removeEventListener('scroll',track);window.removeEventListener('resize',track);centerTracker.current=()=>{};};
 },[]);
 const dailyCalories=entries.filter(e=>e.type==='food'&&e.date===date).reduce((sum,e)=>sum+(foodCalories(e)??0),0);
 const total=items.reduce((n,f)=>n+(f.template?(foodCalories(f.template)||0):f.label.energyKcal*f.amount/100)*basket[f.id],0),unknown=items.some(f=>f.template&&foodCalories(f.template)==null);
 function hideShelfFood(f:GardenFood,from?:HTMLElement){
  if(from&&shelfTrash.current&&motionOK()){
   const a=from.getBoundingClientRect(),b=shelfTrash.current.getBoundingClientRect(),ghost=from.cloneNode(true) as HTMLElement;
   Object.assign(ghost.style,{position:'fixed',left:a.left+'px',top:a.top+'px',width:a.width+'px',height:a.height+'px',margin:'0',zIndex:'10000',pointerEvents:'none'});document.body.appendChild(ghost);
   ghost.animate([{transform:'translate(0,0) rotate(0) scale(1)',opacity:1},{transform:`translate(${(b.left-a.left)*.4}px,${Math.min(b.top-a.top,0)-65}px) rotate(-12deg) scale(.85)`,opacity:.9,offset:.4},{transform:`translate(${b.left-a.left}px,${b.top-a.top}px) rotate(24deg) scale(.08)`,opacity:0}],{duration:650,easing:'ease-in'}).onfinish=()=>ghost.remove();
  }
  onLabel({...f.label,hiddenInKitchen:true});setShelfRemoved(f.label);setShelfDragging(null);setShelfTrashHot(false);
 }
 function overShelfTrash(x:number,y:number){const r=shelfTrash.current?.getBoundingClientRect();return !!r&&x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom}
 function add(food:GardenFood,tile?:HTMLElement){
  setBasket(v=>({...v,[food.id]:Math.min(50,(v[food.id]||0)+1)}));setError('');
  if(tile){sparklePick(tile.closest('.fg-tile') as HTMLElement||tile);const k=tapCalories(food);popText(tile,k==null?'+1份':`+${Math.round(k)}`);hopInto(tile,plateRef.current,food.icon)}
 }
 function finish(ev?:ReactMouseEvent<HTMLButtonElement>){
  if(submitted.current||!items.length)return;submitted.current=true;const rect=ev?.currentTarget.getBoundingClientRect();
  try{onSave(items.map(f=>gardenRecord(f,basket[f.id],date,meal)));if(rect)leafShower(rect)}catch(e){submitted.current=false;setError(e instanceof Error?e.message:'暂时未保存，请重试')}
 }
 const nutrition=gardenNutrition(items.map(f=>gardenRecord(f,basket[f.id],date,meal)));
 function clearPlate(){if(!items.length)return;setClearedBasket({...basket});setBasket({});setSelected(null);setInspected(null);setRemoved(null);setDragged(null);setDragPosition(null);setDropHot(false)}
 function removeFromPlate(id:string){const ratio=basket[id];if(!ratio)return;setRemoved({id,ratio});setBasket(v=>({...v,[id]:0}));if(selected===id)setSelected(null);setDragged(null);setDropHot(false);setDragPosition(null)}
 const draggedFood=foods.find(f=>f.id===dragged);
 function overTrash(x:number,y:number){const r=trashRef.current?.getBoundingClientRect();return !!r&&x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom}

 return <div className="food-garden">
  <div className="fg-banner"><span className="fg-cloud fg-cloud-a" aria-hidden="true"/><span className="fg-cloud fg-cloud-b" aria-hidden="true"/><span className="fg-kicker">🍃 小岛食物园</span><h3>今天，餐盘里长出什么？</h3><p>点一下小食物，它会跳进篮子里。</p><span className="fg-decor" aria-hidden="true">🌳<small>🌼</small></span></div>


  <div className="market-toolbar" role="group" aria-label="货架工具栏"><div className="fg-tabs" role="tablist" aria-label="食物分类">{tabs.map(t=><button type="button" role="tab" aria-selected={tab===t} className={tab===t?'active':''} onClick={()=>{setTab(t);setPage(0)}} key={t}><span aria-hidden="true">{tabIcon[t]}</span>{t}</button>)}</div><div className="market-search"><input className="market-local-query" aria-label="搜索货架食物" placeholder="搜索食物" value={shelfQuery} onChange={e=>{setShelfQuery(e.target.value);setPage(0)}}/><button type="button" className="market-search-toggle" aria-expanded={searchOpen} onClick={()=>setSearchOpen(v=>!v)}>{searchOpen?'收起查找':'⌕ 查找 / 添加'}</button></div><div className="shelf-management"><div ref={shelfTrash} className={`shelf-recycle ${shelfDragging?'is-dragging':''} ${shelfTrashHot?'is-hot':''}`} role="region" aria-label="货架回收篮" onDragOver={e=>{if(e.dataTransfer.types.includes('text/wellgrove-shelf')){e.preventDefault();e.dataTransfer.dropEffect='move';setShelfTrashHot(true)}}} onDragLeave={()=>setShelfTrashHot(false)} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData('text/wellgrove-shelf'),f=foods.find(v=>v.id===id);if(f){const from=aisleRef.current?.querySelector(`[data-food-id="${CSS.escape(id)}"]`);hideShelfFood(f,from as HTMLElement|undefined)}}}>♧ {shelfDragging?'松手，移出货架':'拖到这里，整理货架'}</div><button type="button" onClick={()=>setRecoveryOpen(v=>!v)} aria-expanded={recoveryOpen}>已移出 {foods.filter(f=>f.label.hiddenInKitchen).length}</button>{shelfRemoved&&<span role="status">已移出<button type="button" onClick={()=>{onLabel({...shelfRemoved,hiddenInKitchen:false});setShelfRemoved(null)}}>撤销</button></span>}</div></div>
  {shelfQuery&&<div className="shelf-filter-status">当前筛选：{shelfQuery}<button type="button" onClick={()=>{setShelfQuery('');setPage(0)}}>显示全部食品</button></div>}
  {tab==='每日清单'&&<p className="fg-hint">这是你自己挑选的日常清单，并非医疗或营养必需清单。</p>}
  {tab==='灵感'&&<p className="fg-hint">基础食物的通用份量灵感；请按实际吃下的数量调整。</p>}
  {searchOpen&&<div className="market-search-panel"><FoodShelfSearch catalog={catalog} entries={entries} onConfirm={food=>{onLabel(food);setTab('全部');setShelfQuery(food.name);setPage(0)}} onReveal={food=>{setSearchOpen(false);setTab('全部');setShelfQuery(food.name);setPage(0);setRevealId(food.id)}}/></div>}
  {recoveryOpen&&<div className="shelf-recovery">{foods.filter(f=>f.label.hiddenInKitchen).map(f=><button type="button" key={f.id} onClick={()=>onLabel({...f.label,hiddenInKitchen:false})}>恢复 {f.name}</button>)}<small>只整理货架，不影响已保存饮食。</small></div>}
  {shelfDragging&&shelfDragPosition&&<div className="plate-drag-ghost" aria-hidden="true" style={{left:shelfDragPosition.x,top:shelfDragPosition.y}}><FoodIllustration name={foods.find(f=>f.id===shelfDragging)?.name||''}/></div>}
  <div className="market-mini" aria-label="随行营养与餐盘"><FloralSummaryFrame/><span>已录 <b>{Math.round(dailyCalories)}</b><small> 千卡</small></span><span>{meal}待存 <b>{Math.round(total)}</b><small> 千卡 · {items.length}种</small></span><div className="market-mini-bars" aria-label="待保存餐盘供能比例">{(['protein','carbs','fat'] as const).map(k=><i key={k} className={`mini-${k}`} style={{width:`${nutrition.shares[k]??0}%`}}/>)}</div><button type="button" onClick={()=>plateRef.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'})}>查看餐盘 ↑</button></div>
  {active&&<div className="market-browser compact-market"><nav className="market-directory" aria-label="超市分区导览">{allDepartments.map(d=><button type="button" key={d.name} aria-current={currentDepartment===d.name?'location':undefined} onClick={e=>{sparklePick(e.currentTarget);visitDepartment(d.name)}}><span className="aisle-icon" aria-hidden="true"><FoodIllustration name={d.name}/></span><span className="aisle-name">{d.name}</span><small>{d.foods.length}</small></button>)}</nav><div className="market-aisles" ref={aisleRef} onScroll={()=>centerTracker.current()}>{departments.map((department,index)=><section className="market-shelf" data-active={currentDepartment===department.name} key={department.name} ref={el=>{shelfRefs.current[department.name]=el}} aria-label={`${department.name}货架`}><header><div><small>AISLE {String(index+1).padStart(2,'0')}</small><h4>{department.name}</h4></div><span>{department.foods.length} 种可选 · 点图片拿一份</span></header><div className="fg-grid">{department.foods.map(f=><div key={f.id} className={`fg-tile ${basket[f.id]?'picked':''}`} data-food-id={f.id} data-department={department.name}>
   <div className="shelf-card-tools" data-department={department.name}><button type="button" aria-label={`拖动${f.name}到回收篮`} className="shelf-drag-handle" draggable onDragStart={e=>{e.dataTransfer.setData('text/wellgrove-shelf',f.id);e.dataTransfer.effectAllowed='move';setShelfDragging(f.id)}} onDragEnd={()=>{setShelfDragging(null);setShelfTrashHot(false)}} onPointerDown={e=>{e.preventDefault();shelfPointer.current={id:f.id,x:e.clientX,y:e.clientY,moved:false};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{const d=shelfPointer.current;if(d&&Math.hypot(e.clientX-d.x,e.clientY-d.y)>8){d.moved=true;setShelfDragging(d.id);setShelfDragPosition({x:e.clientX,y:e.clientY});setShelfTrashHot(overShelfTrash(e.clientX,e.clientY))}}} onPointerUp={e=>{const d=shelfPointer.current;if(d?.moved&&overShelfTrash(e.clientX,e.clientY))hideShelfFood(f,e.currentTarget.closest('.fg-tile') as HTMLElement);shelfPointer.current=null;setShelfDragging(null);setShelfDragPosition(null);setShelfTrashHot(false)}} onPointerCancel={()=>{shelfPointer.current=null;setShelfDragging(null);setShelfDragPosition(null);setShelfTrashHot(false)}}>⠿</button><button type="button" aria-label={`移出货架 ${f.name}`} onClick={e=>hideShelfFood(f,e.currentTarget.closest('.fg-tile') as HTMLElement)}>×</button></div>
   <button type="button" className="fg-card-pick" onClick={e=>add(f,e.currentTarget)} aria-label={`添加${f.name}`}><span className="fg-art"><FoodIllustration name={f.name} artworkName={f.label.artworkName} imageUrl={f.label.imageUrl} fatPer100={f.label.fat} amount={f.amount} ratio={basket[f.id]||1}/></span><b title={f.name}>{f.name}</b><small className="market-portion">{marketPortionText(f,basket[f.id]||1)} · {f.template?.weightUnknown?'重量待补全':`${Number((f.amount*(basket[f.id]||1)).toFixed(1))}${f.label.unit}`}</small><span className="market-card-energy">{tapCalories(f)==null?'热量待补全':`${Math.round(tapCalories(f)!*(basket[f.id]||1))} 千卡`}{basket[f.id]?` · 已选${Number(basket[f.id].toFixed(2))}份`:''}</span><span className="market-badges">{foodBadges(f).map(b=><i key={b} className={`badge-${b==='蛋白'?'protein':b==='碳水'?'carbs':b==='脂肪'?'fat':'plant'}`}>{b}</i>)}</span></button>
   <div className="fg-inline-controls"><button type="button" aria-label={`减少${f.name}半份`} disabled={!basket[f.id]} onClick={()=>setBasket(v=>({...v,[f.id]:Math.max(0,(v[f.id]||0)-.5)}))}>−</button><button type="button" className="fg-adjust" aria-label={`调整${f.name}分量`} onClick={()=>openPortion(f)}>{basket[f.id]?Number(basket[f.id].toFixed(2))+'份':'调分量'}</button><button type="button" aria-label={`增加${f.name}半份`} onClick={e=>{setBasket(v=>({...v,[f.id]:Math.min(50,(v[f.id]||0)+.5)}));hopInto(e.currentTarget.parentElement!.parentElement!,plateRef.current,f.icon)}}>＋</button></div>
  </div>)}</div></section>)}</div><nav className="market-pagination" aria-label="食品分页"><span>本页 {pagination.count} 种 · 共 {pagination.total} 种</span><button type="button" disabled={pagination.page===0} onClick={()=>{setPage(pagination.page-1);aisleRef.current?.scrollTo({top:0})}}>上一页</button><b>{pagination.page+1} / {pagination.pages}</b><button type="button" disabled={pagination.page+1>=pagination.pages} onClick={()=>{setPage(pagination.page+1);aisleRef.current?.scrollTo({top:0})}}>下一页</button><small>每页最多 60 种 · 分类整组展示</small></nav></div>}
  {!shown.length&&<div className="fg-empty"><span aria-hidden="true">🌱</span><p>{tab==='常吃'?'记下第一餐，常吃的食物就会在这里生长。':'这一类暂时没有匹配食物，可切换类别或筛选。'}</p><button type="button" onClick={()=>setTab('全部')}>去挑食物 →</button></div>}
  {chosen&&createPortal(<div className="qh portion-portal"><div className="qh-overlay fg-portion-overlay" onClick={e=>{if(e.target===e.currentTarget)setSelected(null)}}><section ref={portionRef} className="fg-portion qh-modal" role="dialog" aria-modal="true" aria-label="调整食物份量" onKeyDown={e=>{if(e.key==='Escape')setSelected(null);if(e.key==='Tab'){const nodes=Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select,summary,a[href]')).filter(el=>el.getClientRects().length);const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}}}>
   <div><span aria-hidden="true"><FoodIllustration name={chosen.name} artworkName={chosen.label.artworkName} imageUrl={chosen.label.imageUrl} fatPer100={chosen.label.fat} amount={chosen.amount} ratio={basket[chosen.id]||1}/></span><b>{chosen.name}</b><button type="button" aria-label="收起份量设置" onClick={()=>setSelected(null)}>×</button></div>
   <p className="plate-selection-energy"><b>{tapCalories(chosen)==null?'热量待补全':Math.round(tapCalories(chosen)!*(basket[chosen.id]||0))+' 千卡'}</b> · 已选 {Number((basket[chosen.id]||0).toFixed(2))} 份</p>
   <small>每份：{chosen.caption} · {chosen.label.source}</small>
   <FoodArtworkPicker name={chosen.name} value={chosen.label.artworkName} imageUrl={chosen.label.imageUrl} onChange={value=>onLabel({...chosen.label,artworkName:value})}/>
   <div className="fg-serving-editor">
    <label>每份{chosen.label.unit==='mL'?'体积':'重量'}<span><input aria-label={`每份${chosen.label.unit==='mL'?'体积':'重量'}`} type="number" min="0.1" max="10000" step="0.1" required disabled={!!chosen.template?.weightUnknown} value={servingAmount} onKeyDown={e=>{if(e.key==='Enter')e.preventDefault()}} onChange={e=>{setServingAmount(e.target.value);setServingError('')}}/>{chosen.label.unit}</span></label>
    <button type="button" disabled={!!chosen.template?.weightUnknown} onClick={()=>{try{onLabel(withMarketServing(chosen,Number(servingAmount)));setServingError('');}catch(err){setServingError(err instanceof Error?err.message:'每份分量暂时未保存，请重试')}}}>保存每份分量</button>
    <small>{chosen.template?.weightUnknown?'请先在记录编辑中补全重量和营养依据。':'修改后保持已选份数，热量与营养按新分量计算；后续点选也使用此设置。'}</small>
    {servingError&&<p role="alert">{servingError}</p>}
   </div>
   <div className="fg-stepper"><button type="button" aria-label="减少半份" disabled={!basket[chosen.id]} onClick={()=>setBasket(v=>({...v,[chosen.id]:Math.max(0,(v[chosen.id]||0)-.5)}))}>−</button><output>{basket[chosen.id]||0}<small> 份</small></output><button type="button" aria-label="增加半份" onClick={()=>setBasket(v=>({...v,[chosen.id]:Math.min(50,(v[chosen.id]||0)+.5)}))}>＋</button></div>
   <div className="fg-presets">{[.5,1,1.5,2].map(n=><button type="button" key={n} aria-pressed={basket[chosen.id]===n} onClick={()=>setBasket(v=>({...v,[chosen.id]:n}))}>{n}份</button>)}</div>
   {chosen.amount>0&&!chosen.template?.weightUnknown&&<label className="fg-grams">实际重量 / 体积：{Math.round(chosen.amount*(basket[chosen.id]||0)*100)/100} {chosen.label.unit}<input aria-label="调整食物重量" type="range" min="1" max={Math.min(chosen.amount*50,Math.max(500,chosen.amount*4))} step="1" value={Math.max(1,chosen.amount*(basket[chosen.id]||0))} onChange={e=>setBasket(v=>({...v,[chosen.id]:Number(e.target.value)/chosen.amount}))}/></label>}
   <button type="button" disabled={!basket[chosen.id]} onClick={()=>removeFromPlate(chosen.id)}>从本餐移除</button>
   <div className="fg-marks"><button type="button" disabled={!!chosen.template&&!chosen.template.foodLabel&&(chosen.template.weightUnknown||[chosen.template.protein,chosen.template.carbs,chosen.template.fat].some(v=>v==null))} aria-pressed={!!chosen.label.pinned} onClick={()=>onLabel({...chosen.label,pinned:!chosen.label.pinned})}>{chosen.label.pinned?'💗 已是爱吃':'♡ 标为爱吃'}</button><button type="button" disabled={!!chosen.template&&!chosen.template.foodLabel&&(chosen.template.weightUnknown||[chosen.template.protein,chosen.template.carbs,chosen.template.fat].some(v=>v==null))} aria-pressed={!!chosen.label.dailyPick} onClick={()=>onLabel({...chosen.label,dailyPick:!chosen.label.dailyPick})}>{chosen.label.dailyPick?'☀️ 已在每日清单':'☀ 加入每日清单'}</button></div>
  </section></div></div>,document.body)}
  {pendingList&&createPortal(<div className="qh portion-portal"><div className="qh-overlay fg-portion-overlay" onClick={e=>{if(e.target===e.currentTarget)setPendingList(false)}}><section className="qh-modal fg-portion pending-food-list" ref={pendingListRef} role="dialog" aria-modal="true" aria-label="已选食物明细" onKeyDown={e=>{if(e.key==='Escape')setPendingList(false);if(e.key==='Tab'){const nodes=Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled)'));const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}}}><header><h3>已选 {items.length} 种 · {Math.round(total)} 千卡</h3><button type="button" aria-label="关闭已选食物明细" onClick={()=>setPendingList(false)}>×</button></header>{items.map(f=><button type="button" className="pending-food-row" key={f.id} onClick={()=>openPortion(f)}><FoodIllustration name={f.name} artworkName={f.label.artworkName} imageUrl={f.label.imageUrl}/><span><b>{f.name}</b><small>{Number((f.amount*basket[f.id]).toFixed(1))}{f.label.unit} · {tapCalories(f)==null?'热量待补全':Math.round(tapCalories(f)!*basket[f.id])+' 千卡'}</small></span><span>调整 ›</span></button>)}</section></div></div>,document.body)}
  <section className="fg-basket contained-basket"><h3 className="poster-platter-label">我的搭配餐盘{items.length>0&&<button type="button" className="plate-view-selection" onClick={()=>{portionTrigger.current=document.activeElement as HTMLElement;setPendingList(true)}}>查看已选 {items.length} 种{items.length>Math.max(1,Math.floor(plateSize.width/90))?' · 已堆叠':''} ›</button>}</h3><div className="plate-viewport" tabIndex={0} aria-label="搭配餐盘，悬停或点选食物查看详情"><div className="plate-artboard"><div className="fg-plate" ref={plateRef} aria-label="本餐餐盘">{items.length?items.map((f,index)=><div style={positions[index]} data-inspected={inspected===f.id} onMouseEnter={()=>setInspected(f.id)} onMouseLeave={e=>{if(!e.currentTarget.contains(document.activeElement))setInspected(current=>current===f.id?null:current)}} onFocus={()=>setInspected(f.id)} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setInspected(current=>current===f.id?null:current)}} className={`plate-food ${dragged===f.id?'plate-dragging':''}`} key={f.id} draggable onDragStart={e=>{e.dataTransfer.setData('text/wellgrove-food',f.id);e.dataTransfer.effectAllowed='move';setDragged(f.id)}} onDragEnd={()=>{setDragged(null);setDropHot(false)}}><button type="button" className="plate-food-main" aria-label={`调整${f.name}`} aria-describedby={`plate-info-${meal}-${encodeURIComponent(f.id)}`} onClick={()=>openPortion(f)}><FoodIllustration name={f.name} artworkName={f.label.artworkName} imageUrl={f.label.imageUrl} fatPer100={f.label.fat} amount={f.amount} ratio={basket[f.id]}/><b>{f.name}</b><span>{marketPortionText(f,basket[f.id])}</span><small>{f.template?.weightUnknown?'重量待补全':Number((f.amount*basket[f.id]).toFixed(1))+f.label.unit} · {tapCalories(f)==null?'热量暂无':Math.round(tapCalories(f)!*basket[f.id])+'大卡'}</small></button><div className="plate-food-tooltip" style={{left:Math.max(-positions[index].left,Math.min(positions[index].width/2-95,plateSize.width-positions[index].left-190)),transform:'none'}} role="tooltip" id={`plate-info-${meal}-${encodeURIComponent(f.id)}`}><b>{f.name}</b><span>{marketPortionText(f,basket[f.id])} · {Number((f.amount*basket[f.id]).toFixed(1))}{f.label.unit}</span><strong>{tapCalories(f)==null?'热量待补全':Math.round(tapCalories(f)!*basket[f.id])+' 千卡'}</strong><small>点选调整分量与配图</small></div><div className="plate-food-tools"><button type="button" className="plate-drag-handle" aria-label={`拖动${f.name}放回货架`} onPointerDown={e=>{e.preventDefault();pointerDrag.current={id:f.id,x:e.clientX,y:e.clientY,moved:false};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{const d=pointerDrag.current;if(!d)return;if(Math.hypot(e.clientX-d.x,e.clientY-d.y)>6)d.moved=true;if(d.moved){setDragged(d.id);setDragPosition({x:e.clientX,y:e.clientY});setDropHot(overTrash(e.clientX,e.clientY))}}} onPointerUp={e=>{const d=pointerDrag.current;if(d?.moved&&overTrash(e.clientX,e.clientY))removeFromPlate(d.id);pointerDrag.current=null;setDragged(null);setDragPosition(null);setDropHot(false)}} onPointerCancel={()=>{pointerDrag.current=null;setDragged(null);setDragPosition(null);setDropHot(false)}}>⠿ 拖动</button><button type="button" aria-label={`从餐盘移除${f.name}`} onClick={()=>removeFromPlate(f.id)}>移除</button></div></div>):<span className="fg-plate-empty"><span aria-hidden="true">🍽️</span><small>{recorded.length?'本餐已记录的食物保留在上方，继续点选可追加。':'点食物装盘，名称和实际分量会显示在这里'}</small></span>}</div></div></div><p className="plate-scroll-hint">悬停查看热量 · 点选调整 · 食物较多时自动错位堆叠</p><div className="plate-actions">
   <div className="fg-draft-macros" aria-label="当前搭配营养预览">本餐待保存 · {(['protein','carbs','fat'] as const).map((key,i)=><span key={key}>{['蛋白','碳水','脂肪'][i]} {nutrition.totals[key].toFixed(1)}g{nutrition.missing[key]?' + 待补全':''} · {nutrition.shares[key]==null?'占比暂无':nutrition.shares[key]!.toFixed(0)+'%'} </span>)}</div>
   <div className="fg-summary"><b>{items.length?<>{items.length} 种食物 · <span className="fg-kcal">{Math.round(total)}</span> 千卡{unknown?'（已知部分）':''}</>:'选你喜欢的，慢慢来'}</b><small>通用份量与营养为估算；品牌商品沿用已保存依据。</small></div>
   <div className="plate-commit-actions"><button className="plate-clear" type="button" aria-label="一键清空餐盘" disabled={!items.length} onClick={clearPlate}>清空</button><button className="fg-save" type="button" disabled={!items.length} onClick={finish}>🧺 收进{meal}记录</button></div>
   <div className={`plate-dropzone ${dropHot?'drop-ready':''}`} ref={trashRef} onDragOver={e=>{if(dragged){e.preventDefault();e.dataTransfer.dropEffect='move';setDropHot(true)}}} onDragLeave={()=>setDropHot(false)} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData('text/wellgrove-food');if(id===dragged)removeFromPlate(id)}} aria-label="餐盘食物放回区"><span aria-hidden="true">↶</span>{dropHot?'松手，放回货架':'不想吃了？拖到这里放回货架'}<small>仅移除待保存搭配</small></div></div>
   {clearedBasket&&<div className="plate-clear-notice" role="status">待保存餐盘已清空<button type="button" onClick={()=>{setBasket(v=>restorePlateSelection(v,clearedBasket));setClearedBasket(null)}}>撤销清空</button></div>}
   {removed&&<div className="plate-undo" role="status">已放回货架 <button type="button" onClick={()=>{setBasket(v=>({...v,[removed.id]:removed.ratio}));setRemoved(null)}}>撤销</button></div>}
   {draggedFood&&dragPosition&&<div className="plate-drag-ghost" aria-hidden="true" style={{left:dragPosition.x,top:dragPosition.y}}><FoodIllustration name={draggedFood.name} fatPer100={draggedFood.label.fat} amount={draggedFood.amount} ratio={basket[draggedFood.id]}/><b>{draggedFood.name}</b></div>}

   {error&&<p role="alert">{error}</p>}
  <div className="plate-recorded-box"><SavedFoodTray entries={recorded} onEdit={onEdit} title={`${meal}已记录`}/></div></section>
  <button type="button" className="fg-text" onClick={onText}>没找到食物？展开文字 / 查询入口 ↗</button>
 </div>
}

/* ---------- weigh-in: drag the wooden ruler like a little scale ---------- */
const PX=14; // pixels per 0.1 kg
function drawRuler(canvas:HTMLCanvasElement|null,v:number){
 if(!canvas)return;const w=canvas.clientWidth,h=canvas.clientHeight,dpr=window.devicePixelRatio||1;if(!w||!h)return;
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}
 const ctx=canvas.getContext('2d');if(!ctx)return;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 const c=w/2,half=c/PX/10,t0=Math.floor((v-half)*10)-1,t1=Math.ceil((v+half)*10)+1;
 ctx.textAlign='center';ctx.font='700 13px ui-rounded,"SF Pro Rounded","Arial Rounded MT Bold",sans-serif';
 for(let t=t0;t<=t1;t++){
  const x=c+(t/10-v)*10*PX,major=t%10===0,mid=t%5===0;
  ctx.fillStyle=major?'#7a5638':mid?'#a7805b':'#c9a983';
  const len=major?26:mid?17:10,wd=major?3:2;
  ctx.beginPath();if(typeof ctx.roundRect==='function')ctx.roundRect(x-wd/2,6,wd,len,wd/2);else ctx.rect(x-wd/2,6,wd,len);ctx.fill();
  if(major){ctx.fillStyle='#6e5440';ctx.fillText(String(t/10),x,h-10)}
 }
}
export function PlayfulWeight({value,onChange}:{value:string;onChange:(value:string)=>void}){
 const number=Number(value)||65;
 const canvasRef=useRef<HTMLCanvasElement>(null),rulerRef=useRef<HTMLDivElement>(null),drag=useRef<{x:number;v:number}|null>(null),latest=useRef(number);
 const set=(n:number)=>onChange(Math.max(1,Math.min(500,Math.round(n*100)/100)).toFixed(2));
 const setRef=useRef(set);
 useEffect(()=>{latest.current=number;setRef.current=set;drawRuler(canvasRef.current,number)});
 useEffect(()=>{
  const canvas=canvasRef.current,ruler=rulerRef.current;if(!canvas||!ruler)return;
  const ro=new ResizeObserver(()=>drawRuler(canvas,latest.current));ro.observe(canvas);
  const wheel=(e:WheelEvent)=>{e.preventDefault();const d=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;if(d)setRef.current(Math.round((latest.current+(d>0?.1:-.1))*10)/10)};
  ruler.addEventListener('wheel',wheel,{passive:false});
  return()=>{ro.disconnect();ruler.removeEventListener('wheel',wheel)};
 },[]);
 const step=Math.round(number*10);
 return <div className="fg-weight">
  <span className="fg-kicker">🌿 今日小脚印</span>
  <h3>和今天的自己打个招呼</h3>
  <p>左右拖动木尺来称重，数字只是记录。</p>
  <div className="fg-scale">
   <span className="fg-sprout" key={step} aria-hidden="true">🌱</span>
   <label className="fg-readout">今天的刻度<span><input aria-label="体重（kg）" type="number" step="0.01" min="1" max="500" required value={value} onChange={e=>onChange(e.target.value)}/><small>kg</small></span></label>
   <div className="fg-ruler" ref={rulerRef} role="slider" tabIndex={0} aria-label="拖动木尺设置体重" aria-valuemin={1} aria-valuemax={500} aria-valuenow={number} aria-valuetext={`${number.toFixed(2)} 公斤`}
    onPointerDown={e=>{drag.current={x:e.clientX,v:number};e.currentTarget.setPointerCapture(e.pointerId)}}
    onPointerMove={e=>{if(!drag.current)return;set(drag.current.v-(e.clientX-drag.current.x)/PX/10)}}
    onPointerUp={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}}
    onKeyDown={e=>{const s=e.shiftKey?1:.1;if(e.key==='ArrowRight'||e.key==='ArrowUp'){e.preventDefault();set(number+s)}else if(e.key==='ArrowLeft'||e.key==='ArrowDown'){e.preventDefault();set(number-s)}}}>
    <canvas ref={canvasRef}/><span className="fg-needle" aria-hidden="true"/>
   </div>
  </div>
  <div className="fg-weight-steps">{[-.1,-.01,.01,.1].map(n=><button type="button" key={n} onClick={()=>set(number+n)}>{n>0?'+':'−'}{Math.abs(n).toFixed(2)}</button>)}</div>
  <small>拖木尺选大致刻度，点 ±0.01 精调；也可以点数字直接改。</small>
 </div>
}
