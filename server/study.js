// Practice organization only: these heuristics are not validated ASVAB/AFQT predictions.
import {readFileSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
const DAY=86_400_000;
export const SUBJECTS=['Arithmetic Reasoning','Mathematics Knowledge','Word Knowledge','Paragraph Comprehension'];
export const GUIDES=Object.freeze(Object.fromEntries(SUBJECTS.map(subject=>[subject,'./guide-'+subject.toLowerCase().replaceAll(' ','-')+'.html'])));
export const fail=(status,message)=>Object.assign(new Error(message),{status});
export function readBank(filename) {
 const raw=readFileSync(filename,'utf8').match(/const QUESTIONS=(\[.*?\]);/s)?.[1];
 if(!raw)throw Error('Preserved question bank unavailable.');
 const questions=JSON.parse(raw),ids=new Set(questions.map(q=>q.id));
 if(questions.length!==540||ids.size!==540||questions.some(q=>!/^q\d{4}$/.test(q.id)||!Array.isArray(q.options)||q.options.length!==4||!Number.isInteger(q.answer)||q.answer<0||q.answer>3))throw Error('Invalid preserved question bank.');
 return {questions,hash:createHash('sha256').update(raw).digest('hex')};
}
export function calendarDate(value) {
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw fail(400,'Use a valid calendar date.');
 const time=Date.parse(value+'T00:00:00Z');if(!Number.isFinite(time)||new Date(time).toISOString().slice(0,10)!==value)throw fail(400,'Use a valid calendar date.');
 return time;
}
export function validatePlan(input,now) {
 if(![30,60,90].includes(input.days)||![15,30,45,60].includes(input.minutes)||!Array.isArray(input.weekdays)||!input.weekdays.length||input.weekdays.length>7||input.weekdays.some(d=>!Number.isInteger(d)||d<0||d>6)||new Set(input.weekdays).size!==input.weekdays.length)throw fail(400,'Choose 30, 60 or 90 days, 15–60 suggested minutes, and at least one distinct study weekday.');
 const start=calendarDate(input.startDate),today=Math.floor(now/DAY)*DAY;
 if(start<today-DAY||start>today+7*DAY)throw fail(400,'Start from today or within the next seven days.');
 if(!Number.isSafeInteger(input.revision)||input.revision<0)throw fail(400,'A current plan revision is required.');
 return {days:input.days,minutes:input.minutes,weekdays:[...input.weekdays].sort(),startDate:input.startDate,revision:input.revision};
}
export function evidence(store,account,bank,now) {
 const known=new Map(bank.questions.map(q=>[q.id,q])),latest=new Map(),uniqueAttempts=new Set();let excluded=0,attempts=0;
 const consider=(id,chosen,date,sequence)=>{
  const q=known.get(id),time=Date.parse(date);
  if(!q||!SUBJECTS.includes(q.subject)||!Number.isFinite(time)||time>now+300_000||time<now-30*DAY||!(chosen===null||Number.isInteger(chosen)&&chosen>=0&&chosen<4)){excluded++;return;}
  const previous=latest.get(id);if(!previous||time>previous.time||time===previous.time&&sequence>previous.sequence)latest.set(id,{id,subject:q.subject,chosen,correct:chosen===q.answer,time,sequence});
 };
 const row=store.one('SELECT body FROM progress WHERE account=?',account.id);
 const legacy=row?JSON.parse(row.body).legacy:null;
 for(const attempt of legacy?.history??[]) {
  const fingerprint=JSON.stringify([attempt.date,attempt.mode,attempt.details.map(d=>[d.id,d.chosen])]);if(uniqueAttempts.has(fingerprint))continue;uniqueAttempts.add(fingerprint);attempts++;
  for(const d of attempt.details)consider(d.id,d.chosen,attempt.date,0);
 }
 const completed=store.all("SELECT * FROM guided_sessions WHERE account=? AND state='completed' ORDER BY completed,id",account.id);
 for(const [index,session] of completed.entries()) {
  attempts++;const ids=JSON.parse(session.ids),answers=JSON.parse(session.answers);
  ids.forEach((id,i)=>consider(id,answers[i],new Date(session.completed).toISOString(),index+1));
 }
 const subjects=SUBJECTS.map(subject=>{
  const all=[...latest.values()].filter(q=>q.subject===subject),answered=all.filter(q=>q.chosen!==null),correct=answered.filter(q=>q.correct).length;
  const accuracy=answered.length?Math.round(100*correct/answered.length):null;
  const status=answered.length<10?'baseline-needed':accuracy<70?'focus-next':accuracy<85?'keep-practicing':'maintain';
  return {subject,answered:answered.length,seen:all.length,unanswered:all.length-answered.length,correct,accuracy,status,guide:GUIDES[subject],lastPracticed:all.length?new Date(Math.max(...all.map(q=>q.time))).toISOString():null};
 });
 const priority=subject=>subject.status==='baseline-needed'?1.5:1+(100-subject.accuracy)/40;
 const recommendations=[...subjects].sort((a,b)=>priority(b)-priority(a)||SUBJECTS.indexOf(a.subject)-SUBJECTS.indexOf(b.subject)).map(s=>({...s,reason:s.status==='baseline-needed'?`Only ${s.answered} distinct answered questions in 30 days. Build a baseline; missing evidence does not establish weakness.`:`${s.correct}/${s.answered} distinct latest answers correct in 30 days. ${s.status==='focus-next'?'Review the guide, explain missed reasoning, then try a short set.':'Revisit mixed examples and check whether you can explain the method.'}`}));
 return {subjects,recommendations,latest,completed,attempts,excluded,windowDays:30};
}
export function makePlan(input,profile,now,id=randomUUID()) {
 const start=calendarDate(input.startDate),order=profile.recommendations.map(r=>r.subject),rotation=[...order,order[0],order[1]],entries=[];let slot=0;
 const targets=Array.from({length:input.days},(_,i)=>({date:new Date(start+i*DAY).toISOString().slice(0,10),weekday:new Date(start+i*DAY).getUTCDay()}));
 const count=targets.filter(d=>input.weekdays.includes(d.weekday)).length;
 for(const day of targets) {
  if(!input.weekdays.includes(day.weekday)){entries.push({...day,kind:'rest',subject:null,phase:'Rest or optional catch-up'});continue;}
  slot++;const checkpoint=slot%5===0||slot===count;
  entries.push({...day,kind:checkpoint?'checkpoint':'focused',subject:checkpoint?null:rotation[(slot-1)%rotation.length],phase:slot<=Math.min(4,count)?'Build your baseline':slot>count-Math.max(2,Math.ceil(count*.15))?'Consolidate and explain':'Target and revisit',questionCount:checkpoint?Math.max(4,Math.floor(input.minutes/3/4)*4):Math.min(20,Math.floor(input.minutes/3)),tasks:[{id:'review',label:'Read the linked guide and explain one method in your own words.'},{id:'practice',label:'Complete the guided existing-question practice and review its explanations.'},{id:'reflect',label:'Write down the step to change next time; keep personal notes on your own device.'}]});
 }
 return {id,version:1,days:input.days,minutes:input.minutes,weekdays:input.weekdays,startDate:input.startDate,endDate:entries.at(-1).date,created:new Date(now).toISOString(),studyDays:count,entries,priorities:order,method:'Four AFQT areas are revisited, with extra slots for the two highest-priority areas. Every fifth study day and the final study day is a mixed checkpoint. Time budgets are suggestions, not measured learning needs.'};
}
export function studySnapshot(store,account,bank,now) {
 const profile=evidence(store,account,bank,now),current=store.one('SELECT * FROM study_plans WHERE account=? AND current=1',account.id);
 const active=store.one("SELECT id,plan_id,day FROM guided_sessions WHERE account=? AND state='active'",account.id);
 const completions=current?store.all('SELECT day FROM study_days WHERE account=? AND plan_id=?',account.id,current.id).map(d=>d.day):[];
 const access=store.access(account,now),accessUntil=Math.max(access.beta?access.betaUntil:0,access.pass?access.passUntil:0);
 return {accessUntil,revision:current?.revision??0,plan:current?JSON.parse(current.body):null,completions,active:active??null,dashboard:{subjects:profile.subjects,recommendations:profile.recommendations,windowDays:30,excluded:profile.excluded,completedGuided:profile.completed.length,source:'This account’s explicitly saved cloud V3 history and completed guided sessions. Latest distinct-question answers in the last 30 days, recomputed with current practice keys. Unsaved browser history is not included.',limits:'Practice evidence only. Repeated items, editable imports and a finite question pool limit interpretation. Ten answers and the 70%/85% bands are organizational heuristics, not validated readiness standards, official AFQT percentiles, qualification decisions or predictions.'}};
}
export function createPlan(store,account,input,bank,now) {
 const settings=validatePlan(input,now);
 return store.transaction(()=>{
  if(store.one("SELECT id FROM guided_sessions WHERE account=? AND state='active'",account.id))throw fail(409,'Finish or archive your unfinished guided session before replacing the plan.');
  const previous=store.one('SELECT * FROM study_plans WHERE account=? AND current=1',account.id);
  if((previous?.revision??0)!==settings.revision)throw fail(409,'The plan changed on another device. Reload before replacing it.');
  const plan=makePlan(settings,evidence(store,account,bank,now),now);
  store.run('UPDATE study_plans SET current=0 WHERE account=?',account.id);
  store.run('INSERT INTO study_plans VALUES(?,?,?,?,?,?)',plan.id,account.id,settings.revision+1,JSON.stringify(plan),1,now);
  return studySnapshot(store,account,bank,now);
 });
}
function ownedSession(store,account,id) {
 const row=store.one('SELECT * FROM guided_sessions WHERE id=? AND account=?',id,account.id);if(!row)throw fail(404,'Guided session not found for this account.');return row;
}
export function sessionView(store,account,id,bank) {
 const row=ownedSession(store,account,id),ids=JSON.parse(row.ids),answers=JSON.parse(row.answers);
 if(row.state==='active'&&row.bank_hash!==bank.hash)throw fail(409,'The practice bank changed. Export your study archive and archive this unfinished session before starting a current one.');
 const known=new Map(bank.questions.map(q=>[q.id,q]));
 return {id:row.id,planId:row.plan_id,day:row.day,state:row.state,revision:row.revision,index:row.position,answers,bankHash:row.bank_hash,questions:row.state==='completed'?JSON.parse(row.result).details:ids.map(id=>{const q=known.get(id);return {id:q.id,subject:q.subject,q:q.q,options:q.options};}),result:row.result?JSON.parse(row.result):null};
}
export function startSession(store,account,input,bank,now) {
 return store.transaction(()=>{
  const active=store.one("SELECT id FROM guided_sessions WHERE account=? AND state='active'",account.id);if(active)return sessionView(store,account,active.id,bank);
  const current=store.one('SELECT * FROM study_plans WHERE account=? AND current=1',account.id);
  if(!current||input.planId!==current.id)throw fail(409,'Load the current plan before starting a guided session.');
  const plan=JSON.parse(current.body),day=plan.entries.find(d=>d.date===input.day);
  if(!day||day.kind==='rest')throw fail(400,'Choose a scheduled study day.');
  const profile=evidence(store,account,bank,now),id=randomUUID();
  const rank=q=>{
   const last=profile.latest.get(q.id);const tier=!last?1:last.chosen!==null&&!last.correct?0:2;
   const seed=createHash('sha256').update(id+q.id).digest('hex');return {q,tier,time:last?.time??0,seed};
  };
  const pick=(subject,n)=>bank.questions.filter(q=>q.subject===subject).map(rank).sort((a,b)=>a.tier-b.tier||a.time-b.time||a.seed.localeCompare(b.seed)).slice(0,n).map(r=>r.q.id);
  const ids=day.kind==='checkpoint'?SUBJECTS.flatMap(s=>pick(s,day.questionCount/4)):pick(day.subject,day.questionCount);
  store.run('INSERT INTO guided_sessions VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',id,account.id,current.id,day.date,JSON.stringify(ids),JSON.stringify(ids.map(()=>null)),0,0,'active',bank.hash,now,now,null,null);
  return sessionView(store,account,id,bank);
 });
}
export function updateSession(store,account,id,input,bank,now) {
 return store.transaction(()=>{
  const row=ownedSession(store,account,id),ids=JSON.parse(row.ids);
  if(row.state!=='active')throw fail(409,'This session has already ended. Reload to view its saved result.');
  if(row.bank_hash!==bank.hash)throw fail(409,'The practice bank changed. Export and archive this unfinished session.');
  if(input.revision!==row.revision)throw fail(409,'Another device saved this session. Reload to recover the saved answers.');
  if(!Array.isArray(input.answers)||input.answers.length!==ids.length||!input.answers.every(a=>a===null||Number.isInteger(a)&&a>=0&&a<=3)||!Number.isInteger(input.index)||input.index<0||input.index>=ids.length||typeof input.finish!=='boolean')throw fail(400,'Invalid guided answers or position. Saved answers have not changed.');
  const known=new Map(bank.questions.map(q=>[q.id,q]));let result=null;
  if(input.finish) {
   const details=ids.map((id,i)=>{const q=known.get(id);return {...q,chosen:input.answers[i],correct:input.answers[i]===q.answer};});
   const correct=details.filter(q=>q.correct).length;
   result={correct,total:ids.length,percent:Math.round(100*correct/ids.length),unanswered:input.answers.filter(a=>a===null).length,details,completedAt:new Date(now).toISOString(),bankHash:bank.hash};
  }
  store.run('UPDATE guided_sessions SET answers=?,position=?,revision=revision+1,state=?,updated=?,completed=?,result=? WHERE id=?',JSON.stringify(input.answers),input.index,input.finish?'completed':'active',now,input.finish?now:null,result?JSON.stringify(result):null,id);
  return sessionView(store,account,id,bank);
 });
}
export function completeDay(store,account,input,now) {
 if(input.reviewed!==true||input.reflected!==true)throw fail(400,'Confirm explanation review and reflection before marking a study day complete.');
 const current=store.one('SELECT id FROM study_plans WHERE account=? AND current=1',account.id),session=ownedSession(store,account,input.sessionId);
 if(!current||input.planId!==current.id||session.plan_id!==current.id||session.day!==input.day||session.state!=='completed')throw fail(409,'Complete this day’s guided practice under the current plan first.');
 store.run('INSERT OR IGNORE INTO study_days VALUES(?,?,?,?,?)',account.id,current.id,input.day,session.id,now);
 return {completed:true};
}
export function archiveSession(store,account,id) {
 ownedSession(store,account,id);store.run("UPDATE guided_sessions SET state='archived',revision=revision+1 WHERE id=? AND account=? AND state='active'",id,account.id);return {archived:true};
}
export function studyArchive(store,account,now) {
 return {version:1,exportedAt:new Date(now).toISOString(),plans:store.all('SELECT id,revision,body,current,created FROM study_plans WHERE account=? ORDER BY created,id',account.id).map(p=>({...p,body:JSON.parse(p.body)})),sessions:store.all('SELECT id,plan_id,day,ids,answers,position,revision,state,bank_hash,created,updated,completed,result FROM guided_sessions WHERE account=? ORDER BY created,id',account.id).map(s=>({...s,ids:JSON.parse(s.ids),answers:JSON.parse(s.answers),result:s.result?JSON.parse(s.result):null})),completedDays:store.all('SELECT plan_id,day,session_id,completed FROM study_days WHERE account=?',account.id)};
}
