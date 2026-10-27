# Private beta development operations

The default workflow below is local fictional-data testing, not public recruitment. A separate staged hosted entry is prepared in BETA_HOSTING.md; it has not been deployed or approved for real data. Do not expose the loopback server. Public collection needs the gates in RELEASE_READINESS.md and a separately approved production service. No email is sent automatically; never post records, invitation links or exports publicly.

## Run and validate

Use Node 24, the existing checkout and a private database outside all web roots:

```bash
cd /workspace/asvab-prep-pro
npm ci --ignore-scripts
npm run build
npm run dev:beta
```

This starts the loopback service on port 8001. It serves `dist/`, so rebuild after source edits. Default private DB: the system temporary directory's `aptitude-beacon-development/launch.sqlite`. It is persistent across process restarts on the same filesystem but may disappear with a container/temp cleanup. Use `BEACON_DB_PATH` for a durable private development path, and set the same path for owner commands. The app must not store a DB/export in the repository. No secret is required for free beta development.

Verify internal GETs for `/api/config` (`mode=development`), `/beta.html` and `/practice.html`; then use the browser suites. Do not publish a loopback preview link. A plain Python/static server still supports free learning but cannot collect email or run private accounts. It honestly disables beta collection.

The signup accepts only affirmative adult/contact consent for `beta-2026-10-26`, validates the optional date, stores no marketing consent, and cannot update a previous request. The default address throttle permits 8 signup requests per 15 minutes; it is process-local, connection-based and intentionally does not trust forwarded IP headers. A production reverse proxy would require a reviewed replacement, not blindly trusting X-Forwarded-For.

## Owner access

Run on the machine containing the private database with trusted operator filesystem access. Output can contain personal data: use a private terminal. The following path examples are outside the checkout but still require an owner-private machine/directory:

```bash
npm run owner -- review
npm run owner -- export /tmp/aptitude-private/signups.csv
npm run owner -- metrics
npm run owner -- feedback /tmp/aptitude-private/feedback.csv
npm run owner -- backup /tmp/aptitude-private/snapshot.sqlite
npm run owner -- prune
```

Exports/backups create new 0600 files and refuse overwrite; keep their parent directory private, encrypt at rest before public use, and never attach them to GitHub issues, PRs or chat. The backup uses SQLite VACUUM INTO; an automated test restores it and checks integrity and account data. A production backup/restore drill, off-machine storage, access control and retention/deletion schedule remain unimplemented.

Only after a fictional signup (or a separately approved recruitment flow), a local operator may issue an invitation:

```bash
npm run owner -- invite volunteer@example.test
```

This produces a private 30-minute single-use link. Deliver links only to the opted-in address via an owner-verified private channel. Never send an unsolicited invitation or turn requests into a marketing list. A new invitation invalidates previous invitations to the address without restarting the free-beta period. There is no automated mail/ownership-verification/account-recovery service. Link possession grants access; treat links as secrets.

For a privately verified withdrawal/deletion request:

```bash
npm run owner -- delete volunteer@example.test
```

Invited testers can also delete their own active development data in account.html. The owner separately deletes CSV/backups under the approved schedule. `prune` removes expired sessions/invitations, uninvited requests older than 90 days and feedback older than 90 days; run it daily during any approved beta. It is also applied at service startup. It does not settle the final account/backup retention policy.

## Test credentials and guardrails

Stripe is off unless `BEACON_STRIPE_TEST_MODE=true`, a test `STRIPE_SECRET_KEY` and the matching `STRIPE_WEBHOOK_SECRET` are securely supplied to the development process. Check names/presence only, never print values. Do not put secrets in source, CLI history, saved startup scripts, screenshots or chat. Signing verification requires actual secret bytes in the server process; an HTTPS-proxy placeholder is not a usable HMAC secret. No secret requirement was populated automatically and no provider call was made in this sprint.

If a provider test is authorized/configured later, run Stripe's test tooling against loopback using official tooling and test credentials; do not deploy or tunnel this server publicly. Configure the test endpoint's event schema to `2025-06-30.basil` and the six handled event types in PAYMENT_TEST_PLAN.md. Confirm the webhook signing secret matches the specific forwarder/endpoint. Use only documented test card details. Never use a real card or enable live keys. Keep a private reconciliation log of unknown/mismatched events and pending reservations; no operational monitoring/reconciliation CLI is provided yet.

## Tester and human acceptance

The public-facing beta-guide.html gives session and feedback instructions. Internally check diagnostic and explanations, timer recovery, optional cloud copy on two browsers, session logout/reissue, storage/network failure, an intact V3 backup, export/deletion and a restored database. Use fictional data until privacy/controller/support and deployment approvals exist.

Actual-device checks: iPhone/iPad Safari (including keyboard/zoom and tab suspension), Android Chrome, Windows Chrome/Edge/Firefox, screen readers, reduced motion/contrast, landscape, 200–400% zoom, and intermittent network/storage. Review free/paid language with human testers; no claims of improved scores, official alignment or willingness to pay have been validated.

## Revenue Sprint 2 operations

Open exam-pass.html through the connected service to test schedules, guided existing-question sessions, private results and archive export. Plans and guided records are account-scoped SQLite tables; they do not overwrite original V3/browser keys. The trial/pass is checked on each premium operation. Expired users retain free practice and their own archive export. Old plan versions/results persist; reflection text is not collected.

For a privately verified lost-device/session request, `npm run owner -- revoke-sessions volunteer@example.test` invalidates every session and pending link while retaining the account, study data and original trial end. Verify the requester through the approved private channel before creating a fresh invitation. Set BEACON_PUBLIC_ORIGIN to the approved HTTPS origin for a future hosted operator link; without it, development links remain loopback. This does not send mail or prove delivery.

After a private consistent backup, `node server/verify-backup.js /private/new.sqlite` checks integrity, foreign keys and aggregate schema counts read-only. Restore rehearsal must also compare known account/progress/plan/session identities/results. Actual off-service encrypted storage, provider disk restore/redeploy, monitoring and retention remain owner acceptance work. Do not use provider volume snapshots alone as custom-database recovery evidence.

Use `npm run test:review` and `npm run review:asvab` for workflow integrity; `npm run release:content` remains blocked at zero human approvals. This command cannot establish the truth of a reviewer qualification or signoff. See ../review/README.md for private packets, findings, corrections and version-bound signoff.
