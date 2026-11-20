export function inputEnergy(text:string,amount:number,unit:'g'|'mL',count:number|null){
 const pattern=/(\d+(?:\.\d+)?)\s*(kcal|千卡|大卡|kj|千焦)/gi;
 const matches=[...text.matchAll(pattern)];if(!matches.length)return null;
 // An explicit total takes precedence when a line includes both per-piece and total energy.
 const chosen=matches.find(m=>/(?:合计|总共|总热量|一共)\s*[:：为是]?\s*$/.test(text.slice(Math.max(0,m.index!-12),m.index)))??matches[0];
 const before=text.slice(Math.max(0,chosen.index!-24),chosen.index),after=text.slice(chosen.index!+chosen[0].length,chosen.index!+chosen[0].length+12);
 const value=Number(chosen[1])*(/kj|千焦/i.test(chosen[2])?1/4.184:1);
 if(!Number.isFinite(value)||value>100000)throw new Error('输入热量超出范围');
 if(!/(?:合计|总共|总热量|一共)\s*[:：为是]?\s*$/.test(before)){
  const per100=before.match(/每\s*100\s*(g|克|ml|毫升)\s*[:：为是]?\s*$/i)||after.match(/^\s*\/\s*100\s*(g|克|ml|毫升)/i);
  if(per100){const densityUnit=/ml|毫升/i.test(per100[1])?'mL':'g';if(densityUnit!==unit)throw new Error('每100单位热量与记录单位不一致，请补充正确单位');return{kcal:value*amount/100,note:'按输入的每100单位热量换算'};}
  if(/(?:每\s*(?:块|个|片|颗|份)|per\s*(?:piece|serving))\s*[:：为是]?\s*$/i.test(before)||/^\s*\/\s*(?:块|个|片|颗|份|piece|serving)/i.test(after)){
   if(!count)throw new Error('已输入每单位热量，请补充对应个数或份数');return{kcal:value*count,note:'明确标注每单位热量，按食用数量换算'};
  }
 }
 return{kcal:value,note:'未标注每单位，输入热量按本项合计处理'};
}
