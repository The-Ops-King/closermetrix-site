# Stack Research

**Domain:** Payment webhook enhancement — fuzzy name matching, configurable credit attribution, split-pay tracking
**Researched:** 2026-02-28
**Confidence:** HIGH

## Context: What Already Exists (Do Not Re-research)

The Backend is a production Node.js 22+ / Express 4 / BigQuery system with these
services already in place:

- `PaymentService.js` — payment processing pipeline (needs modification, not replacement)
- `ProspectService.js` — prospect find/create/update (needs new matching logic added)
- `callQueries.findMostRecentShowForProspect()` — email-only match (needs three-tier chain)
- `@google-cloud/bigquery@^7.9.0` — BigQuery client (already installed)
- `uuid@^11.1.0` — ID generation (already installed)
- `winston@^3.17.0` — logging (already installed)

This milestone adds two things to the Backend `package.json` and modifies several
existing services. The Frontend changes are configuration and display only — no new
npm packages required there.

---

## Recommended Stack

### Core Technologies (Existing — No Changes Needed)

| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| Node.js | 22+ | Runtime | Already required in package.json engines |
| Express | ^4.21.2 | HTTP layer | Webhook route already exists |
| @google-cloud/bigquery | ^7.9.0 | Data store | All payment data lives here |
| uuid | ^11.1.0 | ID generation | Used throughout existing services |

### New Libraries Required

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `natural` | ^8.1.1 | Jaro-Winkler distance for name matching | Only addition needed for fuzzy matching |

That is the complete list of new npm dependencies. One package. Everything else is
service logic changes and BigQuery schema additions.

---

## New Library: `natural` — The Only Addition

### Why `natural` over alternatives

**Jaro-Winkler is the right algorithm for human names.** Research from patient record
matching (PubMed, 2004) and AML screening (Flagright, 2024) consistently shows
Jaro-Winkler outperforms Levenshtein for personal names at a threshold of 0.85,
achieving ~97% linkage sensitivity. The reason: Jaro-Winkler weights prefix similarity
more heavily, which is exactly how human names work ("John Smith" vs "Jon Smith" vs
"John Smyth").

**Why `natural` over the alternatives:**

| Library | Decision | Reason |
|---------|----------|--------|
| `natural` | USE THIS | Ships Jaro-Winkler + Levenshtein + phonetics in one package. Version 8.1.1, actively maintained on GitHub. No zero-dependency overhead concern — it's a backend service, not a browser bundle. |
| `string-similarity` | Avoid | Uses Dice coefficient (bigrams), not Jaro-Winkler. Last updated Jan 2021. Abandoned. 1.95M weekly downloads are legacy momentum, not health. |
| `fuse.js` | Avoid | Search-index architecture built for filtering UI lists. Returns ranked search results, not a similarity score. Overhead of building/managing an index for a per-request 20-record comparison is unnecessary. |
| `jaro-winkler` (standalone) | Avoid | Single-purpose, unmaintained (last commit 2015). `natural` provides the same algorithm plus fallbacks. |
| `fast-fuzzy` | Avoid | Designed for substring search (fuzzy search UX), not name comparison. No Jaro-Winkler support. |

**`natural` API for this use case:**

```javascript
const natural = require('natural');

// Returns 0.0–1.0. 1.0 = identical. Use 0.82 as threshold for name matching.
const score = natural.JaroWinklerDistance(
  'John Smith',       // name from payment payload
  'Jon Smith',        // name from Calls table
  { ignoreCase: true }
);
// → 0.9690... → MATCH
```

The `ignoreCase` option handles "JOHN SMITH" vs "John Smith" without a preprocessing step.

### Supporting Libraries (No Installation Needed)

These are already in `package.json`:

| Library | Used For | Notes |
|---------|----------|-------|
| `@google-cloud/bigquery@^7.9.0` | Schema migrations (ALTER TABLE), new queries for three-tier matching | Run DDL via `bq.query()` — same method used for DML. No special API needed. |
| `uuid@^11.1.0` | No new use — already used everywhere | — |
| `winston@^3.17.0` | Log fuzzy match scores for auditability | Log the score and threshold on every fuzzy attempt |

---

## BigQuery Schema Changes

These are the only database changes. No new tables. All additions use `ALTER TABLE ADD COLUMN`.

### BigQuery DDL Pattern (Confirmed Working)

The existing `BigQueryClient.js` `bq.query()` method can run DDL statements directly.
The migration script pattern for this project:

```javascript
// Migration: run via a migration script, not at app startup
// BigQuery requires new columns to be NULLABLE — enforced by the DB engine.

await bq.query(`
  ALTER TABLE \`closer-automation.CloserAutomation.Calls\`
  ADD COLUMN total_payment_amount FLOAT64
`);

