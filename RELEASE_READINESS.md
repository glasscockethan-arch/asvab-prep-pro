# Release readiness — development milestone, not public launch approval

Reviewed October 25, 2026 (America/Chicago). Baseline: `1ec5deb3e99096610e20a3fce2b04dd14791d877`. Branch: `feat/aptitude-beacon-platform`.

**Public launch gate: blocked.** A working development environment and tested platform foundation are available. The requested complete curriculum, independent educational review and production verification are not complete. No advertising, paid infrastructure or purchases were activated.

## Implemented

- Shared semantic layout and purple/lavender design, original vector illustration, responsive catalog, live search and pathway filters, course overviews, lesson navigation and visible in-development tracks.
- Six bounded introductory units, 18 original lessons, worked examples, objectives, prerequisites, practice explanations, flashcards and 72 original questions (54 lesson-practice plus 18 held-out assessment items).
- Reusable study, six-question diagnostic, topic practice, two difficulty labels, randomized question order, ten-minute timed practice, final assessment and missed-question review modes.
- Dashboard, saved units, read-progress indicators, small-unit completion records, practice history, daily/rolling-seven-day goals, activity streaks and deterministic recommendations.
- Versioned local data, active-session recovery with absolute timer deadlines, validated backup merging, recovery download, deletion controls, cross-tab conflict protection and storage-failure warnings.
- Original ASVAB app, key and backup format preserved; original baseline recoverable by commit. New platform reads V3 history without replacing it. Legacy backup validation now rejects malformed nested history and unsafe diagrams before replacement.
- ASVAB improvements: two exact duplicate non-spatial prompts replaced, selected definitions clarified, 12 reversed-glossary items replaced with applications and reading distractors made relevant to their passages. Question count and stable IDs preserved.
- Shared policy/reference pages, no unsupported credential claims, honest source-access status and browser-data deletion/export guidance.
- Dependency-free runtime modules, repeatable static build, schema/syntax/link checks, automated CI and a separate manual Pages workflow. No publication was performed.

## Validation evidence

| Check | Result |
|---|---|
| Node unit tests | 16 passed, 0 failed, 0 skipped |
| Python Playwright browser tests | 12 passed, 0 failed, 0 skipped; final full run 20.6 seconds |
| New unit content schema | 6 units, 18 lessons, 72 questions validated |
| ASVAB structural audit | 540 questions, 540 unique IDs, 9 subjects, 0 structural failures |
| Independent quantitative recomputation | 128 keyed answers checked, 0 failures |
| Independent rotation equivalence | All 60 spatial keys checked; exactly one rotation-equivalent choice each; 0 failures |
| Static checks | 18 HTML pages, 156 static local links, inline/module syntax passed |
| Build | Passed; generated `dist/` with application assets only |
| Dependency security | `npm audit --audit-level=moderate`: 0 reported vulnerabilities |
| Accessibility | axe-core 4.11.0 WCAG A/AA scans: no violations on 9 representative new/static screens in light and dark themes; full scan on an active new assessment passed |
| Responsive/keyboard | No horizontal overflow across 9 screens at 1440×1000, 768×1024 and 390×844; skip-link keyboard activation tested |
| Browser privacy smoke | No unexpected external requests and no JavaScript page errors during the 12 browser tests |
| Git checks | Reviewed changes and whitespace checks; commits retained on development branch |

The final browser suite ran against the built artifact under `/asvab-prep-pro/`, with isolated learner storage. It covers catalog/empty/error states, all six assessments, lesson read/bookmark/completion, flashcards, dark-mode persistence, scoring, missed review, absolute timer expiry after refresh, new/legacy backups, malformed input, unreadable storage, cross-tab changes, deletion isolation, old diagnostic and all three legacy preview quizzes. The first browser run exposed and led to a search fix; its backup-dialog test also needed to wait for the asynchronous validation result. The final run passed all 12.

Additional local scans of the legacy dashboard, three preview quizzes and arithmetic guide found no WCAG-tagged violations. These are automated checks, not a WCAG 2.2 AA conformance certification. Real assistive-technology testing and all interactive states remain outstanding.

## Content coverage and editorial status

