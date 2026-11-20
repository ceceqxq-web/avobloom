import {applyPatch,emptyHealthData,makeBackup,mergeMissing,validateHealthData,type HealthData,type HealthPatch,type HealthSnapshot} from './data.ts';
import type {FoodJob} from './foodJobTypes';
import type {resolvedSimpleFood} from '../simpleFoodLog';
import {upsertLibraryFood} from '../foodLibrary.ts';

type Migration={backupId:string;entries:number;catalog:number;plans:number;conflicts:number};
export type CloudState={snapshot:HealthSnapshot;jobs:FoodJob[];migrations:Record<string,Migration>;backups:{id:string;reason:string;payload:unknown}[]};
export type CloudRow={revision:number;payload:CloudState};
export interface CloudRepository {read():Promise<CloudRow>;compareAndSwap(revision:number,payload:CloudState):Promise<boolean>}
export function emptyCloudState():CloudState{return {snapshot:{data:emptyHealthData(),revision:0,updatedAt:''},jobs:[],migrations:{},backups:[]}}

// Every mutation includes the job and health snapshot in the same database row.
// CAS retries prevent concurrent phones/workers from overwriting another save.
export function cloudHealthStore(repository:CloudRepository){
 async function mutate<T>(work:(state:CloudState)=>T):Promise<T>{
  for(let attempt=0;attempt<8;attempt++){
   const row=await repository.read(),state=structuredClone(row.payload),result=work(state);
   if(await repository.compareAndSwap(row.revision,state))return result;
  }
  throw new Error('同时保存的请求较多，请重试；输入已保留。');
 }
 function write(state:CloudState,data:HealthData){state.snapshot={data:validateHealthData(data),revision:state.snapshot.revision+1,updatedAt:new Date().toISOString()};return state.snapshot}
 function backup(state:CloudState,payload:unknown,reason:string){const id=crypto.randomUUID();state.backups.push({id,reason,payload});return id}
 function job(state:CloudState,id:string){return state.jobs.find(j=>j.id===id)}
 function saveJob(state:CloudState,value:FoodJob){state.jobs=state.jobs.filter(j=>j.id!==value.id);state.jobs.push(value);return value}
 return {
  close:()=>{},read:async()=> (await repository.read()).payload.snapshot,
  listFoodJobs:async()=> (await repository.read()).payload.jobs.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,50),
  patch:(patch:HealthPatch)=>mutate(state=>write(state,applyPatch(state.snapshot.data,patch))),
  migrate:(clientId:string,incoming:HealthData,raw:unknown,recordsOnly=false)=>mutate(state=>{
   if(!/^[\w-]{1,100}$/.test(clientId))throw new Error('迁移标识无效');
   const previous=state.migrations[clientId];if(previous)return {...state.snapshot,migration:previous};
   validateHealthData(incoming);const before=state.snapshot,backupId=backup(state,{raw,data:incoming},'migration'),merged=mergeMissing(before.data,incoming);
   if(before.revision===0&&!recordsOnly){merged.data.goal=incoming.goal;merged.data.calGoal=incoming.calGoal;if(incoming.weightPlan)merged.data.weightPlan=incoming.weightPlan;if(incoming.profile)merged.data.profile=incoming.profile}
   const snapshot=write(state,merged.data),result={backupId,entries:incoming.entries.length,catalog:incoming.catalog.length,plans:Object.keys(incoming.plans).length,conflicts:merged.conflicts};state.migrations[clientId]=result;return {...snapshot,migration:result};
  }),
  restore:(incoming:HealthData,restoreGoals=false)=>mutate(state=>{
   validateHealthData(incoming);const backupId=backup(state,makeBackup(state.snapshot.data),'before-restore'),merged=mergeMissing(state.snapshot.data,incoming);
   if(restoreGoals){merged.data.goal=incoming.goal;merged.data.calGoal=incoming.calGoal;if(incoming.weightPlan)merged.data.weightPlan=incoming.weightPlan;else delete merged.data.weightPlan;if(incoming.profile)merged.data.profile=incoming.profile;else delete merged.data.profile}
   return {...write(state,merged.data),restore:{backupId,added:merged.added,conflicts:merged.conflicts}};
  }),
  enqueueFoodJob:(input:{id:string;text:string;date:string;meal:string;time:string})=>mutate(state=>{
   const previous=job(state,input.id);if(previous){if(previous.text!==input.text||previous.date!==input.date||previous.meal!==input.meal)throw new Error('任务标识重复，请重新提交');return previous}
   const now=new Date().toISOString();return saveJob(state,{...input,status:'queued',stage:'已排队，等待处理',createdAt:now,updatedAt:now,leaseUntil:0,owner:null,error:null,count:0,seen:false});
  }),
  claimFoodJob:(owner:string)=>mutate(state=>{const next=[...state.jobs].sort((a,b)=>a.createdAt.localeCompare(b.createdAt)).find(j=>j.status==='queued'||j.status==='running'&&j.leaseUntil<Date.now());if(!next)return null;return saveJob(state,{...next,status:'running',stage:'正在识别食物与份量',owner,leaseUntil:Date.now()+90000,updatedAt:new Date().toISOString(),error:null})}),
  progressFoodJob:(id:string,owner:string,stage?:string)=>mutate(state=>{const current=job(state,id);if(current?.owner!==owner||current.status!=='running')return;saveJob(state,{...current,stage:stage??current.stage,leaseUntil:Date.now()+90000,updatedAt:new Date().toISOString()})}),
  finishFoodJob:(id:string,owner:string,items:ReturnType<typeof resolvedSimpleFood>[])=>mutate(state=>{
   const current=job(state,id);if(!current||current.status==='succeeded')return current;if(current.owner!==owner||current.status!=='running')throw new Error('任务已由其他处理器接管');if(!items.length)throw new Error('没有可保存的饮食记录');
   const before=state.snapshot.data,ids=new Set(before.entries.map(e=>e.id)),entries=items.map((item,index)=>({...item,id:`food-job-${id}-${index}`,date:current.date,meal:current.meal,time:current.time,type:'food',weightUnknown:false}));let catalog=before.catalog;
   for(const item of items)if(item.foodLabel.source==='Woolworths')catalog=upsertLibraryFood(catalog,item.foodLabel);
   write(state,{...before,entries:[...before.entries,...entries.filter(e=>!ids.has(e.id))],catalog});return saveJob(state,{...current,status:'succeeded',stage:`已保存 ${items.length} 项饮食`,count:items.length,updatedAt:new Date().toISOString(),leaseUntil:0,seen:false});
  }),
  failFoodJob:(id:string,owner:string,error:string)=>mutate(state=>{const current=job(state,id);if(current?.owner!==owner||current.status!=='running')return;return saveJob(state,{...current,status:'failed',stage:'处理失败，输入已保留',error:error.slice(0,1000),leaseUntil:0,updatedAt:new Date().toISOString(),seen:false})}),
  retryFoodJob:(id:string)=>mutate(state=>{const current=job(state,id);if(!current)throw new Error('任务不存在');if(current.status!=='failed')return current;return saveJob(state,{...current,status:'queued',stage:'已重新排队',error:null,owner:null,leaseUntil:0,seen:false,updatedAt:new Date().toISOString()})}),
  markFoodJobSeen:(id:string)=>mutate(state=>{const current=job(state,id);if(current&&['succeeded','failed'].includes(current.status))saveJob(state,{...current,seen:true})}),
 };
}
