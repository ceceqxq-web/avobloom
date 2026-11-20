import type {EnergyProfile} from "../energyPlan";
import type {WeightPlan} from "../weightGoal";
import {plannerFoods} from "../mealPlanner.ts";
import type {HealthEntry} from "../foodRecord";
import type {FoodNutrition} from "../foodNutrition";
import type {MealPlan,MealSlot} from "../mealPlanner";
export type SavedPlan={plan:MealPlan;selected:MealSlot[]};
export type HealthData={entries:HealthEntry[];catalog:FoodNutrition[];goal:number;calGoal:number;weightPlan?:WeightPlan;profile?:EnergyProfile;plans:Record<string,SavedPlan>};
export type HealthSnapshot={data:HealthData;revision:number;updatedAt:string};
export type HealthBackup={format:"qingheng-backup";version:2;exportedAt:string;data:HealthData};
export const emptyHealthData=():HealthData=>({entries:[],catalog:[],goal:55,calGoal:1800,plans:{}});
export function equal(a:unknown,b:unknown):boolean {return canonical(a)===canonical(b)}
function canonical(v:unknown):string {if(v===undefined)return "undefined";if(v===null||typeof v!=="object")return JSON.stringify(v);if(Array.isArray(v))return `[${v.map(canonical).join(",")}]`;return `{${Object.keys(v).sort().map(k=>JSON.stringify(k)+":"+canonical((v as Record<string,unknown>)[k])).join(",")}}`}
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==="object"&&!Array.isArray(v);
const validNumber=(v:unknown,min=0,max=1e8)=>typeof v==="number"&&Number.isFinite(v)&&v>=min&&v<=max;
export const validDate=(v:unknown)=>typeof v==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v+"T12:00:00Z"))&&new Date(v+"T12:00:00Z").toISOString().slice(0,10)===v;
function unique(items:Record<string,unknown>[]){const ids=new Set();for(const i of items){if(typeof i.id!=="string"||!i.id||i.id.length>200||ids.has(i.id))throw new Error("记录 ID 缺失或重复");ids.add(i.id)}}
export function validateHealthData(input:unknown):HealthData {
 if(!object(input)||!Array.isArray(input.entries)||!Array.isArray(input.catalog)||!object(input.plans)||!validNumber(input.goal,1,500)||!validNumber(input.calGoal,1,10000))throw new Error("备份数据结构或目标值无效");
 if(input.profile!=null){const p=input.profile;if(!object(p)||!validDate(p.birthDate)||!validNumber(p.heightCm,50,250)||!["female","male"].includes(String(p.sex))||p.activity!==null&&!["sedentary","light","light-moderate","moderate","active"].includes(String(p.activity))||p.specialSituation!==undefined&&typeof p.specialSituation!=="boolean"||p.autoBudget!==undefined&&typeof p.autoBudget!=="boolean")throw new Error("个人资料格式无效")}
 if(input.weightPlan!=null){const p=input.weightPlan;if(!object(p)||(p.startWeight!==null&&!validNumber(p.startWeight,1,500))||(p.startDate!==null&&!validDate(p.startDate))||(p.targetDate!==null&&!validDate(p.targetDate)))throw new Error("体重目标日期或起始记录无效")}
 if(input.entries.length>100000||input.catalog.length>10000||Object.keys(input.plans).length>10000)throw new Error("记录数量超出限制");
 for(const e of input.entries){if(!object(e)||!validDate(e.date)||!["food","weight","bowel","exercise"].includes(String(e.type))||typeof e.name!=="string"||!e.name||typeof e.time!=="string"||typeof e.meal!=="string"||!validNumber(e.amount))throw new Error("健康记录格式无效");for(const k of ["protein","carbs","fat"])if(e[k]!==null&&!validNumber(e[k]))throw new Error("记录营养值无效");for(const k of ["energyKcal","durationMinutes","distanceKm"])if(e[k]!=null&&!validNumber(e[k]))throw new Error("记录数值无效")}
 unique(input.entries);
 for(const p of input.catalog){if(!object(p)||typeof p.name!=="string"||!["g","mL"].includes(String(p.unit))||!["energyKcal","protein","carbs","fat"].every(k=>validNumber(p[k])))throw new Error("商品标签格式无效")}
 unique(input.catalog);
 for(const [date,v] of Object.entries(input.plans)){if(!validDate(date)||!object(v)||!object(v.plan)||typeof v.plan.id!=="string"||!Array.isArray(v.plan.meals)||!v.plan.meals.length||!validNumber(v.plan.targetCalories,600,4000)||!object(v.plan.preferences)||typeof v.plan.preferences.vegetarian!=="boolean"||typeof v.plan.preferences.snack!=="boolean"||!Array.isArray(v.plan.preferences.exclude)||!Array.isArray(v.selected)||!v.selected.every(s=>["早餐","午餐","晚餐","加餐"].includes(s)))throw new Error("食谱格式无效");if(v.plan.preferences.availableFoodIds!==undefined&&(!Array.isArray(v.plan.preferences.availableFoodIds)||!v.plan.preferences.availableFoodIds.every(id=>typeof id==="string"&&!!plannerFoods[id])))throw new Error("自选食材格式无效");if(v.plan.preferences.allowSupplement!==undefined&&typeof v.plan.preferences.allowSupplement!=="boolean")throw new Error("补充食材选项无效");const seen=new Set();for(const m of v.plan.meals){if(!object(m)||!["早餐","午餐","晚餐","加餐"].includes(String(m.slot))||seen.has(m.slot)||typeof m.title!=="string"||typeof m.recipeId!=="string"||!Array.isArray(m.history)||!m.history.every(x=>typeof x==="string")||!Array.isArray(m.steps)||!m.steps.every(x=>typeof x==="string")||!validNumber(m.minutes)||!Array.isArray(m.items)||!m.items.length||!m.items.every(i=>object(i)&&typeof i.foodId==="string"&&!!plannerFoods[i.foodId]&&validNumber(i.amount,0.1))||![m.nutrition,m.target].every(n=>object(n)&&["calories","protein","carbs","fat"].every(k=>validNumber(n[k]))))throw new Error("食谱菜品格式无效");seen.add(m.slot)}}
 return JSON.parse(JSON.stringify(input)) as HealthData;
}
export function parseBackup(input:unknown):HealthData {
 if(!object(input))throw new Error("请选择Avobloom JSON 备份");
 if(input.format!==undefined){if(input.format!=="qingheng-backup"||input.version!==2)throw new Error("不支持此备份版本");return validateHealthData(input.data)}
 return validateHealthData({...input,catalog:input.catalog??[],plans:input.plans??{}});
}
export const makeBackup=(data:HealthData):HealthBackup=>({format:"qingheng-backup",version:2,exportedAt:new Date().toISOString(),data});
type Collection="entries"|"catalog"|"plans";
export type Change={collection:Collection;id:string;before:unknown;after:unknown};
export type HealthPatch={changes:Change[];settings:{key:"goal"|"calGoal"|"weightPlan"|"profile";before:unknown;after:unknown}[]};
function asMap(data:HealthData,key:Collection):Map<string,unknown>{return new Map<string,unknown>(key==="plans"?Object.entries(data.plans):data[key].map(i=>[i.id,i]))}
export function diffData(before:HealthData,after:HealthData):HealthPatch {
 const changes:Change[]=[];for(const collection of ["entries","catalog","plans"] as const){const a=asMap(before,collection),b=asMap(after,collection);for(const id of new Set([...a.keys(),...b.keys()]))if(!equal(a.get(id),b.get(id)))changes.push({collection,id,before:a.get(id)??null,after:b.get(id)??null})}
 return {changes,settings:(["goal","calGoal","weightPlan","profile"] as const).filter(key=>!equal(before[key]??null,after[key]??null)).map(key=>({key,before:before[key]??null,after:after[key]??null}))};
}
export const hasChanges=(patch:HealthPatch)=>!!(patch.changes.length||patch.settings.length);
export class DataConflict extends Error {constructor(){super("同一条记录已在另一页面修改，本页修改尚未保存。请先导出本页备份，再选择采用数据库版本。");this.name="DataConflict"}}
export function applyPatch(current:HealthData,patch:HealthPatch,check=true):HealthData {
 if(!object(patch)||!Array.isArray(patch.changes)||!Array.isArray(patch.settings)||patch.changes.length>120000)throw new Error("修改请求无效");
 const next=structuredClone(current),seen=new Set<string>();
 for(const c of patch.changes){if(!["entries","catalog","plans"].includes(c.collection)||typeof c.id!=="string"||seen.has(`${c.collection}:${c.id}`))throw new Error("修改项目无效");seen.add(`${c.collection}:${c.id}`);const map=asMap(next,c.collection),existing=map.get(c.id)??null;if(check&&!equal(existing,c.before)&&!equal(existing,c.after))throw new DataConflict();if(c.after===null)map.delete(c.id);else {if(c.collection!=="plans"&&(!object(c.after)||c.after.id!==c.id))throw new Error("修改 ID 不一致");map.set(c.id,c.after)}if(c.collection==="plans")next.plans=Object.fromEntries(map) as HealthData["plans"];else if(c.collection==="entries")next.entries=[...map.values()] as HealthEntry[];else next.catalog=[...map.values()] as FoodNutrition[]}
 for(const s of patch.settings){if(!["goal","calGoal","weightPlan","profile"].includes(s.key))throw new Error("设置项目无效");if(check&&!equal(next[s.key]??null,s.before)&&!equal(next[s.key]??null,s.after))throw new DataConflict();if(s.key==="profile"){if(s.after===null)delete next.profile;else next.profile=s.after as EnergyProfile}else if(s.key==="weightPlan"){if(s.after===null)delete next.weightPlan;else next.weightPlan=s.after as WeightPlan}else next[s.key]=s.after as number}
 return validateHealthData(next);
}
export function mergeMissing(current:HealthData,incoming:HealthData):{data:HealthData;conflicts:number;added:number}{
 const data=structuredClone(current);let conflicts=0,added=0;
 for(const collection of ["entries","catalog","plans"] as const){const a=asMap(data,collection),b=asMap(incoming,collection);for(const [id,v] of b){if(!a.has(id)){a.set(id,v);added++}else if(!equal(a.get(id),v))conflicts++}if(collection==="plans")data.plans=Object.fromEntries(a) as HealthData["plans"];else if(collection==="entries")data.entries=[...a.values()] as HealthEntry[];else data.catalog=[...a.values()] as FoodNutrition[]}
 return{data:validateHealthData(data),conflicts,added};
}
