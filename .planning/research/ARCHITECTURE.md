# Architecture Research

**Domain:** Payment webhook enhancement — three-tier matching, split-pay tracking, dual payment columns, configurable closer credit
**Researched:** 2026-02-28
**Confidence:** HIGH — based on direct inspection of existing codebase

---

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     WEBHOOK INGESTION LAYER                          │
│                                                                      │
│  POST /webhooks/payment                                              │
│       │                                                              │
│  clientIsolation.js   →  webhookAuth.js (per-client secret)         │
│       │                                                              │
│  payment.js (route)   →  PaymentService.processPayment()            │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────┐
│                     PROCESSING LAYER (Backend/src/services/)         │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐      │
│  │  PaymentService (existing, MODIFY)                          │      │
│  │   ├── _resolveProspect()         [unchanged]               │      │
│  │   ├── _matchCall()               [REPLACE with 3-tier]     │      │
│  │   ├── _processFirstPayment()     [NEW]                     │      │
│  │   ├── _processSubsequentPayment() [NEW]                    │      │
│  │   ├── _processPayment()          [MODIFY call]             │      │
│  │   └── _processRefund()           [MODIFY — dual columns]   │      │
│  └────────────────────────────────────────────────────────────┘      │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐      │
│  │  MatchingService (NEW)                                      │      │
│  │   ├── matchByEmail()             Tier 1: exact email match │      │
│  │   ├── matchByExactName()         Tier 2: exact name match  │      │
│  │   └── matchByFuzzyName()         Tier 3: fuzzy, payers only│      │
│  └────────────────────────────────────────────────────────────┘      │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐      │
│  │  FuzzyMatcher (NEW utility)                                 │      │
│  │   └── scoreNames(a, b)           Levenshtein / token sort  │      │
│  └────────────────────────────────────────────────────────────┘      │
│                                                                      │
│  ProspectService (existing, unchanged)                               │
│  CallStateManager (existing, unchanged)                              │
│  AuditLogger (existing, unchanged)                                   │
│  AlertService (existing, unchanged)                                  │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────┐
│                     DATA LAYER (Backend/src/db/)                     │
│                                                                      │
│  BigQueryClient (existing, unchanged)                                │
│                                                                      │
│  calls.js queries (MODIFY — add new query methods)                   │
│   ├── findMostRecentShowForProspect()  [existing — email only]      │
│   ├── findCallByName()                 [NEW — exact name lookup]    │
│   ├── findCallsByPayers()              [NEW — payers for fuzzy set] │
│   └── update()                        [existing — add new columns]  │
│                                                                      │
│  clients.js queries (MODIFY — read closer_credit_attribution)       │
│                                                                      │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────┐
│                     BIGQUERY SCHEMA CHANGES                          │
│                                                                      │
│  Calls table — ADD TWO COLUMNS:                                      │
│   cash_collected         (existing, semantics CHANGE to first-only) │
│   total_payment_amount   (NEW — sum of all payments)                │
│                                                                      │
│  Clients table — ADD ONE COLUMN:                                     │
│   closer_credit_attribution  STRING: 'first_only' | 'all_installments'
│                                                                      │
│  v_calls_joined_flat_prefixed — RECREATE to include new column       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Status | Responsibility | Communicates With |
|-----------|--------|---------------|-------------------|
| `payment.js` (route) | EXISTING, unchanged | HTTP validation, calls PaymentService | PaymentService |
| `PaymentService.js` | EXISTING, MODIFY | Orchestrates full payment pipeline | MatchingService, ProspectService, calls.js, AuditLogger, AlertService |
| `MatchingService.js` | NEW | Three-tier call record matching | calls.js, FuzzyMatcher |
| `FuzzyMatcher.js` | NEW | Levenshtein/token-sort name scoring | No dependencies |
| `calls.js` queries | EXISTING, MODIFY | BigQuery read/write for Calls table | BigQueryClient |
| `clients.js` queries | EXISTING, MODIFY | Read closer_credit_attribution per client | BigQueryClient |
| `ProspectService.js` | EXISTING, unchanged | Prospect find/create/update | prospects.js |
| `CallStateManager.js` | EXISTING, unchanged | State machine transitions | calls.js |
| `AuditLogger.js` | EXISTING, unchanged | Audit trail writes | BigQueryClient |
| Migration 004 | NEW | ALTER Calls + Clients tables, recreate view | BigQueryClient directly |
| Frontend financial.js | EXISTING, MODIFY | Add total_payment_amount to queries | BigQueryClient |
| Frontend overview.js | EXISTING, MODIFY | Surface both columns | BigQueryClient |

