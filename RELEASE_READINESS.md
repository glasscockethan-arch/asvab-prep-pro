# Release readiness — Phase 2 development milestone

Reviewed October 25, 2026 (America/Chicago). Development branch: `feat/aptitude-beacon-platform`. Draft PR: https://github.com/glasscockethan-arch/asvab-prep-pro/pull/1. Original rollback baseline: `1ec5deb3e99096610e20a3fce2b04dd14791d877`; Phase 1 milestone: `cac7d7a`.

**Public launch remains blocked.** The bounded Algebra I learning experience is implemented and locally validated. The complete requested academies, independent educational review and production verification are unfinished. Do not merge or deploy this draft. No purchase, domain registration, ads, tracking, cloud accounts or paid services were added.

## Current implementation

- Expanded the existing `linear-equations` item in place into **Algebra I foundations: equations and linear models**, content revision 2: 3 chapters, 9 sequenced lessons, 54 practice questions, 18 chapter-check questions and a 12-question cumulative final.
- Preserved the original course ID, three lesson IDs and all 12 question IDs. Older history, bookmarks and read flags remain usable. An old three-question result is retained but cannot complete the expanded course.
- Platform totals: **24 lessons and 144 original questions**, across the bounded Algebra course and five introductory units. The standalone ASVAB app remains **540 questions**, with stable IDs and its existing storage key; it was not rewritten in Phase 2.
- Added local course enrollment, chapter navigation, explicit reading/practice distinction, topic evidence, course completion summary, actionable recommendations and an accessible graph/table with keyboard-operable input.
- Course practice standard requires all lessons read, each full topic pool answered with at least 80% latest accuracy, every complete chapter check and the complete final at least 80% for the current content revision. This is evidence on these materials, not broad mastery or an official credential. Repeated attempts reuse the same pools.
- Catalog schema 2, compatible schema-1 adapter, course/question review trails, source and skill IDs, prerequisite validation, deterministic mathematical-key models, duplicate detection and generated review/coverage inventories.
- Storage schema 2 retains the existing platform key. Version-1 state/backups and active sessions migrate without immediate rewriting. Conflicting attempt IDs and duplicate nested records are rejected, newer reading is preserved and valid old active sessions retain their original content revision.
- Preserved the Phase 1 catalog, themes, study/timed/diagnostic/review modes, flashcards, goals/streaks, safe backups, ASVAB integration, privacy controls, shared layout, static build, CI and manually dispatched Pages workflow.

## Automated validation

| Check | Result |
|---|---|
| Node tests | **28 passed**, 0 failed, 0 skipped; includes the original 16 checks with the original v1 catalog retained as a compatibility fixture |
| Browser suite | **16 passed**, 0 failed, 0 skipped; latest full run 32.1 seconds |
| Curriculum gate | 24 lessons, 144 platform questions, all course/question IDs/review/source references validated |
| Algebra mathematical models | **54 of 84** question keys recomputed, 0 failures; remaining conceptual/inequality interpretations require editorial review |
| Duplicate detection | 0 exact platform prompt duplicates; 13 number-normalized near-duplicate groups recorded for review |
| ASVAB structure | 540 questions, 9 subjects, 540 unique IDs, 0 structural failures |
| ASVAB semantic baseline | 128 quantitative keys and all 60 spatial keys recomputed, 0 failures; this does not verify all factual answers/explanations |
| Static validation/build | 18 HTML pages, 156 static local links, JavaScript syntax and `dist/` build passed |
| Dependency audit | `npm audit --audit-level=moderate`: 0 reported vulnerabilities; no npm runtime dependency |
| Accessibility/responsive | axe scans in light/dark themes, keyboard skip-link and graph controls; no overflow at 1440×1000, 768×1024 and 390×844 on representative screens |
| Network/privacy smoke | No unexpected external app requests or JavaScript page errors during browser tests |
| Live reference availability | **3 reachable, 3 failed; command exits nonzero**. NCCER 404, ASE 403 and official ASVAB 403 remain unresolved |

The browser suite tests the built artifact beneath `/asvab-prep-pro/`, including all six final assessments, all three new chapter checks, the entire Algebra practice-standard completion flow, v1 unfinished-assessment migration, ASVAB V3 preservation, conflicting backup rejection, timer recovery, enrollment, graph interaction and legacy preview quizzes. It uses fresh isolated storage; no real learner storage was cleared.

Automated accessibility scans are not WCAG conformance certification. Viewport emulation in Chromium is not actual Windows, iPad Safari, iPhone or Android hardware testing. Hosted GitHub Actions execution and production deployment are distinct from the local evidence above.

## Coverage and review status