| Academy | Available | Explicitly unreleased |
|---|---|---|
| High school | Linear equations; reading evidence (2 introductory units) | Algebra II, geometry, grammar/writing, biology, chemistry, physics, study skills/full courses |
| College | Introductory statistics; research literacy (2 introductory units) | Full college algebra/precalculus, academic writing, science refreshers, critical thinking and time-management courses |
| Trades | Trade measurement; ideal electrical paper models (2 introductory units) | EPA 608, NCCER Core, OSHA awareness, welding, automotive/ASE, full blueprint/tool and apprenticeship pathways |
| Military | Preserved 540-question V3 app and 4 static AFQT guides | Complete independent answer/source review, richer difficulty calibration and all-subject guide expansion |

The new units have author review only; no independent educator or subject-expert approval is claimed. Three-question assessments are small practice checks, not sufficient evidence of broad mastery. Unit completion is an activity record, not a credential. Estimated times are rough self-paced estimates, not measured outcomes.

`docs/QUESTION_REVIEW.csv` inventories all 540 legacy items. 188 have independent numeric/geometry key checks; the other 352 have author screening with source/editorial review pending. All explanations, factual nuances, distractors and educational value still require independent review. Ten number-normalized prompt groups remain repeated; reversed glossary concepts and shared reading passages also reduce variety. The single exact repeated prompt group is the graphical instruction shared across spatial items. Do not treat structural success as factual verification.

## Exact blockers to broad public launch

1. Independently review every released lesson and answer. Complete factual/source review of the legacy bank, improve remaining templates/distractors and verify explanations. Do not claim the full curricula requested are complete.
2. Apply the saved environment domain additions and successfully review current EPA, OSHA, NCCER, ASE and official ASVAB information before releasing credential-specific preparation. Initial CONNECT requests were denied by egress policy. Access attempts are recorded without fabricated verification dates. Jurisdiction/state licensing rules have not been researched.
3. Establish a verified private support channel and have the owner review privacy, terms, minors-related obligations, copyright and operator/jurisdiction details. Public GitHub issues are not a private support channel.
4. Test on actual Windows desktop browsers, iPad Safari and Android/iPhone, plus screen readers and keyboard-only primary flows. Current device sizes are Chromium emulation only. Advanced zoom/reflow, all error states, more contrast/focus scenarios and manual assistive-technology checks remain.
5. Review and merge the development branch, configure GitHub Pages to deploy the built artifact, authorize the intended release, then verify the real deployed URLs, data paths, persistence and backups. Local artifact validation does not establish production deployment. The live site was initially inaccessible through the environment proxy.

## Known limitations and technical debt

- No login, backend, automatic cross-device sync or offline caching for the new modules. A static HTTP server is required; `file:` loading of the new homepage is unsupported. The original app remains self-contained offline.
- The original V3 app still contains embedded styles/data/logic. Migration is additive; full extraction awaits further regression coverage and a separate compatibility review.
- Source/lesson content is mostly client rendered. Routes use query strings; clean static per-lesson pages and richer prerendering are future SEO work. No fabricated structured data was added.
- Storage quotas can prevent persistence. Recovery/export controls are supplied, but browser eviction cannot be prevented. Repeated assessment uses the same small held-out pool after its first exposure.
- Backup import validates shape and merges data; it does not provide cryptographic provenance or establish an independently verified educational result.
- CI and manual Pages workflow files were created and inspected; hosted GitHub Actions execution has not been observed.
- No MSI/Windows connector or local Windows path is accessible here. README documents a non-destructive handoff; no MSI sync is claimed.
- No exhaustive penetration test, comprehensive dependency supply-chain review, legal review or accreditation is claimed. Runtime introduces no package dependency, secret, tracking or external service.

## Exact blockers to future monetization

All public-launch blockers above, plus brand/trademark due diligence, a suitable operator/payment/tax/age review, current provider eligibility/policy review and any required consent/privacy implementation. See `docs/BRAND_AND_MONETIZATION.md`. No trademark clearance, domain ownership, AdSense acceptance or revenue is claimed. Potential future ad locations are documentation only, outside assessments.

## Environment and delivery

The existing cloud checkout, Node 24, Python 3.12, pinned axe-core and preinstalled Playwright/Chromium support development and local validation. Installation/start instructions and domain additions are saved to the onboarding draft for review. A draft save does not apply network changes or publish the snapshot. No fresh-task restoration, production publication, remote push or MSI synchronization is established by this report.
