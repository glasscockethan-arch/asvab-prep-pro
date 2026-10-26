import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateCatalog,questionsFor} from '../src/engine.js';
import {courseQuestions,courseEvidence,assessmentEvidence,topicEvidence,normalizeCatalog} from '../src/curriculum.js';
import {verifyMathematicalKey,evaluateExpression} from '../src/content-checks.js';
import {emptyState,validateState,mergeState,parseBackup,loadState,STORAGE_KEY} from '../src/storage.js';
const raw=JSON.parse(fs.readFileSync(new URL('../data/courses.json',import.meta.url)));
const catalog=validateCatalog(raw),course=catalog.courses[0];
const old=JSON.parse(fs.readFileSync(new URL('./fixtures/catalog-v1.json',import.meta.url)));
function attempt(questions,mode='practice',chapterId){return {id:crypto.randomUUID(),courseId:course.id,date:'2026-10-25T12:00:00Z',mode,contentRevision:course.contentRevision,...(chapterId?{chapterId}:{}),details:questions.map(q=>({id:q.id,chosen:q.answer,correct:true}))};}
test('v1 catalogs normalize without mutating source or losing original question IDs',()=>{
 const before=JSON.stringify(old),normalized=normalizeCatalog(old);assert.equal(normalized.schemaVersion,2);assert.equal(JSON.stringify(old),before);
 const ids=new Set(catalog.courses.flatMap(courseQuestions).map(q=>q.id));for(const q of old.courses.flatMap(courseQuestions))assert.ok(ids.has(q.id),q.id);
 assert.equal(course.lessons.length,9);assert.equal(courseQuestions(course).length,84);assert.equal(catalog.courses.flatMap(courseQuestions).length,144);
});
test('mathematical models catch a corrupted key and distinguish identities from contradictions',()=>{
 let checked=0;for(const q of courseQuestions(course))if(q.verification){assert.equal(verifyMathematicalKey(q).checked,true);const wrong=structuredClone(q);wrong.answer=(q.answer+1)%4;assert.throws(()=>verifyMathematicalKey(wrong));checked++;}assert.ok(checked>=40);
 assert.equal(evaluateExpression(['div',['sub',25,7],3]),6);assert.throws(()=>evaluateExpression(['div',1,0]));assert.throws(()=>evaluateExpression(['eval',1,2]));
});
test('chapters, prerequisites, source references and editorial trails are validated',()=>{
 for(const mutate of [d=>d.courses[0].chapters[0].lessonIds.push('missing'),d=>d.courses[0].lessons[0].prerequisites=['linear-models'],d=>d.courses[0].assessment[0].sourceRefs=['missing'],d=>delete d.courses[0].assessment[0].review,d=>d.courses[0].prerequisiteCourseIds=[d.courses[0].id]]){const copy=structuredClone(raw);mutate(copy);assert.throws(()=>validateCatalog(copy));}
});
test('diagnostic spans all three chapters; chapter and final pools are disjoint from practice',()=>{
 const diagnostic=questionsFor(course,'diagnostic');assert.equal(diagnostic.length,6);for(const ch of course.chapters)assert.ok(diagnostic.some(q=>ch.lessonIds.includes(q.skillId)));
 const practice=new Set(questionsFor(course).map(q=>q.id));for(const ch of course.chapters){const selected=questionsFor(course,'chapter',null,'all',ch.id);assert.equal(selected.length,6);assert.ok(selected.every(q=>!practice.has(q.id)));}assert.throws(()=>questionsFor(course,'chapter',null,'all','missing'));
});
test('old tiny assessments and forged correctness flags cannot complete the expanded course',()=>{
 const state=emptyState();for(const lesson of course.lessons)state.lessons[`${course.id}-${lesson.id}`]='2026-10-25T12:00:00Z';
 const prior=attempt(course.assessment.slice(0,3),'assessment');prior.contentRevision=1;state.attempts.push(prior);assert.equal(courseEvidence(course,state).met,false);assert.equal(assessmentEvidence(course,state.attempts).covered,false);
 const forged=attempt(course.assessment,'assessment');forged.details.forEach((d,i)=>{d.chosen=(course.assessment[i].answer+1)%4;});assert.equal(assessmentEvidence(course,[forged]).passed,false);
});
test('full course standard requires reading, all topic pools, all chapter checks and the final',()=>{
 const state=emptyState();state.attempts.push(attempt(course.assessment,'assessment'));assert.equal(courseEvidence(course,state).met,false);
 for(const l of course.lessons){state.lessons[`${course.id}-${l.id}`]='2026-10-25T12:00:00Z';state.attempts.push(attempt(l.questions));}
 assert.equal(courseEvidence(course,state).met,false);
 for(const ch of course.chapters)state.attempts.push(attempt(ch.assessment,'chapter',ch.id));
 assert.equal(courseEvidence(course,state).met,true);assert.equal(courseEvidence(course,state).final.percent,100);
 delete state.lessons[`${course.id}-balance`];assert.equal(courseEvidence(course,state).met,false);assert.equal(courseEvidence(course,state).next.kind,'lesson');
});
test('topic evidence uses latest answers chronologically and requires the full six-question pool',()=>{
 const lesson=course.lessons[0],first=attempt(lesson.questions),partial=attempt(lesson.questions.slice(0,3));assert.equal(topicEvidence(course,lesson,[partial]).met,false);
 const later=attempt(lesson.questions.slice(0,2));later.date='2026-10-26T12:00:00Z';later.details.forEach((d,i)=>{d.chosen=(lesson.questions[i].answer+1)%4;d.correct=true;});
 const result=topicEvidence(course,lesson,[later,first]);assert.equal(result.correct,4);assert.equal(result.met,false);
});
test('v1 storage migration preserves active session, history, bookmarks and reading without writing',()=>{
 const state={...emptyState(),schemaVersion:1};delete state.enrollments;state.bookmarks=[course.id];state.lessons[`${course.id}-balance`]='2026-10-25T12:00:00Z';const active={courseId:course.id,mode:'assessment',ids:course.assessment.slice(0,3).map(q=>q.id),answers:[0,null,null],index:1,deadline:null};state.active=active;
 const text=JSON.stringify(state),storage={getItem:key=>key===STORAGE_KEY?text:null};const loaded=loadState(storage);assert.equal(loaded.state.schemaVersion,2);assert.deepEqual(loaded.state.active,active);assert.deepEqual(loaded.state.enrollments,{});assert.equal(storage.getItem(STORAGE_KEY),text);assert.deepEqual(parseBackup(text),loaded.state);
});
test('enrollments and chapter-session metadata roundtrip and malformed chapter imports fail',()=>{
 const state=emptyState();state.enrollments[course.id]='2026-10-25T12:00:00Z';state.attempts.push(attempt(course.chapters[0].assessment,'chapter',course.chapters[0].id));assert.deepEqual(parseBackup(JSON.stringify(state)),state);
 delete state.attempts[0].chapterId;assert.throws(()=>validateState(state));
});
test('backup merging rejects conflicting attempts and preserves newer reading and earliest enrollment',()=>{
 const current=emptyState(),incoming=emptyState();const entry=attempt(course.assessment,'assessment');current.attempts.push(entry);incoming.attempts.push(structuredClone(entry));incoming.attempts[0].details[0].chosen=(entry.details[0].chosen+1)%4;assert.throws(()=>mergeState(current,incoming),/Conflicting/);assert.equal(current.attempts[0].details[0].chosen,entry.details[0].chosen);
 incoming.attempts=[];current.lessons['unit-lesson']='2026-10-26T12:00:00Z';incoming.lessons['unit-lesson']='2026-10-25T12:00:00Z';current.enrollments.unit='2026-10-25T12:00:00Z';incoming.enrollments.unit='2026-10-26T12:00:00Z';const merged=mergeState(current,incoming);assert.equal(merged.lessons['unit-lesson'],current.lessons['unit-lesson']);assert.equal(merged.enrollments.unit,current.enrollments.unit);
});
test('ambiguous duplicate session records and non-object backups are rejected',()=>{
 const state=emptyState(),entry=attempt(course.assessment,'assessment');state.attempts=[entry,structuredClone(entry)];assert.throws(()=>validateState(state));
 state.attempts=[entry];entry.details.push({...entry.details[0]});assert.throws(()=>validateState(state));assert.throws(()=>parseBackup('null'),/object/);assert.throws(()=>parseBackup('[]'),/object/);
});
test('diagrams cannot allocate unbounded arrays or display values outside their coordinate window',()=>{
 const copy=structuredClone(raw);copy.courses[0].lessons.find(l=>l.diagram).diagram.xMax=1000000;assert.throws(()=>validateCatalog(copy),/coordinate window/);
});
