import {authorizeHealthRequest} from '@/lib/health/store';
import {estimateFood} from '@/lib/estimateFood';
export const runtime='nodejs';
let active=0;
export async function POST(request:Request){
 try{await authorizeHealthRequest(request)}catch(error){return Response.json({error:error instanceof Error?error.message:'请先登录'},{status:403})}
 if(!request.headers.get('content-type')?.startsWith('application/json')||Number(request.headers.get('content-length'))>4096)return Response.json({error:'请求格式无效'},{status:400});
 if(active>=2)return Response.json({error:'正在估算其他食物，请稍后重试'},{status:429});
 if(!process.env.OPENAI_API_KEY)return Response.json({error:'尚未配置估算服务，记录保持待补全；可在编辑中手动填写或查询标签。'},{status:503});
 active++;
 try{const text=await request.text();if(text.length>4096)throw new Error('描述过长');const body=JSON.parse(text);if(typeof body.name!=='string'||!body.name.trim()||body.name.length>120||body.description!=null&&typeof body.description!=='string'||String(body.description||'').length>1000||!['g','mL'].includes(body.unit))return Response.json({error:'请填写食物名称、有效单位和简短做法描述。'},{status:400});
 const food=await estimateFood(body.name.trim(),body.description||'',body.unit,{apiKey:process.env.OPENAI_API_KEY,model:process.env.OPENAI_NUTRITION_MODEL||process.env.OPENAI_MODEL||'gpt-5.5'});return Response.json({food},{headers:{'Cache-Control':'no-store'}});
 }catch(error){return Response.json({error:error instanceof Error?error.message:'估算失败'},{status:422})}finally{active--}
}
