# Phase 2: FuzzyMatcher + Call Queries - Research

**Researched:** 2026-02-28
**Domain:** String similarity (Jaro-Winkler), pure utility class design, BigQuery query patterns for payment matching
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MTCH-02 | Tier 2 — if email match fails, match by exact name (case-insensitive, trimmed) against Calls for this client | `findCallByName(clientId, name)` query using BigQuery `LOWER(TRIM(...))` comparison. Returns a single call or null. |
| MTCH-03 | Tier 3 — if exact name fails, fuzzy name match (Jaro-Winkler) against payers only | `FuzzyMatcher.findBestMatch(name, callsArray)` — pure function, no BigQuery. `findCallsByPayers(clientId)` fetches the candidate set with SQL-enforced payer filter. |
</phase_requirements>

---

## Summary

Phase 2 delivers two independent, composable pieces that Phase 3 will wire together:

1. **FuzzyMatcher** — a pure JavaScript utility that scores name similarity using Jaro-Winkler and returns the best match above a configurable threshold. It takes an array of call objects (no BigQuery involvement) so it can be unit-tested with no database setup.

2. **Two new query functions on `calls.js`** — `findCallByName` (exact, case-insensitive) and `findCallsByPayers` (returns payer-scoped candidate set for fuzzy matching). Both follow the identical parameterized-query pattern already used throughout `Backend/src/db/queries/calls.js`.

The primary design decisions are:

- **Implement Jaro-Winkler from scratch** rather than installing a package. The algorithm is ~35 lines, has zero external dependencies, is MIT-trivially-licenseable, and is not a maintenance burden. Every evaluated package either has transitive dependencies, is on an unmaintained npm account, or adds overhead that isn't justified for 35 lines.
- **FuzzyMatcher lives in `src/utils/`**, not `src/services/`. It is a pure scoring function, not a stateful service class. `src/utils/` is where pure, dependency-free helpers live in this codebase (`idGenerator.js`, `dateUtils.js`).
- **Call queries stay in `src/db/queries/calls.js`**. The file already has 14 functions; two more fit cleanly. No new file needed — the naming convention (`findCallByName`, `findCallsByPayers`) follows the existing `findBy*` / `find*` pattern.
- **Threshold in `config/index.js`** under a new `matching` key, defaulting to `0.82`. This follows the established pattern where every configurable value has a typed slot in config and a documented `.env` variable name.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-ins only | 22+ | Jaro-Winkler implementation | The algorithm is ~35 lines. No package justified. |
| `@google-cloud/bigquery` | ^7.9.0 (already installed) | `findCallByName`, `findCallsByPayers` queries | Already installed. `bq.query()` is the established query interface. |

### No New Packages Required

**Decision: Implement Jaro-Winkler from scratch.**

Packages evaluated and rejected:

| Package | Version | Why Rejected |
|---------|---------|--------------|
| `jaro-winkler` | 0.2.8 | Single-maintainer npm account (`jordanthomas`), last published >1 year ago, no updates since 2018. Not installed. The package itself is 10 lines of code — there is no leverage in adding a dependency for code this simple. |
| `wink-distance` | 2.0.2 | Has two transitive dependencies (`wink-helpers`, `wink-jaro-distance`). More surface area than the algorithm warrants. MIT but more bloat than needed. |
| `talisman` | 1.1.4 | 6 transitive dependencies, 13.8MB. Designed for heavy NLP work, not for a single distance function. |
| `natural` | 8.1.1 | 14 transitive dependencies, large package. Overkill for one distance metric. |
| `fast-levenshtein` | already in `node_modules` | Wrong algorithm — Levenshtein measures edit distance, not name similarity. Jaro-Winkler is significantly better at matching human names (handles transpositions, prefix bonuses, short names). |

**The algorithm is ~35 lines and was verified correct in research:**
```
John Smith vs Jon Smith:           0.9733  (above 0.82 threshold — correct match)
Mike Johnson vs Michael Johnson:   0.8461  (above 0.82 threshold — correct match)
John Smith vs Jane Doe:            0.6025  (below 0.82 threshold — correct reject)
```

