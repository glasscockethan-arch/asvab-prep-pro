# Content and progress contracts — schema 2

`data/courses.json` is the original authored source. Schema 2 includes courses, chapters, question metadata, source records and explicitly unreleased tracks. `src/engine.js` validates it; `src/curriculum.js:normalizeCatalog` retains a schema-1 compatibility adapter. The original v1 dataset is preserved in `tests/fixtures/catalog-v1.json`, so baseline regression checks remain meaningful.

## Course scope and review

A course supplies audience, prerequisites, objectives, ordered lessons, estimated time, content revision, completion standard, editorial history and source IDs. Lessons have objectives, earlier-lesson prerequisite IDs, original explanatory paragraphs, worked examples, practice and flashcards. Chapters reference existing lessons exactly once and have separate checks. The course final uses a separate ID pool.

Every platform question has a stable ID, revision, skill ID, difficulty, four distinct options, answer index, correct-answer explanation, misconception note, source IDs and review history. `introductory`, `application` and `challenge` are author difficulty labels, not calibrated exam difficulty. All review records currently identify author screening; no independent educator approval is fabricated.

The bounded Algebra course has 9 lessons, 54 practice questions, 18 chapter questions and 12 final questions. The other five units remain short introductory activities. Full curricula and credential tracks remain unfinished. Question counts do not measure depth.

Sources distinguish `accessedOn` from `verifiedOn` and state their reviewed scope. HTTP success does not substantively verify content. Original mathematical derivations can have no external citation; an inaccessible textbook landing page is not represented as a reviewed textbook. Detailed EPA/OSHA findings and failed NCCER/ASE/ASVAB references are recorded separately.

`npm run audit:curriculum` validates shape, prerequisites, global IDs, review/source references, exact duplicates and mathematical-key models; number-normalized near duplicates are review signals. `node scripts/curriculum-report.mjs --write` updates the coverage/review inventories intentionally. `npm run check:references` checks live availability and can fail for unresolved references; it never silently sets verification dates. Mathematical models are original specifications, not independent expert reviews of wording or pedagogy.

## Study and completion

Study and timed modes use topic/difficulty filters and random question order. Diagnostic selection spreads six questions across the lesson sequence. Chapter mode uses the selected full chapter pool; final mode uses the full final pool. Those defined modes ignore topic/difficulty filters. Timed practice retains its absolute ten-minute deadline on reload. Study shows explanations after each answer; other modes show them after submission. Unanswered items are incorrect.

For the expanded course, the standard requires all lessons read, the full practice pool for every topic answered with at least 80% latest accuracy, at least 80% on each complete chapter assessment and at least 80% on the complete final. Best complete chapter/final attempts on the current content revision count. Exact expected ID coverage prevents a tiny old assessment or duplicated response from qualifying. Topic evidence recomputes from choices and current keys in chronological order, not an imported correctness flag.

For the five original introductory units, reading plus their small final remains an activity record. Neither type establishes broad mastery, school credit, licensing or certification. Repeated attempts reuse questions, so they are practice rather than fresh independent measurements.

## Storage, migration and backups

The storage **key remains** `aptitude-beacon-v1`; the **envelope schema is 2**. It includes reading timestamps, saved units, local enrollment timestamps, attempts, goals, optional active session and optional validated legacy history. Enrollment is local interest tracking, not a school/course-provider registration. Attempts and active sessions can retain chapter IDs and content revisions.

Schema-1 data migrates in memory with empty enrollments, preserving existing readings, bookmarks, attempts and active sessions. Reading or loading does not immediately rewrite the old bytes. On a later explicit save, the validated schema-2 envelope is persisted. A resumed old session without revision metadata finishes as content revision 1; it cannot be relabeled as evidence for the expanded revision-2 course.

Imports validate before mutation. V1/V2 new-platform backups and valid ASVAB V3 backups are supported; unknown versions, non-object JSON, duplicate nested records and conflicting attempt IDs are rejected. Merges retain newer read timestamps, earliest enrollment, bookmarks and complete history. A conflicting attempt cannot silently replace a different current record. Current active sessions are retained rather than overwritten by an imported one. Imports do not establish educational provenance.

`asvab-prep-pro-v3` is read but never replaced by new-platform migration or deletion. Original diagrams survive validated legacy export. Use the original app's own confirmed restore to transfer its actual history. Corrupt data is preserved with recovery controls; quota failures warn that state remains in memory. Cross-tab writes disable the stale tab pending reload.

Backups can reveal interests and should remain private. Browser eviction and clearing site data remain risks; there is no automatic sync or server database. New-platform deletion leaves V3 and theme data intact.

## Maintainer workflow

Keep IDs stable and append review history when meaning changes. A revised assessment pool needs a content-revision change and compatibility tests. Verify measurable objectives and prerequisites, not only JSON structure. Keep regulated/technical material bounded by its reviewed references. Run unit tests, both bank/curriculum audits, the build and browser tests; update release evidence. Independent review, actual-device/assistive-technology checks and owner launch gates remain separate.
