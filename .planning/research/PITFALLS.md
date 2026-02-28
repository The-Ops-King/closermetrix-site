# Pitfalls Research

**Domain:** Payment webhook enhancement — fuzzy name matching, split-pay tracking, dual payment columns on existing BigQuery system
**Researched:** 2026-02-28
**Confidence:** HIGH (codebase read directly; patterns verified against BigQuery docs and payment webhook literature)

---

## Critical Pitfalls

### Pitfall 1: Fuzzy Match Against Wrong Pool (Matching Non-Payers)

**What goes wrong:**
The fuzzy match tier should only run against callers who already have a payment on record (`cash_collected > 0 OR total_payment_amount > 0`). If the pool is not filtered to payers-only, the fuzzy algorithm will find the closest name among ALL prospect names — including people who never paid. A prospect named "John Smith" who has a Follow Up call will match incoming payments for "Jon Smith" who is a completely different person that actually paid.

**Why it happens:**
The natural reflex when writing a fuzzy query is `SELECT * FROM Calls WHERE client_id = @clientId AND prospect_name IS NOT NULL`. The payers-only constraint is easy to forget because it's a business rule, not a technical constraint, and `PaymentService._processPayment()` currently only queries by email (`findMostRecentShowForProspect`), so there's no reference implementation that scopes to payers.

**How to avoid:**
The fuzzy name match query MUST include the payers-only gate as a hard SQL filter, not an application-level filter. Example structure:
```sql
SELECT *, LEVENSHTEIN(prospect_name, @incomingName) as distance
FROM Calls
WHERE client_id = @clientId
  AND (cash_collected > 0 OR total_payment_amount > 0)
  AND prospect_name IS NOT NULL
  AND attendance IN ('Show', 'Follow Up', 'Lost', 'Closed - Won', 'Deposit', 'Disqualified', 'Not Pitched')
ORDER BY distance ASC
LIMIT 1
```
Set a hard maximum distance threshold (e.g., Levenshtein distance <= 3 or Jaro-Winkler >= 0.88) — reject the match if no candidate clears it, rather than taking the "best" match regardless of score.

**Warning signs:**
- Payments attributed to a prospect with `cash_collected = 0` before the payment
- Two prospects with similar names get payments cross-attributed on the same day
- AuditLog shows `action: 'new_close'` for a call that was in `Ghosted` or `Scheduled` state (not a Show state)

**Phase to address:**
Phase implementing the three-tier matching chain (before any fuzzy logic goes live).

---

### Pitfall 2: `cash_collected` Semantic Shift Breaks Existing `_processPayment` Logic

**What goes wrong:**
The current `PaymentService._processPayment()` accumulates ALL payments into `cash_collected`:
```javascript
cash_collected: (call.cash_collected || 0) + amount,
```
After the refactor, `cash_collected` means first payment only. If the "is this the first payment?" check is wrong or missing, subsequent installments will overwrite or accumulate into `cash_collected`, breaking the semantic and corrupting historical data going forward.

**Why it happens:**
The check for "is there already a first payment?" requires reading `cash_collected` before writing. Because BigQuery DML is not transactional in the ACID sense (no row-level locking across separate statements), a race condition is possible if two installments for the same prospect arrive seconds apart and both read `cash_collected = 0` before either write completes.

**How to avoid:**
The "is this the first payment?" determination must happen on the call record's CURRENT `cash_collected` value read at the start of the `_processPayment` call — before any writes. Use an explicit branch:
```javascript
const isFirstPayment = !call.cash_collected || call.cash_collected === 0;
if (isFirstPayment) {
  updates.cash_collected = amount;  // Set — not accumulate
}
// Always accumulate total
updates.total_payment_amount = (call.total_payment_amount || 0) + amount;
```
Document this branch with a comment explaining the semantics. For the race condition: accept it as a known edge case (two installments seconds apart is rare) and add an AuditLog entry so it's detectable and recoverable.

