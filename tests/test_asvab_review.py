"""Only fictional reviewer attestations in isolated test objects; never actual signoff."""
import copy
import importlib.util
from pathlib import Path
import tempfile
import unittest
spec=importlib.util.spec_from_file_location('review',Path(__file__).parents[1]/'tools/asvab_review.py');review=importlib.util.module_from_spec(spec);spec.loader.exec_module(review)
class ReviewerWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.questions,self.bank=review.read_questions();self.records=review.refresh_records(self.questions,self.bank);self.registry={'schemaVersion':1,'reviewers':[]}
    def fictional_approval(self):
        q=self.questions[0];self.registry['reviewers']=[{'id':'fictional-reviewer','displayName':'Fictional test reviewer','subjects':[q['subject']],'qualificationSummary':'Fictional fixture, never an actual qualification claim','qualificationEvidenceRef':'private:fictional-evidence','qualificationVerifiedBy':'fictional-owner','qualificationVerifiedAt':'2026-01-01T00:00:00Z','independent':True}]
        item=self.records['items'][0];item.update(status='approved',assignedTo='fictional-reviewer',signoff={'reviewerId':'fictional-reviewer','contentHash':item['contentHash'],'reviewedAt':'2026-01-01T00:00:00Z','checks':{key:True for key in review.CHECKS},'sourceRefs':['private:fictional-source'],'notes':'Fictional notes used only to exercise the record validator.','mathRecomputed':True,'mathEvidence':'Fictional derivation used solely in this software test.'});return item
    def test_initial_inventory_is_complete_and_never_claims_review(self):
        errors,approved=review.validate(self.questions,self.bank,self.registry,self.records);self.assertEqual(errors,[]);self.assertEqual(approved,0);self.assertTrue(all(i['signoff'] is None for i in self.records['items']))
    def test_missing_qualifications_scope_or_signoff_prevents_approval(self):
        self.fictional_approval();errors,approved=review.validate(self.questions,self.bank,self.registry,self.records);self.assertEqual(errors,[]);self.assertEqual(approved,1)
        for key in ['independent','qualificationEvidenceRef','qualificationVerifiedAt']:
            broken=copy.deepcopy(self.registry);broken['reviewers'][0].pop(key);self.assertTrue(review.validate(self.questions,self.bank,broken,self.records)[0])
        wrong=copy.deepcopy(self.registry);wrong['reviewers'][0]['subjects']=['Word Knowledge'];self.assertTrue(review.validate(self.questions,self.bank,wrong,self.records)[0])
    def test_changed_content_fails_and_refresh_preserves_old_signoff_as_history(self):
        self.fictional_approval();changed=copy.deepcopy(self.questions);changed[0]['explanation']+=' Proposed corrected wording.'
        self.assertTrue(review.validate(changed,self.bank,self.registry,self.records)[0]);refreshed=review.refresh_records(changed,self.bank,self.records);item=refreshed['items'][0];self.assertEqual(item['status'],'needs_recheck');self.assertIsNone(item['signoff']);self.assertIsNotNone(item['history'][0]['priorSignoff']);self.assertEqual(review.validate(changed,self.bank,self.registry,refreshed)[1],0)
    def test_open_findings_and_missing_math_recomputation_block_signoff(self):
        item=self.fictional_approval();item['findings']=[{'id':'q0001-f1','kind':'distractors','severity':'material','status':'open','description':'One distractor requires independent checking.'}];self.assertTrue(review.validate(self.questions,self.bank,self.registry,self.records)[0]);item['findings']=[];item['signoff']['mathRecomputed']='not_applicable';self.assertTrue(review.validate(self.questions,self.bank,self.registry,self.records)[0])
    def test_duplicates_unknown_ids_future_dates_and_missing_checks_fail(self):
        item=self.fictional_approval();item['signoff']['reviewedAt']='2999-01-01T00:00:00Z';self.assertTrue(review.validate(self.questions,self.bank,self.registry,self.records)[0]);item['signoff']['reviewedAt']='2026-01-01T00:00:00Z';item['signoff']['checks']['explanation']=False;self.assertTrue(review.validate(self.questions,self.bank,self.registry,self.records)[0]);self.records['items'].append(copy.deepcopy(self.records['items'][0]));self.assertTrue(review.validate(self.questions,self.bank,self.registry,self.records)[0])
    def test_self_verified_qualifications_and_self_approved_corrections_are_rejected(self):
        item=self.fictional_approval();self.registry['reviewers'][0]['qualificationVerifiedBy']='fictional-reviewer';self.assertTrue(review.validate(self.questions,self.bank,self.registry,self.records)[0]);self.registry['reviewers'][0]['qualificationVerifiedBy']='fictional-owner';item['corrections']=[{'beforeHash':'f'*64,'afterHash':item['contentHash'],'rationale':'Fictional correction record for a software boundary test.','authorId':'fictional-reviewer','sourceRefs':['private:fictional-source'],'commit':'1234567'}];self.assertTrue(review.validate(self.questions,self.bank,self.registry,self.records)[0])
    def test_packet_contains_original_keys_explanations_diagrams_and_sanitizes_html(self):
        questions=copy.deepcopy(self.questions);questions[0]['q']='<script>not executable</script>';text=review.packet(questions,'Arithmetic Reasoning');self.assertIn('&lt;script&gt;',text);self.assertNotIn('<script>',text);self.assertEqual(text.count('<article>'),60);self.assertIn('current practice key',text);self.assertIn('<svg',review.packet(self.questions,'Assembling Objects'))
        with tempfile.TemporaryDirectory() as directory:
            target=Path(directory)/'packet.html';review.private_packet(target,text);self.assertEqual(target.stat().st_mode&0o777,0o600)
            with self.assertRaises(FileExistsError):review.private_packet(target,text)
            with self.assertRaises(ValueError):review.private_packet(review.ROOT/'packet.html',text)
if __name__=='__main__':unittest.main(verbosity=2)
