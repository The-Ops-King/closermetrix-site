# Feature Research

**Domain:** Payment webhook enhancement for high-ticket sales intelligence platform
**Researched:** 2026-02-28
**Confidence:** HIGH (existing codebase + domain logic fully understood; external patterns MEDIUM from WebSearch)

---

## Context: What Already Exists

This is a SUBSEQUENT MILESTONE. The payment webhook system is working. This research covers
the enhancement layer: better matching, dual-column payment tracking, split-pay support, and
configurable closer credit attribution.

**Already built (do not redesign):**
- `POST /webhooks/payment` with `clientIsolation` + `webhookAuth` middleware
- `PaymentService` — email-based matching, refund handling, audit logging
- `ProspectService` — find-or-create by email, payment count tracking
- `CallStateManager` — state transitions triggered by payments
- `AlertService` — chargeback alerts
- Frontend Financial page with `cashCollected` and `revenueGenerated` scorecards

**What needs to change:**
- `cash_collected` currently accumulates ALL payments — must become first-payment-only
- No `total_payment_amount` column exists yet
- Matching is email-only — needs three-tier chain
- No fuzzy name matching against prior payers
- No configurable closer credit attribution
- Frontend surfaces only single `cashCollected` metric, not the dual-column split

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that must work or the payment system is broken or misleading.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| `cash_collected` = first payment only | Tyler's explicit requirement; "cash collected on close" is a standard sales metric — the amount the closer captured at the call | LOW | Requires BigQuery ALTER TABLE to add semantics; existing rows need migration logic. Only the first payment for a call sets this field. |
| `total_payment_amount` = sum of all payments | A deal with a 3-pay plan needs to show total contract value eventually collected, not just the first installment | LOW | New column. Updated on every payment for this call (first + subsequent). Reduced on refunds. |
| Refunds reduce BOTH columns correctly | A refund of the first payment must reduce `cash_collected`; a refund of any installment reduces `total_payment_amount`. Without this, financial reports show phantom revenue. | MEDIUM | Must determine WHICH payment is being refunded. If `cash_collected > 0` and refund amount equals it, reduce both; otherwise reduce only `total_payment_amount`. |
| Email-first matching | Email is the reliable unique identifier across payment processors. Without it, every payment is an orphan. | LOW | Already built. Preserve as Tier 1 of the chain. |
| Exact name match fallback | Some payment processor automations send contact name but not email (GoHighLevel, some Stripe setups). Without name match, these payments are unmatched and never credited. | MEDIUM | Tier 2. Case-insensitive, trim-normalized match against `prospect_name` in Calls table. Only run if email match fails. |
| Fuzzy name match (payers-only scope) | Payment processor names often have slight variations ("John Smith" vs "John S."). Without fuzzy match, legitimate repeat payers are missed. Restricted to payers only to prevent false matches to unpaid prospects. | HIGH | Tier 3. Only runs if Tiers 1 and 2 fail. Must query only calls where `cash_collected > 0 OR total_payment_amount > 0`. Levenshtein or Jaro-Winkler distance. Threshold configurable (suggested: >= 85% similarity). |
| Payment plan detection (payment_type awareness) | When a payment arrives with `payment_type: 'payment_plan'`, the system must know this is an installment, not a standalone payment. Without this, installment #2 of a 3-pay would re-trigger state transitions incorrectly. | LOW | `payment_type` already in payload. Logic is: if call is already `Closed - Won`, it is an installment — add to `total_payment_amount` only, do NOT set `cash_collected` again. |
| Idempotency / duplicate prevention | Zapier and GHL automations frequently fire the same webhook 2-3 times on retries. Without idempotency, the same $3,000 payment gets recorded twice. | MEDIUM | Check for recent identical payments (same `prospect_email` + `payment_amount` + `client_id` within a 60-second window) before processing. Return `{ status: 'ok', action: 'duplicate_skipped' }`. Confidence: MEDIUM (standard webhook pattern, confirmed by multiple WebSearch sources). |
| BigQuery view update | `v_calls_joined_flat_prefixed` is the source for ALL Frontend dashboard queries. If `total_payment_amount` is not added to this view, the Frontend can't read it. | LOW | `CREATE OR REPLACE VIEW` to add the new column. Per project constraints, existing columns must not change. |
| Frontend surfaces both metrics | The Financial page currently shows `cashCollected` (Revenue on Close) and `revenueGenerated` (Deal Size). Once the column semantics change, the dashboard must correctly label and display `cash_collected` (first payment) vs `total_payment_amount` (all payments) as distinct scorecards. | MEDIUM | Changes to `financial.js` queries, `FinancialPage.jsx`, `computePageData.js`. Labels matter: "Cash on Close" vs "Total Collected" avoids confusion. |
| Audit trail for both columns | Every change to either payment column needs an audit log entry. Without this, debugging mismatches between cash_collected and total_payment_amount is impossible. | LOW | Already have AuditLogger. Add `total_payment_amount` as tracked field alongside `cash_collected`. |
| No-match graceful handling | A payment where matching fails (all three tiers fail) must not be silently dropped. It must be logged, the prospect record still updated, and the admin alerted if desired. | LOW | Already implemented in current system for email-no-match case. Extend to cover full-chain failure. |

