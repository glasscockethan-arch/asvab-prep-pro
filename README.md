# Aptitude Beacon

A free static learning platform with bounded Algebra I and College Algebra/Quantitative Literacy courses plus five introductory units, totaling 36 lessons and 256 original questions, plus the preserved 540-question ASVAB V3 application. The free learning app requires no account or runtime secret. An optional local ASVAB beta service and separate staged hosted entry prepare recruitment, accounts, guided study and private progress; neither has been publicly deployed or approved for real customer data. The proposed first paid offer is a $19.99 one-time 90-day Exam Pass; subscriptions and course expansion are deferred.

**This is not launch-ready.** See [RELEASE_READINESS.md](RELEASE_READINESS.md) for content, source-verification, accessibility and owner gates. The bounded courses state their scope; neither is a complete school-year or semester curriculum. Five other units remain introductions. No academic or professional credential is issued. The legacy bank remains subject to independent editorial review.

## Develop locally

Use Node 24 (required by the built-in SQLite development service), Python 3.12 and the existing checkout:

```sh
cd /workspace/asvab-prep-pro
npm ci --ignore-scripts
npm run dev
```

Use a static HTTP server for the new module-based platform. Opening the new homepage directly as a `file:` URL does not support loading the lesson JSON. For a local copy of V3, keep `practice.html` and `asvab-recovery.js` together; the helper is now required for unfinished-session recovery. No offline installation/cache guarantee is made, and iPad Files may render HTML as a preview.

## Validate and build

```sh
npm test
npm run test:math
npm run test:review
npm run check
npm run audit:bank
npm run audit:curriculum
npm run audit:college
npm audit --audit-level=moderate
npm run build
```

The build produces `dist/` with only static application assets and data. It preserves project-subdirectory routing without server rewrites. No credentials, tests, dependency directory or Git metadata are deployed. The sole npm development dependency is the pinned axe-core accessibility checker; the application uses no runtime package dependency.

For browser tests:

```sh
python3 -m pip install -r requirements-dev.txt
python3 -m playwright install --with-deps chromium
npm run build
npm run test:e2e
npm run test:launch:e2e
```

In this cloud environment, Python Playwright and `/usr/bin/chromium` are already installed. Tests select that executable if available; otherwise they use Playwright's installed Chromium. `CHROMIUM_PATH` can select an executable. Tests cover a desktop viewport, iPad-sized and phone-sized layouts in Chromium. Emulation is not real Windows, Safari/iPad or Android device testing.

`python3 tools/audit_question_bank.py --check` is read-only. Omit `--check` only when intentionally regenerating `QUESTION_BANK_AUDIT.md`. `python3 tools/audit_semantics.py` independently recomputes numeric/rotation answers; `--write-review` updates the per-question inventory. These checks do not replace factual or pedagogical review.

## Structure

- `src/`: shared layout, study engine, schema validation, progress and UI modules.
- `data/courses.json`: schema-2 original content, chapter assessments, editorial/source records and explicitly unreleased tracks.
- `practice.html`: preserved standalone V3 app and its existing storage key.
- `assets/`: original beacon illustration, no remote asset requests.
- `tests/`: Node unit tests and Python Playwright/axe browser tests.
- `scripts/`: link/syntax/content checks and static build.
- `.github/workflows/`: CI plus a separate manual Pages publication workflow.
- `docs/`: baseline audit, implementation milestones, data model, bank inventory and brand checks.

## Learner data

Progress is browser-local. The new platform reads and summarizes valid ASVAB history without replacing the original `asvab-prep-pro-v3` key. Backups are validated before merge. New-platform deletion leaves V3 data intact. Use the original app's Backup / Restore to transfer its history. There is no automatic cross-device sync. The platform storage key is retained while its envelope migrates from schema 1 to 2. Reading, existing active sessions and historical results are preserved; the expanded Algebra course requires fresh current-pool evidence. Keep exported files private and out of Git.

## Deployment and rollback

The baseline rollback commit is `1ec5deb3e99096610e20a3fce2b04dd14791d877`. Development is on `feat/aptitude-beacon-platform`; no production branch was reset or force-pushed. Preserve learner backups before any origin/path change because browser storage is origin-scoped.

For a reviewed release, set GitHub Pages source to **GitHub Actions**, then manually dispatch **Publish reviewed static site**, reviewing its stated limits. This workflow builds and tests before uploading `dist/` and deploying. Publication has not been performed or verified in this task. Avoid deploying the repository root: source/docs/test files are not the intended site artifact.

