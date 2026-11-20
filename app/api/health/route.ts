import {readLocalCloudMigration} from "@/lib/health/localCloudMigration";
import {openHealthStore,authorizeHealthRequest} from "@/lib/health/store";
import {DataConflict,parseBackup,makeBackup,type HealthPatch} from "@/lib/health/data";
export const runtime="nodejs";
export const dynamic="force-dynamic";
function failure(e:unknown){return Response.json({error:e instanceof Error?e.message:"数据库操作失败"},{status:e instanceof DataConflict?409:400,headers:{"Cache-Control":"no-store"}})}
export async function GET(request:Request){let db;try{await authorizeHealthRequest(request);db=await openHealthStore();const snapshot=await db.read();if(new URL(request.url).searchParams.has("download"))return Response.json(makeBackup(snapshot.data),{headers:{"Cache-Control":"no-store","Content-Disposition":"attachment; filename=qingheng-backup.json"}});return Response.json(snapshot,{headers:{"Cache-Control":"no-store"}})}catch(e){return failure(e)}finally{db?.close()}}
export async function POST(request:Request){let db;try{await authorizeHealthRequest(request);if(!request.headers.get("content-type")?.startsWith("application/json"))throw new Error("需要 JSON 请求");const raw=await request.text();if(Buffer.byteLength(raw)>12*1024*1024)throw new Error("备份不能超过12MB");const body=JSON.parse(raw);db=await openHealthStore();if(body.action==="bootstrap"){
 if(process.env.VERCEL!=="1"&&process.env.WELLGROVE_STORAGE==="supabase"&&process.env.WELLGROVE_MERGE_LOCAL==="1"){
  const legacy=readLocalCloudMigration();
  if(legacy)await db.migrate(legacy.id,legacy.data,{source:"local-sqlite",recordsOnly:true},true);
 }
 return Response.json(await db.migrate(body.clientId,parseBackup(body.legacy),body.raw));
}if(body.action==="patch")return Response.json(await db.patch(body.patch as HealthPatch));if(body.action==="restore")return Response.json(await db.restore(parseBackup(body.backup),body.restoreGoals===true));throw new Error("未知操作")}catch(e){return failure(e)}finally{db?.close()}}