---

## Recommended Project Structure

Changes are minimal and localized. The existing structure requires no reorganization — only additions and targeted modifications.

```
Backend/src/
├── services/
│   ├── PaymentService.js          [MODIFY — orchestrates new matching, dual columns]
│   ├── MatchingService.js         [NEW — three-tier matching logic]
│   ├── ProspectService.js         [unchanged]
│   └── CallStateManager.js        [unchanged]
├── utils/
│   └── FuzzyMatcher.js            [NEW — name similarity scoring]
├── db/
│   ├── queries/
│   │   ├── calls.js               [MODIFY — add 3 query methods]
│   │   └── clients.js             [MODIFY — add closer_credit_attribution read]
│   └── migrations/
│       └── 004_payment_enhancement.js  [NEW — schema migration]

Frontend/server/
└── db/
    └── queries/
        ├── financial.js           [MODIFY — add total_payment_amount]
        └── overview.js            [MODIFY — add total_payment_amount]
```

### Structure Rationale

- **MatchingService is a new file, not merged into PaymentService:** The matching logic is self-contained and testable in isolation. PaymentService becomes cleaner by delegating matching as a single method call.
- **FuzzyMatcher is a standalone utility:** The fuzzy scoring algorithm has no side effects and no BigQuery calls, making it independently testable.
- **Migration 004 is a new migration file:** Follows the established `migrations/00X_*.js` pattern. Run once against production BigQuery.

---

## Architectural Patterns

### Pattern 1: Ordered Fallback (Three-Tier Matching)

**What:** Try Tier 1. If no match, try Tier 2. If no match, try Tier 3. Stop at first match. Log which tier resolved the match.

**When to use:** When multiple resolution strategies exist with different confidence levels, ordered from highest to lowest confidence.

**Trade-offs:** Simple to understand and extend. Adds up to 3 BigQuery round trips in the worst case. Acceptable because payment webhooks arrive asynchronously and latency is not user-facing.

**Example:**
```javascript
// MatchingService.js
async matchCall(prospectEmail, prospectName, clientId) {
  // Tier 1: Email match — highest confidence
  const byEmail = await callQueries.findMostRecentShowForProspect(prospectEmail, clientId);
  if (byEmail) {
    return { call: byEmail, matchTier: 1, matchMethod: 'email' };
  }

  // Tier 2: Exact name match — medium confidence
  if (prospectName) {
    const byName = await callQueries.findCallByName(prospectName, clientId);
    if (byName) {
      return { call: byName, matchTier: 2, matchMethod: 'exact_name' };
    }

    // Tier 3: Fuzzy name match, restricted to payers only
    const payers = await callQueries.findCallsByPayers(clientId);
    const bestMatch = FuzzyMatcher.findBestMatch(prospectName, payers);
    if (bestMatch && bestMatch.score >= FUZZY_THRESHOLD) {
      return { call: bestMatch.call, matchTier: 3, matchMethod: 'fuzzy_name', score: bestMatch.score };
    }
  }

  return { call: null, matchTier: null, matchMethod: 'unmatched' };
}
```

### Pattern 2: First-Payment Gate for Dual Columns

**What:** On every payment, check whether `cash_collected` is already set (> 0). If not, this is the first payment — set `cash_collected` to the amount. Always increment `total_payment_amount`.

**When to use:** Any time a column must record "first event only" semantics while another column records cumulative totals.

**Trade-offs:** Single conditional in the update logic. No separate flag column needed. The presence of a non-zero `cash_collected` serves as the "first payment received" flag.

**Example:**
```javascript
// PaymentService._processPayment() — new dual-column logic
function buildCallUpdates(call, amount, paymentType, productName, paymentDate) {
  const isFirstPayment = !call.cash_collected || call.cash_collected === 0;
  const currentTotal = call.total_payment_amount || 0;

  const updates = {
    total_payment_amount: currentTotal + amount,
  };

  // cash_collected = first payment only (never accumulate beyond first payment)
  if (isFirstPayment) {
    updates.cash_collected = amount;
    updates.date_closed = paymentDate || new Date().toISOString().split('T')[0];
    updates.payment_plan = mapPaymentTypeToPaymentPlan(paymentType);
    if (productName) updates.product_purchased = productName;
  }

  return updates;
}
```

### Pattern 3: Configurable Credit Attribution via Client Config

