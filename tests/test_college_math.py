"""Independent checker tests: exact arithmetic, printed choices and safe parsing."""
from fractions import Fraction
from pathlib import Path
import copy
import json
import sys
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools'))
import verify_college_math as audit

class CollegeMathTests(unittest.TestCase):
    def test_all_modeled_keys_and_printed_options(self):
        checked,literal=audit.run()
        self.assertEqual(checked,84)
        self.assertEqual(literal,7)
    def test_exact_powers_and_rounding(self):
        self.assertEqual(audit.expression(['pow',1.02,3]),Fraction(132651,125000))
        self.assertEqual(audit.rounded(Fraction('530.604'),2),Fraction('530.60'))
        self.assertEqual(audit.rounded(Fraction('1.005'),2),Fraction('1.01'))
        self.assertEqual(audit.rounded(Fraction('-1.005'),2),Fraction('-1.01'))
    def test_printed_polynomial_parser(self):
        self.assertEqual(audit.printed_polynomial('(x − 2)(x + 5)'),list(map(Fraction,[-10,3,1])))
        self.assertEqual(audit.printed_polynomial('3x² − (x² − 2x + 5)'),list(map(Fraction,[-5,2,2])))
        self.assertEqual(audit.printed_polynomial('(x − 5)²'),list(map(Fraction,[25,-10,1])))
    def test_no_dynamic_code_or_unbounded_polynomial(self):
        for text in ['__import__("os")','x.__class__','open("file")','x**1000']:
            with self.assertRaises((ValueError,SyntaxError)):audit.printed_polynomial(text)
    def test_printed_choice_typo_is_not_hidden_by_annotation(self):
        course=next(c for c in json.loads((audit.ROOT/'data/courses.json').read_text())['courses'] if c['id']==audit.CID)
        q=copy.deepcopy(course['lessons'][4]['questions'][0]);q['options'][q['answer']]='3x² + 99x + 3'
        with self.assertRaises(AssertionError):audit.verify_question(q)
    def test_no_real_roots_and_retaining_zero(self):
        self.assertEqual(audit.real_roots([4,0,1]),[])
        self.assertEqual(audit.real_roots([0,-2,1]),[Fraction(0),Fraction(2)])
        self.assertEqual(audit.real_roots([9,-6,1]),[Fraction(3)])
if __name__=='__main__':unittest.main()
