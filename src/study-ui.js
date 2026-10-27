import {api} from './api.js';
import {mountLayout} from './layout.js';
import {escapeHtml as h} from './html.js';
const $=s=>document.querySelector(s),say=(s,text)=>{$(s).textContent=text;};
let storage;try{storage=localStorage;}catch{storage={getItem(){return null;},setItem(){throw Error('Storage unavailable.');}};}
mountLayout('launch',storage,message=>{const status=$('#status');status.hidden=false;status.textContent=message;});
let snapshot=null,session=null,busy=false;
const statusLabels={'baseline-needed':'Build a baseline','focus-next':'Focus next','keep-practicing':'Keep practicing',maintain:'Maintain and revisit'};
const today=new Date();today.setMinutes(today.getMinutes()-today.getTimezoneOffset());$('#plan-start').value=today.toISOString().slice(0,10);
function download(data) {const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='Aptitude_Beacon_study_archive.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);}
$('#study-export').addEventListener('click',async()=>{try{download(await api('study/archive'));say('#study-message','Private study archive downloaded. Keep it outside public/shared folders.');}catch(error){say('#study-message',error.message);}});
async function refresh() {
 snapshot=await api('study');$('#premium-study').hidden=false;say('#study-message','Study tools available through your free beta trial or test Exam Pass. No production purchase is represented.');
 const dashboard=snapshot.dashboard;say('#study-source',dashboard.source);say('#study-limits',dashboard.limits);
 $('#practice-summary').innerHTML=`<p><strong>${dashboard.completedGuided}</strong> guided sessions completed. Recommendations use a ${dashboard.windowDays}-day window. ${dashboard.excluded} records outside that window, outside the four subjects, or unmatched were excluded.</p><div class="table-scroll"><table><caption>Latest distinct-question practice evidence; not official ASVAB scores</caption><thead><tr><th scope="col">Area</th><th scope="col">Answered</th><th scope="col">Correct</th><th scope="col">Accuracy</th><th scope="col">Unanswered</th><th scope="col">Next step</th></tr></thead><tbody>${dashboard.subjects.map(s=>`<tr><th scope="row">${h(s.subject)}</th><td>${s.answered}</td><td>${s.correct}</td><td>${s.accuracy===null?'No evidence':s.accuracy+'%'}</td><td>${s.unanswered}</td><td>${h(statusLabels[s.status])}</td></tr>`).join('')}</tbody></table></div>`;
 $('#study-recommendations').innerHTML=dashboard.recommendations.map(s=>`<article><h4>${h(s.subject)} · ${h(statusLabels[s.status])}</h4><p>${h(s.reason)}</p><a href="${h(s.guide)}">Read the free ${h(s.subject)} guide</a></article>`).join('');
 renderCalendar();
}
function renderCalendar() {
 const plan=snapshot.plan;if(!plan){$('#calendar-days').innerHTML='';return;}
 say('#calendar-summary',`${plan.days} calendar days · ${plan.startDate} to ${plan.endDate} · ${plan.studyDays} scheduled study days · ${snapshot.completions.length} days complete. Suggested ${plan.minutes} minutes per study day; actual time varies. Completion needs guided practice plus your review and reflection confirmation. ${plan.method} Current study access ends ${new Date(snapshot.accessUntil).toLocaleString()}. Calendar dates after access ends do not extend access; you can export the calendar and continue free practice.`);
 $('#plan-days').value=plan.days;$('#plan-minutes').value=plan.minutes;
 document.querySelectorAll('[name=weekday]').forEach(el=>el.checked=plan.weekdays.includes(+el.value));
 const weeks=[];for(let i=0;i<plan.entries.length;i+=7)weeks.push(plan.entries.slice(i,i+7));
 $('#calendar-days').innerHTML=weeks.map((days,index)=>`<details ${index===0?'open':''}><summary>Week ${index+1} · ${h(days[0].date)}–${h(days.at(-1).date)}</summary><ul class="study-days">${days.map(day=>`<li><div><strong>${h(day.date)}${snapshot.completions.includes(day.date)?' · Complete':''}</strong><p>${day.kind==='rest'?'Rest or optional catch-up':`${h(day.phase)} · ${h(day.subject||'Four-subject checkpoint')} · ${day.questionCount} existing questions`}</p></div>${day.kind==='rest'?'':`<button class="button secondary" data-study-day="${h(day.date)}">Start ${h(day.date)}</button>`}</li>`).join('')}</ul></details>`).join('');
 document.querySelectorAll('[data-study-day]').forEach(button=>button.addEventListener('click',()=>run(async()=>{session=await api('study/sessions',{method:'POST',body:{planId:plan.id,day:button.dataset.studyDay}});renderSession();$('#guided-title').focus();})));
}
async function run(action) {if(busy)return;busy=true;try{await action();}catch(error){say('#study-message',error.message+' No new action is confirmed.');say('#guided-message',error.message+' Reload to recover the last server-saved answers.');}finally{busy=false;}}
$('#study-plan-form').addEventListener('submit',event=>{event.preventDefault();run(async()=>{
 if(snapshot.plan&&!confirm('Replace the current schedule? Existing plans and results remain in your private study archive.'))return;
 snapshot=await api('study/plan',{method:'POST',body:{days:+$('#plan-days').value,minutes:+$('#plan-minutes').value,startDate:$('#plan-start').value,weekdays:[...document.querySelectorAll('[name=weekday]:checked')].map(el=>+el.value),revision:snapshot.revision}});say('#plan-message','Study plan saved. Its workload is guidance, not a score promise.');await refresh();
});});
function capture() {const selected=document.querySelector('input[name=guided-answer]:checked');session.answers[session.index]=selected?+selected.value:null;}
async function save(index,finish=false) {
 capture();if(finish&&session.answers.some(a=>a===null)&&!confirm('Unanswered questions count as incorrect in this practice result. Finish now?'))return;
 session=await api('study/sessions/'+session.id,{method:'PUT',body:{revision:session.revision,answers:session.answers,index,finish}});renderSession();if(finish)await refresh();$('#guided-title').focus();
}
function renderSession() {
 $('#guided-panel').hidden=false;say('#guided-message','');say('#guided-title',`Guided session · ${session.day}`);
 if(session.state==='completed') {
  const result=session.result;
  $('#guided-content').innerHTML=`<h3>Practice result: ${result.correct}/${result.total} (${result.percent}%)</h3><p>${result.unanswered} unanswered. This is accuracy on these existing practice questions, not an official AFQT percentile or a prediction. Repeated questions can make practice results look stronger than transferable skills.</p>${result.details.map(q=>`<details><summary>${h(q.id)} · ${q.correct?'Correct':q.chosen===null?'Unanswered':'Review next'} · ${h(q.subject)}</summary><p class="question-text">${h(q.q)}</p><p>Your choice: ${q.chosen===null?'Unanswered':h(q.options[q.chosen])}</p><p><strong>Practice key: ${h(q.options[q.answer])}</strong></p><p>${h(q.explanation)}</p></details>`).join('')}<form id="complete-study-day"><h3>Finish the review step</h3><label class="check-row"><input id="reviewed" type="checkbox" required><span>I reviewed the explanations, including answers I got right.</span></label><label class="check-row"><input id="reflected" type="checkbox" required><span>I identified a step to change or explain next time. Personal notes stay with me.</span></label><button class="button" type="submit">Mark this study day complete</button></form>`;
  $('#complete-study-day').addEventListener('submit',event=>{event.preventDefault();run(async()=>{await api('study/complete-day',{method:'POST',body:{planId:session.planId,day:session.day,sessionId:session.id,reviewed:$('#reviewed').checked,reflected:$('#reflected').checked}});await refresh();say('#guided-message','Study day complete: practice, explanation review and self-reported reflection recorded. This is not verified mastery.');});});return;
 }
 const q=session.questions[session.index];
 $('#guided-content').innerHTML=`<p><strong>Question ${session.index+1} of ${session.questions.length}</strong> · ${h(q.id)} · ${h(q.subject)} · ${session.answers.filter(a=>a!==null).length} answered</p><p><a href="./guide-${h(q.subject.toLowerCase().replaceAll(' ','-'))}.html">Review the free subject guide</a></p><h3 class="question-text">${h(q.q)}</h3><fieldset><legend>Choose an answer, or leave unanswered.</legend>${q.options.map((option,index)=>`<label class="guided-answer"><input name="guided-answer" type="radio" value="${index}" ${session.answers[session.index]===index?'checked':''}><span><strong>${'ABCD'[index]}.</strong> ${h(option)}</span></label>`).join('')}</fieldset><p class="fine">Your choice saves when you use a save/navigation button. Reload resumes the last confirmed server save.</p><div class="actions"><button class="button secondary" id="guided-previous" ${session.index===0?'disabled':''}>Save / previous</button><button class="button secondary" id="guided-save">Save position</button><button class="button" id="guided-next" ${session.index===session.questions.length-1?'disabled':''}>Save / next</button><button class="button secondary" id="guided-finish">Finish guided practice</button><button class="button secondary" id="guided-archive">Archive unfinished session</button></div>`;
 $('#guided-previous').addEventListener('click',()=>run(()=>save(session.index-1)));
 $('#guided-next').addEventListener('click',()=>run(()=>save(session.index+1)));
 $('#guided-save').addEventListener('click',()=>run(async()=>{await save(session.index);say('#guided-message','Answers and position saved privately to this account.');}));
 $('#guided-finish').addEventListener('click',()=>run(()=>save(session.index,true)));
 $('#guided-archive').addEventListener('click',()=>run(async()=>{if(!confirm('Archive the unfinished session? Only last server-saved answers will remain in your private archive.'))return;await api('study/sessions/'+session.id,{method:'DELETE',body:{}});session=null;$('#guided-panel').hidden=true;await refresh();}));
}
async function initialize() {
 try{await refresh();if(snapshot.active){try{session=await api('study/sessions/'+snapshot.active.id);renderSession();say('#study-message','Resumed your unfinished guided session from its last server save.');}catch(error){const notice=$('#active-study-notice');notice.hidden=false;notice.textContent=error.message+' Download the private archive before retiring this session. ';const button=document.createElement('button');button.className='button secondary';button.textContent='Archive saved unfinished session';button.addEventListener('click',()=>run(async()=>{if(!confirm('Archive this unfinished session? Its saved answers remain in the private archive.'))return;await api('study/sessions/'+snapshot.active.id,{method:'DELETE',body:{}});notice.hidden=true;await refresh();}));notice.append(button);}}}
 catch(error){$('#premium-study').hidden=true;say('#study-message',error.status===403?'Your premium trial or test pass has ended. Free practice and your own data export stay available.':error.status===401?'Sign in with a private free-beta invitation to try these study tools. Existing free practice needs no account.':error.message);}
}
initialize();
