# Baseline audit

Audit date: October 25, 2026 (owner timezone). Commit: `1ec5deb3e99096610e20a3fce2b04dd14791d877`.

## Verified locally

- Static site, 15 HTML documents, no package manifest, build, CI or automated browser tests.
- All 19 referenced local page/asset URLs returned HTTP 200.
- Existing structural audit: 540 unique questions across nine subjects; zero structural failures; three repeated prompt groups.
- Chromium: completed a 45-question diagnostic across nine subjects with 100% score, persisted history across reload; initialized 90-question/90-minute and 40-question/40-minute modes; rendered spatial targets/options; scored a subject test at 95%, reviewed its one missed question and cleared the missed deck; exported valid JSON of three sessions; scored all three existing four-question quizzes; mobile home/practice pages fit a 390px viewport; zero JavaScript page errors in these flows.
- No runtime credentials, backend, payments, ads or tracking required.

## Gaps and defects

- New learning paths have four-question previews, not substantial complete courses. Homepage wording risks implying more depth than available.
- No reusable course model, topic assessment engine, search, saved lessons, goals, theme control or shared learner dashboard.
- Legacy restore accepts arrays without validating nested session details. Malformed backups can later crash rendering. Local storage errors are surfaced with alerts; no migration layer or cross-tab conflict handling.
- Monolithic HTML embeds 540 questions and all app logic. Keep it working while introducing tested modules alongside it.
- 120 quantitative questions largely reuse nine templates; 240 science/technical items reuse 120 glossary definitions forward and backward; 60 vocabulary items use short synonyms; 60 reading questions use 20 passages. Spatial distractors require independent rotation-equivalence checks. Structural validity is not educational correctness.
- Duplicate non-spatial prompts q0019/q0021 and q0050/q0058; q0138 calls resilient “adaptable,” an imprecise closest synonym; scientific definitions need scope qualifiers (e.g. eukaryotic nucleus).
- Accessibility: no systematic skip links, keyboard/focus/contrast checks or screen-reader evidence; timer/selection changes need checking.
- Policy text focuses on ASVAB, lacks platform-wide storage/deletion guidance and attribution. Public GitHub issues are the only support method; a private contact is not established.
- Canonical URLs, repeatable deployment and honest content status are missing.

## Not established

Live-site inspection is blocked by egress policy, not an observed production defect. No real iPad/Windows/mobile-device checks, screen-reader testing, independent expert answer review, legal compliance review, trademark clearance or deployment publication have occurred. No connected MSI project can be inspected with the available tools.
