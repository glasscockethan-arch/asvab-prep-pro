# Aptitude Beacon implementation and launch gates

Baseline: `1ec5deb3e99096610e20a3fce2b04dd14791d877`. Development branch: `feat/aptitude-beacon-platform`. A verified archive of the original tracked site is retained outside the checkout at `/workspace/asvab-prep-pro-pre-platform.tar.gz`; the baseline commit is the portable rollback point. No learner storage is removed during migration.

## Milestones

1. Audit and preserve: inspect the live site where reachable, all local pages, storage, bank and deployment. Record baseline browser evidence and launch blockers.
2. Shared foundation: dependency-free ES modules, data contracts, resilient versioned browser storage, deterministic scoring, accessible purple/lavender design, static build and CI.
3. Learning workflow: catalog/search/filters, bounded introductory units, lesson navigation, practice/diagnostic/timed/review modes, explanations, bookmarks, flashcards, dashboard, goals, export/import and legacy preservation.
4. Validation and release record: unit and browser tests, accessibility checks, link/build checks, bank semantics, honest editorial status and owner gates.

## Architecture decision

Keep the existing standalone `practice.html` and `asvab-prep-pro-v3` key operational. Use browser ES modules and plain semantic HTML for the new platform. A framework migration does not improve this small static site's deployment enough to justify its dependencies. Build with Node's standard library; serve with Python. No server database, analytics, account system, API key or paid infrastructure.

## Content scope

Release individual introductory units only when they contain objectives, prerequisites, a syllabus, instruction, worked examples, practice explanations and assessment. These units are not full high school/college courses or credential exam preparation. Advanced requested tracks stay visibly in development until content and official references have been reviewed. Full expert review of the legacy question bank remains a launch gate.

## External prerequisites

- Initial requests to the live GitHub Pages site, EPA, OSHA, NCCER, ASE and official ASVAB site were denied by the environment's egress proxy (HTTP CONNECT 403). Domain additions are saved to the environment draft; saving alone does not apply them. Do not attach a false verification date to these sources.
- No connected MSI computer/filesystem capability is exposed. Do not infer access to `C:\Users\Ethan\Documents\ASVAB-Prep-Pro-V3` from the path alone. Git commits and documented clone/pull steps are the handoff.
- Do not publish an incomplete product. Verify deployment after an authorized publication is actually available.
