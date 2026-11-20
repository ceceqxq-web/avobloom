declare module "node:sqlite" {
 export class DatabaseSync {
  constructor(path:string,options?:{readOnly?:boolean});
  exec(sql:string):void;
  prepare(sql:string):{get(...values:unknown[]):Record<string,unknown>|undefined;all(...values:unknown[]):Record<string,unknown>[];run(...values:unknown[]):unknown};
  close():void;
 }
}
