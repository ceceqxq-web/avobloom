import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, writeFile, access, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
export const runtime = "nodejs";
const exec = promisify(execFile);
let compilation: Promise<string> | undefined;
let running = 0;
async function ocrBinary() {
  if (!compilation) compilation = (async()=>{
    const source = path.join(process.cwd(),"tools/food-label-ocr.swift");
    const hash = createHash("sha256").update(await readFile(source)).digest("hex").slice(0,16);
    const directory = path.join(tmpdir(),`qingheng-ocr-${hash}`);
    const binary = path.join(directory,"label-ocr");
    try { await access(binary); return binary; } catch {}
    await mkdir(directory,{recursive:true});
    await exec("/usr/bin/xcrun",["swiftc",source,"-O","-module-cache-path",path.join(directory,"modules"),"-o",binary],{timeout:120000,maxBuffer:1024*1024});
    return binary;
  })().catch(error=>{compilation=undefined;throw error});
  return compilation;
}
export async function GET() {return Response.json({available:process.platform==="darwin",engine:"Apple Vision",local:true})}
export async function POST(request: Request) {
  if (process.platform!=="darwin") return Response.json({error:"本机照片识别目前支持 macOS，请使用标签粘贴方式。"},{status:501});
  if (Number(request.headers.get("content-length"))>12*1024*1024) return Response.json({error:"图片过大，请选择 8 MB 以内的照片。"},{status:413});
  if (running>=2) return Response.json({error:"有其他照片正在识别，请稍后再试。"},{status:429});
  running++;
  let directory: string | undefined;
  try {
    const form = await request.formData(), file=form.get("image");
    if (!(file instanceof File) || !file.size || file.size>8*1024*1024) return Response.json({error:"请选择 8 MB 以内的营养标签照片。"},{status:400});
    if (!["image/jpeg","image/png","image/webp","image/heic","image/heif"].includes(file.type)) return Response.json({error:"支持 JPG、PNG、WebP 和 HEIC 照片。"},{status:400});
    directory=await mkdtemp(path.join(tmpdir(),"qingheng-label-"));
    const input=path.join(directory,"label-image");
    await writeFile(input,Buffer.from(await file.arrayBuffer()));
    const binary=await ocrBinary();
    const {stdout}=await exec(binary,[input],{timeout:45000,maxBuffer:1024*1024});
    const result=JSON.parse(stdout);
    if (typeof result.text!=="string" || !result.text.trim()) return Response.json({error:"未识别到文字，请让营养标签正对镜头、光线均匀并重新拍摄。"},{status:422});
    return Response.json({text:result.text.slice(0,20000),engine:result.engine,lowConfidence:result.items.some((item:{confidence:number})=>item.confidence<0.7)});
  } catch {
    return Response.json({error:"照片识别失败。请尝试清晰的 JPG / PNG 标签近照，或使用粘贴 / 手填标签。"},{status:422});
  } finally {running--;if(directory)await rm(directory,{recursive:true,force:true}).catch(()=>{})}
}