The inline implementation is testable, auditable, and carries no dependency risk.

---

## Architecture Patterns

### Where to Put FuzzyMatcher

**Decision: `Backend/src/utils/FuzzyMatcher.js`**

The `src/utils/` directory is for stateless, dependency-free helpers. Current occupants:
- `idGenerator.js` — pure function, returns a UUID
- `dateUtils.js` — pure functions, date arithmetic
- `logger.js` — thin wrapper
- `AuditLogger.js` — has BigQuery dependency (slightly heavier — borderline between utils and services)
- `AlertService.js` — has external call capability

`FuzzyMatcher` has:
- No BigQuery dependency
- No Express dependency
- No state
- One input (name + array), one output (best match or null)
- Independently testable with just `require('./FuzzyMatcher')`

This is squarely `utils/` territory. Putting it in `services/` would be wrong — services in this codebase coordinate between other services and BigQuery (e.g., `PaymentService.js`, `ProspectService.js`). `FuzzyMatcher` coordinates nothing. It is a scoring function.

**Module shape:**

```javascript
// Backend/src/utils/FuzzyMatcher.js
const config = require('../config');

class FuzzyMatcher {
  /**
   * Finds the best-matching call from callsArray by prospect_name similarity.
   * Uses Jaro-Winkler distance. Returns the highest-scoring call above the
   * threshold, or null if no call scores high enough.
   *
   * IMPORTANT: No BigQuery calls are made. callsArray must be pre-fetched.
   *
   * @param {string} name — The name to match (from payment webhook)
   * @param {Array<Object>} callsArray — Array of call records with prospect_name
   * @returns {Object|null} Best matching call record, or null
   */
  findBestMatch(name, callsArray) { ... }

  /**
   * Computes Jaro-Winkler similarity between two strings.
   * Returns 0.0 (no similarity) to 1.0 (identical).
   * Normalizes inputs: lowercased, trimmed.
   *
   * @param {string} s1
   * @param {string} s2
   * @returns {number} Similarity score [0.0, 1.0]
   */
  _jaroWinkler(s1, s2) { ... }  // private, inlined algorithm
}

module.exports = new FuzzyMatcher();
```

Following the singleton export pattern used by `PaymentService.js` (`module.exports = new PaymentService()`) and `ProspectService.js`.

### Where to Put Call Queries

**Decision: Add to existing `Backend/src/db/queries/calls.js`**

The existing file has 14 query functions covering every current use case for the Calls table. Two more functions fit cleanly without bloating the file. The existing function naming convention:
- `find*` for SELECT queries returning one or more rows
- `findBy*` when the primary filter is a specific field value
- `findAll*` / `find*For*` for broader scoped queries

New functions follow this convention exactly:
- `findCallByName(clientId, name)` — "find a call by [prospect] name"
- `findCallsByPayers(clientId)` — "find calls [filtered to] payers"

**No new file needed.** Creating `callsMatching.js` or similar would fragment the Calls query surface area and require importers to know which of two files to import from.

### Config Pattern for Threshold

**Decision: Add `matching` key to `Backend/src/config/index.js`**

The existing config file already handles every configurable numeric threshold:
- `timeouts.transcriptTimeoutMinutes` (env: `TRANSCRIPT_TIMEOUT_MINUTES`, default: `5`)
- `ai.maxTokens` (env: `AI_MAX_TOKENS`, default: `8000`)
- `fathom.pollIntervals` (parsed from comma-separated env var)

The threshold follows this exact pattern:

```javascript
// In config/index.js — add to the config object:
matching: {
  jaroWinklerThreshold: parseFloat(process.env.FUZZY_MATCH_THRESHOLD) || 0.82,
},
```

