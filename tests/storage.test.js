import test from 'node:test';
import assert from 'node:assert/strict';
import {STORAGE_KEY,LEGACY_KEY,emptyState,validateState,validateLegacy,parseBackup,mergeState,loadState,saveState,activity,localDay} from '../src/storage.js';
const detail={id:'q0001',subject:'Arithmetic Reasoning',q:'What is 2 + 2?',options:['4','5','6','7'],answer:0,chosen:0,correct:false,explanation:'Add the two quantities to get four.'};
const legacy={app:'ASVAB Prep Pro V3',version:3,history:[{date:'2026-10-25T12:00:00Z',mode:'diagnostic',details:[detail]}],missed:[],week:2};
function memory(initial={}){const data=new Map(Object.entries(initial));return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};}
test('legacy migration preserves original bytes, recomputes correctness and is repeatable',()=>{
 const raw=JSON.stringify(legacy),storage=memory({[LEGACY_KEY]:raw});const loaded=loadState(storage);assert.equal(loaded.state.legacy.history.length,1);assert.equal(loaded.state.legacy.history[0].details[0].correct,true);assert.equal(storage.getItem(LEGACY_KEY),raw);assert.ok(saveState(storage,loaded.state));assert.equal(loadState(storage).state.legacy.history.length,1);assert.equal(storage.getItem(LEGACY_KEY),raw);
});
test('legacy spatial graphics survive validation and export',()=>{
 const copy=structuredClone(legacy);copy.history[0].details[0].visual={target:[[0,0]],options:[[[0,0]],[[0,1]],[[1,0]],[[1,1]]]};
 const state=parseBackup(JSON.stringify(copy));assert.deepEqual(parseBackup(JSON.stringify(state)).legacy.history[0].details[0].visual,copy.history[0].details[0].visual);
});
test('invalid nested imports and future versions fail without changing existing data',()=>{
 const storage=memory({[STORAGE_KEY]:JSON.stringify(emptyState())});const before=storage.getItem(STORAGE_KEY);
 const bad=structuredClone(legacy);bad.history[0].details[0].options=null;assert.throws(()=>parseBackup(JSON.stringify(bad)));assert.throws(()=>parseBackup('{'));assert.throws(()=>parseBackup('{"schemaVersion":99}'));assert.throws(()=>parseBackup('x'.repeat(10_000_001)));assert.equal(storage.getItem(STORAGE_KEY),before);
});
test('merge is idempotent and retains lessons, bookmarks and history',()=>{
 const a=emptyState(),b=emptyState();a.lessons['unit-first']='2026-10-24T12:00:00Z';b.lessons['unit-second']='2026-10-25T12:00:00Z';a.bookmarks=['unit-a'];b.bookmarks=['unit-b'];b.attempts=[{id:'attempt-1',courseId:'unit-b',date:'2026-10-25T12:00:00Z',mode:'practice',details:[{id:'question-1',chosen:1,correct:true}]}];
 const merged=mergeState(a,b);assert.equal(Object.keys(merged.lessons).length,2);assert.equal(merged.attempts.length,1);assert.deepEqual(mergeState(merged,b),merged);assert.deepEqual(a.bookmarks,['unit-a']);
});
test('malformed saved platform data blocks writes instead of resetting it',()=>{
 const storage=memory({[STORAGE_KEY]:'not-json'});assert.equal(loadState(storage).state,null);assert.equal(storage.getItem(STORAGE_KEY),'not-json');
 const unavailable={getItem(){throw Error('denied');},setItem(){throw Error('quota');}};assert.equal(loadState(unavailable).state,null);assert.equal(saveState(unavailable,emptyState()),false);
});
test('invalid legacy data does not prevent new lessons and does not overwrite legacy',()=>{
 const storage=memory({[LEGACY_KEY]:'{"history":[{}],"missed":[]}'});const loaded=loadState(storage);assert.ok(loaded.state);assert.match(loaded.warning,/original storage is unchanged/);assert.ok(saveState(storage,loaded.state));assert.equal(storage.getItem(LEGACY_KEY),'{"history":[{}],"missed":[]}');
});
test('active sessions roundtrip deadlines and reject inconsistent answers',()=>{
 const state=emptyState();state.active={courseId:'linear-equations',mode:'timed',ids:['question-1','question-2'],answers:[0,null],index:1,deadline:5000};assert.deepEqual(parseBackup(JSON.stringify(state)),state);state.active.answers=[];assert.throws(()=>validateState(state));
});
test('goals count answered questions and rolling seven days, not unanswered items',()=>{
 const now=new Date(2026,9,25,12).getTime(),state=emptyState();
 for(const [days,chosen] of [[0,1],[1,0],[2,null],[8,1]])state.attempts.push({id:`attempt-${days}`,courseId:'course',date:new Date(now-days*86400000).toISOString(),mode:'practice',details:[{id:'q',chosen,correct:false}]});
 assert.deepEqual(activity(state,now),{daily:1,weekly:2,streak:2});assert.match(localDay(now),/^2026-10-25$/);
});
test('invalid legacy dates, choice indices and week values are rejected',()=>{
 for(const mutate of [x=>x.history[0].date='bad',x=>x.history[0].details[0].chosen=9,x=>x.week=0]){const copy=structuredClone(legacy);mutate(copy);assert.throws(()=>validateLegacy(copy));}
});