**Warning signs:**
- `cash_collected` value on a call is the sum of multiple payments (larger than any single payment)
- Calls where `cash_collected > total_payment_amount` (impossible under correct semantics)
- Frontend metrics show `cash_collected` changing for existing Closed - Won calls on subsequent installments

**Phase to address:**
Phase refactoring `PaymentService._processPayment()` to implement dual-column semantics.

---

### Pitfall 3: `v_calls_joined_flat_prefixed` View Not Updated — New Column Silently Missing from Frontend

**What goes wrong:**
Adding `total_payment_amount` to the Calls table does NOT automatically add it to the BigQuery view `v_calls_joined_flat_prefixed`. The view uses an explicit column list (confirmed in `CLAUDE.md`: "BQ view is explicit column list — new columns on Calls table do NOT auto-appear in `v_calls_joined_flat_prefixed`. Must `CREATE OR REPLACE VIEW` to add them."). The Backend queries the raw Calls table, so the Backend works. But the Frontend's `computePageData.js` and dashboard queries go through the view — `total_payment_amount` will show as `undefined` everywhere on the Frontend until the view is updated.

**Why it happens:**
The Backend and Frontend hit different query paths. Backend PaymentService updates the Calls table directly. Frontend data flows through the view. It's easy to test the Backend webhook, see it writing correctly, and declare the feature done — without noticing the Frontend is reading stale view schema.

**How to avoid:**
The view update (`CREATE OR REPLACE VIEW`) must be a required step in the same implementation phase as the column addition — not an afterthought. Add it to the migration script. Test the Frontend display with the executive test token (`af3016c9-5377-43f3-9d16-03428af0cc4d`) after every schema change.

**Warning signs:**
- Frontend shows dashes or 0 for `total_payment_amount` even after payments process correctly
- `computePageData.js` receives `undefined` for `total_payment_amount`
- BigQuery query on the view returns rows without `total_payment_amount` column

**Phase to address:**
The schema migration phase — view update must be bundled with `ALTER TABLE ADD COLUMN`.

---

### Pitfall 4: Refund Against Split-Pay — Wrong Column Gets Reduced

**What goes wrong:**
A refund for a partial installment (e.g., refunding the 2nd payment of a 3-pay plan) must reduce `total_payment_amount` by the refund amount. It should only reduce `cash_collected` if the refund covers or exceeds the first payment amount. The current `_processRefund()` applies all refunds to `cash_collected` only:
```javascript
const newCash = Math.max(0, oldCash - amount);
```
This is wrong for installment refunds where `cash_collected` = first payment ($3,000) and someone refunds the 2nd installment ($3,000). The code would zero out `cash_collected` and revert the call to `Lost` — incorrectly, because the first payment was not refunded.

**Why it happens:**
The current refund logic was written before `total_payment_amount` existed. It treats any refund as a reduction to `cash_collected`. Without a concept of "which installment is being refunded," there's no way to route the reduction correctly.

**How to avoid:**
The refund logic must implement this decision tree:
1. Always reduce `total_payment_amount` by the refund amount (floor at 0).
2. Only reduce `cash_collected` if the refund amount would logically apply to the first payment. Since there's no "which installment" field in the payload, use this heuristic: if `total_payment_amount - refund_amount < cash_collected`, then the refund is reducing into the first payment range, so reduce `cash_collected` to `total_payment_amount - refund_amount`.
3. Only revert call outcome to `Lost` if `total_payment_amount - refund_amount <= 0` (not just `cash_collected <= 0`).

The refund handling must be updated in the same phase as the dual-column introduction — they cannot be done independently.

**Warning signs:**
- Calls transitioning to `Lost` after an installment refund even though the prospect still has cash on record
- `cash_collected > total_payment_amount` after a refund (data integrity violation)
- AuditLog shows `call_outcome` reverting to `Lost` on a call with non-zero `total_payment_amount`

**Phase to address:**
Phase refactoring `PaymentService._processRefund()` — must happen together with dual-column semantics.

---

