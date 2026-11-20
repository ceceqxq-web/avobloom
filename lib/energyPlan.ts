import {addDays,daysBetween} from "./weightGoal.ts";
export type EnergyProfile={birthDate:string;heightCm:number;sex:"female"|"male";activity:"sedentary"|"light"|"light-moderate"|"moderate"|"active"|null;specialSituation?:boolean;autoBudget?:boolean};
export const activityLevels={sedentary:{label:"久坐为主，基本不运动",factor:1.2},light:{label:"轻度活动，每周运动1–3次",factor:1.375},"light-moderate":{label:"介于轻度与中等活动之间（估算）",factor:1.4625},moderate:{label:"中等活动，每周运动3–5次",factor:1.55},active:{label:"较高活动量，规律高强度训练",factor:1.725}};
export function ageOn(birthDate:string,today:string){const [y,m,d]=birthDate.split("-").map(Number),[ty,tm,td]=today.split("-").map(Number);return ty-y-(tm<m||tm===m&&td<d?1:0)}
export function energyPlan(profile:EnergyProfile|undefined,weight:number|null,goal:number,today:string,targetDate:string|null){
 if(!profile||!profile.birthDate||!profile.heightCm||weight==null)return{status:"missing" as const};
 const age=ageOn(profile.birthDate,today);
 if(!Number.isFinite(age)||age<18||age>100||profile.heightCm<120||profile.heightCm>230||weight<=0||profile.specialSituation)return{status:"unsupported" as const};
 const ree=10*weight+6.25*profile.heightCm-5*age+(profile.sex==="male"?5:-161),bmi=weight/(profile.heightCm/100)**2;
 if(!profile.activity)return{status:"activity" as const,age,ree,bmi};
 const tdee=ree*activityLevels[profile.activity].factor,floor=profile.sex==="female"?1200:1500;
 if(ree<=0||bmi<18.5||goal/(profile.heightCm/100)**2<18.5)return{status:"unsupported" as const,age,ree,bmi,tdee};
 if(goal>=weight)return{status:"maintenance" as const,age,ree,bmi,tdee,budget:Math.round(tdee/10)*10};
 // A cautious product guardrail, not a personalized clinical safety threshold.
 const maximumDeficit=Math.min(tdee*.2,500,tdee-floor);
 if(maximumDeficit<=0)return{status:"unsupported" as const,age,ree,bmi,tdee};
 const remaining=weight-goal,days=targetDate?daysBetween(today,targetDate):null;
 // 7700 kcal/kg is a rough feasibility screen. It is not a dynamic body-weight model.
 const requiredDeficit=days!=null&&days>0?remaining*7700/days:null;
 const limited=days!=null&&(days<=0||requiredDeficit!>maximumDeficit||remaining/days*7>1);
 const requested=requiredDeficit??Math.min(tdee*.15,maximumDeficit);
 const deficit=limited?maximumDeficit:Math.min(requested,maximumDeficit);
 const budget=Math.min(Math.floor(tdee/10)*10,Math.ceil(Math.max(floor,tdee-deficit)/10)*10),actualDeficit=tdee-budget;
 const roughDays=actualDeficit>0?Math.ceil(remaining*7700/actualDeficit):null;
 return{status:limited?"infeasible" as const:targetDate?"feasible" as const:"no-date" as const,age,ree,bmi,tdee,days,requiredDeficit,maximumDeficit,theoreticalBudget:requiredDeficit==null?null:Math.round(tdee-requiredDeficit),budget,actualDeficit,roughDays,roughDate:roughDays!=null&&roughDays<3650?addDays(today,roughDays):null};
}

export function dateIntakeBudget(plan:ReturnType<typeof energyPlan>,sex:EnergyProfile["sex"]){
 if(!("theoreticalBudget" in plan)||plan.theoreticalBudget==null)return null;
 const rounded=Math.round(plan.theoreticalBudget/10)*10;
 return rounded>=(sex==="female"?1200:1500)?rounded:null;
}
