# ASVAB revenue-first sprint — development handoff

Review session: October 26, 2026 (America/Chicago). Starting commit: `933e02d`. Existing development branch and draft PR #1. This is implementation evidence and a staged launch plan, not a launch authorization.

## Product decision and scope

The initial proposed offer is **$19.99 USD once for 90 days**, no renewal or subscription. Preserve the existing genuinely useful free offering: all 540 V3 questions, diagnostic, subject drills, AFQT and mixed timed practice, explanations, missed-question review, local history, guides and JSON backups. The proposed paid addition is private cross-device progress and saved review history. Invited beta accounts trial the cloud-copy tools free for 90 days, starting at first invitation redemption. Invitation reissue does not restart that period. An owner must approve the exact deliverable/value promise before a sale; no exclusivity or willingness-to-pay claim is made. Beacon Plus ($9.99/month), college/trades expansion, advertising and new nonessential courses are deferred.

Keep the 7 existing learning items, 36 lessons, 256 platform questions and every previous identity intact. Non-ASVAB curricula are not prerequisites to an ASVAB-only paid release if explicitly excluded from its offer and left honestly labeled. None of the unfinished credential tracks becomes a released course.

## Verified starting architecture

- Static HTML/CSS/browser JavaScript; no framework rebuild is necessary. Existing storage validation/merging and the V3 diagnostic, scoring, answer review and study recommendations are reused.
- V3 has 60 questions per each of 9 subjects. Diagnostic: 45 questions, 5 per subject, untimed. Mixed practice: 90 questions/90 minutes. AFQT practice: 40 questions/40 minutes across AR/MK/WK/PC. Subject drill: 20 questions. These are practice formats, not official exam replicas. Weak-area recommendations appear after at least 5 recorded answers in a subject.
- Before this sprint: browser-local progress and manual backups only; no accounts, email delivery, server database, checkout, entitlement, or automatic cross-device sync.
- GitHub API reports Pages `build_type=legacy`, source `main:/`, status built. The branch's publication workflow is manual; its CI runs on development pushes/PRs. No Pages settings or publication workflow were dispatched or changed to auto-deploy. The existing main/live site is preserved.
- Existing PR #1 was open/draft from `feat/aptitude-beacon-platform` into `main`, with hosted Phase 3 CI passing. Native Git and GitHub API authentication work.

## Implemented development flows

`beta.html` introduces the ASVAB beta, a useful free tier, optional test date, separate adult/contact consent and the planned pass. No payment is needed. Signup controls remain disabled without a compatible same-origin service; HTML/error responses cannot appear as successful collection. No form field is saved in browser storage.

`server/main.js` is an **optional loopback-only, non-production Node 24 service**. It serves only `dist/` and refuses `NODE_ENV=production` and non-test Stripe keys. Nothing deploys it. GitHub Pages cannot run it. It uses built-in SQLite with a private database outside the checkout (file mode 0600), parameterized queries, bounded JSON bodies, no CORS, host/origin checks, HttpOnly/SameSite sessions, no-store responses, and bounded in-memory throttles. It does not provide disk encryption, production TLS, shared rate limiting, managed email, monitoring, or a production security assurance. Do not expose it using a tunnel, public bind, proxy, or port forwarding to collect real data.

Signup records contain normalized email, optional test date, consent version and creation time. Unique email prevents basic duplicates; duplicate requests return the same generic response and do not permit an unauthenticated profile edit. A honeypot limits obvious bots. No raw IP, form body or card number is persisted/logged by the application.

There is no public signup list or admin API. The local operator CLI reviews/exports records, issues invitations only for opted-in addresses, exports private feedback, prunes old requests, deletes data, and creates consistent SQLite backups. CSV quoting also defangs spreadsheet formulas. Exports refuse overwrite and repository destinations; operators must keep them outside every other public web directory too.

Accounts use manually delivered 30-minute single-use links and hashed seven-day sessions. The owner must privately deliver a link only to the opted-in address; the code itself does not verify delivery or automate email. Tokens are removed from URL fragments before network requests, never put in localStorage, and are not written to request logs. Local HTTP cookies lack Secure; production HTTPS/Secure cookies remain mandatory. Authentication, recovery, session/device revocation and operator access need independent security review before public use.

Cloud copies are explicit uploads/downloads, not background synchronization. They reuse the validated schema-2 envelope and merge logic, can include readable V3 history, strip active sessions/timers, and use account ownership and revision checks to reject stale saves. Retrieving one's cloud copy stays available after access expires. Loading merges into `aptitude-beacon-v1`, retaining local goals, active session and original `asvab-prep-pro-v3` bytes. To restore merged history into V3 itself, use the existing confirmed backup import. The 1 MB API limit means large histories must use local backups until reviewed storage quotas/chunking are supplied. No production backup guarantee is made.

