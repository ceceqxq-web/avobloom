export type FoodJobStatus='queued'|'running'|'succeeded'|'failed';
export type FoodJob={id:string;text:string;date:string;meal:string;time:string;status:FoodJobStatus;stage:string;createdAt:string;updatedAt:string;leaseUntil:number;owner:string|null;error:string|null;count:number;seen:boolean};
