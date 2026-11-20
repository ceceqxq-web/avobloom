import {authorizeHealthRequest} from '@/lib/health/store';
import {processFoodLog} from '@/lib/serverFoodLog';
export const runtime='nodejs';
let active=0;
export async function POST(request:Request){
 const url=new URL(request.url);
 try{await authorizeHealthRequest(request)}catch(error){return Response.json({error:error instanceof Error?error.message:'请先登录'},{status:403})}
 if(active>=1)return Response.json({error:'正在处理另一批饮食，请稍候。'},{status:429});
 active++;
 try{const raw=await request.text();if(raw.length>8000)throw new Error('一次最多输入3000字、15项食物。');const body=JSON.parse(raw);if(typeof body.text!=='string'||!body.text.trim()||body.text.length>3000)throw new Error('请输入食物，可带数量、生熟状态和做法。');
 const items=await processFoodLog(body.text,url.origin);
 return Response.json({items},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return Response.json({error:e instanceof Error?e.message:"处理失败，输入已保留。"},{status:422})}finally{active--}
}
