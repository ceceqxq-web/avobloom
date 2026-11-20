import type { FoodNutrition } from "./foodNutrition";
export type NutritionTotals={energyKcal:number|null;protein:number|null;carbs:number|null;fat:number|null};
export type PortionBasis=NutritionTotals & {amount:number|null;quantity:number|null;quantityUnit:string};
export type PortionSpec={amount:number|null;quantity:number|null;quantityUnit:string};
export type HealthEntry={foodInput?:string;id:string;date:string;type:string;name:string;amount:number;protein:number|null;carbs:number|null;fat:number|null;meal:string;time:string;energyKcal?:number|null;quantityText?:string;recordNote?:string;weightUnknown?:boolean;amountUnit?:"g"|"mL";foodLabel?:FoodNutrition;labelPortionPending?:boolean;portionEstimate?:"energy";portionBasis?:PortionBasis;portionSpec?:PortionSpec;portionMode?:"weight"|"servings"|"count";servings?:number|null;portionEdited?:boolean;planImportKey?:string;planId?:string;durationMinutes?:number;distanceKm?:number|null;foodCategory?:"healthy"|"moderate"|"limit"|"unclassified"};
export type PortionDraft={mode:"weight"|"servings"|"count";amount:string;servings:string;count:string;servingAmount:string;servingQuantity:string;quantityUnit:string;referenceAmount:string;meal:string;energyOverride?:string;estimateFromEnergy?:boolean};
export const foodCalories=(e:HealthEntry):number|null=>e.energyKcal===null?null:e.energyKcal??(e.protein==null||e.carbs==null||e.fat==null?null:e.protein*4+e.carbs*4+e.fat*9);
const round=(n:number)=>Math.round(n*1e8)/1e8;
export const portionNumber=(n:number)=>Number(n.toFixed(3)).toString();
export function portionBasis(entry:HealthEntry):PortionBasis{
 if(entry.portionBasis)return entry.portionBasis;
 const match=entry.quantityText?.match(/^\s*(\d+(?:\.\d+)?)\s*([^\d].*)$/);
 const count=match?Number(match[1]):null;
 return {amount:entry.weightUnknown||entry.amount<=0?null:entry.amount,quantity:count,quantityUnit:match?.[2]?.trim()||"个",energyKcal:foodCalories(entry),protein:entry.protein,carbs:entry.carbs,fat:entry.fat};
}
export function initialPortionDraft(entry:HealthEntry):PortionDraft{
 const basis=portionBasis(entry),label=entry.foodLabel,serving=label?.serving;
 const amountUnit=label?.unit||entry.amountUnit||"g";
 const labelAmount=amountUnit==="g"?serving?.grams:serving?.millilitres;
 const spec=entry.portionSpec||{amount:labelAmount??(basis.amount!=null&&basis.quantity?basis.amount/basis.quantity:null),quantity:serving?.quantity??(basis.quantity?1:null),quantityUnit:serving?.quantityUnit||basis.quantityUnit};
 const specAmount=spec.amount, specQuantity=spec.quantity;
 const currentCount=entry.quantityText?.match(/^\s*(\d+(?:\.\d+)?)\s*([^\d].*)$/);
 const weightKnown=!entry.weightUnknown&&entry.amount>0;
 const servings=entry.servings??(weightKnown&&specAmount?entry.amount/specAmount:currentCount&&specQuantity?Number(currentCount[1])/specQuantity:1);
 const count=entry.portionMode==="weight"||entry.portionMode==="servings"?(specQuantity?specQuantity*servings:null):currentCount?Number(currentCount[1]):specQuantity?specQuantity*servings:null;
 return {mode:entry.portionMode||(entry.quantityText?"count":"weight"),amount:weightKnown?portionNumber(entry.amount):"",servings:portionNumber(servings),count:count==null?"":portionNumber(count),servingAmount:specAmount==null?"":portionNumber(specAmount),servingQuantity:specQuantity==null?"":portionNumber(specQuantity),quantityUnit:spec.quantityUnit,referenceAmount:basis.amount==null?"":portionNumber(basis.amount),meal:entry.meal,estimateFromEnergy:entry.portionEstimate==="energy"};
}
function positive(value:string,label:string,required=false):number|null{
 if(!value.trim()){if(required)throw new Error(`请填写${label}。`);return null}
 const n=Number(value);if(!Number.isFinite(n)||n<=0||n>100000)throw new Error(`${label}须大于 0，且不超过 100000。`);return n;
}
export function updateFoodPortion(entry:HealthEntry,draft:PortionDraft):HealthEntry{
 const basis={...portionBasis(entry)},label=entry.foodLabel,unit=label?.unit||entry.amountUnit||"g";
 const servingAmount=positive(draft.servingAmount,"每份重量 / 体积"),servingQuantity=positive(draft.servingQuantity,"每份个数"),quantityUnit=draft.quantityUnit.trim();
 if(servingQuantity!=null&&!quantityUnit)throw new Error("请填写个数单位，例如 crackers、片或个。");
 let amount:number|null=null,count:number|null=null,servings:number|null=null;
 if(draft.mode==="weight"){
  amount=positive(draft.amount,unit==="g"?"食用克数":"食用毫升数",true);
  if(servingAmount){servings=amount!/servingAmount;if(servingQuantity)count=servings*servingQuantity}
 }else if(draft.mode==="servings"){
  servings=positive(draft.servings,"食用份数",true);
  if(servingAmount)amount=servings!*servingAmount;
  if(servingQuantity)count=servings!*servingQuantity;
 }else{
  count=positive(draft.count,"食用个数",true);
  if(servingQuantity){servings=count!/servingQuantity;if(servingAmount)amount=servings*servingAmount}
 }
 if(!label&&basis.amount==null){
  const ref=positive(draft.referenceAmount,"原记录总重量 / 体积");
  if(ref)basis.amount=ref;
  // A user-supplied serving weight + count can establish the old count's weight.
  else if(servingAmount&&servingQuantity&&basis.quantity&&quantityUnit===basis.quantityUnit)basis.amount=basis.quantity/servingQuantity*servingAmount;
 }
 let totals:NutritionTotals;
 let labelPortionPending=false;
 let basisRatio:number|null=null;
 if(label){
  const labelServing=label.serving,labelAmount=unit==="g"?labelServing?.grams:labelServing?.millilitres;
  const usesLabelServing=draft.mode!=="weight"&&servings!=null&&servingAmount!=null&&labelAmount!=null&&Math.abs(servingAmount-labelAmount)<1e-7;
  if(amount==null&&!usesLabelServing){
   labelPortionPending=true;
   const ratio=count!=null&&basis.quantity&&quantityUnit===basis.quantityUnit?count/basis.quantity:null;
   const prior=(n:number|null)=>ratio!=null&&n!=null?round(n*ratio):null;
   totals={energyKcal:prior(basis.energyKcal),protein:prior(basis.protein),carbs:prior(basis.carbs),fat:prior(basis.fat)};
  }else{
  const perServing=(key:keyof NutritionTotals)=>usesLabelServing&&labelServing?.[key]!=null?round(labelServing[key]!*servings!):amount!=null?round(label[key]*amount/100):null;
  totals={energyKcal:perServing("energyKcal"),protein:perServing("protein"),carbs:perServing("carbs"),fat:perServing("fat")};
  }
 }else{
  let ratio:number|null=null;
  if(draft.mode==="count"&&count!=null&&basis.quantity&&quantityUnit===basis.quantityUnit)ratio=count/basis.quantity;
  else if(amount!=null&&basis.amount)ratio=amount/basis.amount;
  else if(count!=null&&basis.quantity&&quantityUnit===basis.quantityUnit)ratio=count/basis.quantity;
  if(ratio==null)throw new Error("原记录缺少换算依据。请补充原记录总克数，或每份个数与重量后再调整。");
  basisRatio=ratio;
  const scale=(n:number|null)=>n==null?null:round(n*ratio!);
  totals={energyKcal:scale(basis.energyKcal),protein:scale(basis.protein),carbs:scale(basis.carbs),fat:scale(basis.fat)};
 }
 if(!label&&draft.energyOverride?.trim()){
  const energy=Number(draft.energyOverride);
  if(!Number.isFinite(energy)||energy<0||energy>100000)throw new Error("本次总热量须为 0–100000 千卡。");
  totals.energyKcal=energy;
  // Rebase the original reference so subsequent weight/serving edits use the corrected energy.
  if(basisRatio!=null)basis.energyKcal=round(energy/basisRatio);
 }
 const text=draft.mode==="servings"?`${portionNumber(servings!)}份${amount==null?"":` · ${portionNumber(amount)} ${unit}`}`:draft.mode==="count"?`${portionNumber(count!)}${quantityUnit||basis.quantityUnit}${amount==null?"":` · ${portionNumber(amount)} ${unit}`}`:`${portionNumber(amount!)} ${unit}${servings==null?"":` · ${portionNumber(servings)}份`}`;
 return {...entry,...totals,labelPortionPending,portionEstimate:draft.estimateFromEnergy?"energy":undefined,amount:amount==null?0:round(amount),weightUnknown:amount==null,amountUnit:unit,quantityText:text,meal:draft.meal,portionBasis:basis,portionSpec:{amount:servingAmount,quantity:servingQuantity,quantityUnit},portionMode:draft.mode,servings:servings==null?null:round(servings),portionEdited:true};
}

