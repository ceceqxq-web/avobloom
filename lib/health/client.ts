import {applyPatch,diffData,emptyHealthData,hasChanges,makeBackup,parseBackup,type HealthData,type HealthSnapshot} from "./data.ts";
type Status="loading"|"saved"|"saving"|"error"|"conflict";
export type StoreView={data:HealthData;ready:boolean;status:Status;message:string;revision:number;updatedAt:string;migration:string};
type StorageLike=Pick<Storage,"getItem"|"setItem"|"removeItem"|"key"|"length">;
type Transport=(payload?:unknown)=>Promise<HealthSnapshot&{migration?:{entries:number;catalog:number;plans:number;conflicts:number};restore?:{added:number;conflicts:number}} >;
export const healthTransport:Transport=async payload=>{const response=await fetch("/api/health",payload?{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),cache:"no-store"}:{cache:"no-store"});const data=await response.json();if(!response.ok){const e=new Error(data.error||"健康数据库连接失败") as Error&{status:number};e.status=response.status;throw e}return data};
export class HealthClient {
 private view:StoreView={data:emptyHealthData(),ready:false,status:"loading",message:"正在连接健康数据库…",revision:0,updatedAt:"",migration:""};
 private base:HealthData=emptyHealthData();private listeners=new Set<()=>void>();private busy=false;private started=false;private restoring=false;private storage?:StorageLike;private clientId="";private pendingKey="";private migrationWarning="";private recovered=new Map<string,string>();
 private transport:Transport;
 constructor(transport:Transport=healthTransport){this.transport=transport}
 subscribe=(fn:()=>void)=>{this.listeners.add(fn);return()=>{this.listeners.delete(fn)}};
 getSnapshot=()=>this.view;
 private emit(patch:Partial<StoreView>){this.view={...this.view,...patch};for(const fn of this.listeners)fn()}
 private remember(){if(!this.storage)return;try{if(this.dirty())this.storage.setItem(this.pendingKey,JSON.stringify({base:this.base,desired:this.view.data}));else {this.storage.removeItem(this.pendingKey);for(const [key,value] of this.recovered)if(this.storage.getItem(key)===value)this.storage.removeItem(key);this.recovered.clear()}}catch{this.migrationWarning="浏览器应急副本写入失败，未保存时请保持页面开启并导出备份。"}}
 dirty=()=>hasChanges(diffData(this.base,this.view.data));
 async start(storage:StorageLike){if(this.started)return;this.started=true;this.storage=storage;this.emit({status:"loading",message:"正在备份并核对迁移…"});try{
  this.clientId=storage.getItem("qingheng-client-v2")||crypto.randomUUID();storage.setItem("qingheng-client-v2",this.clientId);this.pendingKey=`qingheng-pending-v2:${this.clientId}:${crypto.randomUUID()}`;
  const raw=storage.getItem("qingheng-v1"),plans:Record<string,unknown>={};for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key?.startsWith("qingheng-meal-plan:")){const value=storage.getItem(key);if(value)plans[key.slice("qingheng-meal-plan:".length)]=JSON.parse(value)}}
  const legacy=parseBackup({...emptyHealthData(),...(raw?JSON.parse(raw):{}),plans});
  if(!storage.getItem("qingheng-backup-before-sqlite-v2"))storage.setItem("qingheng-backup-before-sqlite-v2",JSON.stringify({raw,plans,createdAt:new Date().toISOString()}));
  this.emit({data:legacy});const server=await this.transport({action:"bootstrap",clientId:this.clientId,legacy,raw:{health:raw,plans}});
  this.base=server.data;let desired=server.data;const pendingKeys=Array.from({length:storage.length},(_,i)=>storage.key(i)).filter((key):key is string=>!!key&&key.startsWith(`qingheng-pending-v2:${this.clientId}`));let recoveryConflict=false;
  for(const key of pendingKeys){const rawPending=storage.getItem(key);if(!rawPending)continue;const parsed=JSON.parse(rawPending),pendingBase=parseBackup(parsed.base),pendingDesired=parseBackup(parsed.desired),patch=diffData(pendingBase,pendingDesired);if(!hasChanges(patch))continue;
   // If a saved value already matches, an interrupted acknowledgement is harmless.
   try{desired=applyPatch(desired,patch);this.recovered.set(key,rawPending)}catch{recoveryConflict=true;this.migrationWarning="发现与数据库冲突的未保存副本，已保留在浏览器。请导出浏览器原始副本核对后再恢复。"}
  }
  if(recoveryConflict)this.migrationWarning="发现与数据库冲突的未保存副本，未覆盖数据库。请在备份与恢复中导出浏览器原始副本核对。";
  const m=server.migration;this.emit({data:desired,ready:true,status:this.dirtyFrom(this.base,desired)?"saving":"saved",revision:server.revision,updatedAt:server.updatedAt,message:this.migrationWarning,migration:m?`原始副本已备份并核对：${m.entries} 条记录、${m.catalog} 个商品、${m.plans} 份食谱${m.conflicts?`；${m.conflicts} 项冲突保留数据库版本`:""}`:""});this.remember();await this.flush();
 }catch(e){this.started=false;this.emit({status:"error",message:`迁移或连接未完成：${(e as Error).message}。原浏览器数据保留。`})}}
 private dirtyFrom(a:HealthData,b:HealthData){return hasChanges(diffData(a,b))}
 update<K extends keyof HealthData>(key:K,value:HealthData[K]|((previous:HealthData[K])=>HealthData[K])){if(!this.view.ready)throw new Error("数据库尚未就绪");const next=typeof value==="function"?(value as (v:HealthData[K])=>HealthData[K])(this.view.data[key]):value;this.emit({data:{...this.view.data,[key]:next},status:this.view.status==="conflict"?"conflict":"saving"});this.remember();if(this.view.status!=="conflict")void this.flush()}
 updateFields(fields:Partial<HealthData>){if(!this.view.ready)throw new Error("数据库尚未就绪");this.emit({data:{...this.view.data,...fields},status:this.view.status==="conflict"?"conflict":"saving"});this.remember();if(this.view.status!=="conflict")void this.flush()}

 async flush(){if(this.busy||!this.view.ready||this.view.status==="conflict")return;this.busy=true;try{while(this.dirty()){
  const sent=this.view.data,patch=diffData(this.base,sent);this.emit({status:"saving",message:"正在保存…"});const result=await this.transport({action:"patch",patch});const queued=diffData(sent,this.view.data);this.base=result.data;const desired=applyPatch(result.data,queued,false);this.emit({data:desired,status:this.dirtyFrom(this.base,desired)?"saving":"saved",revision:result.revision,updatedAt:result.updatedAt,message:this.migrationWarning});this.remember();
 }if(this.view.status==="saving")this.emit({status:"saved",message:this.migrationWarning})}catch(e){this.emit({status:(e as {status?:number}).status===409?"conflict":"error",message:(e as Error).message});this.remember()}finally{this.busy=false}}
 async refresh(){if(this.restoring||this.busy||!this.view.ready||this.view.status==="conflict")return;if(this.dirty()){await this.flush();return}this.busy=true;try{const server=await this.transport();if(!this.dirty()&&server.revision!==this.view.revision){this.base=server.data;this.emit({data:server.data,revision:server.revision,updatedAt:server.updatedAt,status:"saved",message:this.migrationWarning})}else if(this.view.status==="error")this.emit({status:"saved",message:this.migrationWarning})}catch(e){this.emit({status:"error",message:`同步暂不可用：${(e as Error).message}`})}finally{this.busy=false;if(this.dirty()&&this.view.status!=="error")void this.flush()}}
 async retry(storage:StorageLike){if(!this.view.ready){this.started=false;await this.start(storage)}else if(this.dirty())await this.flush();else await this.refresh()}
 async useDatabaseVersion(){if(this.busy)return;this.busy=true;try{const server=await this.transport();if(this.dirty()&&this.storage)this.storage.setItem(`qingheng-conflict-backup:${Date.now()}`,JSON.stringify(makeBackup(this.view.data)));this.base=server.data;this.emit({data:server.data,revision:server.revision,updatedAt:server.updatedAt,status:"saved",message:"已采用数据库版本，本页修改已另存浏览器冲突备份。"});this.remember()}catch(e){this.emit({status:"error",message:(e as Error).message})}finally{this.busy=false}}
 async restore(backup:unknown,restoreGoals=false){
  if(this.restoring||this.dirty()||!this.view.ready||this.view.status==="conflict")throw new Error("请先完成当前保存或解决冲突，再恢复备份");
  this.restoring=true;
  try{
   // Polling reads may be in flight even while the visible status is saved.
   const deadline=Date.now()+20000;
   while(this.busy&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,50));
   if(this.busy)throw new Error("当前同步仍未完成，请稍后重试合并");
   if(this.dirty()||this.getSnapshot().status==="conflict")throw new Error("请先完成当前保存或解决冲突，再恢复备份");
   this.busy=true;const sent=this.view.data;
   try{const result=await this.transport({action:"restore",backup,restoreGoals});const queued=diffData(sent,this.view.data);this.base=result.data;const desired=applyPatch(result.data,queued,false);this.emit({data:desired,revision:result.revision,updatedAt:result.updatedAt,status:"saved",message:`恢复完成：新增 ${result.restore?.added||0} 项，${result.restore?.conflicts||0} 项差异保留当前版本。恢复前完整副本已保存。`});this.remember()}finally{this.busy=false;if(this.dirty())void this.flush()}
  }finally{this.restoring=false}
 }

}
