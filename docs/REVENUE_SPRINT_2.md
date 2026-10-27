# Revenue Sprint 2 — implementation and handoff

October 26, 2026 (America/Chicago). Verified clean starting head `ff9b2f0`, correct GitHub origin and draft PR #1; both previous hosted CI runs had passed. Work stays on `feat/aptitude-beacon-platform`, with main/live site and the 540-question array unchanged.

## Delivered value

Personalized 30/60/90-day study calendars accept selected weekdays and 15/30/45/60 suggested minutes. They rank recent AFQT review needs, include rest/catch-up days, revisit all four subjects and use balanced checkpoints. Replacing a calendar archives the previous plan, refuses to discard unfinished guided work and never renews access.

Guided sessions reuse existing AR/MK/WK/PC items, prioritize known misses/unseen items, save choices/position with revisions, score server-side and expose existing explanations after completion. Day completion requires the matching guided attempt plus review/reflection confirmations. There is no required passing percentage or verified-mastery claim. Personal reflection notes are not collected. All free practice modes/questions/explanations/progress remain available.

The dashboard distinguishes missing evidence, answered/correct/unanswered, distinct-question coverage, recent practice and schedule completion from official ASVAB/AFQT results. Canonical keys are recomputed for current practice evidence; repeated or editable imports cannot become an official outcome claim. The finite template-heavy bank and unvalidated 10-answer/70%/85% heuristics remain explicitly limited. See EXAM_PASS_FEATURES.md.

New API access uses server beta/pass state on every premium operation. Anonymous, expired and revoked-pass cases cannot create/read dynamic study guidance or save/finish sessions. Account isolation and revision conflicts are enforced. Authenticated own-data exports and unfinished-session archiving remain available after expiry. Guided results live in private server study tables, not a rewritten V3 key; the archive is not a V3 import.

## Beta architecture and reviewer preparation

A separate fixed-origin HTTPS hosted entry supports closed → signup → invited-beta stages and prohibits all hosted payment configuration. Prepared non-root Docker runtime, persistent storage path checks, Secure cookies, HSTS/CSP, persistent private throttle buckets, hourly cleanup, health checks, backup verification and operator session revocation reduce deployment work. Default development startup remains loopback-only. The unapplied Render example disables automatic deployment and still requires an owner-approved paid compute SKU. BETA_HOSTING.md compares Render and Railway, source availability/cost limits, and all migration requirements.

The human-review registry is empty. The 540-item workflow records stable IDs, version fingerprints, assignments, findings, corrections and real signoff requirements; edits invalidate affected approval and preserve history. Standalone private packets include original keys/explanations/spatial diagrams for independent checking. Qualified subject scopes, owner credential verification, actual sources/derivations and independence from correction authors are required records. None was fabricated. Ordinary CI validates record structure while leaving 540 pending; paid content gate remains blocked. See ../review/README.md.

## Local evidence and its limits

- 83 Node checks, 6 Python math-checker tests, 7 reviewer-workflow tests, 23 existing platform/V3 browser checks and 12 connected-beta/premium browser checks pass, zero skips.
- Static/schema/link/build and existing ASVAB (540 structure / 128 numerical / 60 spatial) and mathematical audits pass; npm dependency audit reports zero moderate-or-higher issues. No runtime package was added. The 7/36/256 catalog and 540 question objects remain intact.
- The container builds and runs as a non-root user with read-only root, isolated network and no published port. Fictional test data exercises all three stages, private paths, Secure cookies, guided scoring, process restarts and a consistent verified backup. No provider TLS/disk durability/email delivery/disaster recovery, actual device or independent security/content approval is claimed. No image vulnerability scan was run.
- Tests caught a numeric-clock call error in new expiry display and a missing Content-Length in the raw DELETE test client; both were corrected, with assertions retained. Container validation caught source readability under the non-root user; root-owned code is now explicitly readable while tests keep the filesystem read-only.
- Docker needed a writable Buildx cache and this machine's trusted public CA bundle passed transiently. TLS/package integrity verification remained enabled; no signing/payment/email credential or CA bundle is embedded in the runtime image.

Hosted CI for the pushed final head is reported in draft PR #1 separately. No real customer data, external invitation/email, purchase, new hosted resource, public deploy, merge, live Stripe payment, advertisement or marketing campaign occurred. The optional provider comparison reads public primary documentation; unavailable Cloudflare references are documented, not treated as verified alternatives.

## Remaining critical path

Follow RELEASE_READINESS.md's separate signup, invitation and paid gates. Owner support/controller/policies/budget and independent security/actual-provider acceptance block public collection; delivery/recovery, actual devices and off-service restore block invitations. All 540 current-version qualified reviews, guidance review, approved consumer/value terms, real merchant/sandbox cases and a separately reviewed paid deployment block money collection. Subscriptions and new courses remain deferred.
