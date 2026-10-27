// Feed to the built container over stdin, with --network none, no published ports and fictional data only.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {request as httpRequest} from 'node:http';
import {existsSync} from 'node:fs';
import {Store,CONSENT_VERSION} from './server/store.js';
import {readBank} from './server/study.js';
import {verifyBackup} from './server/verify-backup.js';
assert.notEqual(process.getuid(),0);assert.equal(existsSync('/run/secrets/build_ca'),false);assert.equal(process.env.NODE_EXTRA_CA_CERTS,undefined);
const origin='https://beacon.example.invalid',port=10000;
let child,stderr='';
function request(path,{method='GET',body,cookie}={}) {
 return new Promise((resolve,reject)=>{
  const req=httpRequest(`http://127.0.0.1:${port}${path}`,{method,agent:false,headers:{host:new URL(origin).host,origin,'x-forwarded-proto':'https',...(cookie?{cookie}:{}),...(body===undefined?{}:{'content-type':'application/json','content-length':Buffer.byteLength(JSON.stringify(body))})}},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>{const text=Buffer.concat(chunks).toString();resolve({status:res.statusCode,headers:res.headers,data:res.headers['content-type']?.startsWith('application/json')?JSON.parse(text):text});});});
  req.on('error',reject);req.end(body===undefined?undefined:JSON.stringify(body));
 });
}
async function start(stage) {
 stderr='';child=spawn(process.execPath,['server/hosted.js'],{env:{...process.env,BEACON_RELEASE_STAGE:stage,BEACON_PUBLIC_ORIGIN:origin},stdio:['ignore','ignore','pipe']});child.stderr.on('data',data=>{stderr+=data.toString();});
 for(let attempt=0;attempt<60;attempt++) {if(child.exitCode!==null)throw Error('Hosted entry failed: '+stderr);try{if((await request('/healthz')).status===200)return;}catch{}await new Promise(r=>setTimeout(r,100));}
 throw Error('Hosted readiness timed out: '+stderr);
}
async function stop() {if(child?.exitCode===null){const ended=once(child,'exit');child.kill('SIGTERM');await ended;}}
try {
 await start('closed');assert.equal((await request('/api/config')).data.betaOpen,false);assert.equal((await request('/api/beta-signups',{method:'POST',body:{}})).status,503);assert.equal((await request('/practice.html')).status,200);for(const path of ['/server/store.js','/launch.sqlite','/.env'])assert.equal((await request(path)).status,404);await stop();
 await start('signup');assert.equal((await request('/api/beta-signups',{method:'POST',body:{email:'container-tester@example.test',adult:true,consent:true,consentVersion:CONSENT_VERSION}})).status,202);assert.equal((await request('/api/session',{method:'POST',body:{}})).status,503);await stop();
 let store=new Store('/var/data/launch.sqlite');assert.equal(store.one('SELECT COUNT(*) AS total FROM signups').total,1);const invitation=store.invite('container-tester@example.test',Date.now());store.close();
 await start('invited-beta');const login=await request('/api/session',{method:'POST',body:{token:invitation}});assert.equal(login.status,200);assert.match(login.headers['set-cookie'][0],/Secure/);const cookie=login.headers['set-cookie'][0].split(';')[0];
 const plan=await request('/api/study/plan',{method:'POST',cookie,body:{revision:0,days:30,minutes:15,weekdays:[0,1,2,3,4,5,6],startDate:new Date().toISOString().slice(0,10)}});assert.equal(plan.status,201);const day=plan.data.plan.entries.find(d=>d.kind!=='rest'),started=await request('/api/study/sessions',{method:'POST',cookie,body:{planId:plan.data.plan.id,day:day.date}});assert.equal(started.status,201);
 const keys=new Map(readBank('./dist/practice.html').questions.map(q=>[q.id,q.answer]));const finished=await request('/api/study/sessions/'+started.data.id,{method:'PUT',cookie,body:{revision:0,index:0,answers:started.data.questions.map(q=>keys.get(q.id)),finish:true}});assert.equal(finished.status,200);assert.equal(finished.data.result.percent,100);assert.equal((await request('/api/checkout',{method:'POST',cookie,body:{}})).status,503);await stop();
 await start('invited-beta');const exported=await request('/api/study/archive',{cookie});assert.equal(exported.data.sessions[0].result.percent,100);await stop();
 store=new Store('/var/data/launch.sqlite');store.db.prepare('VACUUM INTO ?').run('/var/data/backup.sqlite');store.close();assert.equal(verifyBackup('/var/data/backup.sqlite').counts.guided_sessions,1);
 console.log('Container smoke passed: nonroot/read-only image; isolated fictional signup/invitation; three release stages; Secure cookie; guided scoring; process-restart persistence; consistent private backup; no payment or public network.');
}finally{await stop();}
