# Learning content and progress contracts

`data/courses.json` is the authored source of truth. `schemaVersion: 1` contains available introductory units, a separate in-development list and official-source metadata. `src/engine.js:validateCatalog` rejects missing instruction, duplicate identifiers, invalid choices and unsupported difficulty levels. Tests require globally unique question IDs.

An available unit supplies its audience, prerequisites, learning objectives, honest 50-minute estimate, three ordered lessons, original instruction, one worked example per lesson, three practice questions per lesson, flashcards and three separate assessment questions. Questions carry a stable ID, four options, an answer index, an explanation and a misconception note. `introductory` questions ask direct concepts; `application` questions require a reasoning step. These tiers are editorial labels, not psychometrically calibrated difficulty.

Assessment questions are held out of lesson practice. They become visible with explanations after submission, so repeat assessment is practice rather than a fresh measurement. A six-question diagnostic samples the lesson pool. Timed practice has a ten-minute absolute deadline. Topic and difficulty filters apply to study and timed practice only; other modes have defined question sets. Missed review uses the latest completed answer to each question. Shuffling changes question order, preserving authored answer-option order.

Unit completion records all three lessons as read plus at least 80% on the small final assessment. It does not mean accredited completion, credential readiness or broad mastery. No badge or certificate is issued. Content remains subject to independent educator review.

## Storage

`aptitude-beacon-v1` has `schemaVersion`, lesson timestamps, saved course IDs, completed attempts, daily/rolling-seven-day goals, an optional active session and optional legacy history. A session persists its question IDs, answers, index and absolute deadline, so closing or refreshing does not reset a timed deadline. Only completed attempts affect goals, history and recommendations.

Imports are parsed and validated before any write. New-platform backups merge by stable attempt IDs; lessons and bookmarks are retained. Legacy backups are normalized and merged without touching `asvab-prep-pro-v3`. Legacy correctness is recomputed; valid diagram coordinates survive export. Unknown versions and malformed nested records are rejected. Source data that cannot be read is preserved with a recovery download path. Storage errors leave the current session in memory with an export warning. A cross-tab write disables the stale tab until reload instead of silently overwriting newer progress.

The original app still owns its V3 key and its own confirmed replace-on-import behavior. New-platform export includes a validated snapshot of readable legacy history, not a promise that the original app has been restored. Use the original app's backup tools to transfer its active history between browsers.

Deletion of new-platform data does not remove V3 or theme data. Clearing browser site data can remove all keys. Backup JSON can reveal study interests and should remain private. There is no account or automatic synchronization.

## Adding a unit

1. Write original, bounded instruction and answer explanations. Do not add counts for marketing.
2. Use stable IDs. Preserve IDs and progress compatibility when improving wording.
3. Verify all answers independently, including distractor plausibility and limits.
4. Add official-source verification dates only after successfully reviewing the actual current source; record jurisdiction where relevant.
5. Keep credential tracks in development until reviewed. A national certification is not a state license, training card or credit.
6. Run the content validator, unit tests, bank checks, build and browser checks. Update release and coverage records.

## Release limits

The 72 new questions have author review, not independent subject-expert approval. Most requested full courses, credential pathways, richer assessments and advanced study material remain unreleased. The old four-question pathway previews are retained and explicitly labeled as previews. Source access attempts blocked by network policy have no verified date.
