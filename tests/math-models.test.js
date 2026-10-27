import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateExpression,evaluatePolynomial,verifyMathematicalKey} from '../src/content-checks.js';
test('integer powers retain sign and reciprocal meaning and reject undefined or excessive models',()=>{
 assert.equal(evaluateExpression(['pow',-4,2]),16);assert.equal(evaluateExpression(['pow',2,-3]),.125);
 for(const expression of [['pow',0,0],['pow',0,-1],['pow',2,.5],['pow',2,100],['pow',1e308,2]])assert.throws(()=>evaluateExpression(expression));
});
test('polynomial identities multiply every term and reject equivalent distractors',()=>{
 assert.deepEqual(evaluatePolynomial(['mul',[-2,1],[5,1]]),[-10,3,1]);assert.deepEqual(evaluatePolynomial(['sub',[0,0,3],[5,-2,1]]),[-5,2,2]);
 const q={id:'polynomial-check',options:['x² + 3x − 10','x² + 7x − 10','x² − 3x − 10','x² + 3x + 10'],answer:0,verification:{kind:'polynomial',expression:['mul',[-2,1],[5,1]],optionExpressions:[[-10,3,1],[-10,7,1],[-10,-3,1],[10,3,1]]}};
 assert.equal(verifyMathematicalKey(q).checked,true);q.verification.optionExpressions[1]=[-10,3,1];assert.throws(()=>verifyMathematicalKey(q),/mismatch/);
});
test('quadratic roots retain zero, repeated roots and the real-domain distinction',()=>{
 for(const [coefficients,optionRoots] of [[[0,-2,1],[[0,2],[2],[0],[]]],[[9,-6,1],[[3],[-3],[0,3],[-3,3]]],[[4,0,1],[[],[-2,2],[-4],[0]]]]){
  const q={id:'root-check',options:['A','B','C','D'],answer:0,verification:{kind:'quadratic-roots',coefficients,optionRoots}};assert.equal(verifyMathematicalKey(q).checked,true);
 }
 assert.throws(()=>verifyMathematicalKey({id:'not-quadratic',options:['A','B','C','D'],answer:0,verification:{kind:'quadratic-roots',coefficients:[1,2,0],optionRoots:[[],[0],[1],[2]]}}),/quadratic/);
});
test('final rounding is explicit and printed-number typos cannot hide behind valid annotations',()=>{
 for(const value of [1.005,-1.005]){
  const amount=value>0?1.01:-1.01,q={id:'rounding-check',options:[String(amount),'0','2','3'],answer:0,verification:{kind:'numeric',expression:value,optionValues:[amount,0,2,3],roundTo:2,checkPrintedOptions:true}};
  assert.equal(verifyMathematicalKey(q).checked,true);const typo=structuredClone(q);typo.options[0]='999';assert.throws(()=>verifyMathematicalKey(typo),/Printed/);q.verification.roundTo=20;assert.throws(()=>verifyMathematicalKey(q),/rounding/);
 }
});
