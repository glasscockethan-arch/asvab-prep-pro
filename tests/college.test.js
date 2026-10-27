import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateCatalog,questionsFor,score} from '../src/engine.js';
import {courseQuestions,courseEvidence,assessmentEvidence} from '../src/curriculum.js';
import {emptyState,parseBackup,mergeState} from '../src/storage.js';
import {evaluateExpression,evaluatePolynomial,verifyMathematicalKey} from '../src/content-checks.js';
import {courseMarkup} from '../src/course-ui.js';
const raw=JSON.parse(fs.readFileSync(new URL('../data/courses.json',import.meta.url)));
const data=validateCatalog(raw),course=data.courses.find(c=>c.id==='college-quantitative');
const identities=JSON.parse(fs.readFileSync(new URL('./fixtures/phase2-identities.json',import.meta.url)));
function attempt(questions,mode='practice',chapterId){return {id:crypto.randomUUID(),courseId:course.id,contentRevision:course.contentRevision,date:'2026-10-25T12:00:00Z',mode,...(chapterId?{chapterId}:{}),details:questions.map(q=>({id:q.id,chosen:q.answer,correct:true}))};}
test('college curriculum adds a complete ordered blueprint while preserving Phase 2 identities',()=>{
 assert.equal(course.lessons.length,12);assert.equal(course.chapters.length,4);assert.equal(courseQuestions(course).length,112);assert.equal(course.assessment.length,16);
 for(const prior of identities){const current=data.courses.find(c=>c.id===prior.id);assert.equal(current.contentRevision,prior.revision);assert.deepEqual(current.lessons.map(l=>l.id),prior.lessons);assert.deepEqual(courseQuestions(current).map(q=>q.id),prior.questions);}
 assert.ok(course.lessons.every(l=>l.paragraphs.length>=5&&l.additionalExamples?.length===1&&l.questions.length===6));
 assert.deepEqual(course.prerequisiteCourseIds,['linear-equations']);
});



test('modeled college keys and their printed numbers catch corrupted content',()=>{
 let checked=0;for(const q of courseQuestions(course))if(q.verification){checked++;assert.equal(verifyMathematicalKey(q).checked,true);const wrong=structuredClone(q);wrong.answer=(q.answer+1)%4;assert.throws(()=>verifyMathematicalKey(wrong));}
 assert.equal(checked,84);
 const q=structuredClone(courseQuestions(course).find(q=>q.verification?.checkPrintedOptions));q.options[q.answer]='999';assert.throws(()=>verifyMathematicalKey(q),/Printed/);
});

test('cumulative skill coverage and chapter-local skills are enforced, not just pool counts',()=>{
 for(const mutate of [c=>c.assessment.forEach(q=>q.skillId='equations'),c=>c.chapters[0].assessment[0].skillId='growth',c=>c.lessons[0].additionalExamples[0].steps=[],c=>c.lessons[0].questions[0].skillId='growth']){const copy=structuredClone(raw);mutate(copy.courses.find(c=>c.id===course.id));assert.throws(()=>validateCatalog(copy));}
 const diagnostic=questionsFor(course,'diagnostic');for(const chapter of course.chapters)assert.ok(diagnostic.some(q=>chapter.lessonIds.includes(q.skillId)));
});
test('college final alone cannot complete the course; all current pools and reading are required',()=>{
 const state=emptyState();state.attempts.push(attempt(course.assessment,'assessment'));assert.equal(courseEvidence(course,state).met,false);
 for(const lesson of course.lessons){state.lessons[`${course.id}-${lesson.id}`]='2026-10-25T12:00:00Z';state.attempts.push(attempt(lesson.questions));}
 for(const chapter of course.chapters.slice(0,3))state.attempts.push(attempt(chapter.assessment,'chapter',chapter.id));assert.equal(courseEvidence(course,state).met,false);
 const last=course.chapters.at(-1);state.attempts.push(attempt(last.assessment,'chapter',last.id));assert.equal(courseEvidence(course,state).met,true);
 const restored=parseBackup(JSON.stringify(state));assert.equal(courseEvidence(course,restored).met,true);assert.deepEqual(mergeState(state,restored),state);
});
test('a final has to cover the exact blueprint and cannot borrow another course’s score',()=>{
 const incomplete=attempt(course.assessment.slice(0,12),'assessment');assert.equal(assessmentEvidence(course,[incomplete]).covered,false);
 const other=attempt(course.assessment,'assessment');other.courseId='linear-equations';assert.equal(assessmentEvidence(course,[other]).covered,false);
 const wrong=course.assessment.map(q=>(q.answer+1)%4);assert.equal(score(course.assessment,wrong).correct,0);
});
test('additional worked examples and recommended prerequisites are rendered and escaped',()=>{
 const lesson=structuredClone(course.lessons[0]);lesson.additionalExamples[0].problem='<script>unsafe</script>';
 const html=courseMarkup(course,emptyState(),lesson,'College',data);assert.match(html,/Worked example 2/);assert.match(html,/&lt;script&gt;unsafe/);assert.doesNotMatch(html,/<script>unsafe/);
 const overview=courseMarkup(course,emptyState(),undefined,'College',data);assert.match(overview,/Recommended foundation/);assert.match(overview,/course.html\?id=linear-equations/);assert.match(overview,/Sources and scoped review/);
});
