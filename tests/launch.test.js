import test from 'node:test';
import {request as httpRequest} from 'node:http';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,statSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createHmac} from 'node:crypto';
import {Store,DAY,CONSENT_VERSION,canonicalEmail,digest} from '../server/store.js';
import {createLaunchServer,validateSignup} from '../server/app.js';
import {PASS,StripeTestClient,verifyEvent,fulfill,startCheckout} from '../server/stripe.js';
import {csv,privateOutput} from '../server/owner.js';
import {emptyState} from '../src/storage.js';
const NOW=Date.UTC(2026,9,26,12),SECRET='whsec_fictional_test_fixture';
function fixture(){const dir=mkdtempSync(join(tmpdir(),'beacon-test-')),store=new Store(join(dir,'private.sqlite'));return {store,dir,close(){store.close();rmSync(dir,{recursive:true,force:true});}};}
function account(store,email='tester@example.test'){store.signup(email,null,NOW);const invite=store.invite(email,NOW);return store.redeem(invite,NOW);}
const event=(type,object,id='evt_Fixture')=>({id,type,created:NOW/1000,livemode:false,data:{object}});
function signed(e,stamp=NOW/1000){const raw=Buffer.from(JSON.stringify(e)),sig=`t=${stamp},v1=${createHmac('sha256',SECRET).update(`${stamp}.`).update(raw).digest('hex')}`;return {raw,sig};}
const checkout=accountId=>({id:'cs_test_Fixture',livemode:false,mode:'payment',status:'complete',payment_status:'paid',amount_total:1999,currency:'usd',client_reference_id:accountId,metadata:{account_id:accountId,offer:PASS.version},payment_intent:'pi_Fixture',url:'https://checkout.stripe.com/c/pay/cs_test_Fixture'});
const mockClient=acct=>({async create(){return checkout(acct.id);},async retrieve(){return checkout(acct.id);}});
async function httpFixture(t,options={}) {
 const f=fixture();let clock=NOW;const server=createLaunchServer({store:f.store,staticRoot:resolve('dist'),now:()=>clock,...options});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
 t.after(async()=>{await new Promise(r=>server.close(r));f.close();});
 const request=async(path,body,extra={})=>{const response=await fetch(origin+path,{method:body===undefined?'GET':'POST',headers:{...(body===undefined?{}:{origin,'Content-Type':'application/json'}),...extra.headers},...(body===undefined?{}:{body:JSON.stringify(body)}),...Object.fromEntries(Object.entries(extra).filter(([k])=>k!=='headers'))});return {status:response.status,body:await response.json(),headers:response.headers};};
 const login=async(email='tester@example.test')=>{f.store.signup(email,null,NOW);const token=f.store.invite(email,NOW),response=await request('/api/session',{token});return response.headers.get('set-cookie').split(';')[0];};
 return {...f,server,origin,request,login,advance(value){clock=value;}};
}
test('signup enforces contact consent, adult eligibility, canonical email and optional real future dates',()=>{
 const input={email:' Test+beta@Example.test ',consent:true,adult:true,consentVersion:CONSENT_VERSION};
 assert.deepEqual(validateSignup(input,NOW),{email:'test+beta@example.test',testDate:null});
 assert.equal(validateSignup({...input,testDate:'2027-02-28'},NOW).testDate,'2027-02-28');
 for(const changes of [{consent:false},{adult:false},{consentVersion:'old'},{email:'bad\r\n@example.test'},{email:'a@localhost'},{testDate:'2027-02-29'},{testDate:'2020-01-01'},{testDate:'2035-01-01'},{testDate:23}])assert.throws(()=>validateSignup({...input,...changes},NOW));
 assert.equal(canonicalEmail('+spreadsheet@example.test'),'+spreadsheet@example.test');
});
test('beta requests deduplicate without allowing unauthenticated profile updates; data is private on disk',()=>{
 const f=fixture();try{f.store.signup('a@example.test','2027-01-01',NOW);f.store.signup('a@example.test','2028-01-01',NOW+1);assert.equal(f.store.all('SELECT * FROM signups').length,1);assert.equal(f.store.one('SELECT test_date FROM signups').test_date,'2027-01-01');assert.equal(statSync(f.store.filename).mode&0o777,0o600);assert.throws(()=>new Store(resolve('public.sqlite')));}finally{f.close();}
});
test('single-use expiring invitation and hashed sessions cannot create accounts for non-consenting addresses',()=>{
 const f=fixture();try{assert.throws(()=>f.store.invite('unknown@example.test',NOW));f.store.signup('a@example.test',null,NOW);const invite=f.store.invite('a@example.test',NOW);assert.equal(f.store.redeem(invite,NOW+31*60_000),null);const fresh=f.store.invite('a@example.test',NOW);const result=f.store.redeem(fresh,NOW);assert.ok(result.account);assert.equal(f.store.redeem(fresh,NOW),null);assert.equal(f.store.account(result.session,NOW).email,'a@example.test');assert.equal(f.store.account(result.session,NOW+7*DAY),undefined);assert.notEqual(f.store.one('SELECT hash FROM sessions').hash,result.session);assert.equal(f.store.access(result.account,NOW+90*DAY).beta,false);}finally{f.close();}
});
test('private CSV defangs spreadsheet formulas and protects exports from overwrite and static publishing',()=>{
 const result=csv([{email:'+formula@example.test',message:' =1+1\n"quoted"'}],['email','message']);assert.match(result,/"'\+formula/);assert.match(result,/"' =1\+1/);assert.match(result,/""quoted""/);
 const f=fixture();try{const filename=join(f.dir,'signups.csv');privateOutput(filename,result);assert.equal(readFileSync(filename,'utf8'),result);assert.equal(statSync(filename).mode&0o777,0o600);assert.throws(()=>privateOutput(filename,'overwrite'));assert.throws(()=>privateOutput(resolve('dist','signups.csv'),result));}finally{f.close();}
});
test('SQLite backup is consistent, private and restorable; pruning respects active beta accounts',()=>{
 const f=fixture();try{const a=account(f.store);f.store.signup('old@example.test',null,NOW-91*DAY);f.store.prune(NOW);assert.equal(f.store.one('SELECT email FROM signups WHERE email=?','old@example.test'),undefined);assert.ok(f.store.one('SELECT email FROM signups WHERE email=?',a.account.email));const filename=privateOutput(join(f.dir,'snapshot.sqlite'),'');f.store.db.prepare('VACUUM INTO ?').run(filename);const restored=new Store(filename);try{assert.equal(restored.one('PRAGMA integrity_check').integrity_check,'ok');assert.equal(restored.one('SELECT email FROM accounts').email,a.account.email);}finally{restored.close();}}finally{f.close();}
});
test('HTTP recruitment rejects CSRF, malformed consent and oversized requests, and does not expose a signup directory',async t=>{
 const f=await httpFixture(t),input={email:'a@example.test',consent:true,adult:true,consentVersion:CONSENT_VERSION};
 assert.equal((await f.request('/api/beta-signups',input,{headers:{origin:'https://evil.test'}})).status,403);
 assert.equal((await f.request('/api/beta-signups',{...input,consent:false})).status,400);
 const first=await f.request('/api/beta-signups',input),second=await f.request('/api/beta-signups',input);assert.equal(first.status,202);assert.deepEqual(first.body,second.body);assert.equal(first.headers.get('cache-control'),'no-store');
 assert.equal((await f.request('/api/beta-signups')).status,401);assert.equal((await f.request('/api/export')).status,401);
 assert.equal((await f.request('/api/session',{token:'x'.repeat(9000)})).status,413);
 const wrongHost=await new Promise((resolve,reject)=>{const req=httpRequest(f.origin+'/api/config',{headers:{host:'evil.test'}},response=>{response.resume();resolve(response.statusCode);});req.on('error',reject);req.end();});assert.equal(wrongHost,403);
});
test('signup throttling and honeypot avoid storing obvious bots, without false success from unavailable endpoints',async t=>{
 const f=await httpFixture(t,{signupLimit:2}),input={email:'bot@example.test',consent:true,adult:true,consentVersion:CONSENT_VERSION,website:'spam'};
 assert.equal((await f.request('/api/beta-signups',input)).status,202);assert.equal(f.store.all('SELECT * FROM signups').length,0);
 await f.request('/api/beta-signups',input);assert.equal((await f.request('/api/beta-signups',input)).status,429);
 f.advance(NOW+16*60_000);assert.equal((await f.request('/api/beta-signups',{...input,website:''})).status,202);
});
test('account sessions are HttpOnly, expire, log out, and isolate each learner cloud copy',async t=>{
 const f=await httpFixture(t),cookie=await f.login();
 assert.match(cookie,/^beacon_session=/);const token=f.store.invite('tester@example.test',NOW);const login=await f.request('/api/session',{token});assert.match(login.headers.get('set-cookie'),/HttpOnly; SameSite=Strict; Path=\/api/);
 const headers={cookie};const saved=await f.request('/api/progress',{revision:0,state:emptyState()},{method:'PUT',headers});assert.equal(saved.status,200);
 const other=await f.login('second@example.test');assert.equal((await f.request('/api/progress',undefined,{headers:{cookie:other}})).body.revision,0);
 assert.equal((await f.request('/api/progress',undefined,{headers})).body.revision,1);
 assert.equal((await f.request('/api/session',{}, {method:'DELETE',headers})).status,200);assert.equal((await f.request('/api/account',undefined,{headers})).status,401);
 f.advance(NOW+7*DAY);assert.equal((await f.request('/api/account',undefined,{headers:{cookie:other}})).status,401);
});
test('cloud progress uses optimistic concurrency, validates backups, and never transports live timers',async t=>{
 const f=await httpFixture(t),cookie=await f.login(),headers={cookie},state=emptyState();state.lessons['old-lesson']=new Date(NOW).toISOString();state.active={courseId:'linear-equations',mode:'timed',ids:['old-question'],answers:[null],index:0,deadline:NOW+1000};
 assert.equal((await f.request('/api/progress',{revision:0,state},{method:'PUT',headers})).status,200);
 const loaded=(await f.request('/api/progress',undefined,{headers})).body;assert.equal(loaded.state.active,null);assert.ok(loaded.state.lessons['old-lesson']);
 assert.equal((await f.request('/api/progress',{revision:0,state:emptyState()},{method:'PUT',headers})).status,409);
 assert.equal((await f.request('/api/progress',{revision:1,state:{schemaVersion:999}},{method:'PUT',headers})).status,400);
 assert.deepEqual((await f.request('/api/progress',undefined,{headers})).body,loaded);
});
test('private feedback and account deletion remain authenticated and remove related development records',async t=>{
 const f=await httpFixture(t),cookie=await f.login(),headers={cookie};assert.equal((await f.request('/api/feedback',{category:'content',questionId:'q0001',message:'Please explain the final rounding step.'},{headers})).status,201);assert.equal(f.store.all('SELECT * FROM feedback').length,1);
 assert.equal((await f.request('/api/account',{confirm:'wrong'},{method:'DELETE',headers})).status,400);
 assert.equal((await f.request('/api/account',{confirm:'DELETE'},{method:'DELETE',headers})).status,200);
 for(const table of ['accounts','signups','sessions','feedback'])assert.equal(f.store.all('SELECT * FROM '+table).length,0);
});
test('webhook signature requires untouched raw bytes, recent timestamp, test livemode, and matching HMAC',()=>{
 const e=event('checkout.session.completed',{id:'cs_test_Fixture'}),{raw,sig}=signed(e);assert.deepEqual(verifyEvent(raw,sig,SECRET,NOW),e);assert.throws(()=>verifyEvent(Buffer.from(raw.toString()+' '),sig,SECRET,NOW));assert.throws(()=>verifyEvent(raw,sig,SECRET,NOW+301_000));assert.throws(()=>verifyEvent(raw,sig.replace('v1=','v1=0'),SECRET,NOW));assert.throws(()=>verifyEvent(raw,sig+',t=1',SECRET,NOW));const live=signed({...e,livemode:true});assert.throws(()=>verifyEvent(live.raw,live.sig,SECRET,NOW));
});
test('Stripe adapter rejects live credentials and checkout cannot accept client-supplied prices or destinations',async()=>{
 assert.throws(()=>new StripeTestClient('sk_live_fake'));let request;const client=new StripeTestClient('sk_test_Fixture',async(url,options)=>{request={url,options};return {ok:true,json:async()=>({})};});await client.create({id:'account-1'},'http://127.0.0.1:8001','retry-1');const form=new URLSearchParams(request.options.body);assert.equal(form.get('line_items[0][price_data][unit_amount]'),'1999');assert.equal(form.get('line_items[0][price_data][currency]'),'usd');assert.equal(form.get('mode'),'payment');assert.equal(form.get('payment_method_types[0]'),'card');assert.equal(request.options.headers['Idempotency-Key'],'retry-1');assert.ok(!form.has('customer_email'));assert.throws(()=>client.retrieve('cs_live_fake'));
});
test('checkout retries reuse one reservation and idempotency key without generating a second purchase',async()=>{
 const f=fixture();try{const {account:a}=account(f.store),keys=[];let first=true;const client={async create(a,o,key){keys.push(key);if(first){first=false;throw new Error('timeout');}return checkout(a.id);}};await assert.rejects(startCheckout(f.store,a,client,'http://127.0.0.1:8001',NOW));await startCheckout(f.store,a,client,'http://127.0.0.1:8001',NOW);assert.equal(keys[0],keys[1]);assert.equal(f.store.all('SELECT * FROM checkouts').length,1);await startCheckout(f.store,a,client,'http://127.0.0.1:8001',NOW);assert.equal(keys.length,2);await assert.rejects(startCheckout(f.store,a,client,'http://127.0.0.1:8001',NOW+DAY),/reconciliation/);}finally{f.close();}
});
test('only a verified settled checkout grants exactly 90 days and replay never extends access',async()=>{
 const f=fixture();try{const {account:a}=account(f.store),client=mockClient(a);await startCheckout(f.store,a,client,'http://127.0.0.1:8001',NOW);assert.equal(f.store.access(a,NOW).pass,false);const e=event('checkout.session.completed',{id:'cs_test_Fixture'});await fulfill(f.store,e,client,NOW);assert.equal(f.store.access(a,NOW).passUntil,NOW+90*DAY);await fulfill(f.store,e,client,NOW+DAY);await fulfill(f.store,{...e,id:'evt_Duplicate',created:NOW/1000+DAY/1000},client,NOW+DAY);assert.equal(f.store.access(a,NOW).passUntil,NOW+90*DAY);assert.equal(f.store.access(a,NOW+90*DAY-1).pass,true);assert.equal(f.store.access(a,NOW+90*DAY).pass,false);await assert.rejects(startCheckout(f.store,a,client,'http://127.0.0.1:8001',NOW),/active/);}finally{f.close();}
});
test('unpaid returns, bad amounts, metadata mismatch and live sessions never unlock an Exam Pass',async()=>{
 const f=fixture();try{const {account:a}=account(f.store),client=mockClient(a);await startCheckout(f.store,a,client,'http://127.0.0.1:8001',NOW);for(const change of [{amount_total:1},{currency:'eur'},{metadata:{}},{client_reference_id:'another'},{livemode:true}])await assert.rejects(fulfill(f.store,event('checkout.session.completed',{id:'cs_test_Fixture'}),{retrieve:async()=>({...checkout(a.id),...change})},NOW));await fulfill(f.store,event('checkout.session.completed',{id:'cs_test_Fixture'}),{retrieve:async()=>({...checkout(a.id),payment_status:'unpaid'})},NOW);assert.equal(f.store.access(a,NOW).pass,false);await fulfill(f.store,event('checkout.session.async_payment_succeeded',{id:'cs_test_Fixture'},'evt_Settled'),client,NOW);assert.equal(f.store.access(a,NOW).pass,true);}finally{f.close();}
});
test('refunds and disputes revoke access even when delivered before payment; failed events cannot undo settled payment',async()=>{
 for(const early of [true,false]){const f=fixture();try{const {account:a}=account(f.store),client=mockClient(a);await startCheckout(f.store,a,client,'http://127.0.0.1:8001',NOW);const refund=event('charge.refunded',{payment_intent:'pi_Fixture',amount_refunded:100},'evt_Refund'),paid=event('checkout.session.completed',{id:'cs_test_Fixture'});if(early)await fulfill(f.store,refund,client,NOW);await fulfill(f.store,paid,client,NOW);if(!early)await fulfill(f.store,refund,client,NOW);assert.equal(f.store.access(a,NOW).pass,false);await fulfill(f.store,event('checkout.session.async_payment_failed',{id:'cs_test_Fixture'},'evt_Failed'),client,NOW);assert.equal(f.store.one('SELECT state FROM checkouts').state,'paid');}finally{f.close();}}
});
test('HTTP webhook integration rejects forged events and test Checkout remains disabled without configuration',async t=>{
 const f=await httpFixture(t),cookie=await f.login();assert.equal((await f.request('/api/checkout',{amount:1},{headers:{cookie}})).status,503);assert.equal((await f.request('/api/stripe/webhook',{})).status,503);
});
test('HTTP signed webhook grants only the referenced account and protects premium endpoints on expiry',async t=>{
 let client;const f=await httpFixture(t,{stripe:{create(...a){return client.create(...a);},retrieve(...a){return client.retrieve(...a);}},webhookSecret:SECRET}),cookie=await f.login(),a=f.store.one('SELECT * FROM accounts');client=mockClient(a);f.store.run('UPDATE accounts SET beta_until=? WHERE id=?',NOW,a.id);
 assert.equal((await f.request('/api/progress',{revision:0,state:emptyState()},{method:'PUT',headers:{cookie}})).status,403);
 assert.equal((await f.request('/api/progress',undefined,{headers:{cookie}})).status,200);
 const started=await f.request('/api/checkout',{amount:1,successUrl:'https://evil.test'},{headers:{cookie}});assert.equal(started.status,200);
 const {raw,sig}=signed(event('checkout.session.completed',{id:'cs_test_Fixture'}));
 let response=await fetch(f.origin+'/api/stripe/webhook',{method:'POST',body:raw,headers:{'stripe-signature':'bad'}});assert.equal(response.status,400);
 response=await fetch(f.origin+'/api/stripe/webhook',{method:'POST',body:raw,headers:{'stripe-signature':sig}});assert.equal(response.status,200);
 assert.equal((await f.request('/api/progress',undefined,{headers:{cookie}})).status,200);
});

test('production startup and externally bound origins are refused by the development-only service',()=>{
 const f=fixture();try{assert.throws(()=>createLaunchServer({store:f.store,staticRoot:'dist',origin:'https://example.test'}),/loopback/);const old=process.env.NODE_ENV;try{process.env.NODE_ENV='production';assert.throws(()=>createLaunchServer({store:f.store,staticRoot:'dist'}),/development-only/);}finally{if(old===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=old;}}finally{f.close();}
});
test('a paid pass revocation also applies to disputes and different event deliveries cannot resurrect it',async()=>{
 const f=fixture();try{const {account:a}=account(f.store),client=mockClient(a);await startCheckout(f.store,a,client,'http://127.0.0.1:8001',NOW);await fulfill(f.store,event('checkout.session.completed',{id:'cs_test_Fixture'}),client,NOW);await fulfill(f.store,event('charge.dispute.created',{payment_intent:'pi_Fixture'},'evt_Dispute'),client,NOW);await fulfill(f.store,event('checkout.session.completed',{id:'cs_test_Fixture'},'evt_ReplayedPaid'),client,NOW);assert.equal(f.store.access(a,NOW).pass,false);}finally{f.close();}
});