After an authorized deployment, verify the actual Pages URL, local asset paths, a lesson and assessment, progress persistence, legacy practice and backups from a clean browser context. Do not call local test success production verification.

No connected MSI filesystem was available. To update the Windows project after these commits are shared to GitHub, back up any local changes, check `git status`, fetch the development branch and merge/review it in `C:\Users\Ethan\Documents\ASVAB-Prep-Pro-V3`. Do not overwrite a non-Git folder or reset local work. If the folder is not a clone, use a separate reviewed clone and copy only known local contributions.

See [CONTRIBUTING.md](CONTRIBUTING.md) before modifying content or storage.

## Phase 2 curriculum milestone

See [docs/PHASE_2_MILESTONE.md](docs/PHASE_2_MILESTONE.md) for the bounded Algebra course and completion criteria. [docs/CURRICULUM_COVERAGE.md](docs/CURRICULUM_COVERAGE.md) and its review inventory are generated by `node scripts/curriculum-report.mjs --write`; the regular audit is read-only. Live availability checks use `npm run check:references`; the Phase 2 result was 3 reachable and 3 failed sources; the expanded Phase 3 audit has 14 reachable and 3 failed destinations. That command intentionally exits nonzero for failed references. It does not belong to the offline build gate and does not establish factual verification.

EPA certification administration and OSHA Outreach distinctions were reviewed with scoped dates. Credential courses remain in development; consult [docs/OFFICIAL_SOURCE_REVIEW.md](docs/OFFICIAL_SOURCE_REVIEW.md). The current branch and draft PR #1 remain unmerged and the public site remains unchanged.

## Phase 3 college flagship

[docs/PHASE_3_MILESTONE.md](docs/PHASE_3_MILESTONE.md) describes the 12-lesson college course and its practice standard. [docs/COLLEGE_SOURCE_REVIEW.md](docs/COLLEGE_SOURCE_REVIEW.md) records the scoped first-party textbook review and unavailable NIST alternatives. `npm run audit:college` recomputes modeled keys and parses printed choices independently in Python; it does not replace educator review. The revenue-first sprint now prioritizes ASVAB launch gates; college/trades expansion is deferred. This historical milestone is not a launch approval.

## ASVAB revenue-first development

See [sprint status](docs/ASVAB_REVENUE_SPRINT.md), [operator runbook](docs/BETA_OPERATIONS.md), [provider test plan](docs/PAYMENT_TEST_PLAN.md) and [release gates](RELEASE_READINESS.md). From this existing checkout, `npm run build` then `npm run dev:beta` serves the built site and optional API on loopback port 8001. It uses Node 24 built-ins and a 0600 SQLite file outside the repository. A plain static server still serves free learning but honestly disables email collection. GitHub Pages cannot host this API.

`npm run owner -- review` and the runbook's private export/invitation/backup/deletion commands operate on the same local database. Never expose the service via a tunnel, collect real requests, publish personal data, or put secrets/exports in this checkout. No mail is sent automatically. Stripe is off by default and requires secure test bindings for future sandbox tests. No live payment is supported. The separate hosted entry is prepared/tested in isolation and requires explicit configuration, hosting/budget/security approval and stage acceptance before deployment.

The first revenue sprint passed 62 Node tests, 6 Python checker tests and 30 browser tests. The current sprint passes 83 Node, 13 Python and 35 browser tests. V3's 540-question array is unchanged; active recovery is separate from its completed-progress key. Cloud copies are explicit merges, not automatic sync, and preserve V3 bytes. Independent human educational and security review, a private support channel, approved policies/hosting and actual provider/device acceptance remain mandatory before release.

## Revenue Sprint 2: study value and staged beta

[Feature matrix](docs/EXAM_PASS_FEATURES.md), [sprint evidence](docs/REVENUE_SPRINT_2.md), [hosting comparison/migration](docs/BETA_HOSTING.md) and [qualified-review workflow](review/README.md) describe the current work. `exam-pass.html` provides personalized calendars, weak-area guidance, a practice-evidence dashboard and guided existing-question sessions. Free ASVAB questions/modes/history stay free. No new questions or official score prediction was added.

`npm run review:asvab` validates 540 pending review records; `npm run release:content` intentionally fails until actual qualified independent signoff exists. Ordinary CI passing is not expert approval. `deployment/Dockerfile` and the unapplied Render example prepare one non-root Node service with persistent SQLite, HTTPS origin, default closed stage and no hosted payments. The image's isolated smoke uses no public networking or real customer data. See the hosting document before any build, cost commitment, provider change or deployment; current authorization permits none of those public actions.
