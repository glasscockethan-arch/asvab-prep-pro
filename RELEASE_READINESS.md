# Release readiness — Revenue Sprint 2

Review session: October 26, 2026 (America/Chicago). Starting commit `ff9b2f0`; existing `feat/aptitude-beacon-platform` and [draft PR #1](https://github.com/glasscockethan-arch/asvab-prep-pro/pull/1). Original main/live baseline: `1ec5deb3e99096610e20a3fce2b04dd14791d877`.

**No public deployment, real signup collection, customer invitation or live payment has been authorized/performed.** Implementation and isolated tests are complete; the three owner-acceptance gates below remain separate. No merge, domain/service purchase, paid infrastructure provisioning, advertising, third-party analytics or marketing send occurred.

## Current product and evidence

The proposed **$19.99 USD one-time Exam Pass / 90-day access** now includes personalized 30/60/90-day calendars, chosen weekdays/time budgets, structured four-subject review, a practice-evidence dashboard, guided sessions with saved answers/review/reflection and private progress continuity. The free beta trials these tools without payment. Calendars do not extend the entitlement; creating a new plan preserves earlier activity and does not renew access. Subscriptions, college/trades expansion and new questions remain deferred.

All existing 540 V3 questions/explanations, diagnostics, timed/subject practice, local recommendations/history and backups remain free. The question array/IDs are byte-for-byte unchanged. Seven platform items / 36 lessons / 256 questions and schema-1/schema-2/V3 progress compatibility remain. Guided study uses the existing bank; no exclusive or AI-generated question pool is added. [Feature matrix](docs/EXAM_PASS_FEATURES.md).

| Verification | Result and limit |
|---|---|
| Node unit / HTTP / SQLite / compatibility | **83 passed**, zero failures/skips; includes previous 62, study calendar/evidence/scoring, entitlement/refund/account boundaries, migration/restore, staged hosting and session recovery |
| Python mathematical-checker tests | **6 passed**; preserved mathematical content unchanged |
| Python reviewer-workflow tests | **7 passed**; fictional attestations only, no actual human approval |
| Existing platform / V3 browser suite | **23 passed**, zero failures/skips; original scoring, recovery/timers, storage, backups, accessibility and course flows retained |
| Connected beta / premium browser suite | **12 passed**, zero failures/skips; includes calendar lengths, guided resume/scoring/review, expiry/local-flag denial, data export, changed-bank recovery and keyboard/responsive/axe checks |
| Build / audits | 22 HTML pages, static links/syntax/schema; 540 structural checks, 128 quantitative and 60 spatial keys; preserved platform/college model audits passed; no new curriculum |
| Dependency audit | Zero reported moderate-or-higher npm vulnerabilities; no runtime npm package added. This is not a container/first-party security audit. |
| Container | Build and isolated non-root/read-only smoke passed; no public network or published port; all release stages, Secure cookie, guided scoring, restart persistence and private consistent backup exercised |
| Human review gate | **0/540 approvals**, zero registered reviewers. Record integrity passes; `npm run release:content` intentionally blocks paid release. |
| Hosted provider / real devices / Stripe | Not deployed or validated; actual TLS/disk/sender/recovery/real-device/provider acceptance remains required. Local signed Stripe fixtures and mocks are not merchant acceptance. |

Practice dashboard evidence uses the latest distinct-question answers from 30 days, canonical practice keys, explicit unanswered/missing evidence and four AFQT areas. Repetition/imports do not establish mastery. The ten-answer minimum and 70%/85% bands are unvalidated organization heuristics, not official AFQT percentiles or qualification/readiness predictions. Qualified pedagogical review is required before sale.

## Gate A — before collecting beta signups

All items require actual evidence and owner acceptance, not merely a configured stage value:

- [ ] Identify the operator/controller and a verified private support/consent-withdrawal route; assign monitoring and a realistic response/incident process. Public GitHub issues are not a private channel.
- [ ] Approve actual recruitment privacy/terms, adult-only initial eligibility, explicit beta contact consent without marketing, optional date purpose, regional/data-processing requirements and a retention/export/backup deletion schedule. Collect no DOB, military/school records, official scores, card details or unnecessary data.
- [ ] Approve the hosting approach and full cost ceiling/quote. Recommend one paid Render Node/Docker instance plus a private persistent SQLite disk; approximate compute-plus-1-GB floor is $7.25/month before other charges. Exact current compute SKU, workspace, bandwidth, tax, backup and email costs need confirmation. Nothing has been purchased/provisioned.
- [ ] Independently review the signup/data/security boundary, trusted TLS ingress, origin/host checks, body limits, persistent throttles, CSP compatibility exception, private operator access, provider logs, encryption/region and data deletion. Dependency/axe scans are not that review.
- [ ] After explicit deployment approval only, create the exact reviewed artifact in **closed** stage and verify actual HTTPS redirects/proxy headers, private paths, host rejection, health, non-root disk permissions and persistence across provider restart/redeploy. GitHub Pages cannot run this backend; never tunnel the local development service.
- [ ] Establish consistent private database backups and approved encrypted off-service retention/restore operations for signup records. Verify a restoration and private CSV review/export with fictional data. Do not rely on a custom-database volume snapshot as proof of recovery.
- [ ] Validate the form, consent, error/duplicate states, privacy/support and keyboard/mobile usability on actual intended devices; verify no unexpected collection/marketing. Confirm owner can handle withdrawal/deletion without public disclosure.
- [ ] Separately approve opening **signup** stage. This stage permits requests but denies invitation redemption and account/study work. No emails or marketing are automatically sent.

## Gate B — before inviting beta testers

Complete Gate A plus:

- [ ] Approve the exact invitation cohort/scope and beta disclosures, known content limitations and feedback/correction triage. Full independent paid-quality signoff is not claimed by a clearly labeled free exploratory beta; address known material errors before exposure.
- [ ] Verify email possession through an actual private delivery/receipt rehearsal using an owner-controlled opted-in test address. Initial manual delivery can avoid a new sender service/domain, but must go only to the requested address. No delivery/ownership proof has yet occurred. Approve a verified sender/managed identity integration if the security review requires it.
- [ ] Test actual HTTPS/Secure-cookie sign-in, 30-minute single use, seven-day session expiry, private reissue, sign-out and operator lost-device recovery. `owner revoke-sessions` invalidates sessions/invitations without deleting learning records; requester identity must be checked privately. No address-change or automated recovery service exists.
- [ ] Validate two real devices, shared-browser/account switching, explicit cloud upload, old-origin export/import migration, guided scoring/resume, stale conflicts, access expiry, exports/deletion, offline/network/storage failure and sufficiently large histories. Current cloud-copy limit is 1 MB. Unfinished V3 sessions remain device-local.
- [ ] Rehearse application-consistent backup and restore including accounts, original progress, plans, guided answers/results and completion rows. Verify identities/counts and old progress before accepting writes; define maintenance, rollback, incident, quota and operator coverage. A local tmpfs/process-restart test is not provider disaster recovery.
- [ ] Review the actual responsive/accessibility artifact with iOS/iPadOS Safari, Android, Windows browsers and assistive technology, 200–400% zoom, keyboard/focus/error paths, tab suspension and interrupted saves. Chromium emulation/axe is only partial evidence.
- [ ] Separately approve **invited-beta** stage. Start with a small consenting free cohort and validate whether calendars/recommendations/review are useful. No real tester data, outreach or willingness-to-pay evidence was collected in this task.

## Gate C — before accepting real payments

Complete Gates A and B plus:

1. **Qualified independent educational approval for all offered material.** Review all 540 prompts, keys, explanations, distractors, ambiguity, repetition, rights and technical claims; AFQT 240 first, then the other 300. Register real independently qualified reviewers by scope, verify qualifications privately and record actual sources/derivations/findings/signoff against the current content hashes. Resolve corrections with the same question IDs and independent recheck. The reviewer workflow is prepared, not completed. Also review the new guidance heuristics/claims for pedagogical appropriateness.
2. **Truthful paid value and consumer/operator terms.** Approve the exact $19.99/90-day deliverable, free comparison, access/expiry, no-renewal, refund/failure/dispute, outage/support, privacy, tax, merchant/operator, jurisdiction/minors and brand requirements. Assess beta value/limitations without promising score gains. No legal, tax, trademark or merchant eligibility assurance is made.
3. **Real Stripe sandbox acceptance.** Test secret/signing bindings remain absent. Complete actual successful/3DS/declined/canceled/replayed/out-of-order/refunded/failed-refund/disputed and outage/reconciliation cases in PAYMENT_TEST_PLAN.md. Verify account, merchant/payout capability, API/event schema, alerts and recovery. Existing local test adapter/mocks do not satisfy this gate.
4. **Reviewed paid deployment implementation.** The hosted beta intentionally rejects every payment configuration and has no paid/live stage. A separate reviewed change and approval must introduce any live-payment path after content/security/provider acceptance, while retaining server-owned expiry, refund revocation and own-data export. A client flag or stage string cannot enable sales.
5. **Exact release approval and post-release verification.** Recheck all tests/content fingerprints, container/image vulnerabilities and immutable digest, actual artifact/device/support/backup/provider evidence, then obtain separate explicit merge/deployment/live-payment authorization. Do not merge PR #1 or deploy under this sprint's authorization.

## Operational and review records

- [Hosting comparison, source evidence and migration](docs/BETA_HOSTING.md); the Render example is unapplied review material and does not default a billable compute plan.
- [Reviewer qualification/correction/signoff workflow](review/README.md). Ordinary CI permits honest pending states; `release:content` requires all 540 approvals. Software validates records, not the truth of human credentials/attestations.
- [Updated free/premium product matrix](docs/EXAM_PASS_FEATURES.md), [operator runbook](docs/BETA_OPERATIONS.md), [Stripe cases](docs/PAYMENT_TEST_PLAN.md).
- All new work has development-author screening/testing only. The 10 ASVAB normalized-template groups, glossary/passages, explanations and factual keys still need expert review. Older OpenStax/EPA/OSHA source records remain scoped historical evidence; no new curriculum signoff is inferred.

Shortest planning path, conditional on owner decisions/qualified help: approximately **1–3 engineering days after approvals** to configure and accept signup-only hosting, then **1–3 days** for invitation/recovery/device acceptance and a small cohort. These are not elapsed work or deployment promises. Paid launch remains roughly **10–20 business days after reviewer/test access and owner decisions**, potentially longer for corrections/security/legal/provider findings; 540 items at 4–8 minutes is 36–72 reviewer hours before fixes/recheck. Parallelize human review with approved beta preparation; do not expand the catalog or build subscriptions to fill waiting time.
