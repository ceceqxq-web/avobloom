import type { HealthEntry } from "./foodRecord";
export type FoodCategory="healthy"|"moderate"|"limit"|"unclassified";
export const foodCategories:Record<FoodCategory,{label:string;description:string;color:string}>={
 healthy:{label:"健康食物",description:"水果蔬菜、常见主食和优质蛋白等",color:"#5d9770"},
 moderate:{label:"适度摄入",description:"注意分量的坚果、普通饼干及调味食品等",color:"#c7a35b"},
 limit:{label:"减脂需少量",description:"甜点、糖果、油炸和含糖饮料等",color:"#cc8174"},
 unclassified:{label:"待分类",description:"食物信息不足，可在编辑中指定分类",color:"#b0b5a7"},
};
/** A local, editable food-type heuristic, not an official nutritional rating.
 * Reference: Australian Dietary Guidelines, five food groups and discretionary choices.
 * Energy density or a single macro alone never makes a food a 'limit' item.
 */
export function classifyFood(entry:Pick<HealthEntry,"name"|"foodCategory">):{category:FoodCategory;reason:string}{
 if(entry.foodCategory&&Object.hasOwn(foodCategories,entry.foodCategory))return{category:entry.foodCategory,reason:"已手动指定分类"};
 const n=entry.name.toLowerCase();
 if(/雪花酥|曲奇|巧克力|糖果|蛋糕|甜甜圈|冰淇淋|雪糕|奶茶|可乐|汽水|薯片|炸鸡|炸薯|油条|饼干夹心|夹心饼干|cookie|chocolate|confectionery|candy|cake|doughnut|donut|ice\s*cream|potato\s*chips|corn\s*chips|doritos|sugar.?sweetened|soft\s*drink|fried\s*chicken|french\s*fries/i.test(n))return{category:"limit",reason:"按甜点、含糖饮料或油炸零食类型识别，建议注意频率和分量"};
 if(/杏仁|坚果|核桃|花生|腰果|开心果|瓜子|芝麻|花生酱|果汁|果干|干果|饼干|crackers?|biscuits?|nuts?\b|almonds?|cashews?|peanuts?|walnuts?|pistachios?|nut\s*&\s*legume|juice|dried\s*fruit|butter|奶油|黄油|香肠|培根|bacon|sausage/i.test(n))return{category:"moderate",reason:"按坚果、普通饼干、果汁或调味食品识别；营养和分量需结合包装判断"};
 if(/橙子|鲜橙|芒果|苹果|香蕉|草莓|蓝莓|西瓜|猕猴桃|葡萄|番茄|西兰花|菠菜|生菜|黄瓜|胡萝卜|蔬菜|鸡蛋|水煮蛋|白煮蛋|鸡胸|瘦牛肉|瘦肉|豆腐|豆类|扁豆|鹰嘴豆|米饭|燕麦|糙米|全麦|玉米|土豆|红薯|牛奶|无糖酸奶|原味酸奶|oranges?|mango|apples?|banana|berries|broccoli|spinach|salad|vegetables?|eggs?|chicken\s*breast|lean\s*beef|tofu|lentils?|chickpeas?|plain\s*yog[hu]urt|unsweetened|oats?|brown\s*rice|milk|salmon|tuna|三文鱼|鱼肉/i.test(n))return{category:"healthy",reason:"按常见基础食物识别；具体烹调和配料可能改变分类"};
 return{category:"unclassified",reason:"名称不足以判断食物类型，请在编辑中选择分类"};
}
export function summarizeFoodCategories(entries:HealthEntry[],getCalories:(entry:HealthEntry)=>number|null){
 const keys:FoodCategory[]=["healthy","moderate","limit","unclassified"];
 const groups=keys.map(category=>({category,calories:0,count:0,missingCalories:0,percent:0}));
 let missingCalories=0;
 for(const entry of entries){if(entry.type!=="food")continue;const category=classifyFood(entry).category,group=groups.find(g=>g.category===category)!;group.count++;const energy=getCalories(entry);if(energy==null||!Number.isFinite(energy)||energy<0){group.missingCalories++;missingCalories++}else group.calories+=energy;}
 const total=groups.reduce((sum,g)=>sum+g.calories,0);
 if(total>0){
  // Largest-remainder rounding: displayed shares sum to exactly 100.0%, including unclassified energy.
  const shares=groups.map((g,index)=>{const raw=g.calories/total*1000;return{index,value:Math.floor(raw),fraction:raw-Math.floor(raw)}});
  let remainder=1000-shares.reduce((sum,g)=>sum+g.value,0);
  for(const share of [...shares].sort((a,b)=>b.fraction-a.fraction)){if(remainder<=0)break;share.value++;remainder--;}
  for(const share of shares)groups[share.index].percent=share.value/10;
 }
 return{groups,total,missingCalories};
}
