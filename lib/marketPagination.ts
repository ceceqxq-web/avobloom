export const marketDisplayOrder=['蛋奶','米面主食','豆制品','肉类','海鲜','蔬菜','水果','坚果与油脂','零食点心','饮品','其他食物'] as const;
export type ShelfGroup<T>={name:string;foods:T[]};
/** Page by foods, retaining category boundaries rather than mixing the last row. */
export function marketPage<T>(groups:ShelfGroup<T>[],requestedPage:number,size=60){
 const total=groups.reduce((sum,g)=>sum+g.foods.length,0),pages=Math.max(1,Math.ceil(total/size)),page=Math.max(0,Math.min(Math.floor(requestedPage)||0,pages-1));
 let offset=0;
 const visible=groups.flatMap(group=>{const start=Math.max(0,page*size-offset),end=Math.min(group.foods.length,(page+1)*size-offset);offset+=group.foods.length;return end>start?[{name:group.name,foods:group.foods.slice(start,end)}]:[]});
 return {groups:visible,total,pages,page,count:visible.reduce((sum,g)=>sum+g.foods.length,0)};
}
export function marketDepartmentPage<T>(groups:ShelfGroup<T>[],name:string,size=60){let offset=0;for(const group of groups){if(group.name===name)return Math.floor(offset/size);offset+=group.foods.length}return 0}