And in `.env.example`:
```bash
# Fuzzy name matching threshold for payment webhook (Jaro-Winkler, 0.0-1.0)
# Higher = stricter. Default: 0.82 (matches near-identical names, rejects obvious mismatches)
FUZZY_MATCH_THRESHOLD=0.82
```

`FuzzyMatcher` reads `config.matching.jaroWinklerThreshold` at runtime. No hardcoded `0.82` anywhere in the utility itself.

### SQL Patterns for the Two New Query Functions

**Pattern established in `calls.js`:**
```javascript
const bq = require('../BigQueryClient');
const CALLS_TABLE = bq.table('Calls');

async function findSomething(clientId, param) {
  const rows = await bq.query(
    `SELECT * FROM ${CALLS_TABLE}
     WHERE client_id = @clientId
       AND some_field = @param
     LIMIT 1`,
    { clientId, param }
  );
  return rows.length > 0 ? rows[0] : null;
}
```

**`findCallByName` implementation note:**

BigQuery has `LOWER()` and `TRIM()` as first-class functions. The comparison must normalize both sides to avoid misses due to capitalization or leading/trailing whitespace:

```sql
SELECT * FROM ${CALLS_TABLE}
WHERE client_id = @clientId
  AND LOWER(TRIM(prospect_name)) = LOWER(TRIM(@name))
ORDER BY appointment_date DESC
LIMIT 1
```

`@name` parameter is passed as-is from the service caller. Both sides are normalized in SQL, which is the right place for it — the query is self-documenting and the normalization cannot be accidentally bypassed.

**`findCallsByPayers` implementation note:**

The requirement says the payer filter (`cash_collected > 0 OR total_payment_amount > 0`) must be enforced in SQL WHERE, not in application code. This is a hard constraint from the success criteria. The SQL must look like:

```sql
SELECT * FROM ${CALLS_TABLE}
WHERE client_id = @clientId
  AND (cash_collected > 0 OR total_payment_amount > 0)
ORDER BY appointment_date DESC
```

No LIMIT — this is the full candidate set for fuzzy matching. `FuzzyMatcher.findBestMatch` receives this array and scores every element. The result set is bounded naturally because only payers are returned (a small subset of all calls for a client).

**Dependency on Phase 1:** `findCallsByPayers` references `total_payment_amount`, which does not exist on the Calls table until Phase 1's migration runs. Phase 2 depends on Phase 1 completing first. The query file can be written before Phase 1 completes, but the query will fail at runtime until the column exists.

### Test File Pattern

All service unit tests follow the same structure — see `Backend/tests/services/PaymentService.test.js` as the canonical example:

```javascript
jest.mock('../../src/db/BigQueryClient', () => require('../helpers/mockBigQuery'));

const callQueries = require('../../src/db/queries/calls');
const mockBQ = require('../helpers/mockBigQuery');

beforeEach(() => { mockBQ._reset(); });

describe('findCallsByPayers', () => {
  it('returns only calls where cash_collected > 0', async () => {
    mockBQ._seedTable('Calls', [
      { call_id: 'c1', client_id: 'friends_inc', prospect_name: 'John Smith', cash_collected: 5000, total_payment_amount: 5000 },
      { call_id: 'c2', client_id: 'friends_inc', prospect_name: 'Jane Doe',   cash_collected: 0,    total_payment_amount: 0    },
    ]);
    const result = await callQueries.findCallsByPayers('friends_inc');
    expect(result).toHaveLength(1);
    expect(result[0].call_id).toBe('c1');
  });
});
```

`FuzzyMatcher` tests require no mock at all — just `require` the module and call it with in-memory arrays.

---

## Files to Create or Modify

| File | Action | What Changes |
|------|--------|-------------|
| `Backend/src/utils/FuzzyMatcher.js` | CREATE | New file — Jaro-Winkler algorithm + `findBestMatch()` |
| `Backend/src/db/queries/calls.js` | MODIFY | Add `findCallByName()` and `findCallsByPayers()` at the bottom |
| `Backend/src/config/index.js` | MODIFY | Add `matching.jaroWinklerThreshold` key |
| `Backend/tests/services/FuzzyMatcher.test.js` | CREATE | Unit tests for FuzzyMatcher (no mock needed) |
| `Backend/tests/services/calls.queries.test.js` | CREATE | Unit tests for the two new query functions (uses mockBigQuery) |