| Area | Available in development | Remaining |
|---|---|---|
| High school | Bounded Algebra equations/inequalities/linear-graphs course; introductory reading-evidence unit | Full Algebra I, systems, exponents, quadratics, Algebra II, geometry, grammar/writing and science courses |
| College | Introductory statistics and research-literacy units | Substantial college algebra/quantitative literacy, precalculus, academic writing, critical thinking, biology/chemistry and study-skills courses |
| Trades | Introductory measurement and ideal electrical paper models; scoped EPA/OSHA reference review | Complete trade-math/construction flagship, EPA preparation course and other credential pathways; detailed technical and state requirements |
| Military | Preserved 540-question V3 application and four AFQT guides | Independent review of every answer/explanation, remaining template/distractor improvements, difficulty calibration and full AFQT flagship |

All platform instruction remains **author-screened, not independently educator-reviewed**. `docs/CURRICULUM_REVIEW.json` inventories every platform question; `docs/CURRICULUM_COVERAGE.md` records quantitative and duplicate checks. `docs/QUESTION_REVIEW.csv` inventories every legacy ASVAB question. No independent subject-expert approval is claimed for either bank.

The Algebra course is bounded, not a full school-year Algebra I curriculum. Its separate assessment pools improve the evidence compared with the previous three-question check, but they remain finite practice pools. Mathematical models validate the key against the authored model, not the word-problem interpretation, all distractors, explanations or educational sufficiency.

## Official source verification

On October 25, 2026, the EPA certification-requirements and test-topics pages and OSHA Outreach page were successfully retrieved and read. Verified scope is limited to EPA certification administration/types, the proctored Core distinction for Universal, the published topic-category structure, and OSHA Outreach's program/card/training distinctions. The pages do not approve Aptitude Beacon or verify a course that has not been written.

NCCER's saved Core URL returned 404; ASE and official ASVAB endpoints returned 403. OpenStax's algebra landing page returned a JavaScript shell: reachability is recorded, without substantive textbook verification. No date is fabricated for unreviewed content. See `docs/OFFICIAL_SOURCE_REVIEW.md` and the scoped records in `data/courses.json`.

## Exact launch blockers

1. Independent educator/subject-expert review of every released lesson, answer and explanation, including all ASVAB items. Resolve material inaccuracies, weak distractors and repetitive templates before broad launch.
2. Complete a deliberate release scope; the full requested curricula are not implemented. Keep unfinished subjects and all credential preparation explicitly in development.
3. Before credential-specific release, verify detailed current regulations, exam-domain coverage, provider requirements and state-specific licensing applicability. EPA/OSHA administrative review is a starting point, not a completed preparation course. Resolve the failed references.
4. Establish a verified private support channel and complete owner/operator, legal/privacy, minors-related, jurisdiction and brand/trademark review. No legal-compliance or trademark-clearance claim is made.
5. Conduct actual desktop/mobile/iPad and assistive-technology testing, including expanded reflow/zoom/focus/error-state checks. Current automation does not establish hardware compatibility or full WCAG 2.2 AA conformance.
6. Separately authorize any eventual release, review hosted CI, configure Pages to deploy only the built artifact, and verify the real deployed primary flows and backups. No merge or production publication is authorized in this milestone.

## Known limitations

- No automatic cross-device sync, account backend or new-platform offline cache. New modules need HTTP/HTTPS; `practice.html` remains standalone.
- Browser quota/eviction can still lose unsaved data; export remains necessary. Backups are locally editable activity records, not cryptographically verified academic results.
- Existing platform storage key remains `aptitude-beacon-v1` while its envelope is schema 2. Forward/older backups are supported only by explicit adapters; unknown versions are rejected.
- The V3 application remains monolithic. Full extraction, comprehensive factual review and advanced ASVAB/AFQT features remain future milestones.
- Most content is client-rendered with query routes. Richer prerendering, cleaner lesson URLs and wider performance measurement remain SEO work.
- New content JSON is about 240 KB uncompressed, including review metadata. No production transport/performance benchmark is claimed.
- No connected MSI/Windows filesystem is available; no Windows-project synchronization is claimed.

## Monetization and delivery

Public launch blockers also block a monetization-ready claim. Additional brand, operator/payment/tax/age and current advertising-policy checks remain. No ad placement is active. See `MONETIZATION_READINESS.md` and `docs/BRAND_AND_MONETIZATION.md`.

Changes belong only on `feat/aptitude-beacon-platform` and draft PR #1. `main`, the live Pages site and V3 learner storage must remain unchanged. Push/PR verification is reported separately after the commits are made; local tests do not establish remote delivery or snapshot publication.