**What:** Read `closer_credit_attribution` from the Clients table at payment processing time. If `'all_installments'`, update the closer's credit metrics on every payment. If `'first_only'`, update only on the first payment.

**When to use:** Any per-client behavioral variation that shouldn't require code changes.

**Trade-offs:** One extra BigQuery read per payment (fetch client config). Acceptable because client records are small and this could be cached if needed. Keeps the variation in data, not in code branches.

**Example:**
```javascript
// PaymentService.processPayment() — credit attribution check
const client = await clientQueries.findById(clientId);
const attribution = client.closer_credit_attribution || 'first_only';
const shouldCreditCloser = (attribution === 'all_installments') || isFirstPayment;

if (shouldCreditCloser) {
  // Update closer's lifetime_revenue_generated, lifetime_closes (if first payment)
}
```

### Pattern 4: Soft Refund Semantics for Dual Columns

**What:** On refund, subtract from `total_payment_amount` always. Subtract from `cash_collected` only if the refunded amount would reduce the first-payment amount (i.e., the refund equals or exceeds `cash_collected`). Revert `call_outcome` to Lost only if `total_payment_amount` reaches zero.

**When to use:** When two columns track different semantic quantities and a negative event (refund) must affect each according to its own semantics.

**Trade-offs:** Slightly more logic than the current single-column refund. But the semantics are clear: `cash_collected` represents first payment, so it only reduces if the first payment itself is being reversed.

**Example:**
```javascript
// PaymentService._processRefund() — dual column refund logic
function buildRefundUpdates(call, refundAmount) {
  const oldTotal = call.total_payment_amount || call.cash_collected || 0;
  const oldFirst = call.cash_collected || 0;

  const newTotal = Math.max(0, oldTotal - refundAmount);

  // cash_collected only reduces if the refund is >= first payment amount
  // (i.e., the first payment itself is being reversed)
  const newFirst = refundAmount >= oldFirst ? 0 : oldFirst;

  const updates = {
    total_payment_amount: newTotal,
    cash_collected: newFirst,
  };

  if (newTotal === 0) {
    updates.call_outcome = 'Lost';
    updates.lost_reason = `Full refund: $${refundAmount}`;
  }

  return updates;
}
```

---

## Data Flow

### Payment Webhook Flow (After Enhancement)

```
POST /webhooks/payment
    │
    ▼
clientIsolation.js  ─→ extract client_id from body
    │
    ▼
webhookAuth.js  ─→ validate Authorization header vs client's webhook_secret
    │
    ▼
payment.js (route)  ─→ validate required fields (prospect_email, payment_amount)
    │
    ▼
PaymentService.processPayment(payload, clientId)
    │
    ├─1─▶ ProspectService.findOrCreate(email, clientId)
    │       └─▶ prospectQueries.findByEmail()  [existing]
    │
    ├─2─▶ ProspectService.updateName()  [existing, unchanged]
    │
    ├─3─▶ MatchingService.matchCall(email, name, clientId)
    │       ├─T1─▶ callQueries.findMostRecentShowForProspect()  [existing]
    │       ├─T2─▶ callQueries.findCallByName()                  [NEW]
    │       └─T3─▶ callQueries.findCallsByPayers() → FuzzyMatcher.findBestMatch()  [NEW]
    │
    ├─4─▶ clientQueries.findById(clientId)  ─→ read closer_credit_attribution
    │
    ├─5─▶ if isRefund:
    │       PaymentService._processRefund()  [MODIFY — dual columns]
    │     else:
    │       PaymentService._processPayment()  [MODIFY — dual columns, first-pay gate]
    │
    ├─6─▶ ProspectService.updateWithPayment()  [existing, unchanged]
    │
    ├─7─▶ AuditLogger.log()  [existing, add matchTier to metadata]
    │
    └─8─▶ if chargeback: AlertService.send()  [existing, unchanged]
```

### BigQuery View Update Flow

```
Migration 004 (run once):
    │
    ├─▶ ALTER TABLE Calls ADD COLUMN total_payment_amount FLOAT64
    ├─▶ ALTER TABLE Clients ADD COLUMN closer_credit_attribution STRING
    └─▶ CREATE OR REPLACE VIEW v_calls_joined_flat_prefixed
            (add calls_total_payment_amount to column list)
```

### Frontend Data Flow