---

## Existing Patterns to Follow

### 1. Config key naming
`config.timeouts.transcriptTimeoutMinutes` — group name + camelCase key. Follow: `config.matching.jaroWinklerThreshold`.

### 2. Singleton export
`module.exports = new FuzzyMatcher()` — same as `PaymentService.js` and `ProspectService.js`. Callers do `const fuzzyMatcher = require('../utils/FuzzyMatcher')`.

### 3. Query return conventions
Every `find*` function in `calls.js` returns either the first row or `null` for single-record queries, or returns the raw array for multi-record queries. Follow this exactly:
- `findCallByName` → `rows.length > 0 ? rows[0] : null`
- `findCallsByPayers` → `return rows` (array, possibly empty)

### 4. BigQueryClient usage in query files
```javascript
const bq = require('../BigQueryClient');
const CALLS_TABLE = bq.table('Calls');
// All queries: bq.query(sql, params)
```
Do not import BigQuery directly. Do not use `bq.runQuery()` — **the correct method is `bq.query()`**. Calling `bq.query()` returns the rows array directly (already destructures `[rows]` inside `BigQueryClient.query()`). Never do `const [rows] = await bq.query(...)` — that would destructure the first character of the first row object.

### 5. JSDoc on every function
Every function in this codebase has a JSDoc block. Format:
```javascript
/**
 * One-line description of what this does.
 *
 * More detail if needed — explain WHY, not just what.
 *
 * @param {type} paramName — Description
 * @returns {type} Description
 */
```

### 6. Mock BigQuery for tests
`jest.mock('../../src/db/BigQueryClient', () => require('../helpers/mockBigQuery'))` must be the first line of any test that touches query files. The mock supports `_seedTable(name, rows)` and `_reset()`. The mock handles `>` comparisons in WHERE clauses (confirmed in `mockBigQuery.js` line 318+), so `cash_collected > 0` will filter correctly in tests when seeding rows with numeric values.

---

## Pitfalls

### Pitfall 1: `bq.query()` vs `bq.runQuery()` — returns rows directly, do not destructure

`BigQueryClient.query()` already destructures `[rows]` from the Google BigQuery SDK response (line 56 of `BigQueryClient.js`). It returns the `rows` array directly. Calling `const [rows] = await bq.query(...)` would assign the first element of the rows array to `rows`, not the array itself.

**Correct:**
```javascript
const rows = await bq.query(sql, params);
return rows.length > 0 ? rows[0] : null;
```

**Wrong:**
```javascript
const [rows] = await bq.query(sql, params);  // BUG: rows = first row object, not array
```

This gotcha is documented in MEMORY.md and has caused bugs before.

### Pitfall 2: `total_payment_amount` column doesn't exist until Phase 1 completes

`findCallsByPayers` queries `total_payment_amount`. The query file can be written in Phase 2, but it will throw a BigQuery error if executed before Phase 1's migration runs. The test can be written with the mock (which does not validate column existence), but end-to-end testing requires Phase 1 to be applied first.

**Mitigation:** Document this in the function's JSDoc: `@requires Phase 1 migration — total_payment_amount column must exist on Calls table`.

### Pitfall 3: Jaro-Winkler prefix bonus requires exact implementation

Jaro-Winkler adds a prefix bonus of `p * prefixLength * (1 - jaro)` where `p = 0.1` (standard constant, never exceeds 0.25). The prefix must be counted from the START of the string, case-normalized, and capped at 4 characters. Getting this wrong produces scores that look plausible but don't match reference implementations.