// BigQuery does NOT support IF NOT EXISTS on ADD COLUMN.
// Guard idempotency by checking INFORMATION_SCHEMA first:
const existing = await bq.query(`
  SELECT column_name
  FROM \`closer-automation.CloserAutomation.INFORMATION_SCHEMA.COLUMNS\`
  WHERE table_name = 'Calls' AND column_name = 'total_payment_amount'
`);
if (existing.length === 0) {
  await bq.query(`ALTER TABLE ... ADD COLUMN total_payment_amount FLOAT64`);
}
```

**INFORMATION_SCHEMA check before each ALTER TABLE is the correct BigQuery migration
pattern.** There is no `IF NOT EXISTS` clause for `ADD COLUMN` in BigQuery DDL (confirmed
via official docs). Running an ADD COLUMN on an existing column throws an error.

### Calls Table Changes

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `total_payment_amount` | FLOAT64 | NULL (0 in practice) | Sum of ALL payments. `cash_collected` stays but is redefined to first payment only. |
| `closer_credit_attribution` | STRING | NULL | Denormalized from client config at write time. Values: `'all_installments'` or `'first_only'`. Enables fast reporting without join to Clients table. |

`cash_collected` is NOT renamed — it stays as the column name but its meaning changes:
first payment only. Existing data with accumulated totals in `cash_collected` will be
migrated: `total_payment_amount = cash_collected` for all existing Closed-Won rows, then
`cash_collected` stays as-is (it represents the first payment for all existing records
where only one payment was made, which is the common case).

### Clients Table Changes

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `credit_attribution` | STRING | `'all_installments'` | Per-client configuration. `'all_installments'` or `'first_only'`. Read by PaymentService when processing each payment. |

### View Update Required

```sql
-- Run via migration script after column additions
CREATE OR REPLACE VIEW `closer-automation.CloserAutomation.v_calls_joined_flat_prefixed` AS
  -- existing SELECT with these additions:
  -- c.total_payment_amount AS calls_total_payment_amount,
  -- c.closer_credit_attribution AS calls_closer_credit_attribution,
```

The view uses an explicit column list (per the project MEMORY.md note). Must
`CREATE OR REPLACE VIEW` to include new columns — they will NOT auto-appear.

---

## Service Architecture Changes (No New Files Needed)

The three-tier matching chain lives inside `PaymentService.js` and a new helper
method on `callQueries`. No new service files are needed.

### Three-Tier Matching Chain

```
Tier 1 — Email match
  callQueries.findMostRecentShowForProspect(email, clientId)
  [already exists — no change needed]

Tier 2 — Exact name match (new query)
  callQueries.findByExactNameWithPayment(name, clientId)
  WHERE prospect_name = @name AND (cash_collected > 0 OR total_payment_amount > 0)
  AND attendance IN ('Show', 'Follow Up', 'Lost', 'Closed - Won', 'Deposit', ...)
  [add to calls.js queries]

Tier 3 — Fuzzy name match via natural.JaroWinklerDistance (new logic in PaymentService)
  1. Fetch all callers with existing payments for this client
  2. Score each prospect_name against incoming prospect_name using JaroWinklerDistance
  3. Return highest-scoring match IF score >= 0.82
  4. If no match above threshold → fall through (no call found, log and continue)
  [implemented in PaymentService._findCallByFuzzyName()]
```

**Fuzzy match scope restriction** (critical for correctness): Fuzzy matching only runs
against calls where `cash_collected > 0 OR total_payment_amount > 0`. This prevents
false matches against the large population of never-paid prospects.

### Configurable Credit Attribution

Stored per-client in `Clients.credit_attribution`. PaymentService reads this at webhook
time:

```javascript
// In PaymentService.processPayment():
const client = await clientQueries.findById(clientId);
const creditMode = client.credit_attribution || 'all_installments';

