import {createHmac, timingSafeEqual} from 'node:crypto';
import {randomUUID} from 'node:crypto';
import {DAY} from './store.js';
export const PASS = Object.freeze({amount:1999,currency:'usd',days:90,version:'exam-pass-90-v1'});
export function verifyEvent(raw,signature,secret,now=Date.now()) {
 if(!secret?.startsWith('whsec_') || typeof signature!=='string' || signature.length>2048)throw new Error('Invalid webhook signature');
 const parts=signature.split(',').map(part=>part.split('='));
 const stamps=parts.filter(([key])=>key==='t');
 if(stamps.length!==1 || !/^\d+$/.test(stamps[0][1]))throw new Error('Invalid webhook timestamp');
 const stamp=Number(stamps[0][1]);if(Math.abs(now/1000-stamp)>300)throw new Error('Stale webhook signature');
 const expected=createHmac('sha256',secret).update(`${stamp}.`).update(raw).digest();
 const valid=parts.some(([key,value])=>key==='v1'&&/^[a-f0-9]{64}$/.test(value??'')&&timingSafeEqual(expected,Buffer.from(value,'hex')));
 if(!valid)throw new Error('Invalid webhook signature');
 const event=JSON.parse(raw.toString('utf8'));
 if(!/^evt_[a-zA-Z0-9]+$/.test(event.id??'') || event.livemode!==false || !Number.isInteger(event.created) || event.created*1000>now+300_000 || event.created<=0 || !event.data?.object)throw new Error('Invalid test event');
 return event;
}
export class StripeTestClient {
 constructor(key,fetcher=fetch) {if(!/^sk_test_[a-zA-Z0-9]+$/.test(key??''))throw new Error('Only a Stripe test secret key is accepted.');this.key=key;this.fetcher=fetcher;}
 async request(route,{form,idempotency}={}) {
  const response=await this.fetcher('https://api.stripe.com/v1/'+route,{method:form?'POST':'GET',headers:{Authorization:`Bearer ${this.key}`,'Stripe-Version':'2025-06-30.basil',...(form?{'Content-Type':'application/x-www-form-urlencoded'}:{}),...(idempotency?{'Idempotency-Key':idempotency}:{})},...(form?{body:new URLSearchParams(form).toString()}:{}),signal:AbortSignal.timeout(15_000)});
  if(!response.ok)throw new Error('Stripe test request failed. Retry or ask the owner to reconcile the pending checkout.');
  return response.json();
 }
 create(account,origin,key){return this.request('checkout/sessions',{idempotency:key,form:{mode:'payment','payment_method_types[0]':'card','line_items[0][quantity]':'1','line_items[0][price_data][currency]':PASS.currency,'line_items[0][price_data][unit_amount]':String(PASS.amount),'line_items[0][price_data][product_data][name]':'ASVAB Exam Pass — 90 days (TEST)',client_reference_id:account.id,'metadata[account_id]':account.id,'metadata[offer]':PASS.version,success_url:origin+'/account.html?checkout=returned',cancel_url:origin+'/account.html?checkout=canceled'}});}
 retrieve(id){if(!/^cs_test_[a-zA-Z0-9]+$/.test(id??''))throw new Error('Only test checkout IDs are accepted.');return this.request('checkout/sessions/'+id);}
}
export async function startCheckout(store,account,client,origin,now) {
 const access=store.access(account,now);if(access.pass)throw new Error('An active Exam Pass already exists. Renewal is deferred.');
 const row=store.transaction(()=>{
  const pending=store.one("SELECT * FROM checkouts WHERE account=? AND state IN ('creating','open')",account.id);
  if(pending)return pending;
  // Uncertain requests older than Stripe's idempotency retention need owner reconciliation, not a fresh charge.
  const id=randomUUID();store.run("INSERT INTO checkouts(id,account,state,created) VALUES(?,?,'creating',?)",id,account.id,now);
  return store.one('SELECT * FROM checkouts WHERE id=?',id);
 });
 if(now-row.created>23*60*60_000)throw new Error('Pending checkout requires owner reconciliation before retry.');
 if(row.state==='open')return {url:row.url};
 const session=await client.create(account,origin,row.id);
 if(!/^cs_test_[a-zA-Z0-9]+$/.test(session.id??'') || session.livemode!==false || !session.url?.startsWith('https://checkout.stripe.com/'))throw new Error('Invalid test checkout response');
 store.run("UPDATE checkouts SET stripe_id=?,state='open',url=? WHERE id=? AND state='creating'",session.id,session.url,row.id);store.count('test_checkouts');
 return {url:session.url};
}
export async function fulfill(store,event,client,now) {
 if(store.one('SELECT id FROM events WHERE id=?',event.id))return;
 const object=event.data.object;
 let session=null;
 const paid=['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type);
 if(paid) {
  session=await client.retrieve(object.id);
  const row=store.one('SELECT * FROM checkouts WHERE stripe_id=?',session.id);
  // The webhook may race the create response. Retry; do not acknowledge and lose a real test payment.
  if(!row)throw new Error('Unknown checkout; retry after owner reconciliation.');
  if(session.id!==object.id||session.livemode!==false||session.mode!=='payment'||session.status!=='complete'||session.amount_total!==PASS.amount||session.currency!==PASS.currency||session.client_reference_id!==row.account||session.metadata?.account_id!==row.account||session.metadata?.offer!==PASS.version)throw new Error('Checkout does not match the server-owned offer.');
  if(session.payment_status!=='paid') { // A completed asynchronous checkout is not a paid entitlement.
   if(event.type==='checkout.session.async_payment_succeeded')throw new Error('Payment not settled');
   session=null;
  } else if(!/^pi_[a-zA-Z0-9]+$/.test(session.payment_intent??''))throw new Error('Payment intent missing');
 }
 store.transaction(()=>{
  if(store.one('SELECT id FROM events WHERE id=?',event.id))return;
  if(session) {
   const row=store.one('SELECT * FROM checkouts WHERE stripe_id=?',session.id);
   const paidAt=event.created*1000;
   const revoked=!!store.one('SELECT payment_intent FROM refunds WHERE payment_intent=?',session.payment_intent);
   // Different event IDs for the same session never extend the original 90-day period.
   store.run("UPDATE checkouts SET state='paid',payment_intent=?,paid_at=COALESCE(paid_at,?),expires=COALESCE(expires,?),revoked=MAX(revoked,?) WHERE id=?",session.payment_intent,paidAt,paidAt+PASS.days*DAY,Number(revoked),row.id);
   if(row.paid_at===null)store.count('test_payments_succeeded');
  }
  if(['charge.refunded','charge.dispute.created'].includes(event.type)) {
   const pi=object.payment_intent;
   if(typeof pi!=='string'||!/^pi_[a-zA-Z0-9]+$/.test(pi))throw new Error('Payment intent missing');
   // Conservative test policy: any successful partial/full refund or dispute suspends access for owner review.
   if(event.type==='charge.dispute.created'||(object.refunded===true||Number.isInteger(object.amount_refunded)&&object.amount_refunded>0)) {
    const result=store.run('INSERT OR IGNORE INTO refunds VALUES(?,?)',pi,now);
    store.run('UPDATE checkouts SET revoked=1 WHERE payment_intent=?',pi);
    if(result.changes)store.count('test_refunds_or_disputes');
   }
  }
  if(['checkout.session.expired','checkout.session.async_payment_failed'].includes(event.type)) {
   const result=store.run("UPDATE checkouts SET state=? WHERE stripe_id=? AND state IN ('open','creating')",event.type.endsWith('expired')?'expired':'failed',object.id);
   if(result.changes)store.count('test_payment_failures_or_expirations');
  }
  store.run('INSERT INTO events VALUES(?,?)',event.id,now);
 });
}
