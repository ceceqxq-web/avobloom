export const marketDisplayOrder=['蛋奶','米面主食','豆制品','肉类','海鲜','蔬菜','水果','坚果与油脂','零食点心','饮品','其他食物'] as const;
export type ShelfGroup<T>={name:string;foods:T[]};
function shelfPages<T>(groups:ShelfGroup<T>[],size:number){
 const pages:ShelfGroup<T>[][]=[[]];let count=0;
 for(const group of groups){if(!group.foods.length)continue;if(group.foods.length<=size&&count&&count+group.foods.length>size){pages.push([]);count=0}
  let start=0;while(start<group.foods.length){if(count===size){pages.push([]);count=0}const end=Math.min(group.foods.length,start+size-count);pages.at(-1)!.push({name:group.name,foods:group.foods.slice(start,end)});count+=end-start;start=end;}}
 return pages;
}
/** Keep ordinary departments together; only a department larger than a page is split. */
export function marketPage<T>(groups:ShelfGroup<T>[],requestedPage:number,size=60){const all=shelfPages(groups,Math.max(1,Math.floor(size)||60)),page=Math.max(0,Math.min(Math.floor(requestedPage)||0,all.length-1)),visible=all[page];return{groups:visible,total:groups.reduce((n,g)=>n+g.foods.length,0),pages:all.length,page,count:visible.reduce((n,g)=>n+g.foods.length,0)}}
export function marketDepartmentPage<T>(groups:ShelfGroup<T>[],name:string,size=60){const index=shelfPages(groups,Math.max(1,Math.floor(size)||60)).findIndex(page=>page.some(g=>g.name===name));return Math.max(0,index)}
