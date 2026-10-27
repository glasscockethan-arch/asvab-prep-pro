import test from 'node:test';
import {verifyBackup} from '../server/verify-backup.js';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {Store,DAY} from '../server/store.js';
import {createLaunchServer} from '../server/app.js';
import {readBank,SUBJECTS,calendarDate,validatePlan,evidence,makePlan,createPlan,startSession,updateSession,sessionView,completeDay,archiveSession,studyArchive,studySnapshot} from '../server/study.js';
import {emptyState} from '../src/storage.js';
const NOW=Date.UTC(2026,9,26,12),bank=readBank('practice.html');
const settings=(changes={})=>({days:30,minutes:30,weekdays:[1,2,3,4,5],startDate:'2026-10-26',revision:0,...changes});
function fixture(t) {const dir=mkdtempSync(join(tmpdir(),'beacon-study-')),store=new Store(join(dir,'study.sqlite'));t.after(()=>{store.close();rmSync(dir,{recursive:true,force:true});});const login=(email='study@example.test')=>{store.signup(email,null,NOW);return store.redeem(store.invite(email,NOW),NOW);};return {dir,store,login};}
function firstSession(f,a){const snapshot=createPlan(f.store,a,settings(),bank,NOW),day=snapshot.plan.entries.find(d=>d.kind!=='rest');return startSession(f.store,a,{planId:snapshot.plan.id,day:day.date},bank,NOW);}
function finish(f,a,s,wrong=false){const questions=new Map(bank.questions.map(q=>[q.id,q]));return updateSession(f.store,a,s.id,{revision:s.revision,index:0,answers:s.questions.map(q=>wrong?(questions.get(q.id).answer+1)%4:questions.get(q.id).answer),finish:true},bank,NOW+60_000);}
function saveHistory(store,a,details,dates=[NOW-1000]){const state=emptyState();state.legacy={history:dates.map(date=>({date:new Date(date).toISOString(),mode:'diagnostic',details})),missed:[],week:1};store.run('INSERT INTO progress VALUES(?,?,?,?)',a.id,1,JSON.stringify(state),NOW);}
test('30/60/90 calendars preserve actual calendar days, weekdays, budgets, balanced checkpoints and bounded question counts',t=>{
 const f=fixture(t),a=f.login().account,profile=evidence(f.store,a,bank,NOW);
 for(const days of [30,60,90])for(const minutes of [15,30,45,60]){
  const config=settings({days,minutes}),plan=makePlan(config,profile,NOW,'test-plan-id');assert.equal(plan.entries.length,days);assert.equal(calendarDate(plan.endDate)-calendarDate(plan.startDate),(days-1)*DAY);
  const scheduled=plan.entries.filter(d=>d.kind!=='rest');assert.equal(scheduled.length,plan.studyDays);assert.equal(scheduled.at(-1).kind,'checkpoint');assert.ok(scheduled.every(d=>d.questionCount>=4&&d.questionCount<=20));assert.ok(scheduled.filter(d=>d.kind==='checkpoint').every(d=>d.questionCount%4===0));assert.deepEqual(new Set(scheduled.filter(d=>d.subject).map(d=>d.subject)),new Set(SUBJECTS));assert.ok(plan.entries.filter(d=>d.kind==='rest').every(d=>[0,6].includes(d.weekday)));
 }
 const leap=makePlan(settings({days:30,startDate:'2028-02-20'}),profile,NOW);assert.ok(leap.entries.some(d=>d.date==='2028-02-29'));assert.equal(leap.entries[10].date,'2028-03-01');
});
test('plan validation rejects malformed dates, duplicate weekdays, unsupported horizons/budgets, stale starts and revisions',()=>{
 for(const change of [{days:31},{days:'30'},{minutes:5},{weekdays:[]},{weekdays:[1,1]},{weekdays:[8]},{weekdays:['1']},{startDate:'2026-02-29'},{startDate:'2020-01-01'},{startDate:'2026-12-01'},{revision:-1}])assert.throws(()=>validatePlan(settings(change),NOW));
 assert.equal(validatePlan(settings(),NOW).days,30);
});
test('missing evidence is labeled as missing, not as a weak skill or official readiness conclusion',t=>{
 const f=fixture(t),a=f.login().account,p=evidence(f.store,a,bank,NOW);assert.ok(p.subjects.every(s=>s.accuracy===null&&s.status==='baseline-needed'));assert.match(p.recommendations[0].reason,/does not establish weakness/);assert.match(studySnapshot(f.store,a,bank,NOW).dashboard.limits,/not validated readiness/);
});
test('practice evidence deduplicates imports and repeated questions, ignores client correctness flags, and uses current canonical keys',t=>{
 const f=fixture(t),a=f.login().account,qs=bank.questions.filter(q=>q.subject===SUBJECTS[0]).slice(0,12),details=qs.map(q=>({...q,chosen:(q.answer+1)%4,correct:true,answer:(q.answer+1)%4}));saveHistory(f.store,a,[...details,...details],[NOW-2000,NOW-1000,NOW-1000]);
 const p=evidence(f.store,a,bank,NOW);assert.equal(p.subjects[0].answered,12);assert.equal(p.subjects[0].correct,0);assert.equal(p.subjects[0].status,'focus-next');assert.equal(p.recommendations[0].subject,SUBJECTS[0]);assert.equal(p.subjects[1].status,'baseline-needed');assert.equal(p.subjects[1].accuracy,null);
});
test('old, future, unknown and non-AFQT practice is excluded; unanswered items are transparent and do not fabricate accuracy',t=>{
 const f=fixture(t),a=f.login().account,qs=bank.questions.filter(q=>q.subject===SUBJECTS[0]).slice(0,10);saveHistory(f.store,a,[...qs.map(q=>({...q,chosen:null})),{id:'q9999',chosen:0}],[NOW-31*DAY,NOW+DAY,NOW-1000]);const p=evidence(f.store,a,bank,NOW);assert.equal(p.subjects[0].answered,0);assert.equal(p.subjects[0].unanswered,10);assert.equal(p.subjects[0].accuracy,null);assert.ok(p.excluded>0);
});
test('guided practice reuses unique existing IDs, prioritizes known missed items, and checkpoints cover all four subjects',t=>{
 const f=fixture(t),a=f.login().account,q=bank.questions[0];saveHistory(f.store,a,[{...q,chosen:(q.answer+1)%4}]);const snapshot=createPlan(f.store,a,settings(),bank,NOW),day=snapshot.plan.entries.find(d=>d.subject===q.subject),s=startSession(f.store,a,{planId:snapshot.plan.id,day:day.date},bank,NOW);assert.equal(s.questions[0].id,q.id);assert.equal(new Set(s.questions.map(q=>q.id)).size,s.questions.length);assert.ok(s.questions.every(q=>bank.questions.some(original=>original.id===q.id)&&!Object.hasOwn(q,'answer')));archiveSession(f.store,a,s.id);
 const checkpoint=snapshot.plan.entries.find(d=>d.kind==='checkpoint'),mixed=startSession(f.store,a,{planId:snapshot.plan.id,day:checkpoint.date},bank,NOW);assert.deepEqual(new Set(mixed.questions.map(q=>q.subject)),new Set(SUBJECTS));
});
test('only server-derived scoring completes a guided session; saved position/answers survive reads and reject stale edits',t=>{
 const f=fixture(t),a=f.login().account,s=firstSession(f,a),answers=s.questions.map((_,i)=>i===0?0:null);const saved=updateSession(f.store,a,s.id,{revision:0,index:2,answers,finish:false},bank,NOW);assert.equal(saved.revision,1);assert.equal(sessionView(f.store,a,s.id,bank).index,2);assert.equal(sessionView(f.store,a,s.id,bank).answers[0],0);assert.throws(()=>updateSession(f.store,a,s.id,{revision:0,index:0,answers,finish:true},bank,NOW),/Another device/);
 assert.throws(()=>updateSession(f.store,a,s.id,{revision:1,index:0,answers:[7],finish:false},bank,NOW));const result=finish(f,a,saved);assert.equal(result.result.percent,100);assert.ok(result.result.details.every(q=>q.chosen===q.answer&&q.correct));assert.equal(evidence(f.store,a,bank,NOW+60_000).completed.length,1);assert.throws(()=>finish(f,a,result),/already ended/);
});
test('marking a calendar day complete requires its own finished session and review/reflection; it is idempotent',t=>{
 const f=fixture(t),a=f.login().account,s=firstSession(f,a);const input={planId:s.planId,day:s.day,sessionId:s.id,reviewed:true,reflected:true};assert.throws(()=>completeDay(f.store,a,input,NOW),/Complete this day/);finish(f,a,s);assert.throws(()=>completeDay(f.store,a,{...input,reviewed:false},NOW));assert.throws(()=>completeDay(f.store,a,{...input,day:'2026-10-27'},NOW));completeDay(f.store,a,input,NOW);completeDay(f.store,a,input,NOW);assert.equal(studySnapshot(f.store,a,bank,NOW).completions.length,1);
});
test('replanning preserves old plans/results, checks revisions, and never silently abandons an unfinished session',t=>{
 const f=fixture(t),a=f.login().account,s=firstSession(f,a);assert.throws(()=>createPlan(f.store,a,settings({revision:1}),bank,NOW),/unfinished/);finish(f,a,s);assert.throws(()=>createPlan(f.store,a,settings({revision:0}),bank,NOW),/another device/);createPlan(f.store,a,settings({revision:1,days:60}),bank,NOW);const exported=studyArchive(f.store,a,NOW);assert.equal(exported.plans.length,2);assert.equal(exported.sessions.length,1);assert.equal(exported.sessions[0].state,'completed');
});
test('account isolation and changed content revision guard active sessions without deleting archived evidence',t=>{
 const f=fixture(t),a=f.login().account,b=f.login('other@example.test').account,s=firstSession(f,a);assert.throws(()=>sessionView(f.store,b,s.id,bank),/not found/);assert.throws(()=>archiveSession(f.store,b,s.id),/not found/);assert.equal(studyArchive(f.store,b,NOW).sessions.length,0);assert.throws(()=>sessionView(f.store,a,s.id,{...bank,hash:'changed'}),/bank changed/);assert.throws(()=>updateSession(f.store,a,s.id,{revision:0}, {...bank,hash:'changed'},NOW),/bank changed/);archiveSession(f.store,a,s.id);assert.equal(studyArchive(f.store,a,NOW).sessions[0].state,'archived');
});
test('additive database initialization preserves an older account/cloud row; deletion cascades through study records',t=>{
 const dir=mkdtempSync(join(tmpdir(),'beacon-migrate-')),file=join(dir,'old.sqlite'),old=new DatabaseSync(file);old.exec('PRAGMA foreign_keys=ON; CREATE TABLE accounts(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,created INTEGER NOT NULL,beta_until INTEGER NOT NULL); CREATE TABLE progress(account TEXT PRIMARY KEY REFERENCES accounts(id),revision INTEGER NOT NULL,body TEXT NOT NULL,updated INTEGER NOT NULL);');old.prepare('INSERT INTO accounts VALUES(?,?,?,?)').run('original-account','original@example.test',NOW,NOW+90*DAY);const original=JSON.stringify(emptyState());old.prepare('INSERT INTO progress VALUES(?,?,?,?)').run('original-account',4,original,NOW);old.close();const store=new Store(file);try{assert.equal(store.one('SELECT body FROM progress').body,original);assert.equal(store.one('SELECT revision FROM progress').revision,4);const a=store.one('SELECT * FROM accounts');createPlan(store,a,settings(),bank,NOW);assert.equal(studyArchive(store,a,NOW).plans.length,1);}finally{store.close();rmSync(dir,{recursive:true,force:true});}
 const f=fixture(t),a=f.login().account,s=firstSession(f,a);finish(f,a,s);f.store.deleteAccount(a.email);for(const table of ['study_plans','guided_sessions','study_days'])assert.equal(f.store.all('SELECT * FROM '+table).length,0);
});
async function http(t){const f=fixture(t);let clock=NOW;const server=createLaunchServer({store:f.store,staticRoot:resolve('dist'),now:()=>clock});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));const origin=`http://127.0.0.1:${server.address().port}`;const {session,account}=f.login(),cookie='beacon_session='+session;const request=async(path,body,method=body===undefined?'GET':'POST',withCookie=true)=>{const r=await fetch(origin+path,{method,headers:{origin,'Content-Type':'application/json',...(withCookie?{cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:r.status,body:await r.json()};};return {...f,account,request,advance(now){clock=now;}};}
test('HTTP premium boundaries deny anonymous/free/expired users and ignore spoofed paid flags, while exports remain available',async t=>{
 const f=await http(t);assert.equal((await f.request('/api/study',undefined,'GET',false)).status,401);assert.equal((await f.request('/api/study')).status,200);f.store.run('UPDATE accounts SET beta_until=?',NOW);
 assert.equal((await f.request('/api/study')).status,403);assert.equal((await f.request('/api/study/plan',{...settings(),paid:true,passUntil:NOW+90*DAY})).status,403);assert.equal((await f.request('/api/study/archive')).status,200);assert.equal((await f.request('/api/progress')).status,200);
});
test('server-owned pass permits guided features, exact expiry blocks changes, and refunds revoke new work without hiding own archive',async t=>{
 const f=await http(t);f.store.run('UPDATE accounts SET beta_until=?',NOW);f.store.run("INSERT INTO checkouts(id,account,state,created,paid_at,expires) VALUES(?,?,'paid',?,?,?)",'test-pass',f.account.id,NOW,NOW,NOW+1000);
 const made=await f.request('/api/study/plan',settings());assert.equal(made.status,201);const day=made.body.plan.entries.find(d=>d.kind!=='rest');const started=await f.request('/api/study/sessions',{planId:made.body.plan.id,day:day.date});assert.equal(started.status,201);
 f.advance(NOW+1000);assert.equal((await f.request('/api/study')).status,403);assert.equal((await f.request('/api/study/sessions/'+started.body.id,{revision:0,answers:started.body.answers,index:0,finish:true},'PUT')).status,403);assert.equal((await f.request('/api/study/archive')).body.sessions.length,1);
 f.advance(NOW);f.store.run('UPDATE checkouts SET revoked=1');assert.equal((await f.request('/api/study/plan',settings())).status,403);assert.equal((await f.request('/api/study/sessions/'+started.body.id,{},'DELETE')).status,200);
});

test('consistent SQLite backup restores plans, canonical results and completion without changing identity',t=>{
 const f=fixture(t),a=f.login().account,s=firstSession(f,a),result=finish(f,a,s);completeDay(f.store,a,{planId:s.planId,day:s.day,sessionId:s.id,reviewed:true,reflected:true},NOW);const path=join(f.dir,'snapshot.sqlite');f.store.db.prepare('VACUUM INTO ?').run(path);assert.equal(verifyBackup(path).counts.guided_sessions,1);const restored=new Store(path);try{assert.deepEqual(sessionView(restored,a,s.id,bank).result,result.result);assert.deepEqual(studySnapshot(restored,a,bank,NOW).completions,[s.day]);assert.equal(studyArchive(restored,a,NOW).plans[0].id,s.planId);}finally{restored.close();}
});
