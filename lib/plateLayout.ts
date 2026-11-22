/** Fill one row, then visibly fan later foods over it, keeping every pile inside the rim. */
export function plateLayout(width:number,height:number,count:number){
 const w=Math.max(1,width),h=Math.max(1,height),columns=Math.max(1,Math.min(Math.max(1,count),Math.floor(w/90))),capacity=columns;
 const cardWidth=Math.min(76,w),cardHeight=Math.min(60,h),layers=Math.ceil(count/capacity),spread=Math.min(24,Math.max(0,h-cardHeight));
 return Array.from({length:count},(_,index)=>{const layer=Math.floor(index/capacity),col=index%capacity,offset=layer===0?0:layer%2?12:-12,top=layers<=1?(h-cardHeight)/2:(layer%4)/Math.min(3,Math.max(1,layers-1))*spread;
 return {position:'absolute' as const,left:Math.max(0,Math.min(w-cardWidth,(col+.5)*w/columns-cardWidth/2+offset)),top:Math.max(0,Math.min(h-cardHeight,top)),width:cardWidth,height:cardHeight,zIndex:index+1,'--plate-art-height':`${Math.max(1,cardHeight)}px`,'--plate-tilt':`${layer===0?(col%2?3:-3):layer%2?8:-8}deg`};});
}
/** Undo a clear without discarding foods selected after clearing. */
export function restorePlateSelection(current:Record<string,number>,previous:Record<string,number>){
 const result={...current};for(const [id,amount] of Object.entries(previous))if(Number.isFinite(amount)&&amount>0)result[id]=Math.min(50,Math.max(0,result[id]||0)+amount);return result;
}