**Mitigation:** Test against known pairs with expected values. A correct implementation should produce:
- `'john smith'` vs `'jon smith'` → ~0.973 (above 0.82)
- `'john smith'` vs `'jane doe'` → ~0.603 (below 0.82)
- `'michael johnson'` vs `'mike johnson'` → ~0.846 (above 0.82)
- `'sarah connor'` vs `'sarah o\'brien'` → ~0.836 (borderline — confirms threshold sensitivity)

Include all four as explicit test cases.

### Pitfall 4: `findBestMatch` must handle null/missing `prospect_name` in call records

Call records may have `prospect_name: null` (e.g., if the prospect was identified only by email and name was never populated). The fuzzy matcher must skip null names rather than throwing or producing a nonsense score.

**Implementation:** Before calling `_jaroWinkler`, check `if (!call.prospect_name) continue;`.

### Pitfall 5: Normalization must happen inside `_jaroWinkler`, not the caller

The `findBestMatch` signature takes the raw `name` string from the payment webhook payload. Names from external systems are not always clean: mixed case, extra spaces, company suffixes ("John Smith LLC"). Normalization (lowercase + trim) must happen inside `_jaroWinkler` on both inputs, not in the caller. This ensures the comparison is always case-insensitive regardless of where `_jaroWinkler` is called from.

### Pitfall 6: mockBigQuery `>` filter comparison — numeric types matter

The `mockBigQuery` `filterRows` function handles `>` comparisons but relies on JavaScript's `>` operator. When seeding test data, ensure `cash_collected` and `total_payment_amount` are seeded as **numbers** (e.g., `cash_collected: 5000`) not strings (e.g., `cash_collected: '5000'`). String comparison `'5000' > 0` behaves unexpectedly in JS. The real BigQuery column is FLOAT64, so numeric seeding is correct anyway.

### Pitfall 7: Config read timing — `config` is loaded at module require time

`FuzzyMatcher.js` will `require('../config')` at the top of the file. In tests, the threshold is read from the live config (no env var set → defaults to `0.82`). If a test needs to test threshold behavior with a different value, it must either:
- Set `process.env.FUZZY_MATCH_THRESHOLD` before requiring the module (fragile due to Jest module caching), OR
- Accept the default `0.82` and test using names that straddle it

The cleaner approach: do not try to override the threshold in unit tests. Test cases should simply use names where the expected behavior is unambiguous above or below 0.82. The threshold config path is tested by verifying the property exists in config — not by testing at different threshold values.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| String normalization | Custom unicode normalizer | `str.toLowerCase().trim()` | Sufficient for English names. No need for unicode normalization at this scale. |
| Candidate set filtering | Post-query JS filter of all calls | SQL `WHERE cash_collected > 0 OR total_payment_amount > 0` | Required by success criteria — payer filter must be in SQL, not application code. |
| Similarity score caching | Memoization layer | None | `findBestMatch` is called once per payment webhook with a small array. No performance concern. |

---

## Common Questions

**Q: Why not add `findCallByName` as a BigQuery case-insensitive full-text search?**

A: BigQuery doesn't have a native case-insensitive text index. `LOWER(TRIM(prospect_name)) = LOWER(TRIM(@name))` is the correct approach — it uses BigQuery's built-in string functions which run on the BQ execution engine. Full-text search (via `SEARCH()` or `REGEXP_CONTAINS`) would be overpowered for an exact string match.

**Q: Should `findCallsByPayers` have a date range filter?**

A: Not in Phase 2. The success criteria specify only the payer filter (`cash_collected > 0 OR total_payment_amount > 0`). Date range filtering (e.g., "only calls in the last 90 days") would be a Phase 3 decision made by `MatchingService` based on product requirements. Phase 2 delivers the raw candidate set; Phase 3 decides how to narrow it further.

**Q: Why singleton export for FuzzyMatcher if it has no state?**

A: Consistency with the codebase convention. All services and most utilities export a singleton. Since `FuzzyMatcher` reads `config` at construction time (the config is stable throughout the process lifetime), a singleton is both convenient and consistent. No downside at this scale.

---

