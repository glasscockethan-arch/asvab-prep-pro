import test from 'node:test';
import assert from 'node:assert/strict';
import {request as httpRequest} from 'node:http';
import {mkdtempSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {Store,CONSENT_VERSION} from '../server/store.js';
import {createLaunchServer} from '../server/app.js';
import {publicOrigin,hostedSettings} from '../server/hosting.js';
const PUBLIC='https://beacon-example.onrender.com',NOW=Date.UTC(2026,9,26,12);
function fixture(t){const dir=mkdtempSync(join(tmpdir(),'beacon-hosted-')),file=join(dir,'hosted.sqlite'),store=new Store(file);t.after(()=>{store.close();rmSync(dir,{recursive:true,force:true});});return {dir,file,store};}
async function hosted(t,stage){const f=fixture(t),server=createLaunchServer({store:f.store,staticRoot:resolve('dist'),now:()=>NOW,deployment:{mode:'hosted-beta',stage,origin:PUBLIC}});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));const local=`http://127.0.0.1:${server.address().port}`;const request=(route,{body,method=body===undefined?'GET':'POST',headers={}}={})=>new Promise((resolve,reject)=>{const req=httpRequest(local+route,{method,headers:{host:new URL(PUBLIC).host,origin:PUBLIC,'x-forwarded-proto':'https','content-type':'application/json',...(body===undefined?{}:{'content-length':Buffer.byteLength(JSON.stringify(body))}),...headers}},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:JSON.parse(Buffer.concat(chunks))}));});req.on('error',error=>{error.message+=' '+method+' '+route;reject(error);});req.end(body===undefined?undefined:JSON.stringify(body));});return {...f,server,request};}
const signup={email:'volunteer@example.test',adult:true,consent:true,consentVersion:CONSENT_VERSION};
test('hosted settings require an explicit HTTPS origin and persistent path, and default closed without payment configuration',()=>{
 const input={NODE_ENV:'production',BEACON_PUBLIC_ORIGIN:PUBLIC,BEACON_DB_PATH:'/var/data/beta.sqlite'};assert.equal(hostedSettings(input).stage,'closed');assert.equal(hostedSettings(input).port,10000);
 for(const change of [{NODE_ENV:'development'},{BEACON_PUBLIC_ORIGIN:'http://public.example.test'},{BEACON_PUBLIC_ORIGIN:'https://user:pass@example.test'},{BEACON_PUBLIC_ORIGIN:'https://example.test/path'},{BEACON_PUBLIC_ORIGIN:'https://127.0.0.1'},{BEACON_DB_PATH:'/tmp/beta.sqlite'},{BEACON_DB_PATH:'/var/data/../leak.sqlite'},{BEACON_RELEASE_STAGE:'paid'},{STRIPE_SECRET_KEY:'sk_test_Fixture'},{STRIPE_WEBHOOK_SECRET:'whsec_Fixture'},{BEACON_STRIPE_TEST_MODE:'true'},{PORT:'80'}])assert.throws(()=>hostedSettings({...input,...change}));
 assert.equal(publicOrigin(PUBLIC+'/'),PUBLIC);
});
test('closed beta accepts only noncollecting config/health; proxies and fixed host/origin remain enforced',async t=>{
 const f=await hosted(t,'closed');assert.equal((await f.request('/healthz',{headers:{host:'internal-health-probe','x-forwarded-proto':''}})).status,200);
 const config=await f.request('/api/config');assert.equal(config.body.betaOpen,false);assert.equal(config.body.stage,'closed');assert.equal(config.body.testCheckout,false);
 assert.equal((await f.request('/api/beta-signups',{body:signup})).status,503);assert.equal(f.store.all('SELECT * FROM signups').length,0);
 assert.equal((await f.request('/api/config',{headers:{'x-forwarded-proto':'http'}})).status,403);assert.equal((await f.request('/api/config',{headers:{host:'evil.test','x-forwarded-host':new URL(PUBLIC).host}})).status,403);
});
test('signup-only beta stores consent privately but cannot redeem invitations or accept payment events',async t=>{
 const f=await hosted(t,'signup');assert.equal((await f.request('/api/beta-signups',{body:signup})).status,202);assert.equal(f.store.all('SELECT * FROM signups').length,1);
 const invitation=f.store.invite(signup.email,NOW);assert.equal((await f.request('/api/session',{body:{token:invitation}})).status,503);assert.equal(f.store.all('SELECT * FROM accounts').length,0);assert.equal((await f.request('/api/stripe/webhook',{body:{}})).status,503);
});
test('invited beta uses Secure/HttpOnly sessions, CSP and HSTS; CSRF and all payment routes stay blocked',async t=>{
 const f=await hosted(t,'invited-beta');await f.request('/api/beta-signups',{body:signup});const token=f.store.invite(signup.email,NOW);const login=await f.request('/api/session',{body:{token}});assert.equal(login.status,200);assert.match(login.headers['set-cookie'][0],/Secure/);assert.match(login.headers['set-cookie'][0],/HttpOnly; SameSite=Strict/);assert.match(login.headers['strict-transport-security'],/max-age/);assert.match(login.headers['content-security-policy'],/frame-ancestors 'none'/);
 const cookie=login.headers['set-cookie'][0].split(';')[0];assert.equal((await f.request('/api/account',{headers:{cookie}})).status,200);assert.equal((await f.request('/api/checkout',{body:{},headers:{cookie}})).status,503);assert.equal((await f.request('/api/stripe/webhook',{body:{}})).status,503);
 assert.equal((await f.request('/api/session',{method:'DELETE',body:{},headers:{cookie,origin:'https://evil.test'}})).status,403);const logout=await f.request('/api/session',{method:'DELETE',body:{},headers:{cookie}});assert.match(logout.headers['set-cookie'][0],/Max-Age=0; Secure/);
});
test('hosted throttle persists through database reopen and expires without recording an IP address',t=>{
 const f=fixture(t);assert.equal(f.store.rateLimit('signup-email:fixture-digest',2,NOW),true);assert.equal(f.store.rateLimit('signup-email:fixture-digest',2,NOW),true);const second=new Store(f.file);try{assert.equal(second.rateLimit('signup-email:fixture-digest',2,NOW),false);assert.equal(second.rateLimit('signup-email:fixture-digest',2,NOW+16*60_000),true);assert.equal(second.one('SELECT total FROM rate_limits').total,1);}finally{second.close();}
});
test('hosted beta cannot inject a Stripe adapter even in test mode',t=>{
 const f=fixture(t);assert.throws(()=>createLaunchServer({store:f.store,staticRoot:'dist',deployment:{mode:'hosted-beta',stage:'invited-beta',origin:PUBLIC},stripe:{}}),/payments are disabled/);
});
