import {dailyEnergy} from "./dailyEnergy.ts";
import {foodCalories,type HealthEntry} from "./foodRecord.ts";
export type MealSlot="早餐"|"午餐"|"晚餐"|"加餐";
export type MealNutrition={calories:number;protein:number;carbs:number;fat:number};
type Food={id:string;name:string;unit:"g"|"mL";basis:string;role:"protein"|"grain"|"vegetable"|"fruit"|"dairy"|"fat";tags:string[];n:MealNutrition};
const food=(id:string,name:string,basis:string,role:Food["role"],calories:number,protein:number,carbs:number,fat:number,tags:string[]=[],unit:Food["unit"]="g"):Food=>({id,name,basis,role,tags,unit,n:{calories,protein,carbs,fat}});
// Generic food composition estimates per 100 g/mL. Every ingredient declares its weighing basis.
export const plannerFoods:Record<string,Food>={
 chickpeas:food("chickpeas","熟鹰嘴豆","熟制/罐装沥水重量；通用估算","protein",164,8.9,27.4,2.6),
 fungus:food("fungus","泡发熟木耳","充分泡发煮熟沥水重量；非干重，通用估算","vegetable",25,1.5,6,.1),
 mixedberries:food("mixedberries","无糖冷冻混合莓果","解冻可食重量；通用估算","fruit",50,.8,11,.4),
 fries:food("fries","冷冻薯条","冷冻未加额外油重量；品牌差异较大，通用估算","grain",160,2.5,25,5),
 jam:food("jam","普通果酱","含糖果酱即食重量；通用估算","fat",250,.3,65,.1),
 peanutbutter:food("peanutbutter","花生酱","即食重量；通用估算","fat",590,25,20,50,["nuts","peanut"]),
 chia:food("chia","奇亚籽","干重；通用估算","fat",486,16.5,42.1,30.7),
 wholeyogurt:food("wholeyogurt","原味全脂酸奶","无添加糖即食重量；通用估算","dairy",65,3.5,4.7,3.6,["dairy"]),
 rawrice:food("rawrice","大米（生重）","未煮干米重量；通用估算","grain",365,7.1,80,.7),
 milkpowder:food("milkpowder","全脂奶粉","干粉重量，非冲调后重量；通用估算","dairy",496,26,38,27,["dairy"]),
 crackers:food("crackers","普通饼干","普通原味薄脆饼干即食重量；非甜曲奇，通用估算","grain",430,8,70,13,["gluten"]),
 pear:food("pear","梨","去核可食重量；通用估算","fruit",57,.4,15.2,.1),
 cannedfish:food("cannedfish","水浸金枪鱼罐头","水浸沥水重量，非油浸或带酱；通用估算","protein",116,25.5,0,1,["seafood"]),
 firmtofu:food("firmtofu","老豆腐","沥水重量；通用估算","protein",100,10,3,5,["soy"]),

 oats:food("oats","原味燕麦片","干重","grain",379,13.15,67.7,6.52,["gluten"]),
 bread:food("bread","全麦面包","即食重量","grain",247,13,41,4.2,["gluten"]),
 rice:food("rice","熟糙米饭","熟重","grain",123,2.74,25.6,.97),
 quinoa:food("quinoa","熟藜麦","熟重","grain",120,4.4,21.3,1.92),
 pasta:food("pasta","熟全麦意面","煮熟沥水重量","grain",149,5.99,30.07,1.71,["gluten"]),
 potato:food("potato","水煮土豆","去皮熟重","grain",87,1.87,20.13,.1),
 yogurt:food("yogurt","原味脱脂希腊酸奶","即食重量","dairy",59,10.3,3.6,.4,["dairy"]),
 skyr:food("skyr","原味脱脂 Skyr 酸奶","即食重量","dairy",62,11,4,.2,["dairy"]),
 milk:food("milk","低脂牛奶","饮用体积","dairy",46,3.4,4.9,1.5,["dairy"],"mL"),
 soymilk:food("soymilk","无糖豆奶","饮用体积","protein",33,3.3,.6,1.8,["soy"],"mL"),
 tofu:food("tofu","原味硬豆腐","沥水重量","protein",144,17.3,2.8,8.7,["soy"]),
 egg:food("egg","水煮鸡蛋","去壳熟重","protein",155,12.58,1.12,10.61,["egg"]),
 white:food("white","熟鸡蛋蛋白","去蛋黄熟重","protein",52,10.9,.73,.17,["egg"]),
 chicken:food("chicken","去皮鸡胸肉","无额外用油的熟重","protein",165,31,0,3.6,["meat"]),
 beef:food("beef","瘦牛肉","无额外用油的熟重","protein",190,29,0,7.5,["meat","beef"]),
 cod:food("cod","清蒸鳕鱼","去骨熟重","protein",105,23,0,.9,["seafood"]),
 shrimp:food("shrimp","水煮虾仁","去壳熟重","protein",99,24,.2,.3,["seafood"]),
 salmon:food("salmon","三文鱼","无额外用油的熟重","protein",206,22,0,12.4,["seafood"]),
 broccoli:food("broccoli","清蒸西兰花","熟重","vegetable",35,2.38,7.18,.41),
 spinach:food("spinach","焯水菠菜","沥水熟重","vegetable",23,2.97,3.75,.26),
 carrot:food("carrot","清蒸胡萝卜","熟重","vegetable",35,.76,8.2,.18),
 tomato:food("tomato","番茄","可食部分生重","vegetable",18,.88,3.89,.2),
 orange:food("orange","橙子","去皮可食重量","fruit",47,.94,11.75,.12),
 blueberry:food("blueberry","蓝莓","可食部分生重","fruit",57,.74,14.49,.33),
 apple:food("apple","苹果","去核可食重量","fruit",52,.26,13.81,.17),
 banana:food("banana","香蕉","去皮可食重量","fruit",89,1.09,22.84,.33),
 almond:food("almond","无盐杏仁","去壳可食重量","fat",579,21.15,21.55,49.93,["nuts"]),
 walnut:food("walnut","无盐核桃仁","去壳可食重量","fat",654,15.23,13.71,65.21,["nuts"]),
 oil:food("oil","橄榄油","实际使用总量","fat",884,0,0,100),
};
type Recipe={id:string;title:string;slots:MealSlot[];items:[string,number][];steps:string[];minutes:number};
const breakfast:MealSlot[]=["早餐"],main:MealSlot[]=["午餐","晚餐"],snack:MealSlot[]=["加餐"];
export const plannerRecipes:Recipe[]=[
 {id:"oat-blue",title:"蓝莓酸奶燕麦碗",slots:breakfast,items:[["oats",35],["yogurt",170],["blueberry",80],["almond",8]],steps:["燕麦用少量水泡软或煮熟，放凉。","加入原味酸奶、蓝莓和切碎的杏仁；不额外加糖。"],minutes:8},
 {id:"oat-apple",title:"苹果 Skyr 燕麦碗",slots:breakfast,items:[["oats",35],["skyr",160],["apple",100],["walnut",6]],steps:["燕麦加水煮软，苹果去核切丁。","拌入原味 Skyr 和核桃仁，可按喜好撒少量肉桂粉。"],minutes:10},
 {id:"egg-toast",title:"鸡蛋全麦吐司配鲜橙",slots:breakfast,items:[["bread",55],["egg",50],["yogurt",120],["orange",100]],steps:["全麦面包烘热，搭配去壳水煮蛋。","酸奶和橙子单独食用；吐司不另抹黄油。"],minutes:12},
 {id:"tofu-toast",title:"豆腐蛋白全麦早餐盘",slots:breakfast,items:[["bread",60],["tofu",70],["white",100],["orange",100]],steps:["豆腐与熟蛋白切块，用不粘锅少量水加热。","搭配烘热的全麦面包和橙子，可加少量黑胡椒。"],minutes:15},
 {id:"soy-oats",title:"豆奶燕麦蛋白碗",slots:breakfast,items:[["oats",40],["soymilk",200],["white",100],["banana",60],["almond",6]],steps:["燕麦用无糖豆奶煮软。","熟蛋白单独食用，燕麦中加入香蕉片和杏仁。"],minutes:12},
 {id:"chicken-rice",title:"柠檬鸡胸糙米蔬菜碗",slots:main,items:[["chicken",100],["rice",140],["broccoli",160],["oil",5]],steps:["鸡胸肉用柠檬汁和黑胡椒调味，加热至熟透后按熟重称量。","配熟糙米和西兰花，表中橄榄油为整道菜总用油。"],minutes:20},
 {id:"beef-quinoa",title:"黑椒瘦牛肉藜麦碗",slots:main,items:[["beef",100],["quinoa",150],["carrot",150],["oil",3]],steps:["瘦牛肉用黑胡椒调味，熟后称重。","搭配熟藜麦和胡萝卜，使用表中总量的橄榄油。"],minutes:22},
 {id:"cod-potato",title:"清蒸鳕鱼土豆蔬菜盘",slots:main,items:[["cod",150],["potato",200],["broccoli",160],["oil",7]],steps:["鳕鱼清蒸至熟透，土豆煮熟去皮称重。","西兰花蒸熟，橄榄油用于拌蔬菜，少盐调味。"],minutes:22},
 {id:"shrimp-pasta",title:"番茄虾仁全麦意面",slots:main,items:[["shrimp",120],["pasta",145],["tomato",180],["oil",7]],steps:["全麦意面煮熟沥水称重，虾仁煮熟。","番茄炒软后加入虾仁和意面，表中油量为整份总量。"],minutes:20},
 {id:"tofu-rice",title:"豆腐蛋白糙米双蔬碗",slots:main,items:[["tofu",100],["white",140],["rice",150],["broccoli",150]],steps:["豆腐与熟蛋白切块，以少量水和黑胡椒加热。","搭配熟糙米及西兰花，不额外添加食用油。"],minutes:18},
 {id:"tofu-quinoa",title:"菠菜豆腐蛋白藜麦碗",slots:main,items:[["tofu",100],["white",140],["quinoa",160],["spinach",160]],steps:["菠菜焯水沥干，豆腐和蛋白切块加热。","搭配熟藜麦，少盐调味；不额外添加食用油。"],minutes:18},
 {id:"salmon-rice",title:"三文鱼蛋白糙米碗",slots:main,items:[["salmon",70],["white",130],["rice",145],["broccoli",160]],steps:["三文鱼不额外用油烤熟或煎熟，按熟重称量。","搭配熟蛋白、糙米及西兰花，挤少量柠檬汁调味。"],minutes:20},
 {id:"chicken-quinoa",title:"鸡胸菠菜藜麦暖碗",slots:main,items:[["chicken",95],["quinoa",165],["spinach",160],["oil",4]],steps:["将熟鸡胸切片，菠菜焯水沥干。","与熟藜麦混合，按表中用量加入橄榄油调味。"],minutes:18},
 {id:"snack-orange",title:"原味酸奶鲜橙杏仁杯",slots:snack,items:[["yogurt",100],["orange",100],["almond",7]],steps:["橙子去皮切块，与酸奶和杏仁搭配食用。"],minutes:3},
 {id:"snack-blue",title:"蓝莓 Skyr 核桃杯",slots:snack,items:[["skyr",95],["blueberry",80],["walnut",6]],steps:["蓝莓洗净，拌入原味 Skyr，撒上核桃仁。"],minutes:3},
 {id:"snack-apple",title:"苹果酸奶杏仁杯",slots:snack,items:[["yogurt",100],["apple",90],["almond",7]],steps:["苹果去核切块，与原味酸奶和杏仁一起食用。"],minutes:3},
 {id:"snack-soy",title:"无糖豆奶配香蕉杏仁",slots:snack,items:[["soymilk",180],["banana",70],["almond",5]],steps:["无糖豆奶配去皮香蕉和无盐杏仁，不额外加糖。"],minutes:3},
];
export type PlannerPreferences={vegetarian:boolean;exclude:string[];snack:boolean;availableFoodIds?:string[];allowSupplement?:boolean};
export type PlannedIngredient={foodId:string;amount:number};
export type PlannedMeal={slot:MealSlot;recipeId:string;title:string;items:PlannedIngredient[];nutrition:MealNutrition;target:MealNutrition;history:string[];steps:string[];minutes:number};
export type MealPlan={id:string;targetCalories:number;preferences:PlannerPreferences;meals:PlannedMeal[];remaining?:{target:MealNutrition;recorded:MealNutrition;signature:string;exerciseKcal?:number}};
const zero=():MealNutrition=>({calories:0,protein:0,carbs:0,fat:0});
export function ingredientNutrition(item:PlannedIngredient):MealNutrition{const n=plannerFoods[item.foodId].n;return{calories:n.calories*item.amount/100,protein:n.protein*item.amount/100,carbs:n.carbs*item.amount/100,fat:n.fat*item.amount/100}}
export function mealNutrition(items:PlannedIngredient[]):MealNutrition{return items.reduce((s,item)=>{const n=ingredientNutrition(item);return{calories:s.calories+n.calories,protein:s.protein+n.protein,carbs:s.carbs+n.carbs,fat:s.fat+n.fat}},zero())}
export function planNutrition(plan:MealPlan):MealNutrition{return plan.meals.reduce((s,m)=>({calories:s.calories+m.nutrition.calories,protein:s.protein+m.nutrition.protein,carbs:s.carbs+m.nutrition.carbs,fat:s.fat+m.nutrition.fat}),zero())}
function eligible(recipe:Recipe,prefs:PlannerPreferences){return recipe.items.every(([id])=>(!prefs.availableFoodIds?.length||prefs.allowSupplement||prefs.availableFoodIds.includes(id))&&!plannerFoods[id].tags.some(tag=>prefs.exclude.includes(tag)||(prefs.vegetarian&&(tag==="meat"||tag==="seafood"))))}
const roundAmount=(n:number)=>Math.round(n*10)/10;
function scaled(recipe:Recipe,calories:number):PlannedIngredient[]{const base=mealNutrition(recipe.items.map(([foodId,amount])=>({foodId,amount}))).calories;return recipe.items.map(([foodId,amount])=>({foodId,amount:roundAmount(amount*calories/base)}))}
function makeMeal(recipe:Recipe,slot:MealSlot,items:PlannedIngredient[],target?:MealNutrition,history:string[]=[]):PlannedMeal{const nutrition=mealNutrition(items);return{slot,recipeId:recipe.id,title:recipe.title,items,nutrition,target:target||nutrition,history:[...history,recipe.id],steps:recipe.steps,minutes:recipe.minutes}}
export function generateMealPlan(targetCalories:number,prefs:PlannerPreferences,seed:number,id:string):MealPlan{
 if(!Number.isFinite(targetCalories)||targetCalories<600||targetCalories>4000)throw new Error("请输入 600–4000 千卡的食谱预算（这是生成器范围，并非摄入建议）。");
 const shares:[MealSlot,number][]=prefs.snack?[["早餐",.25],["午餐",.35],["晚餐",.3],["加餐",.1]]:[["早餐",.3],["午餐",.4],["晚餐",.3]];
 const used=new Set<string>();
 const meals=shares.map(([slot,share],i)=>{const candidates=recipePool(prefs).filter(r=>r.slots.includes(slot)&&eligible(r,prefs));if(!candidates.length)throw new Error(`${slot}没有符合当前排除条件的方案，请减少排除条件。`);const bestMatch=Math.max(...candidates.map(r=>pantryMatch(r,prefs)));const matched=prefs.availableFoodIds?.length?candidates.filter(r=>pantryMatch(r,prefs)===bestMatch):candidates;const unused=matched.filter(r=>!used.has(r.id));const pool=unused.length?unused:matched;const recipe=pool[Math.abs(Math.floor(seed+i*37))%pool.length];used.add(recipe.id);return makeMeal(recipe,slot,scaled(recipe,targetCalories*share))});
 return{id,targetCalories,preferences:{...prefs,exclude:[...prefs.exclude]},meals};
}
export const replacementTolerance={calories:(n:number)=>Math.max(3,n*.02),protein:(n:number)=>Math.max(2,n*.1),carbs:(n:number)=>Math.max(3,n*.1),fat:(n:number)=>Math.max(1.5,n*.15)};
export function isEquivalent(a:MealNutrition,b:MealNutrition){return(Object.keys(replacementTolerance) as (keyof MealNutrition)[]).every(key=>Math.abs(a[key]-b[key])<=replacementTolerance[key](b[key]))}
export function practicalMinimum(foodId:string,slot:MealSlot):number{
 if(slot!=="午餐"&&slot!=="晚餐")return .1;
 const food=plannerFoods[foodId];
 if(food.tags.includes("meat"))return 80;
 if(food.tags.includes("seafood"))return foodId==="salmon"?70:100;
 if(["tofu","firmtofu","chickpeas"].includes(foodId))return 80;
 if(foodId==="white")return 50;
 if(food.role==="vegetable")return 80;
 if(foodId==="rawrice")return 15;
 if(food.role==="grain")return 40;
 return .1;
}
function fitRecipe(recipe:Recipe,target:MealNutrition,practicalSlot?:MealSlot):PlannedIngredient[]{
 const initial=scaled(recipe,target.calories),amounts=initial.map(i=>i.amount);
 const keys:(keyof MealNutrition)[]=["calories","protein","carbs","fat"];
 const tolerance=keys.map(k=>replacementTolerance[k](target[k])*(k==="calories"?.35:1));
 const minimum=amounts.map((a,i)=>Math.max(practicalSlot?practicalMinimum(initial[i].foodId,practicalSlot):0,plannerFoods[initial[i].foodId].role==="vegetable"?a*.65:a*.2));
 const maximum=amounts.map((a,i)=>Math.max(minimum[i],plannerFoods[initial[i].foodId].role==="vegetable"?a*1.7:a*2.8));
 for(let i=0;i<amounts.length;i++)amounts[i]=Math.max(minimum[i],amounts[i]);
 // Bounded coordinate least-squares keeps recognisable portions while matching energy and macros.
 for(let pass=0;pass<180;pass++)for(let i=0;i<amounts.length;i++){
  const current=mealNutrition(initial.map((item,index)=>({...item,amount:amounts[index]}))),n=plannerFoods[initial[i].foodId].n;
  let numerator=0,denominator=.00015;
  for(let k=0;k<keys.length;k++){const key=keys[k],coef=n[key]/100/tolerance[k];numerator+=coef*(current[key]-target[key])/tolerance[k];denominator+=coef*coef}
  const anchor=.00015*(amounts[i]-initial[i].amount);amounts[i]=Math.max(minimum[i],Math.min(maximum[i],amounts[i]-(numerator+anchor)/denominator));
 }
 return initial.map((item,index)=>({...item,amount:roundAmount(amounts[index])}));
}
export function mealReplacements(plan:MealPlan,slot:MealSlot):PlannedMeal[]{
 const current=plan.meals.find(m=>m.slot===slot);if(!current)return[];
 return recipePool(plan.preferences).filter(r=>r.slots.includes(slot)&&r.id!==current.recipeId&&eligible(r,plan.preferences)).map(r=>makeMeal(r,slot,fitRecipe(r,current.target,plan.remaining?slot:undefined),current.target,current.history)).filter(m=>isEquivalent(m.nutrition,current.target)).sort((a,b)=>{
  const seenA=current.history.includes(a.recipeId)?1:0,seenB=current.history.includes(b.recipeId)?1:0;
  const usedA=plan.meals.some(m=>m.slot!==slot&&m.recipeId===a.recipeId)?1:0,usedB=plan.meals.some(m=>m.slot!==slot&&m.recipeId===b.recipeId)?1:0;
  return seenA-seenB||usedA-usedB||Math.abs(a.nutrition.calories-current.target.calories)-Math.abs(b.nutrition.calories-current.target.calories);
 });
}
export function replacePlanMeal(plan:MealPlan,slot:MealSlot):MealPlan{const replacement=mealReplacements(plan,slot)[0];if(!replacement)throw new Error("当前条件下没有足够接近的替换方案，原菜品已保留。可调整食材偏好后重新生成。");return{...plan,meals:plan.meals.map(m=>m.slot===slot?replacement:m)}}
export const mealImportKey=(plan:MealPlan,slot:MealSlot)=>`${plan.id}:${slot}`;
export function buildMealPlanImport(plan:MealPlan,slots:MealSlot[],date:string,existing:HealthEntry[],idFactory:()=>string,time:string):HealthEntry[]{
 const imported=new Set(existing.filter(e=>e.date===date&&e.planImportKey).map(e=>e.planImportKey));
 return plan.meals.filter(m=>slots.includes(m.slot)&&!imported.has(mealImportKey(plan,m.slot))).flatMap(meal=>meal.items.map(item=>{const f=plannerFoods[item.foodId],n=ingredientNutrition(item);return{id:idFactory(),date,type:"food",time,name:f.name,amount:item.amount,amountUnit:f.unit,energyKcal:n.calories,protein:n.protein,carbs:n.carbs,fat:n.fat,meal:meal.slot,foodCategory:f.role==="fat"?"moderate" as const:"healthy" as const,recordNote:`食谱规划估算：${meal.title}；${f.basis}；含表内用油，不含额外调料热量`,planImportKey:mealImportKey(plan,meal.slot),planId:plan.id}}));
}

