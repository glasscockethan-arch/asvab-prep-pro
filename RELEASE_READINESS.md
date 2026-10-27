# Release readiness — ASVAB revenue-first sprint

Review session: October 26, 2026 (America/Chicago). Branch: `feat/aptitude-beacon-platform`. [Draft PR #1](https://github.com/glasscockethan-arch/asvab-prep-pro/pull/1) remains unmerged. Sprint baseline: `933e02d`; original live/main rollback baseline: `1ec5deb3e99096610e20a3fce2b04dd14791d877`.

**Public beta recruitment is not yet approved or operational. Paid launch is blocked.** The recruitment/account/payment preparations work locally with fictional data. No deployment, live payment, production collection, purchase, advertising or third-party analytics has been enabled. Finish the gates below before seeking the separate release approval.

## Launch scope

Initial offer: **$19.99 USD one-time Exam Pass / 90 days**, no recurring subscription. Proposed paid scope is private cross-device progress and saved review history, currently trialed free in the beta. The owner must approve the exact value/delivery promise. Keep the existing 540-question ASVAB app, diagnostics, timed/targeted practice, explanations, local history and backups genuinely free. Do not add a paywall to existing student work.

Defer Beacon Plus ($9.99/month), college/trades expansion, certification pathways, advertising and nonessential features. Existing 7 learning items / 36 lessons / 256 platform questions and their identities remain intact. Their broader curriculum gaps are recorded in docs/CURRICULUM_COVERAGE.md; completing those academies is not on the critical path to an explicitly ASVAB-only offer. Unfinished certification pathways stay under development.

## Verified project status

| Area | Current evidence and limit |
|---|---|
| ASVAB learning | All 540 questions retained byte-for-byte; 45-question diagnostic, 90-question mixed/40-question AFQT timed modes, 20-question drills, explanations, missed-item review and weak-area recommendations functional |
| Reliability | Separate validated V3 recovery record retains answers/position/deadline after refresh; duplicate completion recovery and stale-write guards added; local backups remain necessary |
| Recruitment | Landing page, consent/privacy, optional date, duplicate prevention, private SQLite storage, local review/CSV export and no false success on static/unavailable service |
| Accounts | Development-only manual single-use invitations, hashed expiring sessions, sign-out and active-data deletion; email delivery/ownership/recovery operations not implemented |
| Progress | Explicit account-isolated revision-checked cloud save/merge, two-browser restore, original V3 bytes preserved; no background sync or production durability claim; 1 MB limit |
| Payments | Default-off Stripe test adapter, fixed server price, signed/retrieved settled events, replay protection, 90-day expiry and conservative refund/dispute revocation; provider sandbox unrun |
| Analytics | Private aggregate test/business-event counters only; no third-party tracker, browsing beacon, ad or marketing campaign |
| Deployment | GitHub API confirms existing Pages build from `main:/` (`legacy`); branch publication workflow stays manual; Node API cannot run on Pages; no hosting/settings change |

Full implementation/limitations: [docs/ASVAB_REVENUE_SPRINT.md](docs/ASVAB_REVENUE_SPRINT.md). Operator instructions: [docs/BETA_OPERATIONS.md](docs/BETA_OPERATIONS.md). Provider cases/source review: [docs/PAYMENT_TEST_PLAN.md](docs/PAYMENT_TEST_PLAN.md).

## Verified automated checks

| Check | Result |
|---|---|
| Node unit / HTTP / SQLite / compatibility | **62 passed**, zero failures/skips; previous 38 retained plus 20 launch-service and 4 V3 recovery checks |
| Independent Python mathematics checker tests | **6 passed**, zero failures/skips |
| Existing platform and V3 browser suite | **23 passed**, zero failures/skips; previous 20 retained plus 3 recovery/conflict regressions |
| Connected-beta browser suite | **7 passed**, zero failures/skips; consent/duplicates, private links, two-browser merge, feedback/deletion, outage, keyboard/axe/responsive and unconnected project-prefix behavior |
| ASVAB audits | 540 structural records, 128 quantitative keys and 60 spatial keys passed; 10 normalized template groups still flagged |
| Other preserved content checks | 7 learning items / 256 questions, 138 JavaScript models; 84 independently recomputed college models and 7 printed equation models; no curriculum added in this sprint |
| Static build | 21 HTML pages / 191 static local links, syntax/schema/content checks and dist build passed; server/tests/DB/secrets excluded |
| Dependency audit | `npm audit --audit-level=moderate`: zero reported vulnerabilities; no runtime npm package added; Node 24 required for development backend |
| Responsive / accessibility | Beta/account/guide/policy screens scanned in light/dark themes; 390/768/1440px layout checks; keyboard flows pass; representative existing course screens retained |

The test suites operate on isolated fictional data and do not clear real student storage. Payment-provider responses are mocked, while HTTP, signature verification, storage, access and expiration are exercised. No successful provider sandbox run, penetration test, external expert review, legal approval or full WCAG certification is claimed. Both CI workflows include the new browser suite; exact pushed-head hosted results are reported on PR #1.

## Gates before public recruitment or an invited remote beta

All remain unchecked until evidence/owner acceptance is recorded:

- [ ] Identify the operator/data controller and provide a verified private support and consent-withdrawal channel. Define who reviews requests/feedback, a realistic response target, closure/export/deletion and incident handling. Public GitHub issues are not private support.
- [ ] Approve actual recruitment privacy/consent/terms, initial adult-only eligibility, retention and deletion of active records, invitations, CSV exports and backups. Do not collect DOB, military/school records, official scores, card details or other unnecessary data.
- [ ] Choose and approve a production-capable hosting/authentication/storage path within an explicitly accepted cost ceiling. GitHub Pages is static; local/ephemeral SQLite is not a hosted durability solution. No provider was purchased, registered, provisioned or assumed free indefinitely.
- [ ] Replace/review the local-only serving and authentication boundary: HTTPS, Secure cookies, verified email delivery and safe recovery, operator access, trusted-proxy and shared rate-limit handling, request/log privacy, database encryption/access/backups, monitoring and a successful production-like restore/deletion drill. Independently review security before exposing any endpoint. Do not tunnel the current development server.
- [ ] Verify the intended preview artifact on actual devices and with assistive technology, including touch/keyboard, focus/error recovery, 200–400% zoom, tab suspension/expired timers, interrupted requests, storage denial and two-device merge. Test large histories and define quotas beyond the current 1 MB cloud limit.
- [ ] Review beta disclaimers/known content errors and the feedback/correction process. A clearly labeled free exploratory beta is not a paid-quality signoff.
- [ ] Obtain explicit approval for the exact deployment/collection scope. Do not merge or deploy under this sprint's authorization.

## Additional gates before accepting real payments (priority order)

1. **Qualified independent educational signoff.** Review all 540 available ASVAB prompts, keys, explanations, distractors, ambiguity, repetition, passage reuse and technical claims; AR/MK/WK/PC first, then every remaining available subject. Record reviewer qualifications, sources, findings, corrections and approval in the question-review record without changing existing IDs. Current records mark independent review pending. Automated/AI review does not satisfy this gate.
2. **Approve a truthful, useful paid deliverable and commercial terms.** Confirm the $19.99/90-day cloud-history offer is sufficient and clearly distinguish it from the free tier. Publish owner-approved refund, cancellation, access/expiry, tax, delivery, outage/support and privacy terms; establish operator/merchant identity, jurisdiction/minors requirements and appropriate brand due diligence. No legal/tax/brand clearance is claimed.
3. **Complete real Stripe sandbox acceptance.** Secure test-key/webhook bindings are absent. Run success, 3DS, decline, cancellation, replay/out-of-order, failed and successful refunds/disputes, outages/reconciliation and renewal-denial cases in docs/PAYMENT_TEST_PLAN.md. Verify merchant onboarding/payout capability, matching API/webhook schema, alerting and reconciliation. Resolve pending-refund/dispute-restoration workflows; test counters do not prove actual conversion or payment delivery.
4. **Meet the recruitment infrastructure/security/device gates above and test the actual paid artifact.** Include server-owned access/expiry, account switching/recovery, historical progress migration, cloud/local export after expiry, access loss after refund and recovery from restored backups. Resolve material errors before a sale.
5. **Separate owner release/live-payment approval.** Authorize the exact reviewed merge/artifact, hosting configuration and live mode only after the above evidence. Production startup/live keys are deliberately rejected by the current development service. Nothing in this sprint enables them.

## Remaining limitations and references

- All new development work has author screening, not independent expert approval. No educational reviewer was engaged or paid in this sprint.
- Browser storage can be evicted; local checks are not transactional cross-tab locking. Unfinished V3 sessions stay device-local. Keep backups and avoid simultaneous local editing.
- The V3 completed-progress key and both platform schema-1/schema-2 compatibility remain; no forced migration/reset. Course identities and the old 540-question inventory remain. New optional session IDs allow recovery without changing answer IDs.
- Free beta accounts expire after 90 days, sessions after 7 days and links after 30 minutes; reissuing a link does not extend access. Free practice and own cloud retrieval remain after entitlement expiration.
- Uninvited signup/feedback pruning runs on startup and owner command; final account/export/backup retention needs approval. No live support inbox, email sender, encryption-at-rest, recovery delivery, operational alerts or production deployment exists.
- Prior source availability: 14/17 reachable in Phase 3, with NCCER 404 and ASE/official ASVAB 403; that optional live audit was not rerun here. Resolve any source needed for claims actually offered, rather than treating unavailable unrelated credential sources as a reason to build more courses. Scoped EPA/OSHA/OpenStax records remain historical evidence, not new expert signoff.
- New payment technical sources and one unavailable guessed changelog path are documented in PAYMENT_TEST_PLAN.md. Technical source checks do not validate merchant/legal readiness.

Planning critical path: approximately **10–20 business days after reviewer availability, owner decisions and test access**, conditional on findings. Review/corrections and production payment/security acceptance drive the date; completing additional academies or a subscription does not. No merge, deployment, live payment, infrastructure expense, domain purchase, advertisement or campaign has occurred.
