import {deploymentMode} from './hosting.js';
import {readBank,studySnapshot,createPlan,startSession,sessionView,updateSession,completeDay,archiveSession,studyArchive} from './study.js';
import {createServer} from 'node:http';
import {readFile, realpath} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
import {validateState} from '../src/storage.js';
import {canonicalEmail, CONSENT_VERSION, DAY, digest} from './store.js';
import {verifyEvent, fulfill, startCheckout, PASS} from './stripe.js';
const fail=(status,message)=>Object.assign(new Error(message),{status});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8'};
export function validateSignup(input,now) {
 if(!input||typeof input!=='object'||input.consent!==true||input.adult!==true||input.consentVersion!==CONSENT_VERSION)throw fail(400,'Confirm the beta contact consent and adult eligibility.');
 let email;try {email=canonicalEmail(input.email);}catch(error){throw fail(400,error.message);}
 let testDate=null;
 if(input.testDate!==undefined&&input.testDate!=='') {
  if(typeof input.testDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(input.testDate))throw fail(400,'Enter a valid optional test date.');
  const parsed=Date.parse(input.testDate+'T00:00:00Z');
  if(!Number.isFinite(parsed)||new Date(parsed).toISOString().slice(0,10)!==input.testDate||parsed<now-DAY||parsed>now+3*366*DAY)throw fail(400,'Choose a test date from today through the next three years, or leave it blank.');
  testDate=input.testDate;
 }
 return {email,testDate};
}
export function createLaunchServer({store,staticRoot,now=Date.now,stripe=null,webhookSecret=null,origin=null,signupLimit=8,deployment=null}={}) {
 const hosted=deploymentMode(deployment),mode=hosted?'hosted-beta':'development',stage=hosted?.stage??'invited-beta';
 // The default entry remains local. Hosted operation needs its separate fixed-origin/staged configuration.
 if(hosted&&(stripe||webhookSecret))throw new Error('Hosted beta payments are disabled.');
 if(hosted)origin=hosted.origin;
 if(process.env.NODE_ENV==='production'&&!hosted)throw new Error('The launch service is development-only. Production operation requires separate review and approval.');
 if(!hosted && origin && !/^http:\/\/127\.0\.0\.1:\d+$/.test(origin))throw new Error('Development origin must use the loopback interface.');
 const attempts=new Map(),root=resolve(staticRoot);let bank;
 const getBank=()=>bank??=readBank(resolve(root,'practice.html'));
 const getOrigin=()=>origin??`http://127.0.0.1:${server.address().port}`;
 function limit(key,max) {
  if(hosted){if(!store.rateLimit(key,max,now()))throw fail(429,'Too many requests. Please try again in 15 minutes.');return;}
  const time=now(),old=attempts.get(key),bucket=old&&old.until>time?old:{count:0,until:time+15*60_000};
  if(attempts.size>2000){for(const [k,v] of attempts)if(v.until<=time)attempts.delete(k);if(attempts.size>2000)throw fail(429,'Please try again later.');}
  attempts.set(key,bucket);if(++bucket.count>max)throw fail(429,'Too many requests. Please try again in 15 minutes.');
 }
 async function body(req,max) {
  const chunks=[];let length=0;
  for await (const chunk of req) {length+=chunk.length;if(length>max)throw fail(413,'Request is too large.');chunks.push(chunk);}
  return Buffer.concat(chunks);
 }
 const server=createServer(async(req,res)=>{
  const send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  try {
   const probe=req.url==='/healthz'&&['GET','HEAD'].includes(req.method);
   if(probe){store.one('SELECT 1 AS ready');send(200,{ready:true});return;}
   if(hosted){
    res.setHeader('Strict-Transport-Security','max-age=31536000');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    if(req.headers['x-forwarded-proto']!=='https')throw fail(403,'The approved TLS proxy is required.');
   }
   const configured=new URL(getOrigin());
   if(req.headers.host!==configured.host)throw fail(403,'Unrecognized development host.');
   const url=new URL(req.url,getOrigin()),route=url.pathname;
   if(!route.startsWith('/api/')) {
    if(req.method!=='GET'&&req.method!=='HEAD')throw fail(405,'Method not allowed.');
    let name=decodeURIComponent(route);if(name==='/')name='/index.html';
    const target=resolve(root,'.'+name);
    if(!target.startsWith(root+sep)||!types[extname(target)])throw fail(404,'Page not found.');
    let actual,content;try{actual=await realpath(target);if(!actual.startsWith(root+sep))throw fail(404,'Page not found.');content=await readFile(actual);}catch(error){if(error.status)throw error;throw fail(404,'Page not found.');}
    res.writeHead(200,{'Content-Type':types[extname(target)]});res.end(req.method==='HEAD'?undefined:content);return;
   }
   if(hosted&&route.startsWith('/api/')&&route!=='/api/config'&&(stage==='closed'||stage==='signup'&&route!=='/api/beta-signups'))throw fail(503,'This beta stage is closed for this action. No collection or sign-in was confirmed.');
   if(req.method==='POST'&&route==='/api/stripe/webhook') {
    if(!stripe||!webhookSecret)throw fail(503,'Stripe test webhooks are not configured.');
    limit('webhook:'+req.socket.remoteAddress,120);
    const raw=await body(req,128_000);let event;
    try{event=verifyEvent(raw,req.headers['stripe-signature'],webhookSecret,now());}catch{throw fail(400,'Invalid test webhook signature or event.');}
    try{await fulfill(store,event,stripe,now());}catch{throw fail(503,'Test payment requires retry or owner reconciliation.');}
    send(200,{received:true});return;
   }
   if(!['GET','POST','PUT','DELETE'].includes(req.method))throw fail(405,'Method not allowed.');
   let input={};
   if(req.method!=='GET') {
    if(req.headers.origin!==getOrigin()||req.headers['sec-fetch-site']==='cross-site')throw fail(403,'Use this site to submit the request.');
    if(req.headers['content-type']?.split(';')[0]!=='application/json')throw fail(415,'JSON request required.');
    const raw=await body(req,route==='/api/progress'?1_000_000:8192);
    try{input=JSON.parse(raw.toString('utf8'));}catch{throw fail(400,'Invalid JSON request.');}
    if(input===null||typeof input!=='object'||Array.isArray(input))throw fail(400,'JSON object required.');
   }
   if(req.method==='GET'&&route==='/api/config'){send(200,{mode,stage,betaOpen:stage!=='closed',consentVersion:CONSENT_VERSION,testCheckout:!!stripe&&!!webhookSecret,offer:PASS});return;}
   if(req.method==='POST'&&route==='/api/beta-signups') {
    limit(hosted?'signup-global':'signup:'+req.socket.remoteAddress,hosted?120:signupLimit);
    const signup=validateSignup(input,now());
    if(hosted)limit('signup-email:'+digest(signup.email),3);
    if(!input.website)store.signup(signup.email,signup.testDate,now());
    // Identical response for new, duplicate and honeypot submissions: no address enumeration.
    send(202,{message:'Your beta request has been received. If a place is available, the owner may contact you about the free beta. No payment is required.'});return;
   }
   const cookie=req.headers.cookie?.split(';').map(part=>part.trim()).find(part=>part.startsWith('beacon_session='))?.slice(15)??'';
   if(req.method==='POST'&&route==='/api/session') {
    limit(hosted?'login-global':'login:'+req.socket.remoteAddress,hosted?120:15);
    if(typeof input.token!=='string'||!/^[a-zA-Z0-9_-]{43}$/.test(input.token))throw fail(401,'Invitation is invalid or expired.');
    const result=store.redeem(input.token,now());if(!result)throw fail(401,'Invitation is invalid or expired.');
    if(cookie)store.run('DELETE FROM sessions WHERE hash=?',digest(cookie));
    res.setHeader('Set-Cookie',`beacon_session=${result.session}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=${7*DAY/1000}${hosted?'; Secure':''}`);
    send(200,{signedIn:true});return;
   }
   const account=store.account(cookie,now());
   if(!account)throw fail(401,'Sign in with a fresh private beta invitation.');
   if(req.method==='GET'&&route==='/api/account'){send(200,{email:account.email,access:store.access(account,now()),mode});return;}
   if(req.method==='DELETE'&&route==='/api/session') {store.run('DELETE FROM sessions WHERE hash=?',digest(cookie));res.setHeader('Set-Cookie',`beacon_session=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0${hosted?'; Secure':''}`);send(200,{signedOut:true});return;}
   if(req.method==='DELETE'&&route==='/api/account') {
    if(input.confirm!=='DELETE')throw fail(400,'Type DELETE to remove private development data.');
    store.deleteAccount(account.email);res.setHeader('Set-Cookie',`beacon_session=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0${hosted?'; Secure':''}`);send(200,{deleted:true});return;
   }
   if(req.method==='POST'&&route==='/api/feedback') {
    limit('feedback:'+account.id,10);
    if(!['content','bug','accessibility','other'].includes(input.category)||typeof input.message!=='string'||input.message.trim().length<10||input.message.length>2000||input.questionId&&!/^q\d{4}$/.test(input.questionId))throw fail(400,'Choose a category and enter 10–2,000 characters. Optional question IDs use q0001 format.');
    const {randomUUID}=await import('node:crypto');
    store.run('INSERT INTO feedback VALUES(?,?,?,?,?,?)',randomUUID(),account.id,input.category,input.questionId||null,input.message.trim(),now());send(201,{saved:true});return;
   }
   if(route==='/api/study/archive'&&req.method==='GET'){send(200,studyArchive(store,account,now()));return;}
   const sessionRoute=route.match(/^\/api\/study\/sessions\/([a-zA-Z0-9-]{10,100})$/);
   if(sessionRoute&&req.method==='DELETE'){send(200,archiveSession(store,account,sessionRoute[1]));return;}
   if(route==='/api/study'||route.startsWith('/api/study/')) {
    const access=store.access(account,now());
    if(!access.beta&&!access.pass)throw fail(403,'Guided study requires a free beta trial or an active test Exam Pass. Existing free practice and your study archive stay available.');
    limit('study:'+account.id,120);
    if(route==='/api/study'&&req.method==='GET'){send(200,studySnapshot(store,account,getBank(),now()));return;}
    if(route==='/api/study/plan'&&req.method==='POST'){send(201,createPlan(store,account,input,getBank(),now()));return;}
    if(route==='/api/study/sessions'&&req.method==='POST'){send(201,startSession(store,account,input,getBank(),now()));return;}
    if(sessionRoute&&req.method==='GET'){send(200,sessionView(store,account,sessionRoute[1],getBank()));return;}
    if(sessionRoute&&req.method==='PUT'){send(200,updateSession(store,account,sessionRoute[1],input,getBank(),now()));return;}
    if(route==='/api/study/complete-day'&&req.method==='POST'){send(200,completeDay(store,account,input,now()));return;}
    throw fail(404,'Study endpoint not found.');
   }
   if(req.method==='POST'&&route==='/api/checkout') {
    limit('checkout:'+account.id,8);
    if(!stripe||!webhookSecret)throw fail(503,'Test Checkout is not configured. Live payments are disabled.');
    try{send(200,await startCheckout(store,account,stripe,getOrigin(),now()));}catch(error){throw fail(409,error.message);}return;
   }
   if(route==='/api/progress') {
    const access=store.access(account,now());
    if(req.method==='GET'){const row=store.one('SELECT * FROM progress WHERE account=?',account.id);send(200,{revision:row?.revision??0,state:row?JSON.parse(row.body):null});return;}
    if(req.method==='PUT') {
     if(!access.beta&&!access.pass)throw fail(403,'Cloud saves require free beta access or an active test Exam Pass. Retrieval and local learning stay available.');
     limit('progress:'+account.id,60);
     let state;try{state=validateState(input.state);}catch{throw fail(400,'Progress format is invalid. The cloud copy has not changed.');}
     state.active=null; // Device timers and unfinished sessions remain local.
     if(!Number.isSafeInteger(input.revision)||input.revision<0)throw fail(400,'A valid cloud revision is required.');
     const revision=store.transaction(()=>{
      const old=store.one('SELECT revision FROM progress WHERE account=?',account.id),current=old?.revision??0;
      if(current!==input.revision)throw fail(409,'Another device saved progress. Load and merge the latest cloud copy before retrying.');
      store.run('INSERT INTO progress VALUES(?,?,?,?) ON CONFLICT(account) DO UPDATE SET revision=excluded.revision,body=excluded.body,updated=excluded.updated',account.id,current+1,JSON.stringify(state),now());return current+1;
     });send(200,{revision});return;
    }
   }
   throw fail(404,'Endpoint not found.');
  }catch(error){send(error.status??500,{error:error.status?error.message:'The development service could not complete this request. No success is implied.'});}
 });
 server.requestTimeout=20_000;server.headersTimeout=10_000;server.maxHeadersCount=50;
 return server;
}
