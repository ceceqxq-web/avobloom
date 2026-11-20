import type {HealthEntry} from './foodRecord';
const normalized=(name:string)=>name.toLowerCase().replace(/[（(](?:通用估算|AI估算)[）)]/g,'').replace(/[^\p{L}\p{N}]/gu,'');
export function frequentFoods(entries:HealthEntry[],limit=10){
 const groups=new Map<string,{name:string;input:string;count:number;last:string}>();
 for(const entry of entries){if(entry.type!=='food')continue;const key=entry.foodLabel&&['Woolworths','标签导入','照片识别'].includes(entry.foodLabel.source)?entry.foodLabel.id:normalized(entry.name);if(!key)continue;const last=entry.date+'T'+entry.time,previous=groups.get(key);const input=entry.foodInput||((entry.quantityText||(!entry.weightUnknown&&entry.amount>0?`${entry.amount}${entry.amountUnit||'g'}`:'1份'))+' '+entry.name);groups.set(key,{name:previous&&previous.last>last?previous.name:entry.name,input:previous&&previous.last>last?previous.input:input,count:(previous?.count||0)+1,last:previous&&previous.last>last?previous.last:last});}
 return [...groups.values()].sort((a,b)=>b.count-a.count||b.last.localeCompare(a.last)||a.name.localeCompare(b.name)).slice(0,limit);
}