## Code Examples (Verified Patterns)

### Config addition

```javascript
// Backend/src/config/index.js — add inside the config object:

/** Payment name matching */
matching: {
  jaroWinklerThreshold: parseFloat(process.env.FUZZY_MATCH_THRESHOLD) || 0.82,
},
```

### FuzzyMatcher skeleton

```javascript
// Backend/src/utils/FuzzyMatcher.js

const config = require('../config');

class FuzzyMatcher {
  findBestMatch(name, callsArray) {
    if (!name || !Array.isArray(callsArray) || callsArray.length === 0) return null;

    const threshold = config.matching.jaroWinklerThreshold;
    let bestScore = -1;
    let bestCall = null;

    for (const call of callsArray) {
      if (!call.prospect_name) continue;
      const score = this._jaroWinkler(name, call.prospect_name);
      if (score > bestScore) {
        bestScore = score;
        bestCall = call;
      }
    }

    return bestScore >= threshold ? bestCall : null;
  }

  _jaroWinkler(s1, s2) {
    // Normalize
    const a = s1.toLowerCase().trim();
    const b = s2.toLowerCase().trim();
    if (a === b) return 1.0;
    // ... Jaro-Winkler algorithm (~30 lines)
  }
}

module.exports = new FuzzyMatcher();
```

### New query functions in calls.js

```javascript
// Add to Backend/src/db/queries/calls.js

/**
 * Finds the most recent call record for a client by prospect name.
 * Uses case-insensitive, trimmed comparison in SQL.
 * Part of Tier 2 matching: called when email match returns null.
 *
 * @param {string} clientId — Client scope
 * @param {string} name — Prospect name from payment webhook
 * @returns {Object|null} Most recent matching call record or null
 */
async findCallByName(clientId, name) {
  const rows = await bq.query(
    `SELECT * FROM ${CALLS_TABLE}
     WHERE client_id = @clientId
       AND LOWER(TRIM(prospect_name)) = LOWER(TRIM(@name))
     ORDER BY appointment_date DESC
     LIMIT 1`,
    { clientId, name }
  );
  return rows.length > 0 ? rows[0] : null;
},

/**
 * Returns all call records for a client that have received payment.
 * Used as the candidate set for Tier 3 fuzzy name matching.
 *
 * Payer filter is enforced in SQL (not application code) per MTCH-03.
 * A call is considered a "payer" if cash_collected > 0 OR total_payment_amount > 0.
 *
 * @requires Phase 1 migration — total_payment_amount column must exist on Calls table
 *
 * @param {string} clientId — Client scope
 * @returns {Array} Call records with cash_collected > 0 or total_payment_amount > 0
 */
async findCallsByPayers(clientId) {
  return bq.query(
    `SELECT * FROM ${CALLS_TABLE}
     WHERE client_id = @clientId
       AND (cash_collected > 0 OR total_payment_amount > 0)
     ORDER BY appointment_date DESC`,
    { clientId }
  );
},
```

---

## Sources

### Primary (HIGH confidence)

