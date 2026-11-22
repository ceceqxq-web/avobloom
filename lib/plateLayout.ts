/** Fill the plate interior, then offset later layers without growing its height. */
export function plateLayout(width:number,height:number,count:number){
 const w=Math.max(1,width),h=Math.max(1,height),columns=Math.max(1,Math.min(Math.max(1,count),Math.floor(w/72))),rows=count>columns&&h>=80?2:1,capacity=columns*rows;
 const cardWidth=Math.min(64,w),cardHeight=Math.min(56,h/rows-4>0?h/rows-4:h);
 return Array.from({length:count},(_,index)=>{const layer=Math.floor(index/capacity),slot=index%capacity,col=slot%columns,row=Math.floor(slot/columns),shift=Math.min(layer,5)*5;
 return {position:'absolute' as const,left:Math.max(0,Math.min(w-cardWidth,(col+.5)*w/columns-cardWidth/2+shift)),top:Math.max(0,Math.min(h-cardHeight,(row+.5)*h/rows-cardHeight/2+shift)),width:cardWidth,height:cardHeight,zIndex:index+1,'--plate-art-height':`${Math.max(1,cardHeight-12)}px`};});
}
