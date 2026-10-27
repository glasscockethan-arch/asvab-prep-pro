// Development-only durable state. Never place this database inside a web/document root.
import {DatabaseSync} from 'node:sqlite';
import {mkdirSync, chmodSync, realpathSync, existsSync} from 'node:fs';
import {dirname, resolve, sep} from 'node:path';
import {createHash, randomBytes, randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
export const DAY = 86_400_000;
export const CONSENT_VERSION = 'beta-2026-10-26';
export const token = () => randomBytes(32).toString('base64url');
export const digest = value => createHash('sha256').update(value).digest('hex');
export const canonicalEmail = value => {
 if(typeof value !== 'string') throw new Error('Enter a valid email address.');
 const email=value.trim().toLowerCase();
 if(email.length>254 || !/^[a-z0-9.!#$%&'*+\-/=?^_`{|}~]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(email)) throw new Error('Enter a valid email address.');
 return email;
};
export class Store {
 constructor(filename) {
  const root=realpathSync(fileURLToPath(new URL('..',import.meta.url)));
  const absolute=resolve(filename);
  if(absolute===root || absolute.startsWith(root+sep)) throw new Error('The private database must be outside the repository.');
  mkdirSync(dirname(absolute),{recursive:true,mode:0o700});
  const directory=realpathSync(dirname(absolute));
  if(directory===root || directory.startsWith(root+sep) || (existsSync(absolute)&&realpathSync(absolute)!==absolute)) throw new Error('Unsafe database path or symlink.');
  this.filename=absolute;
  this.db=new DatabaseSync(absolute);
  chmodSync(absolute,0o600);
  this.db.exec(`PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
   CREATE TABLE IF NOT EXISTS signups(email TEXT PRIMARY KEY, test_date TEXT, consent_version TEXT NOT NULL, created INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS accounts(id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, created INTEGER NOT NULL, beta_until INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS invitations(hash TEXT PRIMARY KEY, email TEXT NOT NULL, expires INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY, account TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS progress(account TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE, revision INTEGER NOT NULL, body TEXT NOT NULL, updated INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS checkouts(id TEXT PRIMARY KEY, account TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, stripe_id TEXT UNIQUE, payment_intent TEXT UNIQUE, state TEXT NOT NULL, created INTEGER NOT NULL, paid_at INTEGER, expires INTEGER, revoked INTEGER NOT NULL DEFAULT 0, url TEXT);
   CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY, created INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS refunds(payment_intent TEXT PRIMARY KEY, created INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS feedback(id TEXT PRIMARY KEY, account TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, category TEXT NOT NULL, question_id TEXT, message TEXT NOT NULL, created INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY, total INTEGER NOT NULL, expires INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS metrics(name TEXT PRIMARY KEY, total INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS study_plans(id TEXT PRIMARY KEY, account TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, revision INTEGER NOT NULL, body TEXT NOT NULL, current INTEGER NOT NULL, created INTEGER NOT NULL);
   CREATE UNIQUE INDEX IF NOT EXISTS one_current_study_plan ON study_plans(account) WHERE current=1;
   CREATE TABLE IF NOT EXISTS guided_sessions(id TEXT PRIMARY KEY, account TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, plan_id TEXT NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE, day TEXT NOT NULL, ids TEXT NOT NULL, answers TEXT NOT NULL, position INTEGER NOT NULL, revision INTEGER NOT NULL, state TEXT NOT NULL, bank_hash TEXT NOT NULL, created INTEGER NOT NULL, updated INTEGER NOT NULL, completed INTEGER, result TEXT);
   CREATE UNIQUE INDEX IF NOT EXISTS one_active_guided_session ON guided_sessions(account) WHERE state='active';
   CREATE TABLE IF NOT EXISTS study_days(account TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE, plan_id TEXT NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE, day TEXT NOT NULL, session_id TEXT NOT NULL REFERENCES guided_sessions(id) ON DELETE CASCADE, completed INTEGER NOT NULL, PRIMARY KEY(account,plan_id,day));
   CREATE UNIQUE INDEX IF NOT EXISTS one_pending_checkout ON checkouts(account) WHERE state IN ('creating','open');`);
 }
 one(sql,...args) { return this.db.prepare(sql).get(...args); }
 all(sql,...args) { return this.db.prepare(sql).all(...args); }
 run(sql,...args) { return this.db.prepare(sql).run(...args); }
 transaction(action) { this.db.exec('BEGIN IMMEDIATE');try {const result=action();this.db.exec('COMMIT');return result;}catch(error){this.db.exec('ROLLBACK');throw error;} }
 count(name) {this.run('INSERT INTO metrics VALUES(?,1) ON CONFLICT(name) DO UPDATE SET total=total+1',name);}
 signup(email,testDate,now) {const result=this.run('INSERT OR IGNORE INTO signups VALUES(?,?,?,?)',email,testDate,CONSENT_VERSION,now);if(result.changes)this.count('beta_signups');}
 invite(email,now) {
  if(!this.one('SELECT email FROM signups WHERE email=?',email))throw new Error('An opted-in signup is required before issuing an invitation.');
  const secret=token();
  this.transaction(()=>{this.run('DELETE FROM invitations WHERE email=?',email);this.run('INSERT INTO invitations VALUES(?,?,?)',digest(secret),email,now+30*60_000);});
  return secret;
 }
 redeem(secret,now) {
  return this.transaction(()=>{
   const invite=this.one('SELECT * FROM invitations WHERE hash=? AND expires>?',digest(secret),now);
   if(!invite)return null;
   this.run('DELETE FROM invitations WHERE email=?',invite.email);
   this.run('INSERT OR IGNORE INTO accounts VALUES(?,?,?,?)',randomUUID(),invite.email,now,now+90*DAY);
   const account=this.one('SELECT * FROM accounts WHERE email=?',invite.email), session=token();
   this.run('INSERT INTO sessions VALUES(?,?,?)',digest(session),account.id,now+7*DAY);this.count('invitation_redemptions');
   return {account,session};
  });
 }
 account(secret,now) {return this.one('SELECT a.* FROM sessions s JOIN accounts a ON a.id=s.account WHERE s.hash=? AND s.expires>?',digest(secret),now);}
 access(account,now) {
  const pass=this.one("SELECT MAX(expires) AS expires FROM checkouts WHERE account=? AND state='paid' AND revoked=0",account.id);
  return {beta:account.beta_until>now,betaUntil:account.beta_until,pass:!!pass?.expires&&pass.expires>now,passUntil:pass?.expires??null};
 }
 deleteAccount(email) {this.transaction(()=>{this.run('DELETE FROM invitations WHERE email=?',email);this.run('DELETE FROM signups WHERE email=?',email);this.run('DELETE FROM accounts WHERE email=?',email);});}
 prune(now) {this.transaction(()=>{this.run('DELETE FROM signups WHERE created<? AND email NOT IN (SELECT email FROM accounts)',now-90*DAY);this.run('DELETE FROM feedback WHERE created<?',now-90*DAY);this.run('DELETE FROM invitations WHERE expires<=?',now);this.run('DELETE FROM sessions WHERE expires<=?',now);this.run('DELETE FROM rate_limits WHERE expires<=?',now);});}
 rateLimit(key,max,now) {
  return this.transaction(()=>{
   this.run('DELETE FROM rate_limits WHERE expires<=?',now);
   const old=this.one('SELECT * FROM rate_limits WHERE key=?',key);
   if(!old&&this.one('SELECT COUNT(*) AS count FROM rate_limits').count>=10_000)return false;
   if(old&&old.total>=max)return false;
   this.run('INSERT INTO rate_limits VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET total=total+1',key,now+15*60_000);return true;
  });
 }
 close(){this.db.close();}
}