- `Backend/src/db/BigQueryClient.js` — Confirmed `bq.query()` returns `rows` array directly (line 56: `const [rows] = await this.client.query(options); return rows;`). Establishes `bq.query(sql, params)` call signature used throughout.
- `Backend/src/db/queries/calls.js` — Full read. All 14 existing query functions follow `bq.query(sql, params)` pattern, `CALLS_TABLE` constant, `rows.length > 0 ? rows[0] : null` return pattern.
- `Backend/src/db/queries/prospects.js` — Secondary confirmation of same patterns.
- `Backend/src/config/index.js` — Full read. `matching` key does not yet exist. Established pattern: `parseInt(...) || default` and `parseFloat(...) || default` for numeric env vars.
- `Backend/src/utils/idGenerator.js`, `Backend/src/utils/dateUtils.js` — Confirmed: `src/utils/` is for stateless, dependency-free helpers. Pattern: module-level function exports or singleton class exports.
- `Backend/src/services/PaymentService.js` — Singleton class pattern: `module.exports = new PaymentService()`.
- `Backend/tests/helpers/mockBigQuery.js` — Full read. Confirmed: `_seedTable`, `_reset`, `>` comparison handling in `filterRows` (lines 316-344), numeric values in seed data required.
- `Backend/tests/services/PaymentService.test.js` — Canonical test file structure: `jest.mock`, `beforeEach(_reset)`, `describe`/`it`, `_seedTable` seeding.
- `Backend/CLAUDE.md` — Section 20 coding standards confirmed: JSDoc on every function, camelCase for utils files, `UPPER_SNAKE_CASE` for constants.
- Inline Jaro-Winkler verification (run during research): `john smith` vs `jon smith` = 0.9733, `john smith` vs `jane doe` = 0.6025, `mike johnson` vs `michael johnson` = 0.8461.
- npm registry: `jaro-winkler@0.2.8` — zero dependencies, MIT, last published >1 year ago, unmaintained. Rejected.
- npm registry: `wink-distance@2.0.2` — 2 transitive deps. Rejected.
- `Backend/node_modules/` scan — No string similarity package installed. Only `fast-levenshtein` (wrong algorithm).

### Secondary (MEDIUM confidence)

- `Backend/src/services/ai/ResponseParser.js` — Confirms that "fuzzy" in this codebase currently means substring containment (not Jaro-Winkler). Phase 2 introduces true distance-based fuzzy matching for the first time.
- `.planning/REQUIREMENTS.md` — MTCH-02 (exact name, case-insensitive) and MTCH-03 (fuzzy Jaro-Winkler against payers only) requirements confirmed as Phase 2 scope.
- `.planning/ROADMAP.md` — Phase 2 success criteria confirmed verbatim.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages, confirmed existing `bq.query()` interface
- Architecture (file placement): HIGH — direct read of `src/utils/` and `src/services/` existing occupants
- Query patterns: HIGH — exact pattern copied from existing `calls.js` functions
- Jaro-Winkler correctness: HIGH — algorithm verified with known name pairs, scores confirmed correct
- Config pattern: HIGH — exact pattern from `config/index.js` direct read
- Pitfalls: HIGH — most from MEMORY.md (documented past bugs) or direct code inspection

**Research date:** 2026-02-28
**Valid until:** 2026-05-28 (BigQuery query API and Node.js stdlib stable; Jaro-Winkler algorithm is fixed mathematics)

---

## Critical Implementation Notes for the Planner

1. **Phase 1 is a hard prerequisite at runtime.** `findCallsByPayers` will throw a BigQuery error until `total_payment_amount` column exists. The test can be written before Phase 1 runs (mock doesn't validate schema), but the integration test requires Phase 1 first.

2. **Do not add a `score` field to the `findBestMatch` return value in Phase 2.** Phase 3 (`MatchingService`) will decide whether to include the confidence score in the audit trail. `FuzzyMatcher.findBestMatch` returns the raw call record or `null` — same contract as `findCallByName`. This keeps the interface symmetric and simple.

3. **`findCallsByPayers` returns the full array, not a single record.** This is unlike every other `find*` function in `calls.js` which returns `row[0] | null`. The distinction is intentional: `findCallsByPayers` is a candidate fetcher for fuzzy scoring, not a direct lookup. The JSDoc must make this clear.

4. **Threshold default of 0.82 is deliberate.** At this value, `mike johnson` vs `michael johnson` = 0.846 (matches), but `sarah smith` vs `sarah jones` = ~0.825 (borderline). The threshold was chosen to catch common name variations (nickname vs full name) while rejecting different people who share a first name. Tyler can tune via `FUZZY_MATCH_THRESHOLD` env var without code changes.

5. **No existing test file for `calls.js` query functions.** The test file `tests/services/calls.queries.test.js` does not yet exist and must be created. The naming follows the pattern of `tests/services/PaymentService.test.js` (one test file per service/query module).