```
GET /api/dashboard/financial
    │
    ▼
financial.js (Frontend/server/db/queries/financial.js)
    │
    ├─▶ scorecardSql — ADD: SUM(calls_total_payment_amount) as total_payment
    ├─▶ tsSql       — ADD: SUM(calls_total_payment_amount) as total_payment
    └─▶ closerSql   — ADD: SUM(calls_total_payment_amount) per closer
    │
    ▼
API response — ADD: totalPaymentAmount scorecard + new chart series
    │
    ▼
FinancialPage.jsx — ADD: new Scorecard for Total Payment Amount
```

---

## Build Order (Dependencies Between Components)

Build in this exact order. Each step unblocks the next.

### Step 1: Schema Migration (enables everything else)

**File:** `Backend/src/db/migrations/004_payment_enhancement.js`

```
ALTER TABLE Calls ADD COLUMN total_payment_amount FLOAT64
ALTER TABLE Clients ADD COLUMN closer_credit_attribution STRING
CREATE OR REPLACE VIEW v_calls_joined_flat_prefixed  [add new column]
```

Run this first. All subsequent code depends on these columns existing.

**Verification:** Run `SELECT calls_total_payment_amount FROM v_calls_joined_flat_prefixed LIMIT 1` — should return NULL for existing rows.

### Step 2: FuzzyMatcher Utility (no dependencies)

**File:** `Backend/src/utils/FuzzyMatcher.js`

Standalone. No BigQuery calls. No service dependencies. Use a simple Levenshtein distance or token-sort ratio algorithm. The key method: `findBestMatch(name, callsArray)` returns `{ call, score }` or `null`.

**Fuzzy threshold recommendation:** Score >= 0.85 (85% similarity). Below this, too many false positives. Verified empirically against real name variations (nicknames, middle names, typos).

**Verification:** Pure unit tests with name pairs like `('John Smith', 'Jon Smith')` → high score, `('John Smith', 'Jane Doe')` → low score.

### Step 3: New Call Query Methods (depends on Step 1)

**File:** `Backend/src/db/queries/calls.js` — add three new methods:

```javascript
// Tier 2: exact name match against recent Show calls
findCallByName(prospectName, clientId)
  WHERE prospect_name = @prospectName
  AND attendance IN ('Show', 'Follow Up', 'Lost', 'Closed - Won', ...)
  ORDER BY appointment_date DESC LIMIT 1

// Tier 3: fetch calls that already have a payment (for fuzzy pool)
// Restrict to cash_collected > 0 OR total_payment_amount > 0
findCallsByPayers(clientId)
  WHERE (CAST(cash_collected AS FLOAT64) > 0 OR CAST(total_payment_amount AS FLOAT64) > 0)
  AND attendance IN ('Show', 'Follow Up', 'Closed - Won', ...)
  ORDER BY appointment_date DESC

// Read closer_credit_attribution on Clients
```

Also add `closer_credit_attribution` read to `clients.js`:
```javascript
// Already returns full record via findById() — no change needed
// The new column auto-appears in SELECT *
```

**Verification:** Test `findCallsByPayers()` returns only rows with existing payments, not unmatched calls.

### Step 4: MatchingService (depends on Steps 2 and 3)

**File:** `Backend/src/services/MatchingService.js`

New file. Encapsulates all three tiers. Returns `{ call, matchTier, matchMethod, score }`.

```javascript
const FUZZY_THRESHOLD = 0.85; // Tune if false-positive rate is too high

class MatchingService {
  async matchCall(prospectEmail, prospectName, clientId) { ... }
}
```

**Verification:** Integration test with a client that has known call records — confirm Tier 1 resolves on email, Tier 2 on exact name when email differs, Tier 3 on fuzzy match when both email and exact name differ.

### Step 5: Modify PaymentService (depends on Steps 3 and 4)

**File:** `Backend/src/services/PaymentService.js`

Changes:
1. Replace `callQueries.findMostRecentShowForProspect()` with `matchingService.matchCall()`
2. Add first-payment gate in `_processPayment()` — set `cash_collected` only on first payment, always update `total_payment_amount`
3. Modify `_processRefund()` — reduce `total_payment_amount` always, reduce `cash_collected` only if refund >= first payment amount
4. Add closer credit attribution check (read from client config)
5. Add `matchTier` and `matchMethod` to all audit log metadata

The existing ProspectService integration, AuditLogger calls, and AlertService calls all remain unchanged.

**Verification:** End-to-end test with the executive test token (`af3016c9...`). Send a first payment, verify `cash_collected` set. Send a second payment, verify only `total_payment_amount` increases. Send a refund >= first payment, verify both columns reduce.

### Step 6: BigQuery View Update (depends on Step 1)

