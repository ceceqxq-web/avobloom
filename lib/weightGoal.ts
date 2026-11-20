export type WeightPlan={startWeight:number|null;startDate:string|null;targetDate:string|null};
const day=86400000;
export function daysBetween(a:string,b:string){return Math.round((Date.parse(b+"T12:00:00Z")-Date.parse(a+"T12:00:00Z"))/day)}
export function addDays(date:string,days:number){const d=new Date(date+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)}
export function weightGoalAnalysis({start,current,goal,today,targetDate}:{start:number|null;current:number|null;goal:number;today:string;targetDate:string|null}){
 const direction=start==null?"unknown":goal<start?"loss":goal>start?"gain":"maintain";
 const total=start==null?null:Math.abs(start-goal),remaining=current==null?null:direction==="gain"?Math.max(0,goal-current):Math.max(0,current-goal);
 const achieved=current!=null&&(direction==="loss"?current<=goal:direction==="gain"?current>=goal:direction==="maintain"?Math.abs(current-goal)<.1:false);
 const progress=start==null||current==null||!total?null:Math.max(0,Math.min(100,(direction==="gain"?current-start:start-current)/total*100));
 const days=targetDate?daysBetween(today,targetDate):null;
 const rate=days!=null&&days>0&&remaining!=null?remaining/days*7:null;
 const forecast=direction==="loss"&&remaining!=null&&remaining>0?{fastDays:Math.ceil(remaining*7),slowDays:Math.ceil(remaining/.5*7),fastDate:addDays(today,Math.ceil(remaining*7)),slowDate:addDays(today,Math.ceil(remaining/.5*7))}:null;
 const status=current==null||start==null?"no-data":achieved?"achieved":direction==="maintain"?"maintain":direction==="gain"?"gain":days!=null&&days<=0?"overdue":rate!=null&&rate>1+1e-8?"fast":rate!=null&&rate<.5?"flexible":targetDate?"within":"no-date";
 return{direction,total,remaining,achieved,progress,days,rate,forecast,status};
}
