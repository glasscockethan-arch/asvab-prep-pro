# Phase 3 milestone — College Algebra and Quantitative Literacy

Starting point: `a457f00`. Branch: `feat/aptitude-beacon-platform`. Draft PR #1 remains unmerged. This milestone completes the highest-priority new course before extending the trades and AFQT flagships.

## Course delivered

`college-quantitative` is an additive course with a recommended Algebra I foundation or equivalent knowledge. Existing courses, question IDs, bookmarks, enrollments and V3 storage are retained.

1. **Algebra, functions and graphs:** equations as constraints, a two-equation model, function notation/domain/composition, coordinate rates and intercepts.
2. **Powers and polynomial structure:** integer powers, reciprocal/sign conventions, scientific notation, polynomial operations, factoring and selected real quadratic solutions.
3. **Percentages, rates and formulas:** comparison bases, sequential/inverse percentage change, weighted averages, total-distance/total-time rates, unit conversions, rearranged formulas and dimensional estimates.
4. **Data, evidence and growth:** mean/median/range, frequency weighting, sampling versus assignment, causal limits, linear versus repeated proportional growth and a defensible recommendation.

The course has **12 lessons, 24 worked examples, 72 practice questions, four six-question chapter checks and a 16-question final: 112 original questions**. Every lesson has measurable objectives, earlier-lesson guidance, instructional explanation, worked reasoning, misconception feedback and a recall card. The graph has a numerical table and keyboard-operable input. All final lesson skills and chapter memberships are validated.

This is a substantial foundations bridge, not a complete semester algebra, precalculus, statistics or finance course. Its six-hour estimate is a rough self-paced estimate, not measured learning time or an award of credit. Systems, logarithms, trigonometry, general irrational quadratic solutions and statistical inference remain outside this course's completed scope.

## Practice evidence

Use the existing transparent standard: every lesson marked read; the full six-question practice pool for each topic answered with at least 80% latest accuracy; every complete chapter check and the complete current-revision final at least 80%. The best complete chapter/final attempt counts. The 16-question final requires at least 13 correct responses. Reading or a final score alone cannot complete the course.

The exact question-ID set, course ID and content revision must match the current assessment. Reused pools are practice, not fresh independent measurements. The result is not an official academic or professional credential and does not establish broad mastery.

## Accuracy checks

- Extend the JavaScript checker to integer powers, polynomial identities and real quadratic roots, with explicit limits and undefined-operation rejection.
- Validate printed numerical choices against their model values, including an explicit final-rounding instruction where used.
- Independently implement exact rational arithmetic in Python, plus a restricted parser for the printed polynomial choices and roots. No `eval` or arbitrary function execution is used.
- Recompute **84 modeled keys and their full printed choice sets**; derive **7 equation models directly from the printed equations**. The remaining 28 conceptual items and interpretation of every model still require editorial judgment.
- Include negative tests for corrupted keys, incorrect printed choices, ambiguous equivalent answers, unsafe parser inputs, omitted zero roots, rounding and missing final-skill coverage.

These are independent software implementations, not independent subject-expert review. They do not prove that every word problem was modeled appropriately, every distractor is plausible, every explanation is optimal or every learner will master the subject.

## Preservation and reliability

No new storage schema or forced migration is introduced. Schema-1 and schema-2 compatibility remains, using the existing platform key. A fixture records every Phase 2 course, lesson and question identity. A browser test completes all 112 course questions, exports the resulting record and merges it into a browser containing earlier Algebra I reading/bookmarks and ASVAB V3 data. Earlier records survive, the new course remains complete and V3 bytes remain unchanged.

Additional browser tests exercise timed-topic recovery, final/partial completion boundaries, recommended prerequisites, source disclosure and graph input. The existing regression suite remains. Accessibility checks identified and led to fixes for lesson-link touch targets and SVG title/description separation; assertions were retained.

## Next coherent courses

- **Skilled Trades Mathematics and Construction Foundations:** expand the existing measurement introduction with fractions, ratios, scaled drawings, areas/volumes and numerical planning. Keep work conceptual and distinguish it from certified training or professional design.
- **AFQT preparation:** build a coherent four-subject course and continue factual/editorial review of the preserved 540-item bank. Do not describe its existing structural/numeric checks as a full review of every explanation.

Both remain unfinished in this milestone. Credential-specific pathways remain in development. No merge, production publication, domain purchase, advertising, analytics or paid infrastructure was introduced.
