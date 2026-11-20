import {beefFatTier} from './meatVisual.ts';
import {foodCalories} from './foodRecord.ts';
import type {GardenFood} from './foodGarden';
import {marketDepartment} from './gardenCategories.ts';
export function withMarketServing(food:GardenFood,amount:number){
 if(!Number.isFinite(amount)||amount<0.1||amount>10000)throw new Error('每份分量请输入 0.1–10000 之间的数值');
 if(food.template?.weightUnknown)throw new Error('请先补全这项食物的重量和营养依据');
 return {...food.label,serving:{description:`1份 · ${amount}${food.label.unit}`,grams:food.label.unit==='g'?amount:null,millilitres:food.label.unit==='mL'?amount:null,quantity:1,quantityUnit:'份',quantitySource:'manual' as const}};
}
function commonReference(name:string):{amount:number;caption:string}|null{
 if(/生|raw|干米/.test(name)&&/米|rice/i.test(name))return {amount:50,caption:'1小份干米'};
 if(/鸡蛋|egg/i.test(name)&&!/粉|white|蛋白|raw|生/i.test(name))return {amount:50,caption:'约1个'};
 if(/米饭|糙米|熟米|rice/i.test(name)&&!/raw|生/i.test(name))return {amount:150,caption:'约1小碗'};
 if(/面包|bread/i.test(name))return {amount:30,caption:'约1片'};
 if(/燕麦|oats?/i.test(name))return {amount:40,caption:'约4汤匙干燕麦'};
 if(/牛奶|豆奶|milk/i.test(name)&&!/粉|powder/i.test(name))return {amount:250,caption:'1杯'};
 if(/酸奶|yogurt|skyr/i.test(name))return {amount:150,caption:'1小碗'};
 if(/豆腐|tofu/i.test(name))return {amount:120,caption:'1小份'};
 if(/肉|chicken|beef|鱼|fish|salmon|cod|shrimp|虾/i.test(name))return {amount:100,caption:'1掌心份量'};
 if(/杏仁|almond/i.test(name))return {amount:12,caption:'约10颗'};
 if(/花生|坚果|nuts?|peanut/i.test(name))return {amount:15,caption:'1小把'};
 if(/油|oil/i.test(name))return {amount:5,caption:'约1小勺'};
 if(/香蕉|banana/i.test(name))return {amount:100,caption:'约1小根可食部分'};
 if(/苹果|apple/i.test(name))return {amount:150,caption:'约1个可食部分'};
 if(/梨|pear/i.test(name))return {amount:180,caption:'约1个可食部分'};
 if(/橙|orange/i.test(name))return {amount:130,caption:'约1个可食部分'};
 if(/番茄|西红柿|tomato/i.test(name))return {amount:150,caption:'约1个'};
 if(/西兰花|菠菜|broccoli|spinach/i.test(name))return {amount:150,caption:'1小盘'};
 return null;
}
function identity(f:GardenFood){
 const product=f.label.sourceUrl?.match(/productdetails\/(\d+)/)?.[1];if(product)return 'product:'+product;
 const n=f.name.toLowerCase().replace(/[（(](?:通用估算|AI估算)[）)]/g,'').replace(/[^\p{L}\p{N}]/gu,'');
 const branded=/woolworth|macro|sunrice|coles|nobby/i.test(f.name)||f.label.source==='Woolworths';
 if(branded)return 'brand:'+n.replace(/\d+(?:kg|g|ml|l)$/,'');
 if(/^(水煮|煮|熟)?鸡蛋$/.test(n))return 'common:egg';
 if(/^(原味)?(硬|老)?豆腐$/.test(n))return 'common:tofu';
 return n;
}
export function prepareMarketFoods(input:GardenFood[]):GardenFood[]{
 const dedup=new Map<string,GardenFood>();
 for(const original of input){
  let f=original;const serving=f.label.serving,grams=f.label.unit==='mL'?serving?.millilitres:serving?.grams,reference=commonReference(f.name);
  // Incomplete historic quantities stay intact until the user supplies a weight.
  if(!f.template?.weightUnknown&&f.amount>0){
   const amount=grams&&grams>0?grams:reference?.amount??f.amount;
   const caption=grams?serving?.quantity?`${serving.quantity}${serving.quantityUnit||'个'}（每次点选）`:serving?.description||'标签1份':reference?.caption||f.caption;
   const ratio=amount/f.amount;
   const confirmed=serving?.quantitySource==='manual';
   const template=confirmed?undefined:f.template?{...f.template,amount,energyKcal:foodCalories(f.template)==null?null:foodCalories(f.template)!*ratio,protein:f.template.protein==null?null:f.template.protein*ratio,carbs:f.template.carbs==null?null:f.template.carbs*ratio,fat:f.template.fat==null?null:f.template.fat*ratio}:undefined;
   f={...f,amount,caption,template};
  }
  const key=identity(f),previous=dedup.get(key);
  const score=(v:GardenFood)=>(v.label.source==='Woolworths'?1000:0)+(v.frequency>0?100:0)+(v.label.pinned?20:0)+v.frequency;
  if(!previous)dedup.set(key,f);else {const winner=score(f)>score(previous)?f:previous;dedup.set(key,{...winner,frequency:f.frequency+previous.frequency,label:{...winner.label,marketDepartmentOverride:f.label.marketDepartmentOverride??previous.label.marketDepartmentOverride,hiddenInKitchen:!!(f.label.hiddenInKitchen||previous.label.hiddenInKitchen),pinned:!!(f.label.pinned||previous.label.pinned),dailyPick:!!(f.label.dailyPick||previous.label.dailyPick)}})}
 }
 return [...dedup.values()].sort((a,b)=>b.frequency-a.frequency||(b.template?.date||b.label.importedAt||'').localeCompare(a.template?.date||a.label.importedAt||'')||Number(!!b.label.pinned)-Number(!!a.label.pinned));
}
export function foodBadges(f:GardenFood):string[]{
 const e=f.template,p=e?e.protein:f.label.protein,c=e?e.carbs:f.label.carbs,fat=e?e.fat:f.label.fat;
 const parts=[{label:'蛋白',n:(p??0)*4},{label:'碳水',n:(c??0)*4},{label:'脂肪',n:(fat??0)*9}].sort((a,b)=>b.n-a.n);
 const badges=parts[0].n>0?[parts[0].label]:[];const zone=marketDepartment(f.name);
 if(['蛋奶','豆制品','肉类','海鲜'].includes(zone)&&(p??0)>0&&!badges.includes('蛋白'))badges.unshift('蛋白');
 if(zone==='蔬菜'||zone==='水果'){badges.push('纤维参考','维矿参考')}
 if(/坚果|杏仁|核桃|花生|奇亚|nuts?|almond|peanut|chia|seed/i.test(f.name))badges.push('纤维参考');
 const tier=beefFatTier(f.name,f.label.fat);if(tier)badges.push(tier==='lean'?'瘦肉 ≤10%脂肪':tier==='medium'?'中等肥 10–20%脂肪':'很肥 >20%脂肪');
 return badges;
}
export function marketPortionText(food:GardenFood,ratio:number){
 if(ratio===1)return food.caption;
 return food.caption.replace(/^(约?)(\d+(?:\.\d+)?)/,(_,approx:string,quantity:string)=>approx+Number((Number(quantity)*ratio).toFixed(2))).replace('（每次点选）','（已选合计）');
}
export function recordPortionText(entry:import('./foodRecord').HealthEntry){
 if(entry.weightUnknown)return entry.quantityText||'份量待补全';
 const unit=entry.amountUnit||'g',quantity=entry.quantityText&&!/份/.test(entry.quantityText)?entry.quantityText:null;
 if(quantity)return `${quantity} · ${Number(entry.amount.toFixed(1))}${unit}`;
 const label=entry.foodLabel,serving=label?.serving,base=unit==='mL'?serving?.millilitres:serving?.grams;
 if(base&&serving?.quantity)return `${Number((entry.amount/base*serving.quantity).toFixed(2))}${serving.quantityUnit||'个'} · ${Number(entry.amount.toFixed(1))}${unit}`;
 const reference=commonReference(entry.name);const caption=reference?.caption.replace(/^(约?)(\d+(?:\.\d+)?)/,(_,approx:string,n:string)=>approx+Number((Number(n)*entry.amount/reference.amount).toFixed(2)));
 return `${caption?caption+' · ':''}${Number(entry.amount.toFixed(1))}${unit}`;
}
