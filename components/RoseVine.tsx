import type {CSSProperties} from 'react';
/** The stem can extend; each leaf is an independent square sprite and only rotates. */
export default function RoseVine({direction='horizontal',foliage=true}:{direction?:'horizontal'|'vertical';foliage?:boolean}){
 const vertical=direction==='vertical',count=vertical?13:11;
 // Stable, irregular placement avoids repeating patterns and re-render flicker.
 // Sizes and adjacent spacing stay within a 1.5:1 range.
 const sizes=[25,31,23,29,26,22,30,24,32,27,23,28,25];
 const gaps=[7.2,9,6.6,8.4,7.6,6.2,8.9,7.1,9.1,6.8,8.1,7.3];
 const sides=[-1,1,1,-1,1,-1,-1,1,1,-1,1,-1,1];
 const droop=[137,155,122,148,131,158,141,126,151,135,119,145,129];
 const totalGap=gaps.reduce((sum,gap)=>sum+gap,0);
 const points=Array.from({length:count},(_,i)=>{
  const travelled=gaps.slice(0,i).reduce((sum,gap)=>sum+gap,0);
  const along=vertical?5+travelled/totalGap*90:5+i*90/(count-1),across=50+Math.sin(i*(vertical?.8:1.4))*(vertical?5:16);
  return {x:vertical?across:along,y:vertical?along:across,angle:vertical?sides[i]*droop[i]:(i%2?145:-35),size:vertical?sizes[i]:9+i%3*1.5,cell:vertical?[0,2,1,0,1,2,2,0,1,2,0,2,1][i]:i%3};
 });
 const path=points.map((p,i)=>{if(!i)return `M${p.x} ${p.y}`;const a=points[i-1];return vertical?`C${a.x} ${(a.y+p.y)/2} ${p.x} ${(a.y+p.y)/2} ${p.x} ${p.y}`:`C${(a.x+p.x)/2} ${a.y} ${(a.x+p.x)/2} ${p.y} ${p.x} ${p.y}`}).join(' ');
 return <span className={`rose-vine rose-vine-${direction}`} aria-hidden="true"><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="rose-vine-stem"><path d={path} fill="none" stroke="#9e9573" strokeWidth="1" vectorEffect="non-scaling-stroke"/><path d={path} fill="none" stroke="#c4b591" strokeWidth=".35" vectorEffect="non-scaling-stroke"/></svg>{foliage&&points.map((p,i)=><span key={i} className="rose-vine-leaf" style={{'--leaf-size':p.size+'px',left:p.x+'%',top:p.y+'%',width:p.size,height:p.size,transform:`translate(-50%,-92%) rotate(${p.angle}deg)`} as CSSProperties}><span style={{backgroundPosition:`${p.cell/2*100}% 50%`}}/></span>)}{vertical&&points.filter((_,i)=>i%3===1).map((p,i)=><span key={`curl-${i}`} className="rose-vine-curl" style={{left:p.x+'%',top:p.y+'%',width:vertical?19+i%2*3:14,height:vertical?25+i%2*3:18,transform:`translate(-50%,-94%) rotate(${vertical?(i%2?78:-70):(i%2?155:-25)}deg)`}}><svg viewBox="0 0 30 40" preserveAspectRatio="xMidYMid meet"><path d="M15 39C12 30 26 28 25 16C24 3 9 1 7 12C5 22 20 25 20 16C20 12 14 11 13 15" fill="none" stroke="#a28c63" strokeWidth="1.15" strokeLinecap="round"/><path d="M15 39C12 30 26 28 25 16C24 3 9 1 7 12" fill="none" stroke="#d0bf97" strokeWidth=".35" strokeLinecap="round"/></svg></span>)}</span>;
}