export function remainingNutrition(daily:number,entries:HealthEntry[],date:string){
 const rows=entries.filter(e=>e.type==="food"&&e.date===date);
 const recorded=rows.reduce((sum,e)=>({calories:sum.calories+(foodCalories(e)??0),protein:sum.protein+(e.protein??0),carbs:sum.carbs+(e.carbs??0),fat:sum.fat+(e.fat??0)}),zero());
 const energy=dailyEnergy(entries,date,daily);
 const target={calories:energy.remaining,protein:Math.max(0,daily*.2/4-recorded.protein),carbs:Math.max(0,daily*.5/4-recorded.carbs),fat:Math.max(0,daily*.3/9-recorded.fat)};
 return{recorded,target,exerciseKcal:energy.burn,unknownExercise:energy.unknownExercise,unknown:rows.some(e=>foodCalories(e)==null||e.protein==null||e.carbs==null||e.fat==null),signature:JSON.stringify(entries.filter(e=>e.date===date&&(e.type==="food"||e.type==="exercise")).map(e=>[e.id,e.type,e.amount,e.meal,e.type==="food"?foodCalories(e):e.energyKcal,e.protein,e.carbs,e.fat]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))))};
}
export function generateRemainingMealPlan(daily:number,prefs:PlannerPreferences,seed:number,id:string,entries:HealthEntry[],date:string,slots:MealSlot[]):MealPlan{
 if(!Number.isFinite(daily)||daily<600||daily>4000)throw new Error("请输入600–4000千卡的每日预算。");
 const remaining=remainingNutrition(daily,entries,date),chosen=[...new Set(slots)];
 if(!chosen.length)throw new Error("请选择需要安排的餐次。");
 if(remaining.target.calories<=0)throw new Error("已知摄入已达到预算，不再自动追加菜单。无需为了数字跳餐，可按饥饿与实际需要调整预算。");
 if(remaining.target.calories/chosen.length<50)throw new Error("剩余额度较小，请减少安排餐次或调整预算，不将其拆成多份微量餐。");
 const share:Record<MealSlot,number>={早餐:.25,午餐:.35,晚餐:.3,加餐:.1},sum=chosen.reduce((s,k)=>s+share[k],0);
 const used=new Set<string>();
 const meals=chosen.map((slot,index)=>{
  const fraction=share[slot]/sum,target={calories:remaining.target.calories*fraction,protein:remaining.target.protein*fraction,carbs:remaining.target.carbs*fraction,fat:remaining.target.fat*fraction};
  const candidates=recipePool(prefs).filter(r=>r.slots.includes(slot)&&eligible(r,prefs));
  if(!candidates.length)throw new Error(`${slot}没有符合偏好的菜品，请调整排除条件。`);
  const ranked=candidates.map(recipe=>{
   const fitted=fitRecipe(recipe,target,slot);
   const floors=fitted.map(item=>({foodId:item.foodId,amount:practicalMinimum(item.foodId,slot)}));
   const floorEnergy=mealNutrition(floors).calories;
   if(floorEnergy>target.calories)return null;
   // Keep main ingredients above practical portions; only rescale the adjustable remainder.
   const slackEnergy=mealNutrition(fitted).calories-floorEnergy;
   const ratio=slackEnergy>0?(target.calories-floorEnergy)/slackEnergy:0;
   const items=fitted.map((item,i)=>({...item,amount:Math.max(floors[i].amount,roundAmount(floors[i].amount+(item.amount-floors[i].amount)*ratio))}));
   const n=mealNutrition(items),score=["protein","carbs","fat"].reduce((s,k)=>{const key=k as "protein"|"carbs"|"fat";return s+((n[key]-target[key])/Math.max(3,target[key]))**2},0)+(used.has(recipe.id)?.15:0)+(prefs.availableFoodIds?.length?(1-pantryMatch(recipe,prefs))*2:0);
   return{recipe,items,score};
  }).filter((candidate):candidate is NonNullable<typeof candidate>=>candidate!==null).sort((a,b)=>a.score-b.score);
  if(!ranked.length)throw new Error(`${slot}的额度不足以安排实际主菜份量，请减少餐次或调整分配，不生成微量肉鱼。`);
  const unused=ranked.filter(r=>!used.has(r.recipe.id)),pool=unused.length?unused:ranked;
  const best=pool[0],near=pool.filter(r=>r.score<=best.score+.04),pick=near[Math.abs(seed+index*37)%near.length];used.add(pick.recipe.id);
  return makeMeal(pick.recipe,slot,pick.items);
 });
 return{id,targetCalories:daily,preferences:{...prefs,exclude:[...prefs.exclude]},meals,remaining:{target:remaining.target,recorded:remaining.recorded,signature:remaining.signature,exerciseKcal:remaining.exerciseKcal}};
}

