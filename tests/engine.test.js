import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {shuffle,score,secondsLeft,questionsFor,validateCatalog} from '../src/engine.js';
const data = JSON.parse(fs.readFileSync(new URL('../data/courses.json',import.meta.url)));
const course = data.courses[0];
test('all released units satisfy the content contract with globally unique question IDs',()=>{
 validateCatalog(data);const questions=data.courses.flatMap(c=>[...c.lessons.flatMap(l=>l.questions),...c.assessment]);
 assert.equal(data.courses.length,6);assert.equal(questions.length,72);assert.equal(new Set(questions.map(q=>q.id)).size,72);
 for(const c of data.courses){assert.equal(c.status,'introductory');assert.equal(c.lessons.length,3);assert.ok(c.lessons.every(l=>l.paragraphs.length>=3&&l.example.steps.length>=3&&l.flashcards.length));}
});
test('scoring counts wrong and unanswered responses without changing input',()=>{
 const questions=course.lessons[0].questions,answers=[questions[0].answer,(questions[1].answer+1)%4,null];
 const before=JSON.stringify(answers),result=score(questions,answers);assert.equal(result.correct,1);assert.equal(result.total,3);assert.equal(result.percent,33);assert.equal(result.details[2].correct,false);assert.equal(JSON.stringify(answers),before);
 assert.throws(()=>score(questions,[9,null,null]));assert.throws(()=>score(questions,[]));
});
test('every answer key scores correctly and each alternative is rejected',()=>{
 for(const c of data.courses)for(const q of [...c.lessons.flatMap(l=>l.questions),...c.assessment])for(let i=0;i<4;i++)assert.equal(score([q],[i]).correct,i===q.answer?1:0);
});
test('timer uses absolute deadline and handles expiry and reload time',()=>{
 assert.equal(secondsLeft(10000,9000),1);assert.equal(secondsLeft(10000,9001),1);assert.equal(secondsLeft(10000,10000),0);assert.equal(secondsLeft(10000,20000),0);assert.equal(secondsLeft(null,999999),null);
});
test('shuffle is a permutation and never mutates the source',()=>{
 const original=[1,2,3,4,5],shuffled=shuffle(original,()=>0);assert.deepEqual(original,[1,2,3,4,5]);assert.deepEqual(shuffled.slice().sort(),original);assert.notDeepEqual(shuffled,original);
});
test('question selection separates assessment holdouts, topics, and difficulty',()=>{
 assert.equal(questionsFor(course,'practice').length,9);assert.equal(questionsFor(course,'diagnostic').length,6);assert.equal(questionsFor(course,'practice','balance').length,3);assert.equal(questionsFor(course,'practice',null,'introductory').length,3);
 const practice=new Set(questionsFor(course).map(q=>q.id));assert.ok(questionsFor(course,'assessment').every(q=>!practice.has(q.id)));assert.throws(()=>questionsFor(course,'practice','missing'));
});
test('malformed catalog and duplicate content identifiers fail validation',()=>{
 const copy=structuredClone(data);copy.courses[0].lessons[0].questions[0].answer=7;assert.throws(()=>validateCatalog(copy));
 const duplicate=structuredClone(data);duplicate.courses.push(duplicate.courses[0]);assert.throws(()=>validateCatalog(duplicate));
});
