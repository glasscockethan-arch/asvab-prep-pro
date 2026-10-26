"""Browser regression tests against the built site under a GitHub Pages-style prefix."""
import functools
import http.server
import json
import os
from pathlib import Path
import re
import tempfile
import threading
import unittest
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT/'data/courses.json').read_text())
QUESTION_MAP = {q['id']:q for c in DATA['courses'] for q in [*c['assessment'],*[q for chapter in c.get('chapters',[]) for q in chapter['assessment']],*[q for lesson in c['lessons'] for q in lesson['questions']]]}
KEY = 'aptitude-beacon-v1'
LEGACY_KEY = 'asvab-prep-pro-v3'
class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass

class BrowserTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not (ROOT/'dist/index.html').exists(): raise RuntimeError('Run npm run build first.')
        cls.directory=tempfile.TemporaryDirectory()
        (Path(cls.directory.name)/'asvab-prep-pro').symlink_to(ROOT/'dist',target_is_directory=True)
        handler=functools.partial(QuietHandler,directory=cls.directory.name)
        cls.server=http.server.ThreadingHTTPServer(('127.0.0.1',0),handler)
        cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True);cls.thread.start()
        cls.base=f'http://127.0.0.1:{cls.server.server_port}/asvab-prep-pro/'
        cls.playwright=sync_playwright().start()
        executable=os.environ.get('CHROMIUM_PATH')
        if not executable and Path('/usr/bin/chromium').exists(): executable='/usr/bin/chromium'
        cls.browser=cls.playwright.chromium.launch(headless=True,**({'executable_path':executable} if executable else {}))
    @classmethod
    def tearDownClass(cls):
        cls.browser.close();cls.playwright.stop();cls.server.shutdown();cls.server.server_close();cls.thread.join();cls.directory.cleanup()
    def setUp(self):
        self.context=self.browser.new_context(viewport={'width':1440,'height':1000},accept_downloads=True)
        self.page=self.context.new_page();self.errors=[];self.external=[]
        self.page.on('pageerror',lambda error:self.errors.append(str(error)))
        self.page.on('request',lambda request:self.external.append(request.url) if not request.url.startswith(self.base) and not request.url.startswith('blob:') else None)
    def tearDown(self):
        self.assertEqual(self.errors,[],'Browser JavaScript errors')
        self.assertEqual(self.external,[],'Unexpected external data request')
        self.context.close()
    def visit(self,route=''):
        self.page.goto(self.base+route)
        expect(self.page.locator('main')).not_to_have_attribute('aria-busy','true')
    def state(self): return self.page.evaluate(f'JSON.parse(localStorage.getItem("{KEY}"))')
    def answer_session(self,wrong_first=False):
        first=True
        while self.page.locator('#question-title').count():
            state=self.state();active=state['active'];index=active['index'];q=QUESTION_MAP[active['ids'][index]]
            answer=(q['answer']+1)%4 if wrong_first and first else q['answer'];first=False
            self.page.locator('input[name="answer"]').nth(answer).check()
            if index==len(active['ids'])-1:
                self.page.locator('#submit').click();break
            self.page.locator('#next').click()
    def start(self,route,mode=None):
        self.visit(route)
        if mode:self.page.locator('#mode').select_option(mode)
        self.page.get_by_role('button',name='Start session',exact=True).click()
        expect(self.page.locator('#question-title')).to_be_visible()
    def test_01_catalog_search_filter_and_empty_state(self):
        self.visit('catalog.html');expect(self.page.locator('.course-card')).to_have_count(7)
        self.page.get_by_label('Search units').fill('algebra');expect(self.page.locator('.course-card')).to_have_count(1)
        self.page.get_by_label('Search units').fill('nothing-matches');expect(self.page.get_by_role('heading',name='No matching units')).to_be_visible()
        self.page.get_by_label('Search units').fill('');self.page.get_by_label('Learning pathway').select_option('trades');expect(self.page.locator('.course-card')).to_have_count(2)
        self.page.reload();expect(self.page.get_by_label('Learning pathway')).to_have_value('trades')
        self.visit('course.html?id=missing');expect(self.page.get_by_role('heading',name='Unit not found')).to_be_visible()
    def test_02_lessons_bookmarks_completion_and_theme(self):
        c=DATA['courses'][1];self.visit('course.html?id='+c['id']);self.page.get_by_role('button',name='Save this unit',exact=True).click();expect(self.page.get_by_role('button',name='Saved to my learning')).to_have_attribute('aria-pressed','true')
        self.page.get_by_role('button',name='Switch color theme').click();theme=self.page.locator('html').get_attribute('data-theme');self.page.reload();expect(self.page.locator('html')).to_have_attribute('data-theme',theme)
        for lesson in c['lessons']:
            self.visit(f'course.html?id={c["id"]}&lesson={lesson["id"]}');self.page.get_by_role('button',name='Mark lesson as read',exact=True).click();expect(self.page.get_by_role('button',name='Lesson marked as read')).to_be_disabled()
        self.start('study.html?id='+c['id']+'&mode=assessment');self.answer_session();expect(self.page.get_by_role('heading',name='3 of 3 correct')).to_be_visible()
        self.visit('dashboard.html');expect(self.page.locator('.stats-grid')).to_contain_text('1Learning practice standards met');self.assertEqual(len(self.state()['lessons']),3)
    def test_03_practice_feedback_missed_review_and_history(self):
        self.start('study.html?id=reading-evidence');self.page.locator('input[name="answer"]').nth((QUESTION_MAP[self.state()['active']['ids'][0]]['answer']+1)%4).check();expect(self.page.locator('#feedback')).to_contain_text('Let’s review.');self.assertTrue(self.page.locator('input[name="answer"]').first.is_disabled())
        # Continue without changing the already-answered first item.
        self.page.locator('#next').click();self.answer_session();expect(self.page.get_by_role('heading',name='8 of 9 correct')).to_be_visible()
        self.start('study.html?id=reading-evidence&mode=review');self.answer_session();expect(self.page.get_by_role('heading',name='1 of 1 correct')).to_be_visible()
        self.visit('dashboard.html');expect(self.page.locator('.dashboard-grid')).not_to_contain_text('Revisit 1 missed');self.assertEqual(len(self.state()['attempts']),2)
    def test_04_timer_deadline_survives_reload_and_expiry_submits(self):
        self.page.clock.install()
        self.start('study.html?id=linear-equations&mode=timed');deadline=self.state()['active']['deadline'];expect(self.page.locator('#clock')).to_contain_text('10:00')
        self.page.locator('input[name="answer"]').nth(0).check();self.page.reload();expect(self.page.locator('#question-title')).to_be_visible();self.assertEqual(self.state()['active']['deadline'],deadline)
        self.page.clock.fast_forward(600_100);expect(self.page.locator('.results-summary')).to_be_visible();self.assertIsNone(self.state()['active']);self.assertEqual(len(self.state()['attempts']),1)
    def test_05_backup_merge_invalid_import_and_legacy_preservation(self):
        self.start('study.html?id=statistics-foundations&mode=assessment');self.answer_session();self.visit('dashboard.html')
        with self.page.expect_download() as download_info:self.page.get_by_role('button',name='Export progress',exact=True).click()
        backup=Path(download_info.value.path()).read_bytes();self.assertEqual(len(json.loads(backup)['attempts']),1)
        self.page.locator('#import').set_input_files({'name':'backup.json','mimeType':'application/json','buffer':backup});expect(self.page.locator('#status')).to_contain_text('Backup merged');self.assertEqual(len(self.state()['attempts']),1)
        before=self.state();self.page.locator('#import').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':b'{"schemaVersion":1}'});expect(self.page.locator('#import-status')).to_contain_text('invalid');self.assertEqual(self.state(),before)
        legacy={'history':[{'date':'2026-10-25T12:00:00Z','mode':'diagnostic','details':[{'id':'q0001','subject':'Arithmetic Reasoning','q':'One plus one?','options':['2','3','4','5'],'answer':0,'chosen':0,'correct':True,'explanation':'One plus one makes two.'}]}],'missed':[],'week':1}
        raw=json.dumps(legacy);self.page.evaluate('(raw)=>localStorage.setItem("asvab-prep-pro-v3",raw)',raw);self.page.reload();expect(self.page.get_by_role('heading',name='Original ASVAB V3 history')).to_be_visible();self.assertEqual(self.page.evaluate('localStorage.getItem("asvab-prep-pro-v3")'),raw);self.assertEqual(len(self.state()['attempts']),1)
        # Persisting a new preference must leave the legacy bytes untouched.
        self.page.locator('#daily').fill('12');self.page.get_by_role('button',name='Save goals').click();self.assertEqual(self.page.evaluate('localStorage.getItem("asvab-prep-pro-v3")'),raw)
    def test_06_corrupt_storage_recovery_and_no_overwrite(self):
        self.visit();self.page.evaluate('(key)=>localStorage.setItem(key,"invalid-json")',KEY);self.visit('dashboard.html');expect(self.page.locator('#recovery-bar')).to_be_visible()
        self.page.get_by_role('button',name='Export progress',exact=True).click()
        self.assertEqual(self.page.evaluate('(key)=>localStorage.getItem(key)',KEY),'invalid-json')
        self.visit('study.html?id=linear-equations');expect(self.page.get_by_role('heading',name='Protect your existing progress')).to_be_visible();self.assertEqual(self.page.evaluate('(key)=>localStorage.getItem(key)',KEY),'invalid-json')
    def test_07_flashcards_and_all_course_assessments(self):
        for course in DATA['courses']:
            self.visit('study.html?id='+course['id']);self.page.get_by_role('button',name='Reveal answer',exact=True).click();expect(self.page.locator('.flash-answer')).to_have_text(course['lessons'][0]['flashcards'][0]['back']);self.page.get_by_role('button',name='Next card').click();expect(self.page.locator('#flashcard')).to_contain_text(f'Card 2 of {sum(len(l["flashcards"]) for l in course["lessons"])}')
            self.page.locator('#mode').select_option('assessment');self.page.get_by_role('button',name='Start session',exact=True).click();self.answer_session();n=len(course['assessment']);expect(self.page.get_by_role('heading',name=f'{n} of {n} correct')).to_be_visible()
    def test_08_keyboard_responsive_and_accessibility(self):
        axe=ROOT/'node_modules/axe-core/axe.min.js';self.assertTrue(axe.exists(),'Run npm ci for axe-core')
        routes=['','catalog.html','course.html?id=linear-equations','course.html?id=linear-equations&lesson=balance','course.html?id=linear-equations&lesson=coordinates','dashboard.html','study.html?id=linear-equations','references.html','privacy.html','contact.html']
        for width,height in [(1440,1000),(768,1024),(390,844)]:
            self.page.set_viewport_size({'width':width,'height':height})
            for route in routes:
                self.visit(route);self.assertTrue(self.page.evaluate('document.documentElement.scrollWidth <= innerWidth'),f'Overflow at {width}: {route}')
            self.visit();self.page.keyboard.press('Tab');expect(self.page.get_by_role('link',name='Skip to main content')).to_be_focused();self.page.keyboard.press('Enter');expect(self.page.locator('main')).to_be_focused()
        self.page.set_viewport_size({'width':1440,'height':1000})
        for theme in ['light','dark']:
            for route in routes:
                self.visit(route);self.page.locator('html').evaluate('(el,theme)=>el.dataset.theme=theme',theme);self.page.add_script_tag(path=str(axe))
                violations=self.page.evaluate('async () => (await axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa","wcag22aa"]}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))')
                self.assertEqual(violations,[],f'Accessibility scan {theme}: {route}')
        self.start('study.html?id=linear-equations&mode=assessment');self.page.add_script_tag(path=str(axe));violations=self.page.evaluate('async ()=>(await axe.run()).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))');self.assertEqual(violations,[])
    def test_09_legacy_practice_scoring_restore_guard_and_previews(self):
        self.visit('practice.html');self.page.get_by_role('button',name='Start diagnostic',exact=True).click();expect(self.page.locator('#view')).to_contain_text('Question 1 / 45')
        for i in range(45):
            answer=self.page.evaluate('QUESTIONS.find(q=>q.id===session.ids[session.i]).answer');self.page.locator('button.opt').nth(answer).click()
            if i<44:self.page.get_by_role('button',name='Next').click()
        self.page.get_by_role('button',name='Submit test').click();expect(self.page.get_by_role('heading',name='Exam result: 100%')).to_be_visible();before=self.page.evaluate('localStorage.getItem("asvab-prep-pro-v3")')
        self.page.get_by_role('button',name='Backup / Restore',exact=True).click()
        with self.page.expect_event('dialog') as dialog_info:
            self.page.locator('input[type=file]').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':b'{"history":[{}],"missed":[]}'})
        self.assertIn('Unable to import',dialog_info.value.message)
        dialog_info.value.accept()
        self.assertEqual(self.page.evaluate('localStorage.getItem("asvab-prep-pro-v3")'),before)
        self.visit('dashboard.html');expect(self.page.locator('main')).to_contain_text('1 sessions safely read')
        for route,choices in [('high-school.html',[1,1,2,0]),('college.html',[0,0,1,1]),('skilled-trades.html',[2,1,1,2])]:
            self.visit(route)
            for i,answer in enumerate(choices):self.page.locator(f'input[name="q{i}"]').nth(answer).check()
            self.page.get_by_role('button',name='Check answers').click();expect(self.page.locator('.quiz-result')).to_contain_text('Result: 4 of 4 correct')
    def test_10_catalog_error_and_retry(self):
        self.page.route('**/data/courses.json',lambda route:route.fulfill(status=503,body='Unavailable'))
        self.visit();expect(self.page.get_by_role('heading',name='Learning could not load')).to_be_visible();self.page.unroute('**/data/courses.json');self.page.get_by_role('button',name='Try again').click();expect(self.page.locator('.hero')).to_be_visible()
    def test_11_cross_tab_conflict_prevents_overwrite(self):
        self.visit('course.html?id=linear-equations');other=self.context.new_page();other.goto(self.base+'dashboard.html');expect(other.locator('#daily')).to_be_visible();other.locator('#daily').fill('11');other.get_by_role('button',name='Save goals').click();expect(self.page.locator('#status')).to_contain_text('Another tab');expect(self.page.get_by_role('button',name='Save this unit',exact=True)).to_be_disabled();other.close()
    def test_12_deletion_keeps_original_asvab_data(self):
        self.visit('dashboard.html');self.page.evaluate('localStorage.setItem("asvab-prep-pro-v3",JSON.stringify({history:[],missed:[],week:1}))');raw=self.page.evaluate('localStorage.getItem("asvab-prep-pro-v3")');self.page.locator('#data-controls details summary').click();self.page.locator('#delete-confirm').fill('DELETE');self.page.get_by_role('button',name='Delete new-platform progress',exact=True).click();expect(self.page.locator('#status')).to_contain_text('deleted');self.assertIsNone(self.page.evaluate('(key)=>localStorage.getItem(key)',KEY));self.assertEqual(self.page.evaluate('localStorage.getItem("asvab-prep-pro-v3")'),raw)

    def test_13_foundation_enrollment_and_complete_course_standard(self):
        course=DATA['courses'][0]
        self.visit('course.html?id='+course['id'])
        self.page.get_by_role('button',name='Add to my courses',exact=True).click()
        expect(self.page.get_by_role('button',name='Added to my courses',exact=True)).to_be_disabled()
        self.assertIn(course['id'],self.state()['enrollments'])
        for lesson in course['lessons']:
            self.visit(f'course.html?id={course["id"]}&lesson={lesson["id"]}')
            self.page.get_by_role('button',name='Mark lesson as read',exact=True).click()
            self.start(f'study.html?id={course["id"]}&lesson={lesson["id"]}')
            self.answer_session()
            expect(self.page.get_by_role('heading',name='6 of 6 correct')).to_be_visible()
        self.start('study.html?id='+course['id']+'&mode=assessment');self.answer_session()
        expect(self.page.get_by_role('heading',name='12 of 12 correct')).to_be_visible()
        self.visit('course.html?id='+course['id']);expect(self.page.get_by_role('heading',name='Course practice standard: in progress',exact=True)).to_be_visible()
        for chapter in course['chapters']:
            self.start(f'study.html?id={course["id"]}&mode=chapter&chapter={chapter["id"]}')
            self.assertEqual(self.state()['active']['chapterId'],chapter['id'])
            self.answer_session();expect(self.page.get_by_role('heading',name='6 of 6 correct')).to_be_visible()
        self.visit('course.html?id='+course['id']);expect(self.page.get_by_role('heading',name='Course practice standard: met',exact=True)).to_be_visible()
        self.visit('dashboard.html');expect(self.page.locator('.stats-grid')).to_contain_text('1Learning practice standards met')
        self.assertEqual(len(self.state()['attempts']),13)
    def test_14_v1_active_assessment_migrates_without_false_completion(self):
        course=DATA['courses'][0];self.visit()
        legacy_raw=json.dumps({'history':[],'missed':[],'week':1})
        old={'schemaVersion':1,'lessons':{course['id']+'-'+l['id']:'2026-10-25T12:00:00Z' for l in course['lessons'][:3]},'bookmarks':[course['id']],'attempts':[],'goals':{'daily':10,'weekly':50},'legacy':None,'active':{'courseId':course['id'],'mode':'assessment','ids':[q['id'] for q in course['assessment'][:3]],'answers':[None,None,None],'index':0,'deadline':None}}
        self.page.evaluate('([key,raw,legacy])=>{localStorage.setItem(key,raw);localStorage.setItem("asvab-prep-pro-v3",legacy)}',[KEY,json.dumps(old),legacy_raw])
        self.visit('study.html?id='+course['id']);expect(self.page.locator('.question-panel')).to_contain_text('Question 1 of 3');self.answer_session()
        expect(self.page.get_by_role('heading',name='3 of 3 correct')).to_be_visible()
        migrated=self.state();self.assertEqual(migrated['schemaVersion'],2);self.assertEqual(len(migrated['lessons']),3);self.assertEqual(migrated['attempts'][0]['contentRevision'],1)
        self.visit('course.html?id='+course['id']);expect(self.page.get_by_role('heading',name='Course practice standard: in progress',exact=True)).to_be_visible()
        self.assertEqual(self.page.evaluate('localStorage.getItem("asvab-prep-pro-v3")'),legacy_raw)
    def test_15_accessible_graph_input_and_keyboard(self):
        self.visit('course.html?id=linear-equations&lesson=coordinates')
        graph_input=self.page.get_by_label('Try a whole-number input from -2 to 2',exact=True)
        graph_input.fill('-2');expect(self.page.locator('#graph-output')).to_have_text('At x = -2, y = -3.')
        graph_input.press('ArrowUp');expect(self.page.locator('#graph-output')).to_have_text('At x = -1, y = -1.')
        expect(self.page.locator('#selected-point')).to_have_attribute('cx','130')
        graph_input.fill('8');expect(self.page.locator('#graph-output')).to_contain_text('Choose a whole-number input')
        self.page.add_script_tag(path=str(ROOT/'node_modules/axe-core/axe.min.js'))
        violations=self.page.evaluate('async()=>(await axe.run()).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))')
        self.assertEqual(violations,[])
    def test_16_conflicting_backup_keeps_current_attempt(self):
        self.start('study.html?id=statistics-foundations&mode=assessment');self.answer_session();self.visit('dashboard.html')
        before=self.state();conflicting=json.loads(json.dumps(before));detail=conflicting['attempts'][0]['details'][0];detail['chosen']=(detail['chosen']+1)%4
        self.page.locator('#import').set_input_files({'name':'conflict.json','mimeType':'application/json','buffer':json.dumps(conflicting).encode()})
        expect(self.page.locator('#import-status')).to_contain_text('Conflicting attempt IDs')
        self.assertEqual(self.state(),before)

    def test_17_mobile_outline_keyboard_navigation(self):
        self.page.set_viewport_size({'width':390,'height':844})
        self.visit('course.html?id=linear-equations&lesson=coordinates')
        outline=self.page.locator('#course-outline')
        self.assertFalse(outline.evaluate('(el)=>el.open'))
        summary=self.page.get_by_text('Lesson and chapter navigation',exact=True)
        summary.focus();self.page.keyboard.press('Enter')
        self.assertTrue(outline.evaluate('(el)=>el.open'))
        self.page.get_by_role('link',name='Measure a constant rate of change',exact=True).click()
        expect(self.page.locator('h1')).to_have_text('Measure a constant rate of change')
        self.assertFalse(self.page.locator('#course-outline').evaluate('(el)=>el.open'))

if __name__=='__main__':unittest.main(verbosity=2)