const pantryAliases:Record<string,string>={鹰嘴豆:"chickpeas",木耳:"fungus",黑木耳:"fungus","mixed berries冷冻":"mixedberries","mixed berries":"mixedberries",冷冻莓果:"mixedberries",冷冻混合莓果:"mixedberries",冷冻薯条:"fries",薯条:"fries",果酱:"jam",花生酱:"peanutbutter",奇亚籽:"chia",全脂酸奶:"wholeyogurt",大米:"rawrice",生大米:"rawrice",全脂奶粉:"milkpowder",饼干:"crackers",梨:"pear",鱼罐头:"cannedfish",老豆腐:"firmtofu",鸡胸肉:"chicken",鸡胸:"chicken",牛肉:"beef",鱼:"cod",鳕鱼:"cod",虾:"shrimp",虾仁:"shrimp",三文鱼:"salmon",豆腐:"tofu",鸡蛋:"egg",蛋白:"white",米饭:"rice",糙米:"rice",糙米饭:"rice",藜麦:"quinoa",意面:"pasta",土豆:"potato",燕麦:"oats",面包:"bread",牛奶:"milk",豆奶:"soymilk",酸奶:"yogurt",西兰花:"broccoli",菠菜:"spinach",胡萝卜:"carrot",番茄:"tomato",西红柿:"tomato",橙子:"orange",蓝莓:"blueberry",苹果:"apple",香蕉:"banana",杏仁:"almond",核桃:"walnut",橄榄油:"oil",油:"oil"};
export function parsePantryFoods(text:string){
 const ids:string[]=[],unknown:string[]=[];
 for(const token of text.split(/[,，、;；\n]+/).map(s=>s.trim()).filter(Boolean)){
 const normalized=token.toLowerCase(),id=pantryAliases[normalized]??Object.keys(plannerFoods).find(id=>id===normalized||plannerFoods[id].name===token);
 if(id){if(!ids.includes(id))ids.push(id)}else unknown.push(token);
 }return{ids,unknown};
}
function pantryMatch(recipe:Recipe,prefs:PlannerPreferences){return recipe.items.filter(([id])=>prefs.availableFoodIds?.includes(id)).length/recipe.items.length}
function recipePool(prefs:PlannerPreferences):Recipe[]{
 const ids=prefs.availableFoodIds??[];if(!ids.length)return plannerRecipes;
 const byRole=(role:Food["role"])=>ids.filter(id=>plannerFoods[id]?.role===role);
 const proteins=byRole("protein").filter(id=>plannerFoods[id].unit==="g"),grains=byRole("grain").filter(id=>id!=="crackers"),veg=byRole("vegetable");
 const custom:Recipe[]=[];
 for(const protein of proteins)for(const grain of grains)for(const vegetable of veg){
 const items:[string,number][]=[[protein,Math.max(100,practicalMinimum(protein,"午餐"))],[grain,["oats","rawrice"].includes(grain)?35:130],[vegetable,150]];
 if(ids.includes("oil"))items.push(["oil",4]);
 custom.push({id:`pantry-${items.map(([id])=>id).join("-")}`,title:`${plannerFoods[protein].name}配${plannerFoods[grain].name}与${plannerFoods[vegetable].name}`,slots:["午餐","晚餐"],items,steps:["按表中生熟口径称量。生米煮熟后食用；木耳按食品说明安全泡发并煮熟；肉、鱼、蛋充分熟透，罐头即食食材沥水后使用。","搭配表中主食食用。油仅使用清单列出的量，额外酱料需另记热量。"],minutes:20});
 }
 for(const dairy of byRole("dairy").filter(id=>id!=="milkpowder"))for(const fruit of byRole("fruit")){
 const items:[string,number][]=[[dairy,120],[fruit,100]];
 const topping=byRole("fat").find(id=>id!=="oil");if(topping)items.push([topping,5]);
 custom.push({id:`pantry-snack-${items.map(([id])=>id).join("-")}`,title:`${plannerFoods[dairy].name}配${plannerFoods[fruit].name}`,slots:["早餐","加餐"],items,steps:["水果清洗或按包装要求解冻处理，与乳品搭配。奇亚籽需充分浸泡后食用。","按表中分量使用配料，不另加糖或油。"],minutes:5});
 }
 return[...custom,...plannerRecipes];
}
