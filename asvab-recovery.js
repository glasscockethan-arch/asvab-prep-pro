/* Classic script for the preserved V3 app. Its progress key and question IDs do not change. */
'use strict';
globalThis.AsvabRecovery=Object.freeze({
 key:'aptitude-beacon-asvab-session-v1',
 validate(record,questions) {
  const fail=()=>{throw new Error('Unfinished ASVAB session is invalid. Its original recovery record has not been replaced.');};
  if(!record||record.version!==1||typeof record.id!=='string'||!/^[a-zA-Z0-9-]{10,100}$/.test(record.id)||!['diagnostic','mixed','afqt','missed','subject'].includes(record.mode)||typeof record.sub!=='string'||!Array.isArray(record.ids)||!record.ids.length||record.ids.length>90||new Set(record.ids).size!==record.ids.length||!Array.isArray(record.answers)||record.answers.length!==record.ids.length||!record.answers.every(a=>a===null||Number.isInteger(a)&&a>=0&&a<4)||!Number.isInteger(record.i)||record.i<0||record.i>=record.ids.length)fail();
  const known=new Map(questions.map(q=>[q.id,q]));if(!record.ids.every(id=>known.has(id)))fail();
  const timed=['mixed','afqt'].includes(record.mode);
  if(timed?(!Number.isFinite(record.end)||record.end<=0):record.end!==null)fail();
  const sizes={diagnostic:45,mixed:90,afqt:40,subject:20};
  if(sizes[record.mode]&&record.ids.length!==sizes[record.mode]||record.mode==='missed'&&record.ids.length>30)fail();
  if(record.mode==='subject'&&!record.ids.every(id=>known.get(id).subject===record.sub))fail();
  if(record.mode==='afqt'&&!record.ids.every(id=>['Arithmetic Reasoning','Mathematics Knowledge','Word Knowledge','Paragraph Comprehension'].includes(known.get(id).subject)))fail();
  return {version:1,id:record.id,mode:record.mode,sub:record.sub,ids:[...record.ids],answers:[...record.answers],i:record.i,end:record.end};
 }
});
