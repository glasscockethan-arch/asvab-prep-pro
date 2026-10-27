import {api} from './api.js';
import {mountLayout} from './layout.js';
import {loadState,mergeState,saveState,STORAGE_KEY,LEGACY_KEY} from './storage.js';
// Capture then remove invitation fragments before any network request. Never persist the bearer token.
let invitation=new URLSearchParams(location.hash.slice(1)).get('invite');
if(location.hash)history.replaceState(null,'',location.pathname+location.search);
let storage;try{storage=window.localStorage;}catch{storage={getItem(){throw Error('Browser storage is unavailable.');},setItem(){throw Error('Browser storage is unavailable.');}};}
const $=selector=>document.querySelector(selector);
const say=(selector,message)=>{$(selector).textContent=message;};
mountLayout('launch',storage,message=>{const status=$('#status');status.hidden=false;status.textContent=message;});
const page=document.body.dataset.launch;
let config=null;
async function initialize() {
 try{config=await api('config');if(!['development','hosted-beta'].includes(config.mode)||config.consentVersion!=='beta-2026-10-26')throw Error('Unrecognized service configuration.');say('#service-status',!config.betaOpen?'Beta recruitment is currently closed. No request has been saved.':config.mode==='development'?'Development beta service connected. Free beta; no real payment required.':'Free beta service connected. No payment required.');}
 catch{say('#service-status','Private signup collection is not connected on this static preview. Your email has not been saved. Free practice remains available.');return;}
 if(page==='beta') {
  $('#signup-fields').disabled=!config.betaOpen;
  $('#beta-form').addEventListener('submit',async event=>{
   event.preventDefault();const button=$('#signup-submit');button.disabled=true;say('#signup-result','Submitting your free beta request…');
   try{const data=await api('beta-signups',{method:'POST',body:{email:$('#beta-email').value,testDate:$('#test-date').value,consent:$('#beta-consent').checked,adult:$('#adult').checked,consentVersion:config.consentVersion,website:$('#website').value}});say('#signup-result',data.message);$('#beta-form').reset();}
   catch(error){say('#signup-result',error.message+' Your request has not been confirmed.');}
   finally{button.disabled=false;$('#signup-result').focus();}
  });return;
 }
 if(page==='account') {
  if(invitation){$('#redeem-invite').hidden=false;say('#invite-note','A private invitation is ready. Use it once to sign in. The link has been removed from the address bar.');}
  $('#redeem-invite').addEventListener('click',async()=>{
   $('#redeem-invite').disabled=true;
   try{await api('session',{method:'POST',body:{token:invitation}});invitation=null;await refreshAccount();say('#account-result','Signed in to the free development beta.');}
   catch(error){say('#account-result',error.message);$('#redeem-invite').disabled=false;}
  });
  $('#sign-out').addEventListener('click',async()=>{try{await api('session',{method:'DELETE',body:{}});location.reload();}catch(error){say('#account-result',error.message);}});
  $('#save-cloud').addEventListener('click',()=>sync('save'));
  $('#load-cloud').addEventListener('click',()=>sync('load'));
  $('#feedback-form').addEventListener('submit',async event=>{event.preventDefault();const button=$('#feedback-form button');button.disabled=true;try{await api('feedback',{method:'POST',body:{category:$('#feedback-category').value,questionId:$('#question-id').value,message:$('#feedback-message').value}});say('#feedback-status','Private feedback saved for owner review. Thank you for describing the issue.');$('#feedback-form').reset();}catch(error){say('#feedback-status',error.message);}finally{button.disabled=false;}});
  $('#test-checkout').addEventListener('click',async()=>{
   if(!confirm('This is a Stripe test checkout. Use only documented test details, never a real card. Continue?'))return;
   $('#test-checkout').disabled=true;
   try{const result=await api('checkout',{method:'POST',body:{}});const target=new URL(result.url);if(target.protocol!=='https:'||target.hostname!=='checkout.stripe.com')throw Error('Unrecognized test checkout destination.');location.assign(target.href);}catch(error){say('#checkout-status',error.message);$('#test-checkout').disabled=false;}
  });
  $('#delete-account').addEventListener('click',async()=>{try{await api('account',{method:'DELETE',body:{confirm:$('#delete-confirm').value}});$('#signed-in').hidden=true;$('#sign-in').hidden=false;say('#account-result','Private development data deleted. Browser progress and existing owner backups are separate.');}catch(error){say('#account-result',error.message);}});
  await refreshAccount();
 }
}
async function refreshAccount() {
 try{const data=await api('account');$('#signed-in').hidden=false;$('#sign-in').hidden=true;say('#account-identity',data.email);
 const date=value=>new Date(value).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
 say('#access-status',data.access.pass?`Test Exam Pass active through ${date(data.access.passUntil)}. No production purchase is represented.`:data.access.beta?`Free beta cloud-copy access through ${date(data.access.betaUntil)}. No payment required.`:'Cloud-save access has ended. You can still retrieve your cloud copy and use local free practice.');
 $('#save-cloud').disabled=!data.access.beta&&!data.access.pass;
 $('#test-checkout').disabled=!config.testCheckout||data.access.pass;
 if(config.testCheckout)say('#checkout-status',data.access.pass?'A test pass is already active. Renewal is deferred.':'Test mode configured. No live payment can be accepted.');
 if(new URLSearchParams(location.search).has('checkout'))say('#checkout-status','Returned from test Checkout. The server access status above is authoritative; a return URL never confirms payment. Refresh later if the test webhook is pending.');
 }catch(error){if(error.status!==401)say('#account-result',error.message);}
}
async function sync(direction) {
 const save=$('#save-cloud'),load=$('#load-cloud'),wasDisabled=save.disabled;save.disabled=true;load.disabled=true;
 try {
  if(!confirm(direction==='save'?'Save completed learning and readable ASVAB history privately to this signed-in account? Export a local backup first.':'Merge this account’s cloud copy into this browser? Export a local backup first. Original V3 storage will remain unchanged.'))return;
  const before=[storage.getItem(STORAGE_KEY),storage.getItem(LEGACY_KEY)];
  const local=loadState(storage);if(!local.state||local.warning)throw Error(local.warning||'Local progress cannot be read. Export a recovery copy before syncing.');
  const cloud=await api('progress');
  if(direction==='load'&&!cloud.state){say('#cloud-status','No cloud copy exists for this account. Local progress has not changed.');return;}
  const combined=cloud.state?mergeState(local.state,cloud.state):local.state;
  if(direction==='save') {combined.active=null;await api('progress',{method:'PUT',body:{revision:cloud.revision,state:combined}});say('#cloud-status','Private cloud copy saved. Browser data was not replaced. Load this copy explicitly on another signed-in device.');}
  else {
   if(before[0]!==storage.getItem(STORAGE_KEY)||before[1]!==storage.getItem(LEGACY_KEY))throw Error('Another tab changed local progress. Retry after reviewing it. No local data was replaced.');
   if(!saveState(storage,combined))throw Error('Browser storage could not save the merged copy. Export/recover before continuing.');
   say('#cloud-status','Cloud copy merged into My learning. Original V3 storage, local goals, and unfinished sessions were preserved.');
  }
 }catch(error){say('#cloud-status',error.message);}
 finally{save.disabled=wasDisabled;load.disabled=false;}
}
initialize().catch(()=>say('#service-status','Private beta service unavailable. No successful action has been confirmed.'));
