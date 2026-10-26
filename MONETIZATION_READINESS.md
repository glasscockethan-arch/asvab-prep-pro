# Monetization readiness checklist

Status: PREPARATION ONLY. No advertising provider scripts, ad placements, tracking pixels, or custom domain have been configured or purchased.

## Important brand hold
A different ASVAB practice website is already operating at https://www.missionasvab.org/ using the exact name "Mission ASVAB". Do not commercially rebrand to this name before legal trademark and common-law clearance. The site now uses the working brand **Aptitude Beacon**; this is provisional commercial branding pending comprehensive federal/state/common-law clearance. A preliminary `.com` registry request did not return a registration record for `aptitudebeacon.com`, but this is NOT purchase confirmation or trademark clearance.

## Before applying for Google AdSense
- [x] Publish a useful accessible homepage, navigation, and practice entry point
- [x] Publish initial About, Privacy, Terms, and Contact pages
- [x] Preserve the complete V3 practice application
- [x] Add sitemap and robots files
- [x] Add repeatable structural audit with valid IDs, choices, answer indices and explanations (540 checked; zero structural errors)\n- [ ] Independently verify all 540 answer keys and explanations for factual accuracy and meaningful variety; replace repeated/template-like questions
- [x] Publish initial original worked lesson guides for the four AFQT subject areas\n- [ ] Expand and editorially review the remaining five subject guides
- [ ] Choose a distinctive, legally cleared brand
- [ ] Register a domain (optional but recommended), verify ownership, and configure DNS + HTTPS
- [ ] Provide a working private business/support contact method and review policy language for accuracy
- [ ] Check age of owner, applicable tax/payment information, and AdSense eligibility
- [ ] Evaluate site performance, accessibility, mobile layout, and real-device test flows
- [ ] Integrate privacy/cookie disclosures and consent-management solution as required for visitor jurisdictions
- [ ] Apply for AdSense, complete site ownership verification, and wait for approval
- [ ] Only after approval: add properly labeled and non-disruptive ads outside timed examinations; monitor policy compliance

Official policies:
https://support.google.com/adsense/answer/9724?hl=en
https://support.google.com/adsense/answer/48182?hl=en
https://support.google.com/adsense/answer/10502938?hl=en

## Notes
- Practice scores are **not** official AFQT percentiles.
- The free app currently keeps progress in browser storage and does not have a server database or cross-device sync.
- GitHub Pages is hosting the site; it does not provide ad monetization by itself.

## October 25, 2026 implementation notes
- Four original AFQT guides have been added and linked from the homepage; links appear in sitemap.xml.
- Structural audit lives at `tools/audit_question_bank.py`; findings in `QUESTION_BANK_AUDIT.md`. This is not a substitute for educational content review.
- No ads, trackers, domain purchase, or AdSense application were created.
- Next legal milestone: review live and pending USPTO marks and confusingly similar education brands, search relevant state registries, and examine common-law use; seek qualified legal clearance before committing capital.
