import fs from 'node:fs';
import {validateCatalog} from '../src/engine.js';
import {courseQuestions} from '../src/curriculum.js';
import {verifyMathematicalKey} from '../src/content-checks.js';
const data=validateCatalog(JSON.parse(fs.readFileSync('data/courses.json','utf8')));
const prompts=new Map(),near=new Map(),duplicates=[];
const rows=data.courses.map(course=>{
 const questions=courseQuestions(course),numeric=questions.filter(q=>verifyMathematicalKey(q).checked).length;
 for(const question of questions){
  const prompt=question.prompt.toLowerCase().replace(/[“”]/g,'"').replace(/\s+/g,' ').trim();
  if(prompts.has(prompt))duplicates.push([prompts.get(prompt),question.id]);else prompts.set(prompt,question.id);
  const fingerprint=prompt.replace(/[−-]?\d+(?:\.\d+)?/g,'#');
  near.set(fingerprint,[...(near.get(fingerprint)||[]),question.id]);
 }
 return {id:course.id,title:course.title,revision:course.contentRevision,lessons:course.lessons.length,practice:course.lessons.flatMap(l=>l.questions).length,chapter:course.chapters.flatMap(ch=>ch.assessment).length,final:course.assessment.length,questions:questions.length,modeled:numeric,review:course.review?.status||'legacy metadata'};
});
if(duplicates.length)throw new Error('Exact duplicate question prompts: '+JSON.stringify(duplicates));
const total=field=>rows.reduce((sum,row)=>sum+row[field],0);
const nearGroups=[...near.values()].filter(ids=>ids.length>1);
const report=['# Curriculum coverage and review inventory','','Generated from catalog schema v2. Counts describe scope, not educational quality or independent review.','','| Course | Revision | Lessons | Practice | Chapter | Final | Mathematical model checks |','|---|---:|---:|---:|---:|---:|---:|',...rows.map(row=>`| ${row.title} | ${row.revision} | ${row.lessons} | ${row.practice} | ${row.chapter} | ${row.final} | ${row.modeled}/${row.questions} |`),'',`Totals: ${total('lessons')} lessons; ${total('questions')} original platform questions; ${total('modeled')} mathematical key models checked. The separate legacy ASVAB bank has 540 questions.`,`Exact duplicate prompts: ${duplicates.length}. Number-normalized repeated prompt groups: ${nearGroups.length}. Near matches are review signals, not automatic errors.`,'',`Foundations courses: ${data.courses.filter(c=>c.status==='foundation').map(c=>c.title+' ('+c.chapters.length+' chapter checks, '+c.assessment.length+' final questions)').join('; ')}. ${data.courses.filter(c=>c.status!=='foundation').length} other units remain introductory activities. Reading alone cannot complete a foundations course.`,'', 'Every course and question has a review trail and revision. Independent educator review remains pending for all content. Mathematical models verify a keyed answer against the authored formula; they do not verify that a word problem was modeled correctly, every distractor is sound, or the explanation is pedagogically sufficient.','','## Near-duplicate review signals','',...nearGroups.map(ids=>'- '+ids.join(', ')),'','## Source status','',...data.officialSources.map(source=>`- ${source.organization}: ${source.status}. Verified scope date: ${source.verifiedOn||'none'}.`),''].join('\n');
if(process.argv.includes('--write')){
 fs.writeFileSync('docs/CURRICULUM_COVERAGE.md',report);
 const inventory=data.courses.flatMap(course=>courseQuestions(course).map(question=>({id:question.id,courseId:course.id,contentRevision:course.contentRevision,questionRevision:question.revision,skillId:question.skillId,difficulty:question.difficulty,sourceRefs:question.sourceRefs,reviewStatus:question.review.status,independent:question.review.independent,mathematicalModel:question.verification?.kind||null})));
 fs.writeFileSync('docs/CURRICULUM_REVIEW.json',JSON.stringify(inventory,null,2)+'\n');
}
console.log(`PASS: ${rows.length} learning items, ${total('lessons')} lessons, ${total('questions')} original questions; ${total('modeled')} modeled keys; 0 exact duplicate prompts; ${nearGroups.length} near-duplicate review signals.`);
