#!/usr/bin/env python3
"""Independent exact-arithmetic and printed-choice audit of the original college course.

Uses Fraction and a restricted polynomial parser, not JavaScript or eval().
Model/wording interpretation and educational quality still need educator review.
"""
from fractions import Fraction
from pathlib import Path
import ast
import json
import math
import re

ROOT=Path(__file__).resolve().parents[1]
CID='college-quantitative'
def rational(value):
    if isinstance(value,bool) or not isinstance(value,(int,float,str)):raise ValueError('Invalid rational input')
    return Fraction(str(value))
def expression(value,depth=0):
    if depth>20:raise ValueError('Expression too deep')
    if isinstance(value,(int,float)) and not isinstance(value,bool):return rational(value)
    if not isinstance(value,list) or len(value)!=3:raise ValueError('Invalid expression')
    op,left,right=value;a=expression(left,depth+1);b=expression(right,depth+1)
    if op=='add':return a+b
    if op=='sub':return a-b
    if op=='mul':return a*b
    if op=='div':return a/b
    if op=='pow' and b.denominator==1 and abs(b)<=12 and not(a==0 and b<=0):return a**int(b)
    raise ValueError('Unsupported arithmetic operation')
def trim(poly):
    result=list(poly)
    while len(result)>1 and result[-1]==0:result.pop()
    return result
def add(a,b,sign=1):return trim([(a[i] if i<len(a) else 0)+sign*(b[i] if i<len(b) else 0) for i in range(max(len(a),len(b)))])
def multiply(a,b):
    if len(a)+len(b)>14:raise ValueError('Polynomial exceeds degree limit')
    result=[Fraction(0)]*(len(a)+len(b)-1)
    for i,x in enumerate(a):
        for j,y in enumerate(b):result[i+j]+=x*y
    return trim(result)
def polynomial_model(model,depth=0):
    if depth>20 or not isinstance(model,list):raise ValueError('Invalid polynomial model')
    if model and all(isinstance(n,(int,float)) and not isinstance(n,bool) for n in model):return trim(map(rational,model))
    if len(model)!=3:raise ValueError('Invalid polynomial operation')
    op,left,right=model;a=polynomial_model(left,depth+1);b=polynomial_model(right,depth+1)
    if op=='add':return add(a,b)
    if op=='sub':return add(a,b,-1)
    if op=='mul':return multiply(a,b)
    raise ValueError('Unsupported polynomial model')
def normalize_math(text):return text.replace('−','-').replace('×','*').replace('²','**2').replace('³','**3')
def printed_polynomial(text):
    text=normalize_math(text).replace(' ','')
    text=re.sub(r'(?<=[0-9])x',r'*x',text)
    text=re.sub(r'(?<=[0-9])\(',r'*(',text)
    text=text.replace(')(',')*(').replace('x(','x*(')
    tree=ast.parse(text,mode='eval')
    def parse(node,depth=0):
        if depth>30:raise ValueError('Printed polynomial too deep')
        if isinstance(node,ast.Constant) and isinstance(node.value,(int,float)) and not isinstance(node.value,bool):return [rational(node.value)]
        if isinstance(node,ast.Name) and node.id=='x':return [Fraction(0),Fraction(1)]
        if isinstance(node,ast.UnaryOp) and isinstance(node.op,(ast.USub,ast.UAdd)):
            result=parse(node.operand,depth+1);return [-v for v in result] if isinstance(node.op,ast.USub) else result
        if isinstance(node,ast.BinOp):
            a=parse(node.left,depth+1);b=parse(node.right,depth+1)
            if isinstance(node.op,ast.Add):return add(a,b)
            if isinstance(node.op,ast.Sub):return add(a,b,-1)
            if isinstance(node.op,ast.Mult):return multiply(a,b)
            if isinstance(node.op,ast.Div) and len(b)==1 and b[0]:return trim([v/b[0] for v in a])
            if isinstance(node.op,ast.Pow) and len(b)==1 and b[0].denominator==1 and 0<=b[0]<=6:
                result=[Fraction(1)]
                for _ in range(int(b[0])):result=multiply(result,a)
                return result
        raise ValueError('Unsupported printed expression')
    return trim(parse(tree.body))
def printed_number(text):
    text=normalize_math(text).strip()
    if text.lower()=='no solution':return 'none'
    if text.lower()=='all real numbers':return 'all-real'
    text=re.sub(r'^(?:Only\s+)?x\s*=\s*','',text,flags=re.I)
    text=text.removeprefix('$').replace(',','').removesuffix('%').strip()
    if not re.fullmatch(r'-?\d+(?:\.\d+)?(?:/-?\d+(?:\.\d+)?)?',text):raise ValueError('Unsupported printed number: '+text)
    return Fraction(text)
