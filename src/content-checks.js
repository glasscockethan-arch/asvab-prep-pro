/** Deterministic arithmetic models supplement, rather than replace, educator review. */
const finite = n => typeof n === 'number' && Number.isFinite(n);
export function evaluateExpression(expression, depth = 0) {
  if (depth > 20) throw new Error('Mathematical model is too deep.');
  if (finite(expression)) return expression;
  if (!Array.isArray(expression) || expression.length !== 3) throw new Error('Invalid mathematical expression.');
  const [operation,left,right] = expression;
  const a = evaluateExpression(left,depth+1), b = evaluateExpression(right,depth+1);
  if (operation === 'add') return a+b;
  if (operation === 'sub') return a-b;
  if (operation === 'mul') return a*b;
  if (operation === 'div' && b !== 0) return a/b;
  throw new Error('Unsupported operation or division by zero.');
}
export function verifyMathematicalKey(question) {
  const model = question.verification;
  if (!model) return {checked:false,kind:'editorial'};
  let expected;
  if (model.kind === 'numeric') expected = evaluateExpression(model.expression);
  else if (model.kind === 'equation') {
    if (![model.left,model.right].every(side => Array.isArray(side) && side.length === 2 && side.every(finite))) throw new Error('Invalid equation model.');
    const [a,b] = model.left, [c,d] = model.right;
    expected = a === c ? (b === d ? 'all-real' : 'none') : (d-b)/(a-c);
  } else throw new Error('Unsupported mathematical model.');
  if (!Array.isArray(model.optionValues) || model.optionValues.length !== question.options.length || model.optionValues.some(value => !finite(value) && !['all-real','none'].includes(value))) throw new Error('Invalid mathematical choices.');
  const matches = model.optionValues.flatMap((value,index) =>
    (typeof expected === 'string' ? value === expected : finite(value) && Math.abs(value-expected) <= 1e-9*Math.max(1,Math.abs(expected))) ? [index] : []);
  if (matches.length !== 1 || matches[0] !== question.answer) throw new Error(`Mathematical key mismatch: ${question.id}`);
  return {checked:true,kind:model.kind};
}
