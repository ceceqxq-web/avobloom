import {authorizeHealthRequest} from '@/lib/health/store';
import {translateFoodSearch,matchFoodProducts} from '@/lib/foodSearch';
export const runtime='nodejs';
export const maxDuration=40;
let active=0;
const translations=new Map<string,{expires:number;value:Awaited<ReturnType<typeof translateFoodSearch>>}>();
export async function POST(request:Request){
 try{await authorizeHealthRequest(request)}catch{return Response.json({error:'请先登录'},{status:403})}
 if(!request.headers.get('content-type')?.startsWith('application/json')||Number(request.headers.get('content-length'))>12000)return Response.json({error:'请求格式无效'},{status:400});
 if(active>=3)return Response.json({error:'正在处理其他查询，请稍后重试'},{status:429});
 active++;
 try{
  const text=await request.text();if(text.length>12000)throw new Error('查询过长');const body=JSON.parse(text);
  if(typeof body.query!=='string'||!body.query.trim()||body.query.length>300)throw new Error('请输入300字以内的食物名称。');
  const input=body.query.trim(),cached=translations.get(input);
  const options={apiKey:process.env.OPENAI_API_KEY||'',model:process.env.OPENAI_NUTRITION_MODEL||process.env.OPENAI_MODEL||'gpt-5.5',signal:request.signal};
  const direct=/^\d{3,18}$|^https?:/i.test(input);
  if(!options.apiKey&&!direct)return Response.json({error:'尚未配置语言识别服务，可直接粘贴营养标签。'},{status:503});
  const query=cached&&cached.expires>Date.now()?cached.value:await translateFoodSearch(input,options);
  if(!cached||cached.expires<=Date.now()){while(translations.size>=200)translations.delete(translations.keys().next().value!);translations.set(input,{value:query,expires:Date.now()+15*60*1000})}
  if(body.products!==undefined){
   if(!Array.isArray(body.products)||body.products.length>12||body.products.some((p:unknown)=>!p||typeof p!=='object'||typeof (p as {id?:unknown}).id!=='string'||typeof (p as {name?:unknown}).name!=='string'||String((p as {id:string}).id).length>30||String((p as {name:string}).name).length>300))throw new Error('候选商品格式无效');
   const matchingIds=await matchFoodProducts(query,body.products,options);return Response.json({query,matchingIds},{headers:{'Cache-Control':'no-store'}});
  }
  return Response.json({query},{headers:{'Cache-Control':'no-store'}});
 }catch(error){return Response.json({error:error instanceof Error&&error.name!=='TimeoutError'?error.message:'语言识别或匹配超时，请重试。'},{status:422})}finally{active--}
}
