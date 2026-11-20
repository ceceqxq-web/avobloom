import {foodCalories,type HealthEntry} from './foodRecord.ts';
export function dailyEnergy(entries:HealthEntry[],date:string,budget:number){
 const foods=entries.filter(e=>e.date===date&&e.type==='food'),exercise=entries.filter(e=>e.date===date&&e.type==='exercise');
 const intake=foods.reduce((sum,e)=>sum+(foodCalories(e)??0),0),burn=exercise.reduce((sum,e)=>sum+(e.energyKcal??0),0),net=intake-burn;
 return{intake,burn,net,remaining:Math.max(0,budget-net),over:Math.max(0,net-budget),unknownFood:foods.filter(e=>foodCalories(e)==null).length,unknownExercise:exercise.filter(e=>e.energyKcal==null).length};
}