`asvab-recovery.js` gives the preserved V3 app a separate validated unfinished-session record. Answers/position survive refresh; timed practice retains the absolute deadline and submits on resume if expired. Corrupt records are preserved for explicit recovery/discard. Known duplicate session completion is detected after an interrupted clear. Stale local writes are rejected. Browser storage is not a transactional cross-tab database: avoid simultaneous editing, keep backups, and test actual devices. The 540-question array is byte-for-byte unchanged (SHA256 `c65c4221d4219166b30856e5e70b13572c8cc9e9f8c9187017753563e08061e6`). Old completed results remain compatible; a new optional `sessionId` is ignored safely by existing backup readers.

`beta-guide.html` and `account.html` provide tester instructions, private feedback, sign-out and active development-account deletion. No new messages are sent. Uninvited requests/feedback have a 90-day prune rule; startup and explicit owner cleanup apply it. Final account/export/backup retention and private uninvited withdrawal operations need owner approval.

## Test-only payment boundary

- Test secret credentials are absent in this environment. Checkout is **disabled by default**. No real provider checkout, webhook delivery, refund, 3DS flow or sandbox Dashboard operation has been executed.
- The adapter accepts only `sk_test_...`, creates a server-owned 1999-cent USD card-only one-time Checkout, fixes return destinations, and never receives browser prices or grants access from a return URL.
- API version `2025-06-30.basil` is pinned. Configure the test webhook endpoint to the matching schema. A first-party SDK version source confirms that version exists; actual compatibility still needs sandbox testing.
- Raw-body HMAC, timestamp tolerance and event-ID deduplication precede fulfillment. Test mode is mandatory. Server retrieval verifies account, offer metadata, fixed total/currency, completed session and settled payment. Different event IDs for the same checkout cannot extend access.
- Entitlements are server-owned: 90 × 24 hours from the first accepted paid event's creation timestamp, with exact-boundary expiry. Local flags/backups cannot grant them. Test checkout retries reuse the same reservation/idempotency key. An uncertain reservation older than 23 hours is blocked for reconciliation instead of risking another charge.
- Successful partial/full test refunds or disputes conservatively revoke the test pass, including an event delivered before payment fulfillment. Failed/expired checkout events cannot revoke an already settled payment. No automatic refund API or money movement was added. Pending/failed refunds, dispute resolution, manual reinstatement and reconciliation/alerting remain operator work. A consumer refund policy must be approved independently.
- Private aggregate counters expose signup, invitation, test-checkout, paid-event and refund/failure totals through the local CLI. They contain no browsing identity, beacon, third-party tracker or marketing activation. Counts are operational funnel preparation, not measured conversion rates; a real campaign denominator and consent/legal decision are not implemented.

## Verification

Local final code: 62 Node tests, 6 independent Python checker tests, 23 existing-platform/V3 browser tests and 7 connected-beta browser tests passed, with zero skips. New coverage includes consent, invalid/duplicate input, CSRF/host rejection, throttling, private exports, backup/restore, single-use links, session expiry, account isolation/deletion, cloud conflicts, actual second-browser merging, failed submission messaging, signed webhook integration, incorrect totals/metadata, live-event rejection, replay, exact entitlement expiry, pre-payment refunds and disputes. Payment-provider responses are mocked; tests exercise actual HTTP routes/SQLite, not the Stripe network.

Build/schema/link/syntax checks, all 540 structural checks, 128 quantitative keys, 60 spatial keys, 138 platform models and 84 independent college models passed. `npm audit --audit-level=moderate` reported zero vulnerabilities. Dependency audits do not establish first-party backend security. No runtime npm dependency, external email/analytics SDK or paid service was added.

New beta/account/policy screens passed axe scans in light/dark modes and overflow checks at 390, 768 and 1440 pixels, plus keyboard controls. Actual devices, assistive technology and full WCAG conformance remain unverified. CI now includes both browser suites; hosted results are linked in PR #1 after pushing.

A test harness initially used a browser dialog listener that waited until after the click; it timed out while the modal blocked that click. The listener now accepts the dialog during the action and asserts its warning. No product assertion was disabled. The initial static link check correctly failed until the beta privacy section was implemented.

## Prioritized gates and critical path

See `RELEASE_READINESS.md` for the actionable beta/paid checklist and `PAYMENT_TEST_PLAN.md` for unrun provider cases. Content inventory remains `docs/QUESTION_REVIEW.csv`; no human reviewer signoff was added. The 10 normalized ASVAB template groups, glossary reversal, repeated passages, factual keys and explanations still need qualified independent review.

Planning estimate only: **10–20 business days after owner decisions, reviewer availability and secure test access**, with unknown delays if material errors or legal/security gaps emerge. A 540-item review at 4–8 minutes per item is roughly 36–72 reviewer hours before corrections/rechecking. In parallel, allow approximately 3–5 engineering days for an approved production authentication/hosting/storage path, real Stripe sandbox cases, monitoring and recovery, plus 2–3 days for device/operator/policy acceptance. Do not treat those estimates as elapsed work or a launch commitment. The longest path is qualified review plus corrections, followed by payment/security acceptance and explicit release approval. There is no need to finish college/trades or build a subscription to acquire the first ASVAB customers.
