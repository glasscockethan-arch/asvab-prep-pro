"""Record validation and human-review packets. Software cannot establish human expertise."""
import argparse
import copy
import hashlib
import html
import json
import os
from pathlib import Path
import re
import sys
from datetime import datetime, timezone
ROOT=Path(__file__).resolve().parents[1]
ITEMS=ROOT/'review/asvab-items.json'
REGISTRY=ROOT/'review/reviewers.json'
STATUSES={'pending','assigned','changes_required','correction_proposed','needs_recheck','approved'}
CHECKS={'answerAccuracy','explanation','distractors','ambiguity','sourceSupport','originality','repetition'}
MATH={'Arithmetic Reasoning','Mathematics Knowledge'}
def timestamp():return datetime.now(timezone.utc).isoformat()
def content_hash(question):return hashlib.sha256(json.dumps(question,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
def read_questions():
    raw=re.search(r'const QUESTIONS=(\[.*?\]);',(ROOT/'practice.html').read_text(),re.S)[1]
    questions=json.loads(raw)
    if len(questions)!=540 or {q['id'] for q in questions}!={f'q{i:04d}' for i in range(1,541)}:raise ValueError('The preserved 540 question identities changed. Do not silently replace them.')
    return questions,hashlib.sha256(raw.encode()).hexdigest()
def new_record(q):return {'id':q['id'],'subject':q['subject'],'contentHash':content_hash(q),'status':'pending','assignedTo':None,'findings':[],'corrections':[],'history':[],'signoff':None}
def refresh_records(questions,bank_hash,current=None):
    if current is None:return {'schemaVersion':1,'bankHash':bank_hash,'generatedAt':timestamp(),'items':[new_record(q) for q in questions]}
    result=copy.deepcopy(current);old={item['id']:item for item in result['items']}
    if set(old)!={q['id'] for q in questions}:raise ValueError('Review identities differ. Preserve IDs and investigate before refreshing.')
    for q in questions:
        item=old[q['id']];new_hash=content_hash(q)
        if item['contentHash']!=new_hash:
            item['history'].append({'detectedAt':timestamp(),'beforeHash':item['contentHash'],'afterHash':new_hash,'priorStatus':item['status'],'priorSignoff':item['signoff']})
            item.update(contentHash=new_hash,subject=q['subject'],status='needs_recheck',signoff=None)
    result.update(bankHash=bank_hash,generatedAt=timestamp());return result

def valid_time(value):
    if not isinstance(value,str):return False
    try:parsed=datetime.fromisoformat(value.replace('Z','+00:00'));return parsed.tzinfo is not None and parsed.timestamp()<=datetime.now(timezone.utc).timestamp()+300
    except (ValueError,TypeError):return False

def source_refs(value):return isinstance(value,list) and bool(value) and all(isinstance(ref,str) and len(ref.strip())>=8 for ref in value)

def validate(questions,bank_hash,registry,records):
    errors=[];approved=0;reviewers={};subjects={q['subject'] for q in questions}
    if registry.get('schemaVersion')!=1 or not isinstance(registry.get('reviewers'),list):return ['Invalid reviewer registry schema.'],0
    for reviewer in registry['reviewers']:
        rid=reviewer.get('id');scopes=reviewer.get('subjects')
        if not isinstance(rid,str) or not re.fullmatch(r'[a-z0-9-]{3,80}',rid) or rid in reviewers:errors.append('Reviewer IDs must be distinct stable identifiers.');continue
        reviewers[rid]=reviewer
        if not isinstance(scopes,list) or not scopes or any(s not in subjects for s in scopes):errors.append(f'{rid}: invalid subject scope.')
        for key in ['displayName','qualificationSummary','qualificationEvidenceRef','qualificationVerifiedBy']:
            if not isinstance(reviewer.get(key),str) or len(reviewer[key].strip())<3:errors.append(f'{rid}: missing {key}.')
        if reviewer.get('independent') is not True or not valid_time(reviewer.get('qualificationVerifiedAt')) or reviewer.get('qualificationVerifiedBy')==rid:errors.append(f'{rid}: independent qualification verification must be recorded by the owner.')
    if records.get('schemaVersion')!=1 or records.get('bankHash')!=bank_hash or not isinstance(records.get('items'),list):return errors+['Review bank/schema mismatch. Refresh intentionally and re-review changes.'],0
    known={q['id']:q for q in questions};seen=set()
    for item in records['items']:
        qid=item.get('id');q=known.get(qid)
        if not q or qid in seen:errors.append('Duplicate or unknown review item: '+str(qid));continue
        seen.add(qid);before=len(errors)
        if item.get('subject')!=q['subject'] or item.get('contentHash')!=content_hash(q):errors.append(qid+': stale question fingerprint.')
        status=item.get('status');assigned=item.get('assignedTo');reviewer=reviewers.get(assigned)
        if status not in STATUSES:errors.append(qid+': unknown review status.')
        if assigned is not None and (not reviewer or q['subject'] not in reviewer.get('subjects',[])):errors.append(qid+': assigned reviewer lacks recorded subject scope.')
        if not all(isinstance(item.get(key),list) for key in ['findings','corrections','history']):errors.append(qid+': review histories must be arrays.');continue
        finding_ids=set()
        for finding in item['findings']:
            fid=finding.get('id')
            if not isinstance(fid,str) or fid in finding_ids or not fid:errors.append(qid+': invalid finding identity.')
            finding_ids.add(fid)
            if finding.get('kind') not in CHECKS|{'math','format'} or finding.get('severity') not in ['material','minor'] or finding.get('status') not in ['open','resolved','rejected'] or len(finding.get('description','').strip())<10:errors.append(qid+': incomplete finding.')
            if finding.get('status')!='open' and len(finding.get('resolution','').strip())<20:errors.append(qid+': finding closure needs a reason and correction/source reference.')
        for correction in item['corrections']:
            if not all(re.fullmatch(r'[a-f0-9]{64}',correction.get(key,'')) for key in ['beforeHash','afterHash']) or correction.get('beforeHash')==correction.get('afterHash') or len(correction.get('rationale','').strip())<20 or not correction.get('authorId') or not source_refs(correction.get('sourceRefs')):errors.append(qid+': correction must identify changed fingerprints, author, rationale and sources.')
            if status=='approved' and not re.fullmatch(r'[a-f0-9]{7,40}',correction.get('commit','')):errors.append(qid+': approved corrections need a commit reference.')
        signoff=item.get('signoff')
        if status!='approved':
            if signoff is not None:errors.append(qid+': unfinished items cannot retain current signoff; keep superseded signoff in history.')
            continue
        if not reviewer or signoff is None:errors.append(qid+': approval requires an assigned qualified independent reviewer and signoff.');continue
        if signoff.get('reviewerId')!=assigned or signoff.get('contentHash')!=content_hash(q) or not valid_time(signoff.get('reviewedAt')):errors.append(qid+': approval must identify this question version, reviewer and actual date.')
        if not isinstance(signoff.get('checks'),dict) or any(signoff['checks'].get(check) is not True for check in CHECKS):errors.append(qid+': every editorial check needs explicit signoff.')
        if not source_refs(signoff.get('sourceRefs')) or len(signoff.get('notes','').strip())<20:errors.append(qid+': approval needs source references and substantive review notes.')
        math=signoff.get('mathRecomputed')
        if q['subject'] in MATH and (math is not True or len(signoff.get('mathEvidence','').strip())<20):errors.append(qid+': mathematics requires recorded independent recomputation.')
        if q['subject'] not in MATH and math not in [True,'not_applicable']:errors.append(qid+': explicitly record recomputation or nonmathematical scope.')
        if any(f.get('status')=='open' for f in item['findings']):errors.append(qid+': open findings block approval.')
        if item['corrections'] and item['corrections'][-1].get('afterHash')!=item['contentHash']:errors.append(qid+': final correction must match the approved question fingerprint.')
        if any(c.get('authorId')==assigned for c in item['corrections']):errors.append(qid+': a correction author cannot independently approve their correction.')
        if len(errors)==before:approved+=1
    if seen!=set(known):errors.append('Review inventory must include every preserved question exactly once.')
    return errors,approved

def silhouette(points,label):
    width=max(p[0] for p in points)+1;height=max(p[1] for p in points)+1
    rects=''.join(f'<rect x="{x}" y="{y}" width="1" height="1" fill="#235e89" stroke="white" stroke-width=".04"/>' for x,y in points)
    return f'<svg role="img" aria-label="{html.escape(label)}" viewBox="0 0 {width} {height}" width="150" height="120">{rects}</svg>'
def packet(questions,scope):
    escape=html.escape;parts=[]
    for q in questions:
        if scope!='all' and q['subject']!=scope:continue
        visual=q.get('visual');figures=''
        if visual:figures='<p>Original target silhouette:</p>'+silhouette(visual['target'],q['id']+' target')+'<div>'+''.join('<figure>'+silhouette(points,q['id']+' choice '+'ABCD'[i])+f'<figcaption>Choice {"ABCD"[i]}</figcaption></figure>' for i,points in enumerate(visual['options']))+'</div>'
        options=''.join(f'<li>{escape(option)}{" — current practice key" if i==q["answer"] else ""}</li>' for i,option in enumerate(q['options']))
        parts.append(f'<article><h2>{q["id"]} · {escape(q["subject"])}</h2><p class="prompt">{escape(q["q"])}</p>{figures}<ol type="A">{options}</ol><p><strong>Current explanation:</strong> {escape(q["explanation"])}</p><p>Content fingerprint: <code>{content_hash(q)}</code></p><p>Review accuracy, explanation, distractors, ambiguity, sources, originality, repetition and any mathematics. These are existing unapproved practice keys, not authoritative solutions.</p></article>')
    if not parts:raise ValueError('Choose a known subject or all.')
    return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ASVAB independent review packet</title><style>body{font:16px/1.6 system-ui;max-width:1000px;margin:auto;padding:24px}article{border-top:1px solid #aaa;padding:24px 0;break-inside:avoid}.prompt{white-space:pre-line}figure{display:inline-block}code{overflow-wrap:anywhere}svg{max-width:100%}</style><main><h1>Independent-review working packet</h1><p>Generated '+escape(timestamp())+'. No review or correctness approval is implied. Record findings against stable IDs; preserve every ID. No customer data belongs in this packet.</p>'+''.join(parts)+'</main></html>'
def private_packet(path,text):
    target=Path(path).resolve()
    if target==ROOT or ROOT in target.parents:raise ValueError('Write reviewer packets outside the repository/public roots.')
    target.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
    fd=os.open(target,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
    with os.fdopen(fd,'w',encoding='utf8') as output:output.write(text)

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--refresh',action='store_true');parser.add_argument('--require-approved',action='store_true');parser.add_argument('--packet');parser.add_argument('--output');args=parser.parse_args()
    questions,bank_hash=read_questions();registry=json.loads(REGISTRY.read_text());current=json.loads(ITEMS.read_text()) if ITEMS.exists() else None
    if args.refresh:
        current=refresh_records(questions,bank_hash,current);ITEMS.write_text(json.dumps(current,indent=2,ensure_ascii=False)+'\n')
    if current is None:raise ValueError('Initialize the pending inventory with --refresh.')
    errors,approved=validate(questions,bank_hash,registry,current)
    if errors:
        for error in errors:print('REVIEW RECORD ERROR:',error)
        return 1
    print(f'Review records valid: {len(questions)} items; {approved}/540 recorded human approvals; {540-approved} still require independent signoff.')
    print('Software validates records, not actual reviewer qualifications or the truth of an attestation.')
    if args.packet:
        if not args.output:raise ValueError('Choose a private output path for the packet.')
        private_packet(args.output,packet(questions,args.packet));print('Private reviewer packet created without customer data.')
    if args.require_approved and approved!=540:print('PAID RELEASE BLOCKED: independent signoff is incomplete.');return 1
    return 0
if __name__=='__main__':
    try:sys.exit(main())
    except (ValueError,KeyError,TypeError,OSError) as error:print('REVIEW WORKFLOW BLOCKED:',str(error));sys.exit(1)
