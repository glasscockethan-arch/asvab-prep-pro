"""Private development beta integration. All addresses/data are fictional; no Stripe calls."""
import functools
import http.server
import json
import os
from pathlib import Path
import subprocess
import tempfile
import threading
import unittest
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[1]
KEY='aptitude-beacon-v1'
V3='asvab-prep-pro-v3'
class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
class LaunchBrowserTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.playwright=sync_playwright().start()
        executable=os.environ.get('CHROMIUM_PATH')
        if not executable and Path('/usr/bin/chromium').exists(): executable='/usr/bin/chromium'
        cls.browser=cls.playwright.chromium.launch(headless=True,**({'executable_path':executable} if executable else {}))
    @classmethod
    def tearDownClass(cls): cls.browser.close();cls.playwright.stop()
    def setUp(self):
        self.directory=tempfile.TemporaryDirectory(prefix='beacon-browser-')
        self.process=subprocess.Popen(['node','tests/launch-server.mjs'],cwd=ROOT,env={**os.environ,'BEACON_DB_PATH':str(Path(self.directory.name)/'launch.sqlite')},stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
        info=json.loads(self.process.stdout.readline());self.base=info['origin']+'/';self.invitation=info['invitation']
        self.contexts=[];self.page=self.new_context().new_page();self.errors=[];self.external=[]
        self.page.on('pageerror',lambda error:self.errors.append(str(error)))
        self.page.on('request',lambda request:self.external.append(request.url) if not request.url.startswith(self.base) and not request.url.startswith('blob:') else None)
    def new_context(self):
        context=self.browser.new_context(viewport={'width':1440,'height':1000},accept_downloads=True);self.contexts.append(context);return context
    def tearDown(self):
        self.assertEqual(self.errors,[]);self.assertEqual(self.external,[])
        for context in self.contexts: context.close()
        self.process.terminate();self.process.wait(timeout=10);self.process.stdout.close();self.process.stderr.close();self.directory.cleanup()
    def visit(self,path): self.page.goto(self.base+path)
    def sign_in(self):
        self.visit('account.html#invite='+self.invitation)
        expect(self.page.locator('#redeem-invite')).to_be_visible();self.assertNotIn('invite=',self.page.url)
        self.page.locator('#redeem-invite').click();expect(self.page.locator('#account-identity')).to_have_text('browser-tester@example.test')
    def consent_signup(self,email='new-tester@example.test'):
        self.visit('beta.html');expect(self.page.locator('#beta-email')).to_be_enabled();self.page.locator('#beta-email').fill(email);self.page.locator('#adult').check();self.page.locator('#beta-consent').check()
    def test_01_recruitment_consent_optional_date_and_duplicate_response(self):
        self.consent_signup();self.page.locator('#test-date').fill('2027-06-15');self.page.get_by_role('button',name='Request free beta access').click();expect(self.page.locator('#signup-result')).to_contain_text('received');message=self.page.locator('#signup-result').inner_text();self.assertEqual(self.page.evaluate('Object.keys(localStorage).filter(k=>localStorage[k].includes("new-tester"))'),[])
        self.consent_signup('NEW-TESTER@example.test');self.page.get_by_role('button',name='Request free beta access').click();expect(self.page.locator('#signup-result')).to_have_text(message)
        self.assertEqual(self.page.request.get(self.base+'api/beta-signups').status,401)
    def test_02_invitation_single_use_logout_and_cookie_protection(self):
        self.sign_in();expect(self.page.locator('#access-status')).to_contain_text('Free beta');expect(self.page.locator('#test-checkout')).to_be_disabled();self.assertNotIn('beacon_session',self.page.evaluate('document.cookie'))
        other=self.new_context().new_page();other.goto(self.base+'account.html#invite='+self.invitation);other.locator('#redeem-invite').click();expect(other.locator('#account-result')).to_contain_text('invalid or expired');other.close()
        self.page.locator('#sign-out').click();expect(self.page.locator('#sign-in')).to_be_visible();expect(self.page.locator('#signed-in')).to_be_hidden()
    def test_03_cloud_save_restore_cross_device_preserves_local_and_v3_bytes(self):
        self.sign_in();self.page.evaluate('''async () => {const s=await import('./src/storage.js');let state=s.emptyState();state.lessons['college-equations']='2026-10-26T00:00:00Z';state.bookmarks=['college-quantitative'];state.active={courseId:'linear-equations',mode:'timed',ids:['le-1'],answers:[null],index:0,deadline:Date.now()+60000};localStorage.setItem(s.STORAGE_KEY,JSON.stringify(state));localStorage.setItem(s.LEGACY_KEY,JSON.stringify({history:[],missed:['q0001'],week:2}));}''')
        before=self.page.evaluate(f'localStorage.getItem("{V3}")');local_before=self.page.evaluate(f'localStorage.getItem("{KEY}")');self.page.once('dialog',lambda dialog:dialog.accept());self.page.locator('#save-cloud').click();expect(self.page.locator('#cloud-status')).to_contain_text('saved');self.assertEqual(self.page.evaluate(f'localStorage.getItem("{KEY}")'),local_before)
        # A second device authenticates with a fresh invitation from the same private DB.
        result=subprocess.run(['node','server/owner.js','invite','browser-tester@example.test'],cwd=ROOT,env={**os.environ,'BEACON_DB_PATH':str(Path(self.directory.name)/'launch.sqlite')},text=True,capture_output=True,check=True)
        invitation=result.stdout.split('#invite=')[1].strip();second=self.new_context().new_page();second.goto(self.base+'account.html#invite='+invitation);second.locator('#redeem-invite').click();expect(second.locator('#signed-in')).to_be_visible()
        second.evaluate('''async () => {const s=await import('./src/storage.js');let state=s.emptyState();state.lessons['old-lesson']='2026-10-25T00:00:00Z';state.goals.daily=12;state.active={courseId:'linear-equations',mode:'timed',ids:['local-only'],answers:[null],index:0,deadline:Date.now()+30000};localStorage.setItem(s.STORAGE_KEY,JSON.stringify(state));localStorage.setItem(s.LEGACY_KEY,JSON.stringify({history:[],missed:['q0002'],week:3}));}''')
        second_v3=second.evaluate(f'localStorage.getItem("{V3}")');second.once('dialog',lambda dialog:dialog.accept());second.locator('#load-cloud').click();expect(second.locator('#cloud-status')).to_contain_text('merged into My learning')
        merged=second.evaluate(f'JSON.parse(localStorage.getItem("{KEY}"))');self.assertEqual(set(merged['lessons']),{'college-equations','old-lesson'});self.assertEqual(merged['goals']['daily'],12);self.assertEqual(merged['active']['ids'],['local-only']);self.assertEqual(set(merged['legacy']['missed']),{'q0001','q0002'});self.assertEqual(second.evaluate(f'localStorage.getItem("{V3}")'),second_v3);self.assertEqual(self.page.evaluate(f'localStorage.getItem("{V3}")'),before);second.close()
    def test_04_private_feedback_deletion_and_no_false_payment_confirmation(self):
        self.sign_in();self.page.locator('#question-id').fill('q0001');self.page.locator('#feedback-message').fill('The explanation could show how to choose the denominator.');self.page.get_by_role('button',name='Save private feedback').click();expect(self.page.locator('#feedback-status')).to_contain_text('saved for owner review')
        self.visit('account.html?checkout=returned');expect(self.page.locator('#checkout-status')).to_contain_text('never confirms payment');expect(self.page.locator('#access-status')).not_to_contain_text('Test Exam Pass active')
        self.page.locator('#delete-confirm').fill('DELETE');self.page.locator('#delete-account').click();expect(self.page.locator('#account-result')).to_contain_text('deleted');expect(self.page.locator('#signed-in')).to_be_hidden();self.assertEqual(self.page.request.get(self.base+'api/account').status,401)
    def test_05_unavailable_or_rejected_signup_never_claims_success(self):
        self.consent_signup();self.page.route('**/api/beta-signups',lambda route:route.fulfill(status=503,content_type='application/json',body='{"error":"Temporary service outage"}'));self.page.get_by_role('button',name='Request free beta access').click();expect(self.page.locator('#signup-result')).to_contain_text('not been confirmed');expect(self.page.locator('#beta-email')).to_have_value('new-tester@example.test')
    def test_06_keyboard_mobile_and_accessibility_light_and_dark(self):
        self.sign_in();axe=ROOT/'node_modules/axe-core/axe.min.js'
        for theme in ['light','dark']:
            for route in ['beta.html','beta-guide.html','account.html','privacy.html','terms.html']:
                self.visit(route);expect(self.page.locator('#site-footer .brand')).to_be_visible();self.page.locator('html').evaluate('(el,theme)=>el.dataset.theme=theme',theme);self.page.add_script_tag(path=str(axe));violations=self.page.evaluate('async()=> (await axe.run(document,{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa","wcag22aa"]}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))');self.assertEqual(violations,[],f'{theme} {route}')
        for width,height in [(390,844),(768,1024),(1440,1000)]:
            self.page.set_viewport_size({'width':width,'height':height})
            for route in ['beta.html','account.html','beta-guide.html']:
                self.visit(route);self.assertFalse(self.page.evaluate('document.documentElement.scrollWidth>innerWidth'),route)
        self.visit('beta.html');self.page.locator('#beta-email').focus();self.page.keyboard.type('keyboard@example.test');self.page.locator('#adult').focus();self.page.keyboard.press('Space');expect(self.page.locator('#adult')).to_be_checked();self.page.keyboard.press('Tab');expect(self.page.locator('#beta-consent')).to_be_focused()
    def test_07_static_project_prefix_disables_personal_data_submission(self):
        public=Path(self.directory.name)/'public';public.mkdir();(public/'asvab-prep-pro').symlink_to(ROOT/'dist',target_is_directory=True)
        server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(QuietHandler,directory=str(public)));thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        try:
            page=self.new_context().new_page();page.goto(f'http://127.0.0.1:{server.server_port}/asvab-prep-pro/beta.html');expect(page.locator('#service-status')).to_contain_text('not connected');expect(page.locator('#beta-email')).to_be_disabled();expect(page.locator('#signup-submit')).to_be_disabled();page.close()
        finally: server.shutdown();server.server_close();thread.join()
if __name__=='__main__': unittest.main(verbosity=2)
