# Official source review — scoped findings

Actual retrieval and review date: **October 25, 2026 (America/Chicago)**. Verification applies to the listed claims, not to every rule on a host or to a course's eligibility/approval. No independent legal or credential-provider endorsement is claimed.

## EPA Section 608

Sources successfully retrieved and read:

- https://www.epa.gov/section608/section-608-technician-certification-requirements
- https://www.epa.gov/section608/test-topics

The requirements page states that technicians must pass an EPA-approved test administered by an EPA-approved certifying organization. It states that Section 608 credentials do not expire and that an open-book Core result cannot be used for Universal certification; the Core exam must be proctored for Universal.

EPA lists Type I (small appliances), Type II (high/very-high pressure appliances, with stated exclusions), Type III (low-pressure appliances) and Universal. The applicability and exclusions on the official page matter; this summary does not substitute for them. Certification and state trade licensing are distinct. This review does not survey state licensing requirements or establish that Aptitude Beacon is an approved provider.

The published test-topics page organizes Core, Type I, Type II and Type III domains. A future course can map environmental impacts, regulatory concepts, refrigeration theory, recovery/recycling/reclamation distinctions and safety concepts to that outline. Its numeric thresholds, equipment/date exceptions, refrigerant-specific rules and hands-on techniques need separate current-rule verification. Do not copy procedural examples into unsupervised work instructions or assume a retrieved outline is the full current regulatory text.

**Course status:** EPA preparation remains in development. No question-count, passing-score or proctoring claim beyond what was actually reviewed is invented. No approval, practical training or certification is offered by this site.

## OSHA Outreach

Source successfully retrieved and read: https://www.osha.gov/training/outreach

OSHA describes Outreach as basic safety/health education. It is not a certification and does not satisfy training obligations under specific OSHA standards. The page describes 10-hour and 30-hour classes delivered by OSHA-authorized trainers. Participation is voluntary at the federal-program level, while some states, municipalities or others may require Outreach training.

A student course completion card, certification, professional license and apprenticeship are different. Aptitude Beacon issues none of them. This verification does not establish a particular employer's or state's requirements.

**Course status:** awareness curriculum remains in development; this site is not an OSHA-authorized training provider.

## Unresolved sources

- NCCER: https://www.nccer.org/programs-crafts/programs/core/ returned **HTTP 404**. The official home page was examined for a replacement Core link without finding a usable one in the retrieved markup. A verified replacement URL and current Core requirements remain outstanding.
- ASE: https://www.ase.com/test-series returned **HTTP 403**. Current test-series and experience requirements are unverified.
- Official ASVAB: https://www.officialasvab.com/applicants/afqt/ returned **HTTP 403**. No new official scoring/eligibility verification is claimed.
- OpenStax: https://openstax.org/details/books/elementary-algebra-2e returned HTTP 200 with a JavaScript shell. That establishes reachability of the landing page, not substantive review of the textbook or edition. Algebra instruction is original; model checks use the explicitly authored equations.

`npm run check:references` reports availability separately from factual review. The current live audit has **3 reachable and 3 failed destinations** and exits nonzero. Those failures do not prevent the bounded original Algebra development workflow; they block treating the affected credential/scoring requirements as verified. Full network access is not a substitute for a valid source, and no secrets were added.

Detailed record, retrieval hashes and scoped dates are in `data/courses.json`. Successful HTTP status never automatically sets a verification date.
