# Contributing

Use the existing checkout and a development branch. Cloud tasks are already isolated; create a worktree only when requested. Start with `README.md`, `RELEASE_READINESS.md` and `docs/CONTENT_MODEL.md`.

Keep the original ASVAB app operational. Never clear real learner storage to debug; use a fresh browser context. Preserve `asvab-prep-pro-v3`, question IDs and backup compatibility. Add a migration and regression test before changing progress schemas. Do not use browser code for secrets.

Write original instructional content with worked reasoning and plausible distractors. Do not copy proprietary exam questions. Cite current official requirements with actual verification dates; keep unverified credential tracks in development. Passing a small practice quiz is not a professional qualification.

Use semantic HTML, keyboard-operable controls, visible focus, readable contrast, descriptive labels and reduced-motion support. No external fonts, trackers, analytics, paid service or advertising without explicit owner authorization.

Run `npm ci --ignore-scripts`, `npm test`, `npm run check`, `npm run audit:bank`, `npm run audit:curriculum`, `npm run build` and `npm run test:e2e`. Include the evidence and limitations in your change description. Browser tests use isolated storage and the built site under `/asvab-prep-pro/`.

Commits should form coherent milestones. A manual Pages workflow is provided; do not publish an unfinished product by accident. Review release blockers before requesting public release.

Preserve the v1 content fixture as a compatibility test. For new content, use schema 2 review/source/skill metadata and keep prior question IDs. Course completion needs current full-pool evidence; do not replace it with a tiny score or count of read pages. Live source checks and independent educator review are separate from mathematical-model checks.
