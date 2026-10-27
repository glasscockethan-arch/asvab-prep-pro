# Phase 2 milestone: Algebra I equations and linear models

Starting point: `cac7d7a`, on `feat/aptitude-beacon-platform`, draft PR #1. This milestone deliberately completes a bounded flagship learning experience rather than distributing shallow lessons across all planned subjects. It does not complete the full requested academies or authorize launch.

## Delivered scope

The existing `linear-equations` item is expanded in place. Its course ID, original three lesson IDs, all 12 original question IDs, bookmarks and read/history records remain supported.

1. Equations and models: one-step balance, two-step equations, context modeling.
2. Equivalent forms and inequalities: distribution, variables on both sides, inequalities and feasible ranges.
3. Linear graphs and decisions: coordinates, slope, cost models and domain/extrapolation limits.

The course has 9 sequenced lessons, 54 practice questions, 18 chapter-check questions and a 12-question cumulative final: 84 original questions total. The platform now has 24 lessons and 144 original questions across this course and five unchanged introductory units. The standalone ASVAB bank remains 540 items and was not rewritten in this milestone.

Content includes worked reasoning, objectives, recommended earlier lessons, counterexamples/misconception notes, flashcards and an accessible graph/table with keyboard-operable input. Estimates are rough self-paced estimates, not measured learning outcomes. The scope excludes systems, exponents, polynomials, quadratics and a complete school Algebra I syllabus.

## Course practice standard

Reading is separate from assessed practice. The course requires all nine lessons read, each topic's entire six-question practice pool answered with at least 80% latest accuracy, at least 80% on every complete six-question chapter check, and at least 80% on the complete 12-question final for content revision 2. A complete assessment must have the exact expected ID set; duplicates, partial pools or an older content revision cannot count. The best qualifying chapter/final attempt counts; topic evidence uses latest choices chronologically.

This is evidence on the provided practice material, not independent proof of mastery or a credential. Repeated assessments reuse the same questions. Former three-question results stay in history and cannot count as completing the expanded course. Reading and backups are retained; no new ASVAB-key migration occurs.

## Reliability and content management

- Catalog schema 2 with a tested schema-1 compatibility adapter; course/question revisions, skill IDs, source IDs and author-review trails.
- Storage schema 2 retains the existing platform key and adds local enrollment and assessment revision/chapter metadata. Version-1 state and active sessions migrate in memory without an immediate storage rewrite.
- A resumed former assessment retains content revision 1, rather than being mislabeled as a revision-2 result.
- Backup imports preserve newer reading timestamps and the earliest enrollment, reject conflicting session IDs and duplicate nested question IDs, and retain existing data on failure.
- Course evidence derives correctness from choices and current keys instead of trusting an imported Boolean. No cryptographic provenance or verified academic result is claimed.
- Prerequisite/membership validation, global question IDs, duplicate prompt detection, mathematical-model checks and generated coverage/review inventories.

## Content review

All material has development-author screening, not independent educator approval. Of the 84 Algebra questions, 54 have explicit arithmetic/equation models whose keys are recomputed by the validator. The remaining 30 include conceptual and inequality interpretation items requiring editorial checks. A model check cannot validate the interpretation of a word problem, the wording of a distractor or instructional sufficiency.

`docs/CURRICULUM_REVIEW.json` inventories every platform question; `docs/CURRICULUM_COVERAGE.md` records counts and 13 number-normalized near-duplicate groups for further review. No exact duplicate platform prompts were found. Numerical variants are not evidence of distinct educational depth by themselves.

## Remaining sequence

1. Independent educator review of the bounded Algebra course; improve any ambiguous wording, model interpretation or weak distractor before release.
2. Add systems, exponents and quadratics only with comparable instruction and review; do not rename the bounded foundations course as full Algebra I prematurely.
3. Expand College Algebra/Quantitative Literacy, Trade Math/Construction Fundamentals and AFQT preparation one coherent course at a time.
4. Develop EPA 608 preparation from the reviewed official topic categories, verifying detailed technical rules and regulatory currency before authoring assessments. General certification administration has been checked; the course itself is not written or approved.
5. Continue independent review of all 540 ASVAB explanations and answers; quantitative and shape checks alone are insufficient.

No merge, production publication, purchase, domain registration, advertising, cloud account or paid service belongs to this milestone.
