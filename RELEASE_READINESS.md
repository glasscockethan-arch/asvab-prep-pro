# Release readiness — Phase 3 college flagship milestone

Review session: October 25, 2026 (America/Chicago). Branch: `feat/aptitude-beacon-platform`. Draft PR: https://github.com/glasscockethan-arch/asvab-prep-pro/pull/1. Phase 3 starting point: `a457f00`. Original rollback baseline: `1ec5deb3e99096610e20a3fce2b04dd14791d877`.

**Public launch remains blocked.** The prioritized College Algebra and Quantitative Literacy course is implemented and locally validated. The trades/construction and AFQT flagships remain next, alongside independent educational review and the owner/device/source gates below. Do not merge or deploy this draft.

## Completed implementation

- **College Algebra and Quantitative Literacy** (`college-quantitative`): 12 sequenced lessons in 4 chapters; 24 worked examples; 72 lesson-practice questions; 24 chapter questions; a 16-question cumulative final — **112 original questions**.
- Topics: equations and a two-equation model; functions/domain/composition; graphs and rates; integer powers; polynomials; factoring and selected real quadratic solutions; percentage bases and sequential changes; weighted rates; formulas/units/estimation; descriptive statistics; evidence/sampling; compound-growth models with explicit assumptions.
- Every lesson has objectives, earlier-lesson guidance, explanatory instruction, two worked examples, practice explanations, misconception feedback and a recall card. The graph includes a table and keyboard input. Recommended Algebra I preparation links to the existing course without imposing an enrollment lock.
- Preserve the Phase 2 Algebra I course (9 lessons, 84 questions) and all five introductory units. **Platform totals: 7 learning items, 36 lessons, 256 original questions.** The separate **540-question ASVAB V3 app is unchanged in this phase**.
- Reuse enrollment, bookmarks, dashboards, goals, study/timed/review modes, chapter navigation and transparent completion criteria. The new college course appears on the homepage and in search.
- Require complete topic pools, reading, every chapter check and the final at the declared 80% standard. The 16-question final needs at least 13 correct. Exact IDs/course/revision must match; the final alone cannot complete the course. This is practice evidence, not a credential or broad mastery guarantee.
- Extend mathematical validation to bounded integer powers, polynomial identities, real quadratic roots, printed numeric options and explicit final rounding. Add a separate exact-arithmetic and printed-expression audit in Python.
- Improve additional-example rendering, prerequisite/source disclosure, lesson navigation touch targets and SVG name/description separation. Keep the assertions that identified the accessibility issues.
- Preserve every Phase 2 course, lesson and question identity, existing V1/V2 progress support and the V3 key. No new storage schema or forced migration is required.

## Verified automated checks

| Check | Result |
|---|---|
| Node unit/compatibility tests | **38 passed**, 0 failed, 0 skipped; includes the previous 28 checks plus college coverage |
| Independent Python checker tests | **6 passed**, 0 failed; exact arithmetic, printed choices, parser restrictions, rounding and root retention |
| Browser suite | **20 passed**, 0 failed, 0 skipped; final full run 53.8 seconds |
| Independent college mathematics audit | **84/112 modeled keys and complete printed choice sets checked**, 7 equation models derived from printed equations; 0 failures |
| Catalog/model gate | All 7 items and 256 question IDs/metadata validated; 138 mathematical models across the platform checked in JavaScript |
| Duplicate detection | 0 exact platform prompt duplicates; **17 number-normalized near-duplicate groups** retained as review signals |
| ASVAB baseline | 540 structural checks, 128 numeric keys and 60 spatial keys passed; no full factual/explanation review claimed |
| Static validation/build | 18 HTML pages, 156 static local links, syntax/schema checks and `dist/` build passed |
| Dependency audit | `npm audit --audit-level=moderate`: 0 reported vulnerabilities; no npm runtime dependency added |
| Responsive/accessibility | Representative screens at 1440×1000, 768×1024 and 390×844; axe scans in both themes and keyboard graph/navigation checks passed |
| Browser privacy/error checks | No unexpected external app requests or JavaScript page errors in the suite |
| Live reference availability | **14/17 reachable; 3 failed; audit exits nonzero** for NCCER 404, ASE 403 and official ASVAB 403 |

The built artifact is served under `/asvab-prep-pro/` during browser tests. New coverage completes the entire 112-question course, verifies that reading/final alone are insufficient, exports/merges the completed record into a browser with older reading/bookmarks and V3 data, preserves V3 bytes, and checks timed-topic recovery and source disclosure. All existing functional flows remain covered with isolated storage. Real learner data was not cleared.

The first browser run identified a target-size violation and a graph-name assertion exposing title/description concatenation. Both were corrected, and the full suite was rerun successfully. No assertions were disabled. The independent parser initially needed explicit support for conventional number-before-parenthesis multiplication; its restricted grammar was corrected and tested.

Local evidence and hosted CI are separate. Phase 2 hosted CI passed. This phase adds the six Python checker tests to both validation and the still-manual publication workflow; hosted results for the pushed head are verified and reported during handoff on PR #1. No production publication is authorized or implied by CI success.

