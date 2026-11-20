import {createClient} from '../supabase/server';
import {cloudHealthStore,emptyCloudState,type CloudState} from './cloudState';
import type {Json} from '../database.types';
export const cloudHealthEnabled=()=>process.env.VERCEL==='1'||process.env.WELLGROVE_STORAGE==='supabase';
export async function authorizeHealthRequest(request:Request){
 const url=new URL(request.url),host=request.headers.get('host')||'',origin=request.headers.get('origin');
 if(request.headers.get('sec-fetch-site')==='cross-site'||origin&&origin!==url.origin&&origin!==`https://${host}`&&origin!==`http://${host}`)throw new Error('请求来源不匹配');
 if(!cloudHealthEnabled()){
  const hostname=host?new URL('http://'+host).hostname:'';if(!['localhost','127.0.0.1','[::1]'].includes(hostname))throw new Error('仅允许本机同源请求');
 }else{const client=await createClient();const {data:{user},error}=await client.auth.getUser();if(error||!user)throw new Error('请先登录 Avobloom 后再访问健康记录');}
 return url.origin;
}
export async function openHealthStore(){
 if(!cloudHealthEnabled()){const {openHealthDatabase}=await import('./database');return {...openHealthDatabase(),storageKey:'local'};}
 const client=await createClient(),{data:{user},error}=await client.auth.getUser();if(error||!user)throw new Error('请先登录 Avobloom 后再访问健康记录');
 return {...cloudHealthStore({
  async read(){
   let result=await client.from('wellgrove_health').select('revision,payload').eq('user_id',user.id).maybeSingle();
   if(result.error)throw new Error('云端健康数据库未就绪，请联系管理员完成数据库迁移。');
   if(!result.data){const initial=await client.from('wellgrove_health').upsert({user_id:user.id,payload:emptyCloudState() as unknown as Json},{onConflict:'user_id',ignoreDuplicates:true});if(initial.error)throw new Error('无法初始化云端健康记录');result=await client.from('wellgrove_health').select('revision,payload').eq('user_id',user.id).single();}
   if(result.error||!result.data)throw new Error('无法读取云端健康记录');return {revision:result.data.revision,payload:result.data.payload as unknown as CloudState};
  },
  async compareAndSwap(revision,payload){const {data,error}=await client.from('wellgrove_health').update({revision:revision+1,payload:payload as unknown as Json,updated_at:new Date().toISOString()}).eq('user_id',user.id).eq('revision',revision).select('revision');if(error)throw new Error('云端保存失败，请重试；本页输入已保留。');return !!data?.length;},
 }),storageKey:user.id};
}
export type HealthStore=Awaited<ReturnType<typeof openHealthStore>>;
