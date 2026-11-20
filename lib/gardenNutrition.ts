import type {HealthEntry} from './foodRecord';
export function gardenNutrition(entries:HealthEntry[]){
 const totals={protein:0,carbs:0,fat:0},missing={protein:false,carbs:false,fat:false};
 for(const entry of entries)for(const key of ['protein','carbs','fat'] as const){if(entry[key]==null)missing[key]=true;else totals[key]+=entry[key]}
 const energy={protein:totals.protein*4,carbs:totals.carbs*4,fat:totals.fat*9},sum=energy.protein+energy.carbs+energy.fat;
 const complete=!Object.values(missing).some(Boolean);
 return {totals,missing,complete,shares:{protein:complete&&sum>0?energy.protein/sum*100:null,carbs:complete&&sum>0?energy.carbs/sum*100:null,fat:complete&&sum>0?energy.fat/sum*100:null}};
}