// Replace only the nutrition reference; keep the user's current portion inputs and record identity.
export function selectFoodLabel(entry:HealthEntry,draft:PortionDraft,label:FoodNutrition):{entry:HealthEntry;draft:PortionDraft}{
 const previousUnit=entry.foodLabel?.unit||entry.amountUnit||"g",servingAmount=label.unit==="g"?label.serving?.grams:label.serving?.millilitres;
 const quantity=label.serving?.quantity??null,quantityUnit=label.serving?.quantityUnit||draft.quantityUnit||"个";
 const isMeasuredCount=draft.mode==="count"&&/^(?:g|克|kg|千克|公斤|mL|ml|毫升|L|升)$/i.test(draft.quantityUnit.trim());
 const measuredAmount=isMeasuredCount&&draft.count.trim()?portionNumber(Number(draft.count)*(/^(?:kg|千克|公斤|L|升)$/i.test(draft.quantityUnit.trim())?1000:1)):draft.amount;
 return {entry:{...entry,name:label.name,foodLabel:label,amountUnit:label.unit,energyKcal:null,protein:null,carbs:null,fat:null,portionBasis:portionBasis(entry),portionSpec:{amount:servingAmount??null,quantity,quantityUnit},servings:undefined},draft:{...draft,mode:isMeasuredCount?"weight":draft.mode,amount:previousUnit===label.unit?measuredAmount:"",servingAmount:servingAmount==null?"":portionNumber(servingAmount),servingQuantity:quantity==null?"":portionNumber(quantity),quantityUnit,referenceAmount:"",energyOverride:"",estimateFromEnergy:false}};
}

// This opt-in estimate uses a known total energy, not a guessed cracker count per serving.
export function estimatePortionFromEnergy(entry:HealthEntry,draft:PortionDraft):PortionDraft {
 const preview=updateFoodPortion(entry,draft),label=entry.foodLabel;
 if(!label||!preview.labelPortionPending||preview.energyKcal==null||preview.energyKcal<=0||!Number.isFinite(label.energyKcal)||label.energyKcal<=0)throw new Error("没有可用于估算的已知热量，请填写实际克数 / 毫升数。");
 const amount=round(preview.energyKcal/label.energyKcal*100);
 if(amount<=0||amount>100000)throw new Error("估算重量超出范围，请填写实际克数 / 毫升数。");
 return {...draft,mode:"weight",amount:String(amount),energyOverride:"",estimateFromEnergy:true};
}
