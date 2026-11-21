export const gardenCategories=['肉蛋奶','蔬菜','水果','碳水','油脂'] as const;
export type GardenCategory=typeof gardenCategories[number];
export function gardenCategory(name:string):GardenCategory|null{
 if(/花生酱|坚果|杏仁|核桃|花生|奇亚|油|黄油|牛油果|nut|almond|peanut|chia|butter|avocado|oil/i.test(name))return '油脂';
 if(/蔬菜|生菜|西兰花|白菜|菠菜|木耳|胡萝卜|番茄|西红柿|茄子|黄瓜|蘑菇|菌|lettuce|broccoli|spinach|carrot|tomato|vegetable|mushroom/i.test(name))return '蔬菜';
 if(/芒果|梨|苹果|香蕉|橙|莓|葡萄|桃|西瓜|mango|pear|apple|banana|orange|berr|fruit|grape/i.test(name))return '水果';
 if(/鸡|蛋|牛肉|猪|排骨|五花|肉|鱼|虾|蚬|蛤|豆腐|奶|酸奶|豆|乳|egg|chicken|beef|meat|fish|salmon|cod|shrimp|tofu|milk|yogurt|skyr|bean/i.test(name))return '肉蛋奶';
 if(/米|饭|面|燕麦|藜麦|土豆|红薯|玉米|饼干|曲奇|年糕|rice|bread|oat|quinoa|potato|corn|cracker|cookie|pasta|cake/i.test(name))return '碳水';
 return null;
}

export function proteinFamily(name:string){
 if(/鸡蛋|鸭蛋|鹌鹑蛋|蛋白|egg/i.test(name))return '鸡蛋';
 if(/鱼|虾|蟹|贝|蚬|蛤|海鲜|basa|clam|cockle|fish|salmon|cod|shrimp|prawn|tuna|seafood|mussel|crab/i.test(name))return '鱼虾海鲜';
 if(/鸡|牛肉|猪|排骨|五花|羊|鸭|肉|chicken|beef|pork|lamb|duck|meat|turkey/i.test(name))return '肉类';
 if(/豆腐|豆奶|豆浆|豆|tofu|soy|bean|chickpea/i.test(name))return '豆制品';
 if(/奶|乳|酸奶|milk|yogurt|skyr|cheese|dairy/i.test(name))return '奶和酸奶';
 return '其他';
}
export function mealFoodPriority(name:string,meal:string){
 if(gardenCategory(name)!=='肉蛋奶')return 0;
 const order=meal==='早餐'?['鸡蛋','奶和酸奶','豆制品','肉类','鱼虾海鲜']:meal==='加餐'?['奶和酸奶','鸡蛋','豆制品','肉类','鱼虾海鲜']:['肉类','鱼虾海鲜','豆制品','鸡蛋','奶和酸奶'];
 const index=order.indexOf(proteinFamily(name));return index<0?order.length:index;
}

export const marketDepartments=['蛋奶','豆制品','肉类','海鲜','蔬菜','水果','米面主食','坚果与油脂','零食点心','饮品','其他食物'] as const;
export type MarketDepartment=typeof marketDepartments[number];
export function marketDepartment(name:string):MarketDepartment{
 if(/corn chips|doritos|玉米片/i.test(name))return '米面主食';
 if(/椰子水|coconut.*water|h2coco/i.test(name))return '饮品';
 if(/饼干|曲奇|雪花酥|巧克力|蛋糕|冰淇淋|cracker|cookie|chocolate|cake|ice cream/i.test(name))return '零食点心';
 if(/豆芽|bean\s*sprout/i.test(name))return '蔬菜';
 if(/奶酪|芝士|干酪|ricotta|cheese/i.test(name))return '蛋奶';
 if(/麦麸|麸皮|wheat\s*bran|couscous|fusilli|spiral/i.test(name))return '米面主食';
 if(/蛋白粉|乳清|奶粉|whey|protein powder|milk powder/i.test(name))return '蛋奶';
 if(/豆腐|豆奶|豆浆|豆|tofu|soy|bean|chickpea/i.test(name)&&!/豆油|soybean oil/i.test(name))return '豆制品';
 const c=gardenCategory(name);
 if(c==='蔬菜')return '蔬菜';if(c==='水果')return '水果';
 if(/鱼|虾|蟹|贝|蚬|蛤|海鲜|basa|clam|cockle|fish|salmon|cod|shrimp|prawn|tuna|seafood|mussel|crab/i.test(name))return '海鲜';
 if(c==='肉蛋奶'){const family=proteinFamily(name);return family==='鸡蛋'?'蛋奶':family==='奶和酸奶'?'蛋奶':family==='肉类'?'肉类':'其他食物'}
 if(c==='碳水')return '米面主食';
 if(/杏仁|核桃|花生|坚果|奇亚|nuts?|almond|peanut|chia|seed/i.test(name))return '坚果与油脂';
 if(c==='油脂'||/酱|调味|sauce|dressing/i.test(name))return '坚果与油脂';
 if(/茶|咖啡|果汁|饮料|汽水|coffee|tea|juice|drink|water/i.test(name))return '饮品';
 return '其他食物';
}
export function marketOrder(meal:string):readonly MarketDepartment[]{
 const lead:MarketDepartment[]=meal==='早餐'?['蛋奶','米面主食']:meal==='加餐'?['水果','蛋奶','坚果与油脂','零食点心']:['肉类','海鲜','豆制品'];
 return [...lead,...marketDepartments.filter(d=>!lead.includes(d))];
}

export function normalizeMarketDepartment(value:unknown):MarketDepartment|null{
 if(value==='鸡蛋'||value==='奶与酸奶')return '蛋奶';
 if(value==='坚果与籽'||value==='油与调味')return '坚果与油脂';
 return marketDepartments.includes(value as MarketDepartment)?value as MarketDepartment:null;
}
