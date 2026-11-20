import type {HealthEntry} from './foodRecord';
import type {FoodNutrition} from './foodNutrition';
export function resolveFoodNutrition(entry:HealthEntry,food:FoodNutrition,amount:number):HealthEntry{
 if(!Number.isFinite(amount)||amount<=0||amount>10000)throw new Error('请确认食用重量/体积，大于0且不超过10000。');
 return{...entry,name:food.name,amount,amountUnit:food.unit,weightUnknown:false,foodLabel:food,energyKcal:food.energyKcal*amount/100,protein:food.protein*amount/100,carbs:food.carbs*amount/100,fat:food.fat*amount/100,portionBasis:undefined,portionSpec:undefined,portionMode:'weight',servings:null,labelPortionPending:false,portionEstimate:undefined,portionEdited:false,recordNote:`${entry.recordNote?entry.recordNote.replace(/暂无可靠热量，保存为待补全[；;]?/g,'').replace(/三大营养素暂无[；;]?/g,'')+'；':''}${food.source==="AI估算"?"AI动态估算（非商品标签）":food.source==="通用估算"?"估算：采用同类食物通用参考（非该商品标签）":"用户确认查询标签"}：${food.name}；${food.source}${food.sourceUrl?' '+food.sourceUrl:''}；${food.labelEvidence||""}；按每100${food.unit}换算本次${amount}${food.unit}`};
}
