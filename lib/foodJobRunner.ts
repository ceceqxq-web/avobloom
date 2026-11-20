import {openHealthStore} from './health/store';
import {processFoodLog} from './serverFoodLog';
const running=new Map<string,Promise<void>>();
export async function runFoodJobs(origin:string){
 const db=await openHealthStore(),key=db.storageKey;
 const existing=running.get(key);if(existing){db.close();return existing;}
 const work=(async()=>{
  const until=Date.now()+230000;
  try{while(Date.now()<until){
   const owner=crypto.randomUUID(),job=await db.claimFoodJob(owner);if(!job)break;
   const update=async(stage?:string)=>{await db.progressFoodJob(job.id,owner,stage)};
   const heartbeat=setInterval(()=>{void update().catch(()=>{/* Lease expires and the next poll resumes the durable job. */})},20000);
   try{const items=await processFoodLog(job.text,origin,update);await update('正在保存饮食记录');await db.finishFoodJob(job.id,owner,items)}
   catch(error){await db.failFoodJob(job.id,owner,error instanceof Error?error.message:'处理失败')}
   finally{clearInterval(heartbeat)}
  }}finally{db.close();running.delete(key)}
 })();running.set(key,work);return work;
}