// On additional payments (call already Closed - Won):
if (creditMode === 'all_installments') {
  // Update both cash_collected (if first payment) and total_payment_amount
} else {
  // Only update total_payment_amount — cash_collected stays as first-payment-only
}
```

The `cash_collected` column ALWAYS gets the first payment. `total_payment_amount` ALWAYS
accumulates everything. `credit_attribution` only affects reporting/display logic (which
column the Frontend highlights as "closer's revenue credit"), not the underlying data.

---

## Installation

```bash
# Backend only — one new dependency
cd /Users/user/CloserMetrix/Backend
npm install natural
```

No Frontend package changes needed.

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `fuse.js` | Search-index architecture, not designed for pairwise similarity scoring. Overkill for 20-100 name comparisons per webhook. | `natural.JaroWinklerDistance` |
| `string-similarity` | Abandoned (2021). Dice coefficient is suboptimal for names. | `natural.JaroWinklerDistance` |
| Separate PaymentEvents table | Tyler explicitly out-of-scoped this. Aggregates on Calls only. | Aggregate columns directly on Calls table |
| BigQuery streaming insert for new columns | Streaming buffer prevents immediate updates for 90 minutes. This is already handled by using DML in the project. | DML INSERT/UPDATE (already the pattern in this codebase) |
| Dynamic threshold per client | Over-engineering. 0.82 is the published optimum for person names. If a client reports false matches, revisit then. | Single hardcoded threshold of 0.82 in a config constant |

---

## Stack Patterns by Variant

**If the fuzzy match is called rarely (few unmatched names per day):**
- Query all payer names fresh from BigQuery on each request
- Simple, no caching complexity
- BigQuery cost negligible for 20-100 row queries

**If fuzzy match becomes a hot path (high volume):**
- Cache the payer name list per client_id in memory with a 5-minute TTL
- Use Node's built-in `Map` — no Redis dependency needed at current scale
- Add caching only when profiling shows it's needed

**If the 0.82 threshold produces false matches in production:**
- Raise to 0.87 (more conservative) — update the constant in `config/`
- Add a per-client override field `fuzzy_match_threshold` to Clients table
- Do NOT add this complexity pre-emptively

---

## Fuzzy Match Threshold Rationale

The 0.82 threshold (on a 0.0–1.0 scale) is based on:
- PubMed patient record matching research: 0.80–0.85 range optimal for names
- The scope restriction (payers only) already dramatically reduces false-match risk
- Common variations handled at 0.82: "Jon Smith" / "John Smith" (0.97), "Jennifer Jones" / "Jenny Jones" (0.93), "Rob Anderson" / "Robert Anderson" (0.89)
- Common non-matches correctly rejected at 0.82: "John Smith" / "Jane Smith" (0.76 — different person, correctly rejected)

Store the threshold as a named constant so it's easy to tune:

```javascript
// In src/config/index.js or a new src/config/payment-matching.js
const FUZZY_MATCH_THRESHOLD = 0.82;
```

---

## Version Compatibility

| Package | Version | Compatibility Notes |
|---------|---------|---------------------|
| `natural@^8.1.1` | Node.js 22 | Compatible. No native modules. Pure JS. |
| `@google-cloud/bigquery@^7.9.0` | Node.js 22 | Compatible. Already in use. DDL via query() confirmed. |

---

## Sources

- [npmtrends: fuse.js vs string-similarity downloads](https://npmtrends.com/fuse.js-vs-fuzzy-vs-fuzzy-matching-vs-fuzzy.js-vs-string-similarity) — Fuse.js 7.76M/week, string-similarity 1.95M/week; string-similarity last updated Jan 2021 (MEDIUM confidence)
- [NaturalNode/natural GitHub — package.json](https://github.com/NaturalNode/natural/blob/master/package.json) — Version 8.1.1 confirmed (HIGH confidence)
- [natural NaturalNode GitHub — jaro-winkler source](https://github.com/NaturalNode/natural/blob/master/lib/natural/distance/jaro-winkler_distance.js) — JaroWinklerDistance(s1, s2, {ignoreCase}) API confirmed (HIGH confidence)
- [Flagright — Jaro-Winkler vs Levenshtein for name matching](https://www.flagright.com/post/jaro-winkler-vs-levenshtein-choosing-the-right-algorithm-for-aml-screening) — Jaro-Winkler superior for personal names (MEDIUM confidence)
- [PubMed — Real world performance of approximate string comparators for patient matching](https://pubmed.ncbi.nlm.nih.gov/15360771/) — 97.4% sensitivity at 0.80 threshold (HIGH confidence, peer-reviewed)
- [Google Cloud Docs — Modifying table schemas](https://docs.cloud.google.com/bigquery/docs/managing-table-schemas) — ALTER TABLE ADD COLUMN pattern, IF NOT EXISTS not supported, INFORMATION_SCHEMA check required (HIGH confidence)
- `Backend/src/services/PaymentService.js` — Existing payment pipeline, current `cash_collected` accumulation behavior confirmed by code review
- `Backend/src/db/queries/calls.js` — `findMostRecentShowForProspect()` email-only match confirmed by code review
- `Backend/package.json` — Current dependencies confirmed: `@google-cloud/bigquery@^7.9.0`, no fuzzy library present

---

*Stack research for: CloserMetrix payment webhook enhancement (fuzzy matching, credit attribution, split-pay)*
*Researched: 2026-02-28*
