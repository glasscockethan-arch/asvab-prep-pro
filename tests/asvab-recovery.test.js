import test from 'node:test';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context={};vm.runInNewContext(fs.readFileSync('asvab-recovery.js','utf8'),context);
const {validate,key}=context.AsvabRecovery;
const html=fs.readFileSync('practice.html','utf8'),questions=JSON.parse(html.match(/const QUESTIONS=(\[.*?\]);/s)[1]);
const record=()=>({version:1,id:'test-session-123',mode:'subject',sub:'Arithmetic Reasoning',ids:questions.slice(0,20).map(q=>q.id),answers:Array(20).fill(null),i:0,end:null});
test('ASVAB recovery validates stable question IDs, unique selections, answer indices and supported session versions',()=>{
 const saved=record();assert.equal(validate(saved,questions).ids.length,20);for(const change of [{version:2},{id:''},{mode:'unknown'},{ids:[...saved.ids.slice(0,19),'q9999']},{ids:Array(20).fill('q0001')},{answers:[4,...saved.answers.slice(1)]},{i:20},{sub:'Word Knowledge'}])assert.throws(()=>validate({...saved,...change},questions));
 assert.equal(key,'aptitude-beacon-asvab-session-v1');
});
test('recovery retains absolute timed deadlines and rejects invalid modes, sizes and untimed deadlines',()=>{
 const saved=record();assert.throws(()=>validate({...saved,end:1000},questions));const timed={...saved,mode:'afqt',ids:questions.slice(0,40).map(q=>q.id),answers:Array(40).fill(null),end:123456789};assert.equal(validate(timed,questions).end,123456789);assert.throws(()=>validate({...timed,end:NaN},questions));assert.throws(()=>validate({...timed,end:null},questions));assert.throws(()=>validate({...saved,mode:'diagnostic'},questions));
});
test('recovery copies mutable arrays and cannot alter preserved V3 progress or the question bank',()=>{
 const saved=record(),original=JSON.stringify(questions),clean=validate(saved,questions);clean.answers[0]=1;clean.ids[0]='q0002';assert.equal(saved.answers[0],null);assert.equal(saved.ids[0],'q0001');assert.equal(JSON.stringify(questions),original);
});

test('revenue sprint preserves the complete 540-question bank byte-for-byte',()=>{
 assert.equal(questions.length,540);assert.equal(createHash('sha256').update(html.match(/const QUESTIONS=(\[.*?\]);/s)[1]).digest('hex'),'c65c4221d4219166b30856e5e70b13572c8cc9e9f8c9187017753563e08061e6');
});
