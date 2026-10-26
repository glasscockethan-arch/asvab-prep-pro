# Aptitude Beacon

A free static learning platform with bounded Algebra I and College Algebra/Quantitative Literacy courses plus five introductory units, totaling 36 lessons and 256 original questions, plus the preserved 540-question ASVAB V3 application. No account, server database, subscription, advertising, analytics or runtime API key is required.

**This is not launch-ready.** See [RELEASE_READINESS.md](RELEASE_READINESS.md) for content, source-verification, accessibility and owner gates. The bounded courses state their scope; neither is a complete school-year or semester curriculum. Five other units remain introductions. No academic or professional credential is issued. The legacy bank remains subject to independent editorial review.

## Develop locally

Use Node 22 or newer (cloud validation uses Node 24), Python 3.12 and the existing checkout:

```sh
cd /workspace/asvab-prep-pro
npm ci --ignore-scripts
npm run dev
```

Use a static HTTP server for the new module-based platform. Opening the new homepage directly as a `file:` URL does not support loading the lesson JSON. The standalone `practice.html` remains usable offline in compatible browsers; iPad Files may render HTML as a preview.

## Validate and build

```sh
npm test
npm run test:math
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

[docs/PHASE_3_MILESTONE.md](docs/PHASE_3_MILESTONE.md) describes the 12-lesson college course and its practice standard. [docs/COLLEGE_SOURCE_REVIEW.md](docs/COLLEGE_SOURCE_REVIEW.md) records the scoped first-party textbook review and unavailable NIST alternatives. `npm run audit:college` recomputes modeled keys and parses printed choices independently in Python; it does not replace educator review. Trades/construction and AFQT flagship expansion remain the next coherent courses.
