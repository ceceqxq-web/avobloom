import {DatabaseSync} from 'node:sqlite';
import {existsSync,statSync,realpathSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {parseBackup} from './data.ts';

/** Read-only legacy source. The migration ID is stable after cloud deletions. */
export function readLocalCloudMigration(directory=process.env.QINGHENG_DATA_DIR||path.join(process.cwd(),'.health-data')){
 const filename=path.join(directory,'qingheng.sqlite');
 if(!existsSync(filename))return null;
 const db=new DatabaseSync(filename,{readOnly:true});
 try{
  const row=db.prepare('SELECT data FROM health_state WHERE id=1').get();
  if(!row)return null;
  const data=parseBackup(JSON.parse(String(row.data)));
  const id='sqlite-'+createHash('sha256').update(realpathSync(filename)+':'+statSync(filename).birthtimeMs).digest('hex');
  return {id,data};
 }finally{db.close()}
}