## Course and review scope

The college course is a substantial foundations bridge, not a complete semester algebra, precalculus, statistics or finance course. General systems, logarithms, trigonometry, arbitrary irrational quadratic solutions and statistical inference remain beyond its completed scope. Its six-hour estimate is a rough self-paced estimate, not a measured outcome or credit award.

All new content is **development-author screened, not independently expert-reviewed**. The Python implementation recomputes 84 modeled questions and parses their actual printed choices; the other 28 conceptual items, every model interpretation, distractor and explanation still require independent educational review. Two implementations agreeing do not establish complete pedagogical accuracy.

`docs/CURRICULUM_COVERAGE.md` and `docs/CURRICULUM_REVIEW.json` inventory all 256 platform questions. `docs/QUESTION_REVIEW.csv` retains the 540-item ASVAB inventory. Near-duplicate signals remain visible; numerical variants are not treated as proof of distinct educational depth.

## Sources verified and unavailable

Eleven substantive first-party sections from OpenStax College Algebra 2e and Introductory Statistics 2e were retrieved and read for the stated formal-method scope. Actual access/review-session dates, source IDs, review limitations and retrieval hashes are stored in `data/courses.json`. See `docs/COLLEGE_SOURCE_REVIEW.md`. These section responses contain substantive text, unlike the earlier Elementary Algebra landing-page shell. No textbook text, illustration or exam question was copied into the new course.

NIST alternatives returned 403 and are not marked verified or used as dependencies. The existing scoped EPA certification-administration and OSHA Outreach review remains recorded; detailed technical/state rules and the credential courses remain unfinished. NCCER Core still returns 404, and ASE/official ASVAB endpoints return 403. Successful HTTP responses alone never establish factual verification.

## Remaining curriculum work

| Area | Current bounded work | Still unfinished |
|---|---|---|
| High school | Algebra I equations/inequalities/linear-models course; reading introduction | Full school-year Algebra I, systems/exponents/quadratics expansion, geometry, writing and science curricula |
| College | New 12-lesson algebra/quantitative course; statistics and research mini-units | Full semester depth, precalculus/logarithms/trigonometry, academic writing and broader science courses |
| Trades | Measurement and ideal electrical-paper-model introductions | **Trades Mathematics and Construction Foundations flagship**, plus all certification pathways |
| Military | Preserved 540-item V3 application and four AFQT guides | **Coherent AFQT flagship** and independent review/improvement of every answer, explanation and distractor |

This phase deliberately finishes the highest-priority course rather than distributing shallow material across the remaining academies. The next course should be trades/construction, followed by the four-subject AFQT course and continued bank review.

## Exact public-launch blockers

1. Independent educator/subject-expert review of every available lesson, key and explanation, including all ASVAB items. Resolve material inaccuracies, ambiguity and weak/repetitive distractors before broad launch.
2. Finish and validate a deliberate launch curriculum. Trades/construction and AFQT remain incomplete; keep every unfinished certification pathway in development.
3. For credential-specific material, verify current detailed regulations, official domain requirements, authorized-provider/testing distinctions and state licensing applicability. Scoped EPA/OSHA administration review is not a completed preparation course. Resolve unavailable references before relying on them.
4. Establish a verified private support channel and complete owner/operator, privacy/minors-related, jurisdiction/legal and brand due-diligence review. No legal-compliance or trademark-clearance assurance is made.
5. Conduct actual Windows, iPad Safari, iPhone/Android and assistive-technology testing, including broader zoom/reflow/focus/error states. Chromium viewport emulation and axe scans do not certify real-device behavior or WCAG conformance.
6. Separately authorize a future release, review the build/hosted checks, deploy only the intended artifact and verify the actual live primary flows, persistence and backups. This task authorizes no merge or production deployment.

## Known limitations and preserved constraints

- Repeated assessments reuse finite pools; course practice evidence is not independently verified mastery, credit, licensure or certification.
- Browser eviction/quota can still lose unsaved data. Backups are editable activity records, not cryptographically verified academic results. No account backend, paid infrastructure, automatic sync or new-platform offline cache is added.
- The existing `aptitude-beacon-v1` key retains a schema-2 envelope, with explicit schema-1 compatibility. The new course is additive. Unknown backup versions remain rejected.
- V3 remains monolithic and unchanged in this phase. Its original 540 IDs and storage compatibility are preserved; broader AFQT work remains next.
- Content is mostly client-rendered with query routes. Current content JSON is about **478 KB uncompressed**; local gzip measurement is about **69 KB**, not a production/CDN performance benchmark. Richer prerendering, chunking and production performance measurement remain future work.
- No connected MSI/Windows filesystem is available; no synchronization is claimed.

No merge, live-site replacement, purchase, domain registration, advertising, analytics or paid service was performed. `MONETIZATION_READINESS.md` remains blocked on these release gates and the separate operator/brand/provider requirements.
