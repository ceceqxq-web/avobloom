import {meatArt} from './meatVisual.ts';
import {marketDepartment,type MarketDepartment} from './gardenCategories.ts';
export type FoodArtwork={cell:number;atlas:number;src?:string};
function plantArtwork(name:string):FoodArtwork|null{
 if(/果酱|\bjam\b|marmalade|fruit preserve/i.test(name))return {cell:9,atlas:4};
 if(/黑芝麻|black\s*sesame/i.test(name)&&!/粉|糊|酱|糕|饼|paste|powder|flour|drink|soup|cake|cookie|biscuit/i.test(name))return {cell:0,atlas:0,src:'/brand/watercolor-black-sesame-v1.webp'};
 if(/南瓜|pumpkin|kabocha|butternut/i.test(name)&&!/南瓜子|pumpkin.*seed|seed.*pumpkin/i.test(name))return {cell:0,atlas:0,src:'/brand/watercolor-pumpkin-v1.png'};
 if(/corn chips|doritos|玉米片/i.test(name))return {cell:9,atlas:2};
 if(/cracker|cookie|饼干|曲奇/i.test(name))return /cookie|曲奇/i.test(name)?{cell:15,atlas:4}:{cell:15,atlas:1};
 const extra:[RegExp,number][]=[
  [/ricotta|cottage cheese|茅屋奶酪|瑞可塔|乳清干酪/i,0],
  [/cheese|奶酪|芝士|干酪/i,1],[/chickpea|鹰嘴豆/i,2],
  [/bean\s*sprout|豆芽/i,3],[/wheat\s*bran|麦麸|麸皮/i,4],
  [/spiral|fusilli|螺旋|意大利面/i,5],[/flour|面粉/i,6],
  [/kidney\s*bean|white\s*bean|lentil|扁豆|红腰豆|白芸豆/i,7],
  [/草莓|strawberr/i,8],[/葡萄|grape/i,9],[/cabbage|卷心菜|包菜/i,10],
  [/cashew|腰果/i,11],[/honey|蜂蜜/i,13],[/green\s*pea|青豆|豌豆/i,14],
  [/couscous|古斯米|库斯库斯/i,15]
 ];
 for(const [pattern,cell] of extra)if(pattern.test(name))return {cell,atlas:5};
 const pantry:[RegExp,number][]=[
  [/椰子水|coconut.*water|h2coco/i,4],[/芒果|mango/i,0],
  [/花生酱|peanut butter/i,1],[/花生|peanut|beer nut/i,1],[/核桃|walnut/i,2],
  [/橄榄油|食用油|olive oil|^oil$|^油脂$/i,3],[/混合.*坚果|mixed nut|nut.*mix|坚果与油脂/i,5],
  [/黄油|^butter$/i,6],[/奇亚|chia/i,7],[/牛油果|avocado/i,8],[/果酱|jam/i,9],
  [/鱼罐头|金枪鱼|canned.*fish|tuna/i,10],[/蛋白粉|乳清|whey|protein powder/i,11],
  [/茄子|eggplant|aubergine/i,12],[/黄瓜|cucumber/i,13],[/年糕|nian.?gao/i,14],[/曲奇|cookie/i,15]
 ];
 for(const [pattern,cell] of pantry)if(pattern.test(name))return {cell,atlas:4};
 const supplemental: [RegExp,number][]=[
  [/粉|powder|whey/i,2],[/酸奶|yog[hu]*urt/i,3],
  [/粥|燕麦|porridge|oat/i,0],[/rice cake|corn chips|doritos/i,9],
  [/饺|包子|dumpling/i,5],[/玉米|corn cob/i,6],[/tortilla|wrap|面饼/i,7],
  [/土豆|马铃薯|potato/i,8],[/面条|意面|noodle|pasta/i,4],
  [/大米|生米|uncooked rice|rice.*raw/i,1],[/茶|咖啡|tea|coffee|饮品/i,11],
  [/蘑菇|木耳|mushroom/i,12],[/菠菜|白菜|生菜|spinach|lettuce/i,13],
  [/橙|桔|orange/i,14],[/莓|berr/i,15]
 ];
 for(const [pattern,cell] of supplemental)if(pattern.test(name))return {cell,atlas:2};
 const original: [RegExp,number][]=[
  [/鸡蛋|egg|蛋奶/i,0],[/鸡|chicken|肉类/i,1],[/牛肉|beef|steak/i,2],
  [/鱼|虾|海鲜|salmon|fish|prawn/i,3],[/米饭|糙米|熟米|rice|米面主食/i,4],
  [/牛奶|milk/i,5],[/豆腐|豆制品|tofu/i,6],[/西兰花|蔬菜|broccoli/i,7],
  [/胡萝卜|carrot/i,8],[/番茄|西红柿|tomato/i,9],[/苹果|水果|apple/i,10],
  [/梨|pear/i,11],[/香蕉|banana/i,12],[/杏仁|坚果|油|almond|nut|oil/i,13],
  [/面包|bread/i,14],[/饼干|零食|cracker|cookie/i,15]
 ];
 for(const [pattern,cell] of original)if(pattern.test(name))return {cell,atlas:1};
 if(name==='其他食物')return {cell:10,atlas:2};
 return null;
}

export function foodArtwork(name:string,fatPer100?:number|null):FoodArtwork|null{const meat=meatArt(name,fatPer100);return meat==null?plantArtwork(name):{cell:meat,atlas:3}}

/** Approximate category art is explicitly identified by the renderer. */
export function fallbackFoodArtwork(name:string,department?:MarketDepartment):FoodArtwork{
 const category=department??marketDepartment(name);
 const art:Partial<Record<MarketDepartment,FoodArtwork>>={
  蛋奶:{cell:5,atlas:1},豆制品:{cell:7,atlas:5},蔬菜:{cell:10,atlas:5},
  水果:{cell:10,atlas:1},米面主食:{cell:4,atlas:2},
  坚果与油脂:{cell:5,atlas:4},零食点心:{cell:15,atlas:1},饮品:{cell:11,atlas:2}
 };
 return art[category]??{cell:12,atlas:5};
}
