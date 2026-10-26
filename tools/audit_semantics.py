#!/usr/bin/env python3
"""Independent formula/geometry checks. Does not certify factual or exam accuracy."""
import argparse
import collections
import csv
import json
import math
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
def questions():
    match = re.search(r'const QUESTIONS=(\[.*?\]);', (ROOT/'practice.html').read_text(), re.S)
    if not match: raise ValueError('Embedded question bank not found')
    return json.loads(match.group(1))

def normalize(points):
    min_x=min(x for x,y in points); min_y=min(y for x,y in points)
    return tuple(sorted((x-min_x,y-min_y) for x,y in points))
def rotations(points):
    result=set()
    for _ in range(4):
        result.add(normalize(points)); points=[(-y,x) for x,y in points]
    return result

def expected(question):
    text=question['q']
    patterns=[
        (r'A supply order contains (\d+) identical items costing \$(\d+) total', lambda n,total:total/n),
        (r'What is (\d+)% of (\d+)',lambda pct,base:pct*base/100),
        (r'A vehicle travels at (\d+) miles per hour for (\d+) hours',lambda speed,time:speed*time),
        (r'A recipe uses (\d+) cups of water for (\d+) batches. How many cups are needed for (\d+) batches',lambda cups,old,new:cups/old*new),
        (r'A jacket costs \$(\d+) before a (\d+)% price increase',lambda base,pct:base*(1+pct/100)),
        (r'Solve for x: (\d+)x \+ (\d+) = (\d+)',lambda coefficient,constant,total:(total-constant)/coefficient),
        (r'A rectangle is (\d+) units long and (\d+) units wide',lambda length,width:length*width),
        (r'A triangle has a base of (\d+) units and a perpendicular height of (\d+) units',lambda base,height:base*height/2),
        (r'Evaluate \((\d+) \+ (\d+)\) × (\d+)',lambda a,b,c:(a+b)*c),
    ]
    for pattern,formula in patterns:
        match=re.search(pattern,text)
        if match: return formula(*map(float,match.groups())), 'formula recomputation'
    # Independent known-answer calculations for the authored application replacements.
    calculations={'q0021':15/6,'q0058':100*.8*1.05,'q0273':24/8,'q0331':12/6,'q0332':3+5,'q0333':9*2,'q0334':1/(1/10+1/10),'q0391':2/.25,'q0451':10*.4,'q0452':300/400*100}
    if question['id'] in calculations: return calculations[question['id']], 'authored application recomputation'
    return None

def run(write_review=False):
    rows=[]; verified=collections.Counter(); failures=[]; templates=collections.defaultdict(list)
    for question in questions():
        method='author screening; independent source/editorial review pending'
        result=expected(question)
        if result is not None:
            value,method=result
            try: answer=float(re.search(r'-?\d+(?:\.\d+)?',question['options'][question['answer']]).group())
            except (AttributeError,ValueError): failures.append(question['id']+': numeric key missing'); continue
            if not math.isclose(answer,value,rel_tol=1e-9,abs_tol=1e-9):failures.append(f"{question['id']}: expected {value}, keyed {answer}")
            verified['quantitative']+=1
        elif question['subject'] in ('Arithmetic Reasoning','Mathematics Knowledge'):
            failures.append(question['id']+': quantitative item has no semantic verifier')
        if 'visual' in question:
            target=question['visual']['target']; options=question['visual']['options']
            matches=[i for i,points in enumerate(options) if normalize(points) in rotations(target)]
            if matches != [question['answer']]:failures.append(f"{question['id']}: rotation-equivalent matches {matches}, key {question['answer']}")
            for points in [target,*options]:
                if len(points)!=len(set(map(tuple,points))):failures.append(question['id']+': overlapping squares')
            verified['spatial']+=1;method='all rotations independently recomputed; exactly one matching choice'
        fingerprint=re.sub(r'\d+(?:\.\d+)?','#',question['q'])
        templates[(question['subject'],fingerprint)].append(question['id'])
        rows.append([question['id'],question['subject'],method,'Independent educator/source review pending'])
    repeated=[ids for ids in templates.values() if len(ids)>1]
    if write_review:
        with (ROOT/'docs/QUESTION_REVIEW.csv').open('w',newline='') as out:
            writer=csv.writer(out);writer.writerow(['id','subject','automated_or_author_check','editorial_gate']);writer.writerows(rows)
    print(f"Semantic checks: {verified['quantitative']} quantitative keys, {verified['spatial']} spatial keys; {len(failures)} failures. {len(rows)} items inventoried.")
    print(f"Template warning: {len(repeated)} repeated numeric-normalized prompt groups. Glossary reversal and passage reuse need editorial review.")
    for failure in failures:print('FAIL',failure)
    if failures:raise SystemExit(1)
    return rows

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--write-review',action='store_true')
    run(parser.parse_args().write_review)
