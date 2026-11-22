import type {FoodNutrition} from './foodNutrition';
import type {FoodSearchQuery} from './foodSearch';
import {commonFoodReferences} from './commonFoodReferences.ts';
export type LookupProduct={id:string;name:string;url:string;imageUrl?:string|null;nutrition?:FoodNutrition|null};
export type GenericFoodDraft={name:string;description:string;unit:'g'|'mL'};
export type FoodLookupResult=
 |{kind:'saved';foods:FoodNutrition[];query?:FoodSearchQuery;notice:string}
 |{kind:'products';products:LookupProduct[];query:FoodSearchQuery;notice:string}
 |{kind:'product';food:FoodNutrition;query:FoodSearchQuery}
 |{kind:'generic';foods:FoodNutrition[];drafts:GenericFoodDraft[];query?:FoodSearchQuery;notice:string};
export type LookupServices={
 local:(input:string)=>FoodNutrition[];
 resolve:(input:string)=>Promise<FoodSearchQuery>;
 search:(english:string)=>Promise<{product?:FoodNutrition;products?:LookupProduct[]}>;
 match:(input:string,products:LookupProduct[])=>Promise<string[]>;
 estimate:(query:FoodSearchQuery)=>Promise<FoodNutrition>;
 stage?:(stage:'translate'|'search'|'match'|'generic')=>void;
 signal?:AbortSignal;
};
export function genericFoodDrafts(input:string,query?:FoodSearchQuery):GenericFoodDraft[]{
 const name=query?.genericName||input.trim(),text=`${input} ${query?.englishQuery||''}`;
 if(/hot\s*chocolate|热巧克力|熱巧克力/i.test(text)&&!/powder|粉/i.test(input))return[
  {name:'热巧克力饮品（冲调后）',unit:'mL',description:'通用热巧克力饮品，每100mL冲调后成品；配方未说明，请核对用水或牛奶、糖及奶量。不是干粉标签。'},
  {name:'热巧克力粉（干粉）',unit:'g',description:'通用热巧克力冲调粉，每100g干粉；不含冲调时添加的牛奶或水。糖及可可比例未说明，请核对。'},
 ];
 return[{name,unit:query?.unit||'g',description:query?.description||'通用食品建议，尚未生成营养数值。请先核对食品形态、做法和称重状态。'}];
}
/** Network failures must never make an already saved food unusable or invent nutrition. */
export async function lookupFood(input:string,services:LookupServices,forceOnline=false):Promise<FoodLookupResult>{
 const check=()=>services.signal?.throwIfAborted();
 check();const initial=services.local(input);
 if(initial.length&&!forceOnline)return{kind:'saved',foods:initial,notice:`找到 ${initial.length} 项已保存商品，可直接使用；查询其他品牌或更新标签时再联网。`};
 let query:FoodSearchQuery;
 try{services.stage?.('translate');query=await services.resolve(input);check();if(!query||typeof query.isFood!=='boolean'||(query.isFood&&(!query.englishQuery||!query.genericName)))throw new Error('未取得有效食物名称')}catch{check();if(initial.length)return{kind:'saved',foods:initial,notice:'联网识别暂不可用，已保存的标签仍可直接使用。'};const known=commonFoodReferences(input);return{kind:'generic',foods:known,drafts:known.length?[]:genericFoodDrafts(input),notice:'暂未完成联网识别。可选择下方通用食品建议，核对后再预览营养。'};}
 if(!query.isFood)throw new Error('暂未识别成具体食物，请补充名称、品种或品牌。');
 const local=initial.length?initial:services.local(query.englishQuery);
 if(local.length&&!forceOnline)return{kind:'saved',foods:local,query,notice:`找到 ${local.length} 项已保存商品，可直接使用；无需重新读取官网标签。`};
 async function fallback(reason:string):Promise<FoodLookupResult>{
  check();if(local.length)return{kind:'saved',foods:local,query,notice:`${reason}；已保存的标签仍可直接使用。`};
  services.stage?.('generic');const known=commonFoodReferences(query.englishQuery);
  if(known.length)return{kind:'generic',query,foods:known,drafts:[],notice:`${reason}，以下为通用食品参考，非品牌标签。`};
  // Ambiguous drinks need a form choice before generating any numerical estimate.
  const drafts=genericFoodDrafts(input,query);if(drafts.length>1)return{kind:'generic',query,foods:[],drafts,notice:`${reason}。请选择饮品或干粉，再生成通用预览。`};
  try{const food=await services.estimate(query);check();if(!food||!food.name||!['g','mL'].includes(food.unit)||!['energyKcal','protein','carbs','fat'].every(key=>Number.isFinite(food[key as keyof Pick<FoodNutrition,'energyKcal'|'protein'|'carbs'|'fat'>])&&Number(food[key as keyof Pick<FoodNutrition,'energyKcal'|'protein'|'carbs'|'fat'>])>=0&&Number(food[key as keyof Pick<FoodNutrition,'energyKcal'|'protein'|'carbs'|'fat'>])<=(key==='energyKcal'?1000:100)))throw new Error('未取得完整营养');return{kind:'generic',query,foods:[food],drafts:[],notice:`${reason}，以下为通用估算，确认后才会添加。`}}catch{check();return{kind:'generic',query,foods:[],drafts,notice:`${reason}，通用估算服务也暂未响应。食品建议已保留，可补充信息后重试或手动填写标签。`};}
 }
 let found:{product?:FoodNutrition;products?:LookupProduct[]};
 try{services.stage?.('search');found=await services.search(query.englishQuery);check()}catch{check();return fallback('Woolworths 暂未响应，未能取得新商品结果')}
 if(found.product)return{kind:'product',food:found.product,query};
 const candidates=(found.products||[]).slice(0,12);if(!candidates.length)return fallback('Woolworths 未找到相符商品');
 let ids:string[];try{services.stage?.('match');ids=await services.match(input,candidates);check()}catch{check();return fallback('暂未完成候选商品核对')}
 const allowed=new Set(ids),matches=candidates.filter(p=>allowed.has(p.id));if(!matches.length)return fallback('Woolworths 未找到相符商品');
 return{kind:'products',products:matches,query,notice:`已按英文关键词「${query.englishQuery}」查询并核对商品类型，请选择实际购买的品种。`};
}

/** Existing labels may have been imported from a prepared-drink column. Never silently rescale them. */
export function foodLabelBasisNote(food:FoodNutrition):string|null{
 if(food.unit==='g'&&/powder|粉/i.test(food.name)&&/hot\s*chocolate|cocoa|巧克力|可可/i.test(food.name)&&food.energyKcal<100)return `这是一款干粉商品，但已保存值为每100g ${Number(food.energyKcal.toFixed(1))} 千卡，可能取自冲调后的饮品列。请打开原始来源，核对每100g干粉与每100mL饮品的表头；系统保留原值，不会自动换算。`;
 return null;
}
