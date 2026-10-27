import {DatabaseSync} from 'node:sqlite';
import {realpathSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
export function verifyBackup(filename) {
 const root=realpathSync(fileURLToPath(new URL('..',import.meta.url))),path=realpathSync(resolve(filename));
 if(path===root||path.startsWith(root+sep))throw Error('Use a private backup outside the repository and all public roots.');
 const db=new DatabaseSync(path,{readOnly:true});
 try {
  if(db.prepare('PRAGMA integrity_check').all().some(row=>row.integrity_check!=='ok')||db.prepare('PRAGMA foreign_key_check').all().length)throw Error('Backup integrity or foreign-key verification failed.');
  const tables=new Set(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(row=>row.name));
  for(const required of ['accounts','progress','signups','sessions','checkouts'])if(!tables.has(required))throw Error('Backup lacks the expected application schema.');
  const counts=Object.fromEntries(['accounts','progress','study_plans','guided_sessions','study_days'].map(table=>[table,tables.has(table)?db.prepare('SELECT COUNT(*) AS total FROM '+table).get().total:0]));
  return {integrity:'ok',foreignKeys:'ok',counts};
 }finally{db.close();}
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(verifyBackup(process.argv[2])));