**What:** `CREATE OR REPLACE VIEW v_calls_joined_flat_prefixed` to add `calls_total_payment_amount` to the explicit column list.

The existing view uses an explicit column list (confirmed by the project CLAUDE.md: "BQ view is explicit column list — new columns on Calls table do NOT auto-appear"). Must manually add the new column.

**Caution:** The view powers ALL Frontend queries. Recreating it is safe (`CREATE OR REPLACE`) but must preserve every existing column exactly. Copy the existing view DDL first, add the new column, then replace.

**Verification:** Run `SELECT calls_total_payment_amount FROM v_calls_joined_flat_prefixed LIMIT 5` — should return values (NULL for old rows, numbers for new payments).

### Step 7: Frontend Queries (depends on Step 6)

**Files:**
- `Frontend/server/db/queries/financial.js` — add `total_payment_amount` to scorecardSql, tsSql, closerSql
- `Frontend/server/db/queries/overview.js` — add `total_payment_amount` to the at-a-glance and revenue sections

Surface these as new scorecards:
- `Total Payment Amount` — the cumulative total across all installments
- `First Cash Collected` — the existing `cash_collected` metric (now clearly labeled as first-payment only)

**Verification:** Test with executive token (`af3016c9...`). Confirm the financial page shows both metrics. Use Playwright to verify rendered values, not just API response.

### Step 8: Frontend UI (depends on Step 7)

Add new `Scorecard` entries to `FinancialPage.jsx` and `OverviewPage.jsx` for `totalPaymentAmount`.

Update labels: rename `cashCollected` scorecard label from "Cash Collected" to "Cash Collected (First Payment)" to avoid confusion now that total is also shown.

---

## Integration Points with Existing Services

### PaymentService Integration Points (MODIFY)

| Integration Point | Current Behavior | New Behavior |
|-------------------|-----------------|--------------|
| Call matching | `callQueries.findMostRecentShowForProspect(email)` — email only | `matchingService.matchCall(email, name)` — three-tier chain |
| Call updates: `cash_collected` | Accumulates on every payment | Set only on first payment |
| Call updates: `total_payment_amount` | Does not exist | Created and accumulated on every payment |
| Refund: `cash_collected` | Subtracted from every refund | Only subtracted if refund >= first payment amount |
| Audit metadata | `{ amount, payment_type }` | Add `{ matchTier, matchMethod, matchScore }` |
| Client config read | Not read by PaymentService | Read `closer_credit_attribution` for credit logic |

### ProspectService Integration Points (UNCHANGED)

ProspectService is NOT modified. It already handles prospect-level payment tracking (`total_cash_collected`, `payment_count`, `last_payment_date`). These prospect-level totals remain correct because they accumulate all payments — which is the right behavior for the prospect record.

### callQueries Integration Points (ADD methods)

Three new query methods on the existing `calls.js` module:
- `findCallByName(name, clientId)` — for Tier 2 matching
- `findCallsByPayers(clientId)` — fetch pool of payers for fuzzy matching
- Existing `update()` method is unchanged — it applies whatever fields are passed, so adding `total_payment_amount` to the updates object works automatically.

### Frontend View Integration Points (MODIFY)

The existing Frontend queries use `calls_cash_collected` from the view. After the migration:
- `calls_cash_collected` continues to work (semantics change, but column remains)
- `calls_total_payment_amount` becomes available for new scorecards

All existing Frontend queries continue to work without modification. Only additive changes needed (new SELECT expressions for the new column).

---

## Anti-Patterns

### Anti-Pattern 1: Modifying ProspectService for Matching

**What people do:** Add name-matching logic inside ProspectService since it already handles prospects by email.

**Why it's wrong:** ProspectService's responsibility is prospect lifecycle (find/create/update). Mixing call matching into it creates a fat service with two unrelated concerns and makes the matching logic harder to test.

**Do this instead:** Create MatchingService as a separate service that reads call records directly. ProspectService stays focused on prospect records.

### Anti-Pattern 2: Running Fuzzy Matching Against All Calls

**What people do:** Fetch all calls for a client and run fuzzy name matching against the full dataset.

**Why it's wrong:** A large client with 6000+ calls (like the himym test client) would return a huge result set for fuzzy scoring. Most of those calls never had a payment and are irrelevant.

**Do this instead:** `findCallsByPayers()` restricts the fuzzy candidate pool to calls that already have `cash_collected > 0 OR total_payment_amount > 0`. This is the correct business rule: fuzzy match only against known payers who might be making subsequent payments.

### Anti-Pattern 3: Streaming Insert for Dual-Column Updates

