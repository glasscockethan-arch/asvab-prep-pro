// Local operator CLI only: intentionally no public admin/export HTTP endpoint.
import {writeFileSync, realpathSync, mkdirSync, existsSync, chmodSync} from 'node:fs';
import {resolve, dirname, sep} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {Store,canonicalEmail} from './store.js';
export function csv(rows,columns) {
 const cell=value=>{let text=String(value??'');if(/^[\s]*[=+@\-\t\r\n]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};
 return [columns.map(cell).join(','),...rows.map(row=>columns.map(column=>cell(row[column])).join(','))].join('\r\n')+'\r\n';
}
export function privateOutput(filename,content) {
 const root=realpathSync(fileURLToPath(new URL('..',import.meta.url))),target=resolve(filename);
 mkdirSync(dirname(target),{recursive:true,mode:0o700});const directory=realpathSync(dirname(target));
 if(directory===root||directory.startsWith(root+sep))throw new Error('Export outside the repository and all public directories.');
 writeFileSync(target,content,{mode:0o600,flag:'wx'});return target;
}
export function runOwner(args) {
 const [command,value]=args;
 if(!['review','export','invite','delete','feedback','metrics','prune','backup'].includes(command))throw new Error('Usage: node server/owner.js review | export /private/path.csv | invite email | delete email | feedback /private/path.csv | metrics | prune | backup /private/path.sqlite');
 const store=new Store(process.env.BEACON_DB_PATH??resolve(tmpdir(),'aptitude-beacon-development','launch.sqlite'));
 try {
  if(command==='review')console.log(JSON.stringify(store.all('SELECT email,test_date,consent_version,created FROM signups ORDER BY created'),null,2));
  if(command==='export')console.log(privateOutput(value,csv(store.all('SELECT * FROM signups ORDER BY created'),['email','test_date','consent_version','created'])));
  if(command==='feedback')console.log(privateOutput(value,csv(store.all('SELECT f.category,f.question_id,f.message,f.created,a.email FROM feedback f JOIN accounts a ON a.id=f.account ORDER BY f.created'),['email','category','question_id','message','created'])));
  if(command==='metrics')console.log(JSON.stringify(store.all('SELECT name,total FROM metrics ORDER BY name'),null,2));
  if(command==='invite') {const secret=store.invite(canonicalEmail(value),Date.now());const port=Number(process.env.BEACON_PORT??8001);console.log(`Private, single-use link, expires in 30 minutes. Deliver only to the opted-in address through a verified private channel:\nhttp://127.0.0.1:${port}/account.html#invite=${secret}`);}
  if(command==='delete'){store.deleteAccount(canonicalEmail(value));console.log('Private development data removed; separately remove exported/backed-up copies under the retention policy.');}
  if(command==='prune'){store.prune(Date.now());console.log('Expired invites/sessions, 90-day uninvited requests and 90-day feedback removed.');}
  if(command==='backup') {
   if(!value||existsSync(resolve(value)))throw new Error('Choose a new private backup filename.');
   const target=privateOutput(value,'');
   store.db.prepare('VACUUM INTO ?').run(target);
   chmodSync(target,0o600);
   console.log('Private consistent SQLite backup created: '+target);
  }
 }finally{store.close();}
}
if(process.argv[1]===fileURLToPath(import.meta.url))runOwner(process.argv.slice(2));