def printed_roots(text):
    if text.lower().startswith('no real'):return []
    values=re.findall(r'x\s*=\s*(-?\d+(?:\.\d+)?(?:/\d+)?)',normalize_math(text))
    if not values:raise ValueError('No printed roots found')
    return sorted(set(map(Fraction,values)))
def rounded(value,places):
    if not isinstance(places,int) or not 0<=places<=6:raise ValueError('Unsupported rounding precision')
    scale=10**places;scaled=abs(value)*scale
    whole=scaled.numerator//scaled.denominator
    remainder=scaled-whole
    if remainder>=Fraction(1,2):whole+=1
    return Fraction(whole if value>=0 else -whole,scale)
def real_roots(coefficients):
    c,b,a=map(rational,coefficients)
    if not a:raise ValueError('Not quadratic')
    disc=b*b-4*a*c
    if disc<0:return []
    n=math.isqrt(disc.numerator);d=math.isqrt(disc.denominator)
    if n*n!=disc.numerator or d*d!=disc.denominator:raise ValueError('Exact root audit needs a rational square discriminant')
    root=Fraction(n,d)
    return sorted(set([(-b-root)/(2*a),(-b+root)/(2*a)]))
def verify_question(question):
    model=question.get('verification')
    if not model:return False,False
    kind=model['kind'];literal=False
    if kind=='numeric':
        expected=expression(model['expression'])
        if 'roundTo' in model:expected=rounded(expected,model['roundTo'])
        choices=list(map(printed_number,question['options']))
        annotated=list(map(rational,model['optionValues']))
    elif kind=='equation':
        a,b=map(rational,model['left']);c,d=map(rational,model['right'])
        expected=('all-real' if b==d else 'none') if a==c else (d-b)/(a-c)
        choices=list(map(printed_number,question['options']))
        annotated=[value if isinstance(value,str) else rational(value) for value in model['optionValues']]
        match=re.fullmatch(r'Solve (.+?) = (.+?)\.',normalize_math(question['prompt']))
        if match:
            left=printed_polynomial(match[1]);right=printed_polynomial(match[2])
            assert left==trim([b,a]) and right==trim([d,c]),'Printed equation differs from annotated coefficients'
            literal=True
    elif kind=='polynomial':
        expected=polynomial_model(model['expression']);choices=list(map(printed_polynomial,question['options']));annotated=list(map(polynomial_model,model['optionExpressions']))
    elif kind=='quadratic-roots':
        expected=real_roots(model['coefficients']);choices=list(map(printed_roots,question['options']));annotated=[sorted(set(map(rational,values))) for values in model['optionRoots']]
        match=re.fullmatch(r'Solve (.+?) = (.+?) over the real numbers\.',normalize_math(question['prompt']))
        if match:
            literal_poly=add(printed_polynomial(match[1]),printed_polynomial(match[2]),-1)
            assert literal_poly==trim(map(rational,model['coefficients'])),'Printed quadratic differs from annotated coefficients'
            literal=True
    else:raise ValueError('Unsupported verification kind: '+kind)
    assert choices==annotated,'Printed answer choices differ from model annotations'
    matches=[i for i,value in enumerate(choices) if value==expected]
    assert matches==[question['answer']],f'Expected {expected}; matching printed choices {matches}, keyed {question["answer"]}'
    return True,literal

def run():
    data=json.loads((ROOT/'data/courses.json').read_text())
    course=next(c for c in data['courses'] if c['id']==CID)
    questions=[*[q for lesson in course['lessons'] for q in lesson['questions']],*[q for chapter in course['chapters'] for q in chapter['assessment']],*course['assessment']]
    checked=literal=0;failures=[]
    for question in questions:
        try:
            did_check,did_literal=verify_question(question);checked+=did_check;literal+=did_literal
        except Exception as error:failures.append(question['id']+': '+str(error))
    for failure in failures:print('FAIL',failure)
    if not checked:raise SystemExit('No mathematical checks executed')
    print(f'Independent college audit: {checked}/{len(questions)} modeled keys and printed choice sets checked; {literal} printed equation models derived; {len(failures)} failures.')
    print('Conceptual correctness, model interpretation and teaching quality still require educator review.')
    if failures:raise SystemExit(1)
    return checked,literal
if __name__=='__main__':run()
