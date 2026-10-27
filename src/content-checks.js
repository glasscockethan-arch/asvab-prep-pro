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
  if (operation === 'pow' && Number.isInteger(b) && Math.abs(b) <= 12 && !(a === 0 && b <= 0)) {
    const result = a ** b;
    if (finite(result)) return result;
  }
  throw new Error('Unsupported operation or division by zero.');
}
function trim(coefficients) {
  const result = [...coefficients];
  while (result.length > 1 && Math.abs(result.at(-1)) < 1e-12) result.pop();
  return result;
}
export function evaluatePolynomial(expression, depth = 0) {
  if (depth > 20 || !Array.isArray(expression)) throw new Error('Invalid polynomial model.');
  if (expression.length > 0 && expression.length <= 13 && expression.every(finite)) return trim(expression);
  if (expression.length !== 3 || !['add','sub','mul'].includes(expression[0])) throw new Error('Unsupported polynomial operation.');
  const [operation,left,right] = expression;
  const a = evaluatePolynomial(left,depth+1), b = evaluatePolynomial(right,depth+1);
  const result = Array(operation === 'mul' ? a.length+b.length-1 : Math.max(a.length,b.length)).fill(0);
  if (result.length > 13) throw new Error('Polynomial degree exceeds model limits.');
  if (operation === 'mul') a.forEach((x,i)=>b.forEach((y,j)=>{result[i+j]+=x*y;}));
  else result.forEach((_,i)=>{result[i]=(a[i]||0)+(operation==='sub'?-1:1)*(b[i]||0);});
  if (!result.every(finite)) throw new Error('Non-finite polynomial result.');
  return trim(result);
}
const near = (a,b) => Math.abs(a-b) <= 1e-9*Math.max(1,Math.abs(a),Math.abs(b));
const sameArray = (a,b) => a.length === b.length && a.every((value,i)=>near(value,b[i]));
function numericLabel(label) {
  const cleaned = label.replaceAll('−','-').replaceAll(',','').replace(/^\s*\$\s*/,'').replace(/\s*(?:%|hours?|years?|miles?|dollars?)\s*$/,'').trim();
  if (!/^-?\d+(?:\.\d+)?(?:\/-?\d+(?:\.\d+)?)?$/.test(cleaned)) throw new Error('Printed numeric choice is not supported.');
  const [n,d='1'] = cleaned.split('/').map(Number);
  if (!d) throw new Error('Invalid printed fraction.');
  return n/d;
}
export function verifyMathematicalKey(question) {
  const model = question.verification;
  if (!model) return {checked:false,kind:'editorial'};
  let expected, matches;
  if (model.kind === 'polynomial') {
    expected = evaluatePolynomial(model.expression);
    if (!Array.isArray(model.optionExpressions) || model.optionExpressions.length !== question.options.length) throw new Error('Invalid polynomial choices.');
    matches = model.optionExpressions.flatMap((expression,index)=>sameArray(evaluatePolynomial(expression),expected)?[index]:[]);
  } else if (model.kind === 'quadratic-roots') {
    if (!Array.isArray(model.coefficients) || model.coefficients.length !== 3 || !model.coefficients.every(finite) || model.coefficients[2] === 0) throw new Error('Invalid quadratic coefficients.');
    const [c,b,a] = model.coefficients, discriminant = b*b-4*a*c;
    expected = discriminant < 0 ? [] : discriminant === 0 ? [-b/(2*a)] : [(-b-Math.sqrt(discriminant))/(2*a),(-b+Math.sqrt(discriminant))/(2*a)].sort((x,y)=>x-y);
    if (!Array.isArray(model.optionRoots) || model.optionRoots.length !== question.options.length || model.optionRoots.some(roots=>!Array.isArray(roots)||roots.length>2||!roots.every(finite))) throw new Error('Invalid root choices.');
    matches = model.optionRoots.flatMap((roots,index)=>sameArray([...new Set(roots)].sort((x,y)=>x-y),expected)?[index]:[]);
  } else {
  if (model.kind === 'numeric') {
    expected = evaluateExpression(model.expression);
    if (model.roundTo !== undefined) {
      if (!Number.isInteger(model.roundTo) || model.roundTo < 0 || model.roundTo > 6) throw new Error('Unsupported rounding precision.');
      const scale = 10 ** model.roundTo;
      expected = Math.sign(expected)*Math.round((Math.abs(expected)+Number.EPSILON*Math.max(1,Math.abs(expected)))*scale)/scale;
    }
  }
  else if (model.kind === 'equation') {
    if (![model.left,model.right].every(side => Array.isArray(side) && side.length === 2 && side.every(finite))) throw new Error('Invalid equation model.');
    const [a,b] = model.left, [c,d] = model.right;
    expected = a === c ? (b === d ? 'all-real' : 'none') : (d-b)/(a-c);
  } else throw new Error('Unsupported mathematical model.');
  if (!Array.isArray(model.optionValues) || model.optionValues.length !== question.options.length || model.optionValues.some(value => !finite(value) && !['all-real','none'].includes(value))) throw new Error('Invalid mathematical choices.');
  if (model.checkPrintedOptions && model.optionValues.some((value,i)=>!finite(value)||!near(numericLabel(question.options[i]),value))) throw new Error(`Printed numeric choice mismatch: ${question.id}`);
  matches = model.optionValues.flatMap((value,index) =>
    (typeof expected === 'string' ? value === expected : finite(value) && Math.abs(value-expected) <= 1e-9*Math.max(1,Math.abs(expected))) ? [index] : []);
  }
  if (matches.length !== 1 || matches[0] !== question.answer) throw new Error(`Mathematical key mismatch: ${question.id}`);
  return {checked:true,kind:model.kind};
}