### Differentiators (Competitive Advantage)

Features that set CloserMetrix apart from generic CRMs or payment dashboards.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Configurable closer credit attribution per client | Tyler's clients have different business models. Some want closers credited for every installment (aligns incentives with retention). Others want credit only on the close (closer's job ends at signature; collections is ops). No other sales intelligence platform tailors this per client. | MEDIUM | New field on Clients table: `attribution_mode` ENUM('first_only', 'all_installments'). Default: `'first_only'`. When `all_installments`, every payment updates the closer's lifetime metrics. When `first_only`, only the first payment does. |
| Dual-column payment scorecards in dashboard | Most tools show one revenue number. CloserMetrix showing "Cash on Close: $3,000" alongside "Total Collected: $9,000" gives the client instant visibility into payment plan performance without any math. | LOW | Once columns exist, purely a frontend labeling and scorecard placement decision. High value-per-effort ratio. |
| Payment plan health metric (% of installments received) | For clients with 3-pay or 4-pay programs, knowing that 68% of expected installments have been received is a key business health signal. No existing tool surfaces this. | HIGH | Requires knowing the total expected plan value (from `revenue_generated` / `close_amount`) vs `total_payment_amount`. Formula: `total_payment_amount / revenue_generated * 100`. Meaningful only for `payment_plan` type deals. |
| Fuzzy-only-against-payers design | Restricting fuzzy matching to callers who have already paid is a meaningful safety feature. Generic fuzzy matching against all prospects produces too many false positives. This design choice prevents crediting the wrong person's call record. | MEDIUM | Document this as explicit product behavior. The `cash_collected > 0 OR total_payment_amount > 0` scope constraint is the key differentiator vs naive fuzzy match. Confidence: MEDIUM — domain logic validated through PROJECT.md, general approach confirmed by financial compliance fuzzy matching sources. |
| Payment matching audit trail with tier-reason | Every matched payment should record WHICH tier matched it (email, exact name, fuzzy name) and the similarity score if fuzzy. This lets Tyler debug matching quality over time. | LOW | Add `match_tier` and `match_confidence` to audit log metadata. Cheap to add during implementation. |
| Data Analysis page reflects correct payment semantics | The DataAnalysisPage uses the insight engine to surface patterns. Once dual-column data exists, the AI can surface observations like "3 of your 6 closers have total_payment_amount significantly above cash_collected — your payment plans are performing well." | MEDIUM | Primarily a backend prompt/insight config change once columns exist. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem useful but create complexity without proportionate value for this system.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Separate PaymentEvents log table | "We need a full audit trail of every payment event" | Tyler explicitly excluded this in PROJECT.md: "Separate PaymentEvents log table — Tyler wants aggregates only on Calls table." Adding it creates a second source of truth for payment data, requires joins, and doubles write complexity. | AuditLog already records every payment event with before/after values. Use AuditLog for event history, Calls for current state. |
| Payment processor direct integrations (Stripe/PayPal SDK) | "Why make clients configure Zapier when we can integrate directly?" | Each processor has a different webhook format, auth model, and retry behavior. Building and maintaining 3-4 direct integrations is 4-8 weeks of work. The standardized payload approach (clients configure their own automation) is correct for this stage. | Keep the processor-agnostic webhook. Clients use Zapier/GHL/Make to send the standardized payload. |
| Invoice generation / billing management | "You already track payments, why not send invoices too?" | Out-of-scope per PROJECT.md. Invoicing requires tax handling, dunning logic, and email infrastructure. This is a separate product. | Not applicable. Refer clients to Stripe, Wave, or QuickBooks for invoicing. |
| Payment reminders / dunning | "Alert the client when an installment is late" | Requires knowing the payment schedule (which installment # this is, when the next is due). The current webhook-driven model has no payment schedule data — only receives payments when they happen. Without a schedule, "late" can't be defined. | If Tyler wants dunning in the future, add a `payment_schedule` payload field and store the schedule. Don't build it now. |
| Automatic refund detection via polling | "Check Stripe API to find refunds automatically" | Requires per-processor API keys, complex polling logic, and rate limit handling. The webhook model is simpler and more reliable. | Refunds arrive via the same webhook with `payment_type: 'refund'`. The client's automation sends it. |
| Real-time payment status dashboard | "Show live payment status as payments come in" | BigQuery is not a real-time database. Webhook processing is near-real-time, but dashboard queries go through BigQuery which has eventual consistency. | The 5-minute refresh model is correct. Payments show up within one dashboard refresh cycle. |
| Per-installment payment attribution | "Credit closer X% for installment 1, Y% for installment 2..." | Variable-rate attribution per installment creates a configuration nightmare. The binary `first_only` vs `all_installments` covers 95% of use cases with 10% of the complexity. | Use the configurable `attribution_mode` binary choice. Complex attribution can be added later if a specific client requests it. |

---

## Feature Dependencies

```
[Dual-column columns: cash_collected redef + total_payment_amount new]
    └──required by──> [Three-tier matching chain]
    └──required by──> [Refund logic for both columns]
    └──required by──> [Configurable closer credit attribution]
    └──required by──> [BigQuery view update]
    └──required by──> [Frontend dual-column scorecards]
    └──required by──> [Data Analysis page correctness]

[Three-tier matching chain]
    └──requires──> [Dual-column columns exist] (to scope fuzzy match to payers only)
    └──contains──> [Email match Tier 1] — no new dependencies
    └──contains──> [Exact name match Tier 2] — no new dependencies
    └──contains──> [Fuzzy name match Tier 3] — requires payer scope (cash_collected > 0 OR total_payment_amount > 0)

[Configurable closer credit attribution]
    └──requires──> [attribution_mode field on Clients table]
    └──requires──> [Dual-column columns exist] (determines which column triggers closer credit)
    └──enhances──> [Closer lifetime metrics accuracy]

[BigQuery view update]
    └──requires──> [Dual-column columns exist] (can't add column to view before adding to base table)
    └──required by──> [Frontend dual-column scorecards]
    └──required by──> [financial.js query updates]

[Frontend dual-column scorecards]
    └──requires──> [BigQuery view update]
    └──requires──> [financial.js query updates]
    └──requires──> [computePageData.js updates]
    └──enhances──> [Data Analysis page correctness]

[Idempotency / duplicate prevention]
    └──no upstream dependencies — can be added at PaymentService level independently
    └──enhances──> [Three-tier matching chain] (prevents duplicate credits)

[Payment matching audit trail with tier-reason]
    └──requires──> [Three-tier matching chain] (needs tier info to log)
    └──requires──> [Dual-column columns exist] (to log which column was updated)
```

### Dependency Notes

- **Dual-column columns are the root dependency.** Everything else in this milestone is blocked on `ALTER TABLE Calls` (adding `total_payment_amount`) and BigQuery view update. This must go first.
- **Three-tier matching depends on dual-column columns for its fuzzy-match scope.** The payer restriction (`cash_collected > 0 OR total_payment_amount > 0`) can't be expressed until `total_payment_amount` exists. Tier 1 (email) and Tier 2 (exact name) can be built independently, but Tier 3 (fuzzy) must wait.
- **Configurable attribution depends on columns and a schema change to Clients.** Adding `attribution_mode` to Clients table is a separate BigQuery migration from the Calls column addition.
- **Frontend work is entirely blocked on BigQuery view update.** The Frontend queries `v_calls_joined_flat_prefixed`. Until that view includes `calls_total_payment_amount`, the Frontend can't display it.
- **Idempotency is independent** and can be added at any point in the sprint, though ideally before other matching changes go live.

---

## MVP Definition

### Launch With (v1 — this milestone)

These features constitute the complete milestone as defined in PROJECT.md.

- [ ] **Dual-column schema migration** — `cash_collected` semantics redefined as first-payment-only; `total_payment_amount` column added. This is the foundation all other features depend on.
- [ ] **PaymentService refactor** — First-payment detection logic: if `cash_collected == 0` on the call, this is the first payment; set `cash_collected`. All payments (first + subsequent) add to `total_payment_amount`.
- [ ] **Refund logic for both columns** — If refund amount <= `cash_collected`, reduce `cash_collected` (and `total_payment_amount`). Otherwise reduce only `total_payment_amount`.
- [ ] **Three-tier matching chain** — Email → exact name → fuzzy name (payers only). Replaces current email-only lookup in ProspectService.findOrCreate.
- [ ] **Configurable closer credit attribution** — `attribution_mode` field on Clients table. `PaymentService` checks this before updating closer metrics on installment payments.
- [ ] **Idempotency check** — Duplicate webhook prevention at `PaymentService.processPayment()` entry point.
- [ ] **BigQuery view update** — `CREATE OR REPLACE VIEW v_calls_joined_flat_prefixed` to include `calls_total_payment_amount`.
- [ ] **Frontend Financial page** — Dual-column scorecards, updated chart labels, updated `computePageData.js` financial section.
- [ ] **Data Analysis page** — Ensure insight engine uses updated payment column names.

### Add After Validation (v1.x)

Features worth adding once the core milestone is stable and tested.

- [ ] **Payment plan health metric (% installments received)** — High value for clients on 3-pay/4-pay programs. Trigger: one client requests it or Tyler identifies it as a retention metric.
- [ ] **Payment matching audit trail with tier-reason** — Log `match_tier` and `match_confidence` to AuditLog metadata. Low effort, high debugging value.
- [ ] **Fuzzy match threshold configuration per client** — Currently a system-wide constant. Some clients have prospect names that vary more (transliterations, aliases). Trigger: a client complains of false matches or missed matches.

### Future Consideration (v2+)

Features to defer until specific need is demonstrated.

- [ ] **Multi-currency support** — If Tyler onboards international clients. Requires exchange rate handling, BigQuery schema additions.
- [ ] **Payment schedule storage** — Storing expected installment schedule to enable late payment detection. Requires new payload fields and a PaymentSchedule table. High complexity.
- [ ] **Closer leaderboard by total_payment_amount** — A new scoreboard view showing who has the most total contract value collected vs just first-payment value. Useful dashboard addition once dual-column data has 30+ days of history.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Dual-column schema migration | HIGH | LOW | P1 |
| PaymentService first-payment logic | HIGH | LOW | P1 |
| Refund logic for both columns | HIGH | MEDIUM | P1 |
| Three-tier matching (email + exact name) | HIGH | LOW | P1 |
| Fuzzy name matching (payers only) | HIGH | MEDIUM | P1 |
| Configurable closer credit attribution | HIGH | MEDIUM | P1 |
| BigQuery view update | HIGH | LOW | P1 |
| Frontend dual-column scorecards | HIGH | MEDIUM | P1 |
| Idempotency / duplicate prevention | MEDIUM | MEDIUM | P1 |
| Data Analysis page payment correctness | MEDIUM | LOW | P1 |
| Payment matching audit with tier-reason | MEDIUM | LOW | P2 |
| Payment plan health metric | MEDIUM | HIGH | P2 |
| Fuzzy threshold per-client config | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for this milestone launch
- P2: Should have, add when milestone is stable
- P3: Nice to have, future sprint

---

## Domain-Specific Behavioral Notes

These are opinionated findings from researching how payment matching actually works in practice
and what this specific domain (high-ticket sales coaching) expects:

### First Payment vs Total: Why the Split Matters

In high-ticket sales coaching ($2k-$15k programs), prospects typically choose from:
- **PIF (Paid in Full):** Single payment. `cash_collected == total_payment_amount`.
- **3-pay / 4-pay / 6-pay plan:** First installment is "cash on close." Subsequent installments are collections.
- **Deposit:** Small first payment to reserve the spot; balance paid later.

The closer's job is to get the first payment. The closer should be measured by `cash_collected` (what they captured on the call). `total_payment_amount` measures business health over time — how much of the contracted revenue actually materialized.

**Confidence: HIGH** — This semantic is explicitly in PROJECT.md and consistent with how commission tracking works in sales organizations per WebSearch findings.

### Fuzzy Matching Scope Restriction is Non-Negotiable

Fuzzy matching against all prospects (paid and unpaid) creates too many false positives in a sales intelligence context. A prospect named "John Smith" who never paid should NOT receive credit for a payment from a different "Jon Smith" who DID pay. Restricting fuzzy matching to payers only limits the match space to known buyers where a name variation is a data quality issue, not a business relationship issue.

**Confidence: HIGH** — Explicitly defined in PROJECT.md. Consistent with financial compliance fuzzy matching best practices (source: Financial Crime Academy).

### Three-Tier Chain is the Right Architecture

Email match handles 80-90% of cases (most automation tools send the email correctly). Exact name handles the 5-10% where email is missing or sends a contact email different from the one on the call record. Fuzzy name handles the remaining edge cases (misspellings, middle names, suffixes). Building all three into a chain with clear fallback behavior is the correct approach — trying to pick one and tune it is an anti-pattern.

**Confidence: MEDIUM** — Defined in PROJECT.md. Three-tier matching pattern is consistent with transaction matching industry best practices per WebSearch findings.

### Attribution Mode Default Should Be `first_only`

Most high-ticket coaching businesses model closer compensation on the close, not on collections. Defaulting to `all_installments` would credit closers for payments they had no involvement in. The `first_only` default is correct for the domain.

**Confidence: MEDIUM** — Domain reasoning from PROJECT.md. Consistent with sales commission structures where AEs receive credit at close, not at collections.

### Idempotency Window Should Be 60 Seconds

Zapier and GHL frequently retry failed webhooks within 30-60 seconds. A 60-second deduplication window prevents double-counting without being so long it blocks legitimate same-day payments from the same prospect.

**Confidence: LOW** — 60-second window is reasonable but unverified. Implementation should make this configurable. WebSearch confirmed that idempotency via deduplication is standard practice; the specific window is a judgment call.

---

## Sources

- PROJECT.md — Primary source for all requirements and constraints (HIGH confidence)
- Backend/CLAUDE.md — Schema, existing PaymentService, ProspectService behavior (HIGH confidence)
- [Payment Matching Systems - duplicatepayments.co.uk](https://www.duplicatepayments.co.uk/post/2026/02/16/payment-matching-systems) — Three confidence-tier matching pattern (MEDIUM confidence)
- [Fuzzy Matching In Financial Compliance - financialcrimeacademy.org](https://financialcrimeacademy.org/fuzzy-matching-in-financial-compliance/) — Restricting fuzzy match scope to reduce false positives (MEDIUM confidence)
- [Handling Payment Webhooks Reliably - Medium](https://medium.com/@sohail_saifii/handling-payment-webhooks-reliably-idempotency-retries-validation-69b762720bf5) — Idempotency patterns for webhook processing (MEDIUM confidence)
- [How to Build Split Credit Rules for Team Sales - level6.com](https://www.level6.com/split-credit-rules-sales/) — Closer credit attribution patterns (MEDIUM confidence)
- [Transaction Matching: What It Is - solvexia.com](https://www.solvexia.com/glossary/transaction-matching) — Industry standard for tiered matching (MEDIUM confidence)
- [GoHighLevel Payments - ghl-services-playbooks](https://ghl-services-playbooks-automation-crm-marketing.ghost.io/gohighlevel-payments-accept-online-payments-automate-invoices-and-track-transactions/) — Context for how GHL clients send payment data (LOW confidence, marketing content)
- Existing codebase: PaymentService.js, ProspectService.js, rawData.js, financial.js, FinancialPage.jsx (HIGH confidence — ground truth)

---
*Feature research for: payment webhook enhancement — CloserMetrix*
*Researched: 2026-02-28*
