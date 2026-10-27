# Exam Pass payment test and source record

October 26, 2026 (America/Chicago). Offer: one-time **$19.99 USD / 90 × 24 hours**. Subscriptions are deferred. All provider cases below are **unrun**: no Stripe test key or signing-secret binding is available. Local automated tests use fictional mocked provider responses and signed fixtures, with real HTTP, SQLite and entitlement enforcement. Do not equate that with Stripe sandbox acceptance.

## Provider acceptance before live approval

Use a Stripe test account/sandbox and only official test details. Never provide actual card information. Before executing, securely configure test credentials, match API/event schema `2025-06-30.basil`, confirm owner/operator access and use a reviewed local forwarding setup. No provider changes, live keys, purchases, deployment or refunds were performed here.

| Case | Required evidence | Current evidence |
|---|---|---|
| Checkout price / currency / one-time | Dashboard session and hosted Checkout show $19.99 USD, one item, no renewal; exact return destinations | Local adapter assertions pass; provider unrun |
| Card succeeds | Signed settled event + server retrieval grants the correct account exactly 90 days | Local HTTP/SQLite and model tests pass; provider unrun |
| 3DS succeeds / fails / canceled | Correct return state; access only after verified payment | Provider unrun |
| Declined card / abandoned / expired | Clear message, no entitlement; expired pending row can be reconciled before another attempt | Local failure/state checks pass; provider unrun |
| Checkout return URL forged | Visiting success URL cannot unlock access | Browser and HTTP tests pass |
| Retry after network timeout | Same server reservation/idempotency key; no second charge | Mocked timeout/retry passes; provider unrun |
| Concurrent checkout requests | One pending reservation, provider idempotency and safe error handling | SQLite uniqueness + reuse tested; actual parallel Stripe requests unrun |
| Webhook invalid / stale / modified / live | Reject without mutation | Raw-byte HMAC/timestamp/test-mode tests pass |
| Duplicate / reordered delivery | No extra days; early refund/dispute still revokes; unknown checkout returns retryable failure | Local event/state tests pass; provider delivery unrun |
| Wrong total/account/offer/currency | Reject, no access; owner alert/reconciliation | Local rejection passes; production alerting missing |
| Delayed payment success/failure | No access while unpaid; grant once when settled; no revocation from stale failure after paid | Local fixtures pass; adapter is card-only, optional async event handling still needs provider checks |
| Full / partial test refund | Dashboard refund succeeds; charge.refunded revokes access; free practice and cloud retrieval remain | Local conservative-revocation tests pass; provider unrun |
| Pending / failed refund | No false refund promise; inspect provider status and notify customer only after confirmed outcome | Owner workflow/policy unimplemented |
| Dispute / resolution | Suspend pass on dispute, retain audit, decide restoration through a controlled reviewed process | Revocation tested; resolution/manual reinstatement unimplemented |
| Expiry boundary / clock | Server denies new premium saves at exact expiry; local practice and own data export remain | Independent-clock and HTTP access tests pass |
| Existing active pass / renewal | No accidental repurchase; renewal behavior deferred | Local rejection passes |
| Account/session lifecycle | Two accounts isolated; invitation single use; expired/revoked session denied; recover without taking another user's data | Local/browser tests pass; delivery/recovery/production security review pending |
| Backups / outage / webhook replay | Restore private DB and replay safely, reconcile missed settlement/refund, verify alerts | Local consistent SQLite restore/idempotency tests pass; production recovery drill missing |
| Account data deletion | Authenticated confirmed deletion, no public PII; separately govern financial/backup retention | Development deletion tested; production legal/financial retention undecided |

Handled event types: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`, `charge.dispute.created`. Only a server-retrieved settled test checkout grants access; browser state cannot do so. Signed unsupported events are acknowledged and do not grant access. Refund/dispute revocation is deliberately conservative; owner approval of actual consumer terms is still required.

## First-party sources retrieved and scoped-read

Access/review session October 26, 2026. These are technical source checks by the development author, not independent security/legal approval. No claims that current terms/fees or all provider edge cases were verified. SHA256 identifies the response read in this session; live documentation may change.

| Source | Scope used | Response SHA256 |
|---|---|---|
| https://docs.stripe.com/checkout/fulfillment | Retrieve Checkout, inspect payment status, fulfill idempotently; do not rely on a landing page | `0df698f3017dadfc3f4bcd2f3e270cd864dfcc95ba1df79cc4951ae8d1e788e8` |
| https://docs.stripe.com/webhooks/signature | Verify signature against raw body and endpoint-specific secret | `7b0f0aac90d09f760c8a59cb8bff5d965b3d2468ebed8cd268ab8d1541da7c23` |
| https://docs.stripe.com/webhooks | Raw-body constraint, event IDs, ordering and duplicates | `47776a43a75c514b87ee5ccf8659b009d78304f5095a1c09157652e1a9741c93` |
| https://docs.stripe.com/api/checkout/sessions/create | Server-created payment-mode Checkout and fixed price-data fields | `0f043c2e0de58ddebb826cd500db9cc3a2e5a1738a2186bce3a9568b35203a08` |
| https://docs.stripe.com/api/idempotent_requests | Reuse keys/parameters; keys may be pruned after at least 24 hours | `598ce01fa8d11af80a8e83c556993fe2a8b8b579cb4db4f4bdb7ca87d7a4885e` |
| https://docs.stripe.com/refunds | Full/partial refunds and Dashboard operations; does not establish a consumer policy | `c5a939646124f0ecc48d67a9f1bc54397f1e51499a8157a3dbe664fc3c0db74a` |
| https://docs.stripe.com/api/refunds | Refund API reference; no refund-creation API implemented | `694bef32c5b79d3901e86fb93a0b6d5afb00e3d8b8d126ad30c5c6bbee4f00aa` |
| https://docs.stripe.com/testing | Use test/sandbox payment details, never actual card details | `e2791afea655157bb6bdbf4c9be9f368da18b2f73d3cab65418d7cecd8df914d` |
| https://raw.githubusercontent.com/stripe/stripe-node/v18.3.0/src/apiVersion.ts | First-party generated source explicitly identifies pinned `2025-06-30.basil` | `f939539658ee856633c4a5bdf32adbdb79a05f907eeef30c3f394231373e1029` |

The guessed changelog path `https://docs.stripe.com/changelog/basil/2025-06-30` returned 404 and was not used. The upgrades overview returned 200 but its extracted substantive text did not confirm the specific pinned version; the SDK source above supplied that confirmation. The direct HMAC/API implementation avoids a new runtime dependency but requires independent security review and real provider tests before any public payment service. No verification of real merchant onboarding, payout availability, tax obligations, refund rights or production credentials is claimed.
