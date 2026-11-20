import type {FoodNutrition} from "./foodNutrition";
import type {HealthEntry} from "./foodRecord";
const normalize=(s:string)=>s.toLowerCase().replace(/[^\p{L}\p{N}]/gu,"");
export function sameLibraryFood(a:FoodNutrition,b:FoodNutrition):boolean{
 if(a.id===b.id)return true;
 const product=(f:FoodNutrition)=>f.sourceUrl?.match(/\/productdetails\/(\d+)/)?.[1]||f.id.match(/^woolworths-(\d+)$/)?.[1];
 const ap=product(a),bp=product(b);if(ap||bp)return !!ap&&ap===bp;
 return normalize(a.name)===normalize(b.name)&&a.unit===b.unit&&(['energyKcal','protein','carbs','fat'] as const).every(k=>a[k]===b[k])&&(['quantity','quantityUnit','grams','millilitres','energyKcal','protein','carbs','fat'] as const).every(k=>(a.serving?.[k]??null)===(b.serving?.[k]??null));
}
export function mergeLibraryFood(previous:FoodNutrition|undefined,incoming:FoodNutrition):FoodNutrition {
 const keepCount=previous?.serving?.quantitySource==="manual"&&incoming.serving?.quantitySource!=="manual"&&incoming.source!=="照片识别";
 return {...incoming,hiddenInKitchen:incoming.hiddenInKitchen??previous?.hiddenInKitchen??false,pinned:incoming.pinned??previous?.pinned??false,dailyPick:incoming.dailyPick??previous?.dailyPick??false,marketDepartmentOverride:incoming.marketDepartmentOverride??previous?.marketDepartmentOverride,...(keepCount?{serving:{...incoming.serving,quantity:previous!.serving!.quantity,quantityUnit:previous!.serving!.quantityUnit,quantitySource:"manual" as const}}:{})};
}
export function upsertLibraryFood(saved:FoodNutrition[],incoming:FoodNutrition):FoodNutrition[]{const duplicates=saved.filter(p=>sameLibraryFood(p,incoming));const previous=duplicates[0];const merged=duplicates.reduce<FoodNutrition|undefined>((value,p)=>value?mergeLibraryFood(value,p):p,undefined);const food=mergeLibraryFood(merged,incoming);return[{...food,id:previous?.id||food.id},...saved.filter(p=>!sameLibraryFood(p,incoming))]}

export function libraryUsage(food:FoodNutrition,entries:HealthEntry[]){const records=entries.filter(e=>e.type==="food"&&(e.foodLabel&&sameLibraryFood(e.foodLabel,food)||!e.foodLabel&&normalize(e.name)===normalize(food.name)));return{count:records.length,last:records.reduce((latest,e)=>{const value=`${e.date}T${e.time}`;return value>latest?value:latest},"")}}
export function rankedLibrary(saved:FoodNutrition[],entries:HealthEntry[],query=""):FoodNutrition[]{
 const tokens=query.toLowerCase().trim().split(/\s+/).map(normalize).filter(Boolean);
 const id=query.match(/(?:productdetails\/|^)(\d{3,18})(?:\/|$|\?)/)?.[1];
 const stats=new Map(saved.map(p=>[p.id,libraryUsage(p,entries)]));
 return saved.filter(p=>{if(id)return p.id===`woolworths-${id}`||p.sourceUrl?.match(/\/productdetails\/(\d+)/)?.[1]===id;const text=normalize(`${p.name} ${p.id} ${p.sourceUrl||""} ${entries.filter(e=>e.foodLabel?.id===p.id).map(e=>e.name).join(" ")}`);return tokens.every(token=>text.includes(token))}).sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)||stats.get(b.id)!.count-stats.get(a.id)!.count||stats.get(b.id)!.last.localeCompare(stats.get(a.id)!.last)||(b.importedAt||"").localeCompare(a.importedAt||"")||a.name.localeCompare(b.name));
}