### Pitfall 5: Duplicate Webhook Processing Creates Double-Counted Installments

**What goes wrong:**
Payment processors (via Zapier/GHL automation) frequently retry webhooks on timeout or failure. If `processPayment` is not idempotent, a retried webhook for the same installment will add the payment amount again to `total_payment_amount` — double-counting revenue. There is no idempotency key in the current webhook payload or processing logic.

**Why it happens:**
The current `PaymentService` has no deduplication check. Every call to `processPayment` writes to BigQuery unconditionally. Zapier retries on 5xx responses; GHL has its own retry logic. At 5-8 calls/day per closer and clients sending via automation, duplicate webhooks are not rare — they are expected.

**How to avoid:**
Introduce an idempotency key. Options:
1. Require `payment_id` field in the webhook payload (a unique ID from the payment processor) and check it in AuditLog or a dedupe table before processing.
2. Generate a deterministic key from `(client_id, prospect_email, payment_amount, payment_date)` and check for recent duplicates (within 24 hours) before writing.
Option 2 is simpler given the existing payload structure. Implement as a pre-check query against AuditLog.

**Warning signs:**
- `total_payment_amount` on a call is double the expected deal value
- AuditLog shows two `payment_received` entries for the same amount/date combination
- Prospect `payment_count` incremented twice for one transaction

**Phase to address:**
Webhook processing phase — idempotency check must be in place before any dual-column logic goes live.

---

## Moderate Pitfalls

### Pitfall 6: `closer_credit_attribution` Config Field Missing from Clients Table

**What goes wrong:**
The configurable closer credit attribution ("all installments" vs "first only") requires a field on the Clients table (per PROJECT.md requirements). If this field is not added during the schema migration phase, the feature gets implemented with a hardcoded default, and changing it later per-client requires a code change rather than a data change.

**How to avoid:**
Add `closer_credit_attribution` (STRING, values: `'first_only'` or `'all_installments'`) to the Clients table in the same migration script that adds `total_payment_amount` to Calls. Default to `'all_installments'` for backward compatibility with existing behavior. Read this field in `PaymentService` via a client lookup before deciding whether to update revenue fields on subsequent payments.

**Warning signs:**
- Frontend shows incorrect closer revenue figures for clients who should be on "first only" attribution
- No `closer_credit_attribution` column visible in BigQuery Clients table schema

**Phase to address:**
Schema migration phase.

---

### Pitfall 7: Fuzzy Match Threshold Too Lenient — Nicknames and Short Names Cause False Positives

**What goes wrong:**
Common name pairs that are NOT the same person but score high on Levenshtein:
- "Bob Smith" vs "Rob Smith" (distance: 1)
- "Jim" vs "Tim" (distance: 1)
- "Chris Johnson" vs "Chris Johnston" (distance: 1)
- "Mike" vs "Mike" (exact match on first name only — different people with same first name and different last names if last name is missing from either record)

A Levenshtein threshold of <= 2 would match all of these. The payers-only restriction reduces (but does not eliminate) the risk, since multiple clients could have different payers with similar names.

**How to avoid:**
Use Jaro-Winkler similarity rather than Levenshtein for name matching — it handles prefix agreement better and is more appropriate for personal names. Set a high threshold (>= 0.92) and log all fuzzy matches to AuditLog with the match score so Tyler can audit false positives. Never fuzzy-match on first name only — require full name (first + last) to be present in both the payment payload and the call record.

**Warning signs:**
- Multiple fuzzy matches per day with very short names (2-4 characters)
- AuditLog shows fuzzy-matched payments being later refunded (suggests wrong attribution)
- Any fuzzy match where only first name is available in either the payment payload or the call record

**Phase to address:**
Fuzzy matching implementation phase.

---

### Pitfall 8: BigQuery `ALTER TABLE ADD COLUMN` Requires `IF NOT EXISTS` or Migration Guard

