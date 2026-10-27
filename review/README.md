# Qualified independent ASVAB review workflow

**Current state: 540 pending items, zero registered reviewers and zero human approvals.** No reviewer has been contacted, engaged, paid, qualified or represented as approving this work. The original `docs/QUESTION_REVIEW.csv` remains the historical automated/author inventory. `asvab-items.json` is the version-bound human-review workflow; `reviewers.json` is empty until the owner verifies actual people and their scopes.

## 1. Select and verify people before assignment

The owner should verify relevant ASVAB teaching/tutoring or comparable subject expertise, evidence of actual explanation/distractor review, and experience with the assigned domain. Qualification for algebra does not establish qualification for shop, electronics, mechanical, auto or spatial material. Record qualifications by subject; use multiple reviewers if needed. Reviewers must be independent of the content/correction authors and disclose conflicts. Do not infer competence from a title, military affiliation or AI output. No professional certification or endorsement is implied by this workflow.

Verify supporting credentials/experience privately and obtain permission for any public name or qualification summary. Keep contact details, CVs, payment arrangements and private credential evidence outside Git/public packets. The registry holds stable reviewer IDs, an approved public display name, qualification summary, subject scope, an evidence reference, owner verification actor/date, and independence attestation. A `private:...` reference can identify an owner-controlled evidence record without exposing it. Software cannot authenticate the human or establish that an attestation is true; the owner must verify that independently.

## 2. Assign bounded batches and provide working packets

Start with the four AFQT subjects (240 items), then all remaining subjects (300). Review all 540 offered items before paid release; do not infer signoff from a sample. Subject packets contain the 60 original prompts, choices, existing practice keys/explanations, original spatial diagrams where applicable and per-item fingerprints. A displayed current key is a hypothesis to check, not an authoritative answer.

```bash
npm run review:asvab
npm run review:asvab -- --packet 'Arithmetic Reasoning' --output /tmp/private-review/ar.html
npm run review:asvab -- --packet 'Assembling Objects' --output /tmp/private-review/spatial.html
```

Packets are standalone printable HTML, make no network requests, contain no customer data and are written as new 0600 files outside the repository. Keep them out of other public web roots too. The operator may privately distribute them only after the owner authorizes reviewer engagement/delivery. No distribution is automated. Set `assignedTo` to the verified registry ID and status `assigned`; use batches of roughly 20–60 items with an explicit scope and due date agreed by the actual reviewer.

## 3. Review more than the answer key

For each stable question ID, independently solve the problem before comparing the key, then assess accuracy, explanation usefulness, uniqueness of the correct answer, plausible distractors, ambiguity, reading level, domain applicability, originality/rights, repetition and source support. Recompute mathematical answers and inspect spatial alternatives. Distinguish conceptual educational examples from safety procedures and licensing claims. Verify technical/factual claims with reliable primary references, noting scope, edition, section/page and access date. Record uncertainty instead of filling unsupported gaps.

The 10 normalized template groups, glossary reversal/passages and all weak explanations remain explicit review targets. Evaluate the new study-guidance heuristics and disclaimers separately: the 10-question evidence minimum and 70%/85% practice bands are unvalidated organization rules, not official readiness standards or psychometric models.

Add `findings` with stable IDs, kind (`answerAccuracy`, `explanation`, `distractors`, `ambiguity`, `sourceSupport`, `originality`, `repetition`, `math`, `format`), severity (`material`/`minor`), description, status, source references and proposed resolution. Use `changes_required` if correction is needed. An open finding blocks signoff; any closure needs a substantive explanation and its evidence. Never include student emails, official scores, backups or private reports in a review record.

## 4. Track corrections without changing identity

Create a small correction PR/commit and record before/after content hashes, rationale, author ID, reliable source references and commit. Keep the same q0001–q0540 IDs and subject unless a categorization correction is explicitly reviewed. Do not renumber, remove items or rewrite learner storage to make an audit pass. The bank-wide preservation test currently protects the sprint baseline; deliberate reviewed corrections must update its expected hash with the correction evidence while retaining all IDs and compatibility tests.

Use `correction_proposed` for a proposal. After a question changes, run:

```bash
npm run review:asvab -- --refresh
```

Refresh never approves content: it invalidates changed-item signoff, moves it to `needs_recheck`, and preserves the previous status/signoff and fingerprints in history. Unchanged approvals remain attached to unchanged versions. The independent reviewer must re-solve/recheck the final committed content. A correction author cannot sign off their own correction.

Active guided sessions are bound to the bank version. On a corrected build, export and archive an old unfinished session before starting current content. Completed guided results retain their scoring-version record. Dashboard recommendations recompute imported evidence from current practice keys and explain their limitations; they do not overwrite original V3 history.

## 5. Record actual signoff and owner release acceptance

After actual independent review, set status `approved` with an assigned qualified reviewer, actual review timestamp, exact content fingerprint, source references, substantive notes, and explicit true values for all seven editorial checks. AR/MK require `mathRecomputed: true` plus the actual derivation/evidence. Nonmathematical items must explicitly state `not_applicable` or actual recomputation. An approval cannot retain open findings, point at a stale version or use a correction author's identity. Corrected approvals need a correction commit and a final correction fingerprint matching the approved content.

The exact fields are enforced by `tools/asvab_review.py`; do not copy the fictional test fixtures as real attestations. Keep review edits in small Git commits/PRs for owner audit. Owner acceptance must inspect real evidence, qualifications, unresolved uncertainty, legal/rights questions and the exact release build. A passing schema checker is not that acceptance.

```bash
npm run test:review
npm run review:asvab
npm run release:content
```

Ordinary CI validates record integrity while honestly allowing `pending`. `release:content` must fail until all 540 current-version human approvals are recorded. It currently fails by design. Do not wire this incomplete signoff gate into a claim that a paid deployment is ready. Public beta stages and paid release have separate gates in `RELEASE_READINESS.md`.
