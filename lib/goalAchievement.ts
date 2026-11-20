import type {HealthEntry} from './foodRecord';
import type {WeightPlan} from './weightGoal';
export function goalAchievement(entries:HealthEntry[],goal:number,plan:WeightPlan|undefined,today:string){
 const weights=entries.filter(e=>e.type==='weight'&&e.date<=today).sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time));
 const latest=weights.at(-1),start=plan?.startWeight??weights[0]?.amount;
 if(!latest||start==null||!Number.isFinite(goal)||start===goal)return null;
 if(plan?.startDate&&latest.date<plan.startDate)return null;
 const reached=start>goal?latest.amount<=goal:latest.amount>=goal;
 if(!reached)return null;
 return{key:JSON.stringify([goal,start,plan?.startDate??weights[0]?.date]),weight:latest.amount,date:latest.date,goal};
}