**What goes wrong:**
Running `ALTER TABLE Calls ADD COLUMN total_payment_amount FLOAT64` twice (e.g., during development, or if a migration reruns) without `IF NOT EXISTS` throws a BigQuery error: `Column 'total_payment_amount' already exists in table`. Depending on how the migration runs, this could leave the Clients table in a partially migrated state.

**How to avoid:**
Always use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` in migration scripts. Structure migration scripts to be idempotent — safe to run multiple times. The existing migration pattern (`Backend/src/db/migrations/`) should be followed; verify it checks for existing columns before adding.

**Warning signs:**
- Migration script throws on re-run in development
- `total_payment_amount` column missing from Calls table after a partial migration run

**Phase to address:**
Schema migration phase.

---

### Pitfall 9: `findMostRecentShowForProspect` Matched by Email — Fuzzy Match Returns Different Call

**What goes wrong:**
The three-tier matching chain has an important inconsistency risk: email match finds Call A, but if email match fails and fuzzy name match succeeds, it finds Call B (a different call, for what turns out to be a different prospect). The PaymentService then updates Call B. Later, if the prospect's actual email arrives in a subsequent payment, it creates a new close on Call A. The result is two calls marked Closed - Won for one deal.

**Why it happens:**
The matching chain is designed to find "the best call to attribute this payment to." But each tier can return a different call. If the payment processor sends email on first payment but not on installments, tier 1 wins for payment 1, tier 3 wins for payments 2-N, and they may find different calls.

**How to avoid:**
Once a payment has been attributed to a specific call (via any tier), store a payment-to-call mapping in the AuditLog or on the Prospect record. Subsequent payments for the same prospect should prefer the call already associated with previous payments rather than re-running the full matching chain.

**Warning signs:**
- Two calls marked `Closed - Won` for the same prospect within the same time period
- `total_payment_amount` split across two different call records for one deal

**Phase to address:**
Three-tier matching chain implementation phase.

---

## Minor Pitfalls

### Pitfall 10: `payment_type` Field Absent on Installments — Defaults to `'full'`

**What goes wrong:**
`PaymentService._normalizePaymentType()` defaults to `'full'` when `payment_type` is missing. Zapier/GHL automations often send payment webhooks without a `payment_type` field for installments. The system will treat every installment as a full payment, which maps `payment_plan = 'Full'` on the call record (via `_mapPaymentTypeToPaymentPlan`). This is cosmetically wrong but not data-corrupting.

**How to avoid:**
Improve the `_mapPaymentTypeToPaymentPlan` logic: if `payment_type = 'full'` but `cash_collected` was already set (i.e., this is not the first payment), treat it as `'payment_plan'` for the plan field. Document this in code.

**Warning signs:**
- Call records showing `payment_plan = 'Full'` but `total_payment_amount > cash_collected` (indicating installments arrived)

**Phase to address:**
PaymentService dual-column refactor phase.

---

### Pitfall 11: Historical `cash_collected` Data Is Already Cumulative — Backfill Needed

**What goes wrong:**
The existing `cash_collected` field currently accumulates ALL payments (per existing PaymentService code). After the semantic change, `cash_collected` means first payment only. Existing records have inflated `cash_collected` values. New records will have correct `cash_collected` (first payment only). The dashboard will show inconsistent data: old records appear to have higher first payments than they actually did.

**How to avoid:**
Decide explicitly whether to backfill historical data. If backfill is needed, write a migration that: for each Closed - Won call with existing `cash_collected`, checks AuditLog for the first `payment_received` action and uses that amount for `cash_collected`, setting `total_payment_amount` to the current accumulated `cash_collected`. If backfill is not done, document in the codebase that pre-migration `cash_collected` data has different semantics from post-migration data.

**Warning signs:**
- Historical calls showing `cash_collected > total_payment_amount` (impossible under new semantics)
- Dashboard showing different average first-payment values for calls before and after migration date

**Phase to address:**
Schema migration phase — decide and document the backfill strategy before writing any code.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip idempotency key on webhook | Simpler implementation | Double-counted installments under retry conditions | Never — use deterministic dedup key |
| Hardcode `closer_credit_attribution = 'all_installments'` | No Clients table migration needed | All clients treated identically; cannot change without code deploy | MVP only if no client has requested "first only" yet |
| Skip refund logic update and only update payment logic | Half the work | Refunds corrupt dual-column data immediately | Never — refund and payment logic must ship together |
| Use Levenshtein <= 3 for fuzzy threshold | Catches more matches | High false positive rate for short names | Never — use Jaro-Winkler with strict threshold instead |
| Skip historical backfill of `cash_collected` | No migration risk | Inconsistent metrics before/after migration date | Acceptable if documented and Tyler agrees |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Zapier/GHL payment automation | Assumes `payment_type` is always present | Default to `'full'` but detect installments by checking if first payment already exists |
| BigQuery view update | Forgetting to run `CREATE OR REPLACE VIEW` after column addition | Bundle view update in the same migration script as `ALTER TABLE` |
| ProspectService | `updateWithPayment` always increments `payment_count` — but `payment_count` on Prospects is separate from dual-column logic on Calls | Ensure Prospect-level `total_cash_collected` also distinguishes first vs total if surfaced on frontend |
| AuditLog | Current `payment_close` action logs `fieldChanged: 'call_outcome'` only — doesn't log which payment tier (email/exact/fuzzy) was used | Add `matchTier: 'email|exact_name|fuzzy_name'` to AuditLog metadata for every payment attribution so false positives are auditable |
| BigQuery DML quota | Running backfill as individual row UPDATEs for thousands of calls | Use a single `UPDATE ... WHERE` with a batch condition, not a row-by-row loop |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Full-table scan for fuzzy name match | Slow payment processing (>2s per webhook) | Index on `client_id` + `cash_collected` + `prospect_name`; BigQuery clustering on `client_id` already helps | At 100+ clients with 5,000+ calls each |
| LEVENSHTEIN() on all payer rows per payment | Timeout on large clients | Add a pre-filter: require first character of first name to match (reduces candidate pool by ~90%) | At 1,000+ paying customers per client |
| Backfill UPDATE running row-by-row in Node.js loop | Migration takes hours, DML quota exceeded | Use a single BigQuery DML statement with `CASE WHEN` or a JOIN to a temp table | Any client with >500 calls |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Fuzzy match returns data across clients | One client's payment attributed to another client's prospect | Always include `client_id = @clientId` in the fuzzy match query — same as all other queries |
| `total_payment_amount` visible on basic-tier frontend | Exposes data not paid for | Gate `total_payment_amount` display behind tier check (same pattern as other insight/executive features) |
| Refund endpoint accepts negative `payment_amount` without `payment_type: 'refund'` | Negative amount bypasses refund logic, corrupts columns | Current validation requires `amount > 0`; refunds must use `payment_type: 'refund'` explicitly |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing both `cash_collected` and `total_payment_amount` with no labels | Tyler confused about which column is which | Label them distinctly: "First Payment" and "Total Collected" — not just column names |
| Fuzzy match silently attributes payment with no indication it was fuzzy | Tyler has no way to audit attribution accuracy | Always log match tier in AuditLog; surface in UI as a match confidence indicator |
| Refund reverts call to Lost when only a partial installment was refunded | Tyler sees a closed deal disappear from revenue | Only revert to Lost when `total_payment_amount` reaches 0, not when `cash_collected` reaches 0 |

---

## "Looks Done But Isn't" Checklist

- [ ] **Fuzzy matching:** Often missing payers-only filter — verify query includes `cash_collected > 0 OR total_payment_amount > 0` constraint
- [ ] **Dual columns:** Often missing refund update — verify `_processRefund()` reduces BOTH columns correctly, not just `cash_collected`
- [ ] **BigQuery view:** Often missing after column addition — verify `v_calls_joined_flat_prefixed` includes `total_payment_amount` by querying it directly
- [ ] **Closer credit attribution:** Often missing Clients table field — verify `closer_credit_attribution` column exists and PaymentService reads it
- [ ] **Idempotency:** Often missing dedup check — verify duplicate webhook for same payment does not increment `total_payment_amount` twice
- [ ] **Historical data:** Often undecided — verify backfill decision is documented and either executed or explicitly deferred

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Fuzzy match false positives (wrong attribution) | MEDIUM | Query AuditLog for `matchTier: 'fuzzy'` entries; manually review; run UPDATE to reassign to correct call_id; revert incorrect Closed - Won to previous outcome |
| Double-counted installment (idempotency miss) | MEDIUM | Query AuditLog for duplicate `payment_received` entries same day; subtract duplicate amount from `total_payment_amount` via UPDATE; remove duplicate AuditLog entries |
| Refund zeroing `cash_collected` incorrectly | LOW | Recalculate `cash_collected` from AuditLog history; UPDATE Calls with correct value; re-evaluate `call_outcome` |
| View not updated after column addition | LOW | Run `CREATE OR REPLACE VIEW` with new column list; verify Frontend displays correct data |
| Historical `cash_collected` inflated | HIGH | Requires full AuditLog analysis per call to determine first-payment amount; batch UPDATE; test before running on production |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Fuzzy match wrong pool | Three-tier matching implementation | Query with `prospect_name = 'Test User'` against a client with no payers — should return no fuzzy match |
| `cash_collected` semantic shift breaks payment logic | PaymentService dual-column refactor | Send two installments for same prospect; verify `cash_collected` equals first amount, `total_payment_amount` equals sum |
| View not updated | Schema migration | `SELECT total_payment_amount FROM v_calls_joined_flat_prefixed LIMIT 1` — must not error |
| Wrong refund column reduction | PaymentService dual-column refactor | Send installment refund; verify `cash_collected` unchanged, `total_payment_amount` reduced |
| Duplicate installment via retried webhook | Webhook idempotency | Send same payment payload twice; verify `total_payment_amount` incremented only once |
| `closer_credit_attribution` missing | Schema migration | `SELECT closer_credit_attribution FROM Clients LIMIT 1` — must not error |
| Fuzzy threshold too lenient | Fuzzy matching implementation | Send payment with `prospect_name: 'Rob Smith'` when payer is `'Bob Smith'`; confirm no match (distance 1) |
| Installment attributed to wrong call | Matching chain implementation | Send 3 installments for same prospect; verify all three `total_payment_amount` increments land on the same `call_id` |

---

## Sources

- Codebase: `/Users/user/CloserMetrix/Backend/src/services/PaymentService.js` — existing payment logic
- Codebase: `/Users/user/CloserMetrix/Backend/src/db/queries/calls.js` — `findMostRecentShowForProspect` pattern
- Codebase: `/Users/user/CloserMetrix/Backend/CLAUDE.md` — BigQuery view explicit column list constraint, BigQuery DML INSERT pattern
- Project context: `/Users/user/CloserMetrix/.planning/PROJECT.md` — matching chain spec, column semantics, split-pay requirements
- [Fuzzy Matching Common Mistakes — WinPure](https://winpure.com/fuzzy-matching-common-mistakes/)
- [Fuzzy Matching Getting the Balance Right — ICM](https://www.int-comp.org/insight/fuzzy-matching-getting-the-balance-right/)
- [BigQuery Modifying Table Schemas — Google Cloud Documentation](https://cloud.google.com/bigquery/docs/managing-table-schemas)
- [Handling Payment Webhooks Reliably — Medium](https://medium.com/@sohail_saifii/handling-payment-webhooks-reliably-idempotency-retries-validation-69b762720bf5)
- [Implement Webhook Idempotency — Hookdeck](https://hookdeck.com/webhooks/guides/implement-webhook-idempotency)

---
*Pitfalls research for: CloserMetrix payment webhook enhancement (fuzzy matching, split-pay, dual columns)*
*Researched: 2026-02-28*