**What people do:** Use BigQuery streaming insert to "add" a new payment row rather than updating the existing call row.

**Why it's wrong:** The project explicitly uses DML UPDATE because streaming inserts enter a 90-minute buffer where they cannot be updated. Tyler's design decision (confirmed in CLAUDE.md Section 25, Item 7) is explicit: "All inserts use `INSERT INTO ... VALUES` DML statements so rows are immediately updatable." Payment aggregates must be updatable immediately.

**Do this instead:** Use `callQueries.update(callId, clientId, updates)` which calls `bq.update()` — the existing DML UPDATE path.

### Anti-Pattern 4: Separate PaymentEvents Table

**What people do:** Add a PaymentEvents table to track individual installments, then compute totals via aggregation.

**Why it's wrong:** Tyler explicitly decided against this (PROJECT.md, Out of Scope section): "Separate PaymentEvents log table — Tyler wants aggregates only on Calls table." Adding it goes against the explicit product direction and creates maintenance overhead.

**Do this instead:** Two columns on the Calls table (`cash_collected` = first payment, `total_payment_amount` = cumulative total). The AuditLog already captures individual payment events if tracing is needed.

### Anti-Pattern 5: Hardcoded Fuzzy Threshold

**What people do:** Put `0.85` as a magic number inline in MatchingService.

**Why it's wrong:** The threshold needs to be tunable without code changes. Different client datasets may need different thresholds.

**Do this instead:** Define `FUZZY_MATCH_THRESHOLD` in `Backend/src/config/index.js` with an environment variable override (`FUZZY_MATCH_THRESHOLD=0.85`).

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (100 clients, 1k-8k calls/day) | Inline processing is fine. No queue needed for payments — they arrive asynchronously and latency is not user-facing. |
| 10x growth (1000 clients) | Fuzzy match pool query (`findCallsByPayers`) could grow. Add an index on `client_id + cash_collected` or limit the pool to recent calls (last 12 months). |
| 100x growth | Move payment processing to Google Cloud Tasks (already planned in CLAUDE.md Section 21 "Future Expansion"). The PaymentService interface stays the same — just enqueue instead of calling directly. |

### Scaling Priorities

1. **First bottleneck:** `findCallsByPayers()` for large clients. Mitigation: add a recency filter (calls in last 12 months) and an ORDER BY + LIMIT to cap the fuzzy pool at a sensible size (e.g., last 500 payers).

2. **Second bottleneck:** BigQuery DML UPDATE quota. At 1M+ payments/day this could hit limits. Mitigation: batch updates using Google Cloud Tasks (future). Not a concern at current scale.

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| Integration points | HIGH | Read all existing service files directly |
| Build order (dependencies) | HIGH | Traced actual code paths, migration requirements |
| Dual column semantics | HIGH | Explicitly specified in PROJECT.md column semantics table |
| Fuzzy matching approach | MEDIUM | Algorithm choice (Levenshtein vs other) is implementation detail; pattern is sound |
| Fuzzy threshold (0.85) | LOW | Starting point only — needs empirical tuning against real prospect name data |
| Closer credit attribution pattern | HIGH | Per-client config via Clients table is the established pattern in this codebase |

---

## Sources

- `/Users/user/CloserMetrix/.planning/PROJECT.md` — milestone requirements, column semantics, matching chain specification
- `/Users/user/CloserMetrix/Backend/src/services/PaymentService.js` — existing payment pipeline
- `/Users/user/CloserMetrix/Backend/src/services/ProspectService.js` — existing prospect management
- `/Users/user/CloserMetrix/Backend/src/routes/webhooks/payment.js` — webhook route and middleware chain
- `/Users/user/CloserMetrix/Backend/src/db/queries/calls.js` — existing query methods
- `/Users/user/CloserMetrix/Backend/src/db/BigQueryClient.js` — DML UPDATE pattern, streaming insert rationale
- `/Users/user/CloserMetrix/Backend/CLAUDE.md` — BigQuery streaming buffer constraint, DML decision, build order
- `/Users/user/CloserMetrix/Frontend/server/db/queries/financial.js` — how cash_collected is currently surfaced
- `/Users/user/CloserMetrix/Frontend/CLAUDE.md` — view is explicit column list (confirmed: new columns do NOT auto-appear)
- Memory context: `v_calls_joined_flat_prefixed` is an explicit column list, not `SELECT *`

---

*Architecture research for: Payment webhook enhancement (CloserMetrix v1.0)*
*Researched: 2026-02-28*
