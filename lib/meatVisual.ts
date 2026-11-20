/** Fat is grams per 100 g of food, not the percentage of calories from fat. */
export function beefFatTier(name:string,fatPer100?:number|null):'lean'|'medium'|'fatty'|null{
 if(!/牛肉|牛排|肥牛|beef|steak/i.test(name))return null;
 if(typeof fatPer100==='number'&&Number.isFinite(fatPer100)&&fatPer100>=0)return fatPer100<=10?'lean':fatPer100<=20?'medium':'fatty';
 const explicit=name.match(/(\d+(?:\.\d+)?)\s*%\s*(?:fat|脂肪)/i)||name.match(/(?:脂肪|fat)\s*(\d+(?:\.\d+)?)\s*%/i);
 if(explicit)return beefFatTier(name,Number(explicit[1]));
 if(/肥牛|fatty/i.test(name))return 'fatty';
 if(/瘦|lean/i.test(name))return 'lean';
 return null;
}
export function meatArt(name:string,fatPer100?:number|null):number|null{
 const tier=beefFatTier(name,fatPer100);if(tier)return tier==='lean'?0:tier==='medium'?1:2;
 if(/牛肉|牛排|beef|steak/i.test(name))return 0;
 if(/虾|shrimp|prawn/i.test(name))return 3;
 if(/蚬|蛤|clam|cockle/i.test(name))return 4;
 if(/巴沙|basa|pangasius/i.test(name))return 5;
 if(/鸡翅|chicken wing/i.test(name))return 6;
 if(/鸡腿|drumstick|chicken thigh/i.test(name))return 7;
 if(/整鸡|whole chicken/i.test(name))return 8;
 if(/猪里脊|pork.*(?:fillet|tenderloin)/i.test(name))return 9;
 if(/排骨|spare rib|pork rib/i.test(name))return 10;
 if(/五花|pork belly/i.test(name))return 11;
 return null;
}
