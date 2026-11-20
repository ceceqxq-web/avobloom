import { parseNutritionLabel, servingFromLabel, type FoodNutrition } from "./foodNutrition";
export type PhotoDraft = {
  name:string; unit:"g"|"mL"; energyKcal:string; protein:string; carbs:string; fat:string;
  servingDescription:string; quantity:string; quantityUnit:string; grams:string; millilitres:string; servingsPerPack:string;
  servingEnergyKcal:string; servingProtein:string; servingCarbs:string; servingFat:string;
};
const numberText=(n:number|null|undefined)=>n==null?"":String(Number(n.toFixed(3)));
export function photoDraftFromText(text:string, column:"first"|"last", fallbackName=""):PhotoDraft {
  let nutrition;
  try {nutrition=parseNutritionLabel(text,column)} catch {}
  const serving=servingFromLabel(text,column);
  const heading=text.split(/nutrition(?:al)?\s*(?:information|facts)|营养成分/i)[0];
  const name=heading.split(/\n/).map(s=>s.trim()).find(s=>s.length>=3&&s.length<=100&&!/\d|serv|per\b|每|energy|protein|fat|carbohydrate/i.test(s))||fallbackName;
  return {name,unit:serving.millilitres!=null?"mL":"g",energyKcal:numberText(nutrition?.energyKcal),protein:numberText(nutrition?.protein),carbs:numberText(nutrition?.carbs),fat:numberText(nutrition?.fat),servingDescription:serving.description||"",quantity:numberText(serving.quantity),quantityUnit:serving.quantityUnit||"",grams:numberText(serving.grams),millilitres:numberText(serving.millilitres),servingsPerPack:numberText(serving.servingsPerPack),servingEnergyKcal:numberText(serving.energyKcal),servingProtein:numberText(serving.protein),servingCarbs:numberText(serving.carbs),servingFat:numberText(serving.fat)};
}
export function foodFromPhotoDraft(draft:PhotoDraft,text:string,id:string):FoodNutrition {
  const read=(key:keyof PhotoDraft,required=false):number|null=>{
    const raw=draft[key].trim();
    if(!raw){if(required)throw new Error("请核对并填写每 100 g / mL 的完整热量与三大营养素。");return null;}
    const n=Number(raw);if(!Number.isFinite(n)||n<0)throw new Error("营养值和份量必须是非负数字。");return n;
  };
  if(!draft.name.trim())throw new Error("请填写商品名称。");
  const energyKcal=read("energyKcal",true)!,protein=read("protein",true)!,carbs=read("carbs",true)!,fat=read("fat",true)!;
  if(energyKcal>1000||[protein,carbs,fat].some(n=>n>100))throw new Error("每 100 g / mL 的数值超出范围，请检查识别的列和单位。");
  const quantity=read("quantity");
  if(quantity!=null&&(quantity<=0||!draft.quantityUnit.trim()))throw new Error("请填写每份个数对应的单位，例如 crackers / 片；不确定可留空个数。");
  return {id,name:draft.name.trim(),unit:draft.unit,energyKcal,protein,carbs,fat,source:"照片识别",importedAt:new Date().toISOString(),labelEvidence:text,serving:{description:draft.servingDescription.trim()||null,quantity,quantityUnit:quantity==null?null:draft.quantityUnit.trim(),quantitySource:"label",grams:read("grams"),millilitres:read("millilitres"),servingsPerPack:read("servingsPerPack"),energyKcal:read("servingEnergyKcal"),protein:read("servingProtein"),carbs:read("servingCarbs"),fat:read("servingFat")}};
}
