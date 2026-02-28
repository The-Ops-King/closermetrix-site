# Phase 1: Schema Migration - Research

**Researched:** 2026-02-28
**Domain:** BigQuery DDL — ALTER TABLE, CREATE OR REPLACE VIEW, idempotent migration scripting in Node.js
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCHM-01 | `cash_collected` on Calls table redefined to mean first payment amount only | No DDL needed — this is a semantic redefinition. The column already exists. The migration documents the new meaning and leaves the column structurally unchanged. Data backfill is a separate decision (see Open Questions). |
| SCHM-02 | `total_payment_amount` column added to Calls table = sum of all payments (first + subsequent) | `ALTER TABLE Calls ADD COLUMN total_payment_amount FLOAT64` — guarded by INFORMATION_SCHEMA check for idempotency. |
| SCHM-03 | `attribution_mode` field added to Clients table (`first_only` or `all_installments`) | `ALTER TABLE Clients ADD COLUMN attribution_mode STRING` with DEFAULT applied via UPDATE after add. BigQuery does not support DEFAULT on ALTER TABLE. |
| SCHM-04 | `v_calls_joined_flat_prefixed` updated via `CREATE OR REPLACE VIEW` to include `total_payment_amount` | Must copy exact existing view DDL and add one column. The view uses an explicit column list — new Calls columns do NOT auto-appear. |
</phase_requirements>

---

## Summary

Phase 1 establishes the BigQuery schema that all downstream phases depend on. It is purely additive DDL work: two new columns (one on Calls, one on Clients), a semantic redefinition of an existing column, and a view recreation. No service logic is modified in this phase.

The primary technical challenge is idempotency. BigQuery's `ALTER TABLE ADD COLUMN` does not support `IF NOT EXISTS`. Every column addition must be guarded by an INFORMATION_SCHEMA pre-check that reads existing columns before attempting to add. The existing migration pattern in this codebase (`Backend/src/db/migrations/`) uses `CREATE TABLE IF NOT EXISTS` — which works for tables but not for columns. The Phase 1 migration introduces the INFORMATION_SCHEMA guard pattern for column additions.

The view update (`CREATE OR REPLACE VIEW`) is the highest-risk step because it touches the view that powers all Frontend dashboard queries. The current view DDL is not stored in the repository — it exists only in BigQuery. The migration script must query BigQuery's `INFORMATION_SCHEMA.VIEWS` to retrieve the existing DDL, add the new column expression, and then replace the view. Alternatively, the full view DDL can be reconstructed from the Frontend query files.

**Primary recommendation:** Write `004_payment_enhancement.js` as a single migration file that handles all four schema changes in sequence, with INFORMATION_SCHEMA guards on each column addition. Run it via the existing `migrations/run.js` pattern. Retrieve the existing view DDL before touching it.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@google-cloud/bigquery` | ^7.9.0 | DDL execution, INFORMATION_SCHEMA queries | Already installed. `bq.query()` runs DDL identically to DML — no separate DDL client needed. |
| Node.js | 22+ | Migration runner | Existing requirement. Migration scripts run via `node src/db/migrations/run.js`. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `dotenv` | Already in use | Load `.env` for GCP credentials in migration runner | All migration files call `require('dotenv').config()` — same pattern needed here. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom INFORMATION_SCHEMA guard | `bq.getTable()` SDK method to check schema | SDK method works but requires different client setup. INFORMATION_SCHEMA SQL is consistent with the rest of the codebase and self-documenting. |
| Single migration file | Separate files per change | Single file (004) is preferred because all four changes are tightly coupled — if column add fails, view update should not proceed. One transaction boundary in a single file makes this clearer. |

**Installation:**
```bash
# No new packages required — @google-cloud/bigquery@^7.9.0 already installed
```

---

## Architecture Patterns

### Recommended Project Structure

```
Backend/src/db/migrations/
├── 001_create_prospects.js      # Existing
├── 002_create_audit_log.js      # Existing
├── 003_create_cost_tracking.js  # Existing
└── 004_payment_enhancement.js   # NEW — this phase
```

`run.js` must be updated to call `migration004.up()` after the existing three migrations.

### Pattern 1: INFORMATION_SCHEMA Column Guard

**What:** Before running `ALTER TABLE ADD COLUMN`, query `INFORMATION_SCHEMA.COLUMNS` to check whether the column already exists. Only run the ALTER if it does not.

**When to use:** Every column addition in this codebase. BigQuery rejects `ADD COLUMN` on existing columns with an error — there is no `IF NOT EXISTS` syntax.

**Example:**
```javascript
// Source: Google Cloud Docs — Modifying table schemas
// https://cloud.google.com/bigquery/docs/managing-table-schemas

async function addColumnIfNotExists(bq, tableName, columnName, columnDef) {
  const existing = await bq.query(`
    SELECT column_name
    FROM \`closer-automation.CloserAutomation.INFORMATION_SCHEMA.COLUMNS\`
    WHERE table_name = '${tableName}' AND column_name = '${columnName}'
  `);

  if (existing.length === 0) {
    await bq.query(`
      ALTER TABLE \`closer-automation.CloserAutomation.${tableName}\`
      ADD COLUMN ${columnName} ${columnDef}
    `);
    console.log(`  Added column: ${tableName}.${columnName}`);
  } else {
    console.log(`  Column already exists, skipping: ${tableName}.${columnName}`);
  }
}
```

### Pattern 2: BigQuery Does Not Support DEFAULT on ALTER TABLE

**What:** `ALTER TABLE ADD COLUMN col STRING DEFAULT 'value'` is NOT supported in BigQuery. Columns added via ALTER TABLE are always nullable with no default. To set a default value on existing rows, run a separate `UPDATE` statement after the column addition.

**When to use:** Any time a new column needs a default value for existing rows (SCHM-03: `attribution_mode` should default to `'all_installments'` for all existing client rows).

**Example:**
```javascript
// Step 1: Add column (nullable, no default)
await bq.query(`
  ALTER TABLE \`closer-automation.CloserAutomation.Clients\`
  ADD COLUMN attribution_mode STRING
`);

// Step 2: Set default for all existing rows
await bq.query(`
  UPDATE \`closer-automation.CloserAutomation.Clients\`
  SET attribution_mode = 'all_installments'
  WHERE attribution_mode IS NULL
`);
```

The UPDATE is idempotent: if the column already exists with values set, this is a no-op. If the column was just added (all rows NULL), this sets the default. Safe to run multiple times.

### Pattern 3: CREATE OR REPLACE VIEW — Retrieve Before Replacing

**What:** Before recreating the view, retrieve its current DDL from BigQuery so no existing columns are accidentally dropped. The view powers ALL Frontend queries — dropping any column is a breaking change.

**When to use:** Any view recreation where the full DDL is not stored in the repository.

**Example:**
```javascript
// Retrieve current view DDL from INFORMATION_SCHEMA
const viewInfo = await bq.query(`
  SELECT view_definition
  FROM \`closer-automation.CloserAutomation.INFORMATION_SCHEMA.VIEWS\`
  WHERE table_name = 'v_calls_joined_flat_prefixed'
`);

// Log it — plan to add total_payment_amount to the SELECT list
console.log('Current view DDL:', viewInfo[0].view_definition);

// Then CREATE OR REPLACE VIEW with the new column added
await bq.query(`
  CREATE OR REPLACE VIEW \`closer-automation.CloserAutomation.v_calls_joined_flat_prefixed\` AS
  [existing DDL with c.total_payment_amount AS calls_total_payment_amount added]
`);
```

**CRITICAL:** The migration script should log the existing view DDL before replacing it. If the replacement fails, the log provides the rollback DDL.

### Pattern 4: Migration File Structure (Established Codebase Pattern)

All existing migrations follow this pattern exactly:

```javascript
/**
 * MIGRATION 004: Payment Enhancement Schema
 *
 * Adds total_payment_amount to Calls, attribution_mode to Clients,
 * recreates v_calls_joined_flat_prefixed to include new column.
 *
 * Run via: node src/db/migrations/run.js
 * Safe to run multiple times (idempotent).
 */

require('dotenv').config();
const { BigQuery } = require('@google-cloud/bigquery');
const config = require('../../config');

async function up() {
  const bq = new BigQuery({ projectId: config.bigquery.projectId });
  console.log('Running migration 004: Payment enhancement schema...');

  // Step 1: Add total_payment_amount to Calls
  // Step 2: Add attribution_mode to Clients
  // Step 3: Set default attribution_mode for existing clients
  // Step 4: CREATE OR REPLACE VIEW

  console.log('Migration 004 complete.');
}

module.exports = { up };
```

Note: Migration files instantiate their own `BigQuery` client directly (not the singleton `BigQueryClient.js`). This is the established pattern in migrations 001, 002, 003 — keep it consistent.

### Anti-Patterns to Avoid

- **Running ALTER TABLE without INFORMATION_SCHEMA guard:** BigQuery throws an error if the column already exists. The error will abort the entire migration run. The guard is mandatory.
- **Using BigQueryClient singleton in migration files:** Existing migrations create a new `BigQuery` instance directly. The singleton depends on module initialization order that may not be correct during standalone migration execution.
- **Hardcoding the full view DDL without reading the current version first:** The existing view DDL is not in the repository. Hardcoding a reconstruction risks missing columns that were added manually in BigQuery Console.
- **Splitting the UPDATE for attribution_mode default into a separate script:** The UPDATE must run in the same migration file as the column addition. If they are separate, the column could exist with NULL values and no follow-up UPDATE ever fires.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Column existence check | Custom table schema parser | INFORMATION_SCHEMA.COLUMNS query | BigQuery's official approach. Reliable, documented, consistent with how the rest of the ecosystem does it. |
| View DDL storage | Maintaining a separate copy of the view in the repo | `INFORMATION_SCHEMA.VIEWS.view_definition` | The BigQuery-stored DDL is always current. A repo copy can drift. |

**Key insight:** BigQuery DDL is straightforward SQL. The only non-obvious requirement is the INFORMATION_SCHEMA guard for idempotency. Everything else is standard SQL that the existing `bq.query()` method handles.

---

## Common Pitfalls

### Pitfall 1: ALTER TABLE Fails on Re-Run — Migration is Not Idempotent

**What goes wrong:** Running `ALTER TABLE Calls ADD COLUMN total_payment_amount FLOAT64` throws `Column already exists` on the second run. If the migration runner does not catch this, it aborts — leaving Clients table and the view unmodified on retry.

**Why it happens:** BigQuery does not support `ADD COLUMN IF NOT EXISTS`. Developers forget to add the INFORMATION_SCHEMA pre-check because MySQL and Postgres support `IF NOT EXISTS`.

**How to avoid:** Always wrap every `ADD COLUMN` in the `addColumnIfNotExists()` helper. Test re-runnability by running the migration twice in development.

**Warning signs:**
- `AlreadyExists: Column` error in migration logs
- Migration fails halfway — `total_payment_amount` exists on Calls but `attribution_mode` was never added to Clients

### Pitfall 2: View Recreation Drops Existing Columns

**What goes wrong:** The migration recreates the view with an incomplete column list, dropping existing columns that Frontend queries depend on. Frontend pages that reference dropped columns will immediately fail with `column not found` errors.

**Why it happens:** The developer writes the new view DDL from memory or from an old copy, missing columns added since the last documented schema.

**How to avoid:** Always read `INFORMATION_SCHEMA.VIEWS.view_definition` before recreating. Log the existing DDL. Confirm the new DDL adds `calls_total_payment_amount` and does not remove anything.

**Warning signs:**
- Frontend dashboard pages throw errors after migration
- BigQuery queries on the view return `field not found` errors for previously working columns

### Pitfall 3: DEFAULT Value Not Set for Existing Rows After ALTER TABLE

**What goes wrong:** `attribution_mode` column is added to Clients table. All existing rows have `NULL`. PaymentService reads `client.attribution_mode` and gets `null`, causing it to fall back to a hardcoded default (if one exists) or throw an error (if it doesn't).

**Why it happens:** BigQuery's ALTER TABLE does not support DEFAULT. Developers assume the column will have a default when it does not.

**How to avoid:** Always follow ALTER TABLE with an UPDATE that sets the default value for all NULL rows. Run it in the same migration file, immediately after the column addition.

**Warning signs:**
- `attribution_mode` is NULL for all clients after migration
- PaymentService logs show `attribution_mode: null` in client config reads

### Pitfall 4: `cash_collected` Column Type Is Accidentally Modified

**What goes wrong:** SCHM-01 specifies that `cash_collected` semantics change (meaning = first payment only), but the column itself must not be altered. If the migration accidentally includes a TYPE change or a DROP+RE-ADD, historical data is destroyed.

**Why it happens:** Developers conflate "semantic change" with "schema change." SCHM-01 is a documentation-level change only — no DDL required.

**How to avoid:** SCHM-01 requires NO BigQuery DDL. The column already exists as `FLOAT`. The semantic change is implemented in PaymentService logic (Phase 3), not in the migration. The migration's only job is to add the two new columns and update the view.

**Warning signs:**
- Any DDL statement that references `cash_collected` in this migration is wrong
- A migration step that says "ALTER TABLE Calls ALTER COLUMN cash_collected" is a bug

### Pitfall 5: View DDL Is Unavailable Because the View Doesn't Exist Yet

**What goes wrong:** If `v_calls_joined_flat_prefixed` does not yet exist in the BigQuery project (development environment, fresh deployment), the INFORMATION_SCHEMA query returns no rows. The migration must handle this case.

**Why it happens:** The view is a production artifact that may not exist in all environments.

**How to avoid:** Check whether the view exists before attempting to read its DDL. If it does not exist, the `CREATE OR REPLACE VIEW` step creates it from scratch using the full known DDL. The migration must include the complete view DDL as a fallback — not just the ALTER step.

**Warning signs:**
- `Migration 004 complete` with no view being created (because the INFORMATION_SCHEMA query returned empty and the code skipped the view step)
- Frontend queries immediately fail with `Table not found: v_calls_joined_flat_prefixed`

---

## Code Examples

Verified patterns from official sources and existing codebase:

### INFORMATION_SCHEMA Column Check

```javascript
// Source: Google Cloud Docs — https://cloud.google.com/bigquery/docs/information-schema-columns
// Confirmed working in this codebase via existing BigQueryClient.js bq.query() method

const rows = await bq.query({
  query: `
    SELECT column_name
    FROM \`closer-automation.CloserAutomation.INFORMATION_SCHEMA.COLUMNS\`
    WHERE table_name = @tableName
      AND column_name = @columnName
  `,
  params: { tableName: 'Calls', columnName: 'total_payment_amount' },
  location: 'US',
});
// rows.length === 0 means column does not exist → safe to ADD
// rows.length > 0 means column exists → skip
```

### ALTER TABLE ADD COLUMN

```javascript
// Source: Google Cloud Docs — Modifying table schemas
// BigQuery DDL: https://cloud.google.com/bigquery/docs/reference/standard-sql/data-definition-language#alter_table_add_column_statement

await bq.query({
  query: `
    ALTER TABLE \`closer-automation.CloserAutomation.Calls\`
    ADD COLUMN total_payment_amount FLOAT64
  `,
  location: 'US',
});
// New column is immediately available for DML UPDATE/INSERT
// New column is NULL for all existing rows (BigQuery behavior for ADD COLUMN)
```

### UPDATE to Set Default Value

```javascript
// Sets attribution_mode = 'all_installments' for all existing clients
// Idempotent: WHERE attribution_mode IS NULL means no-op if already set

await bq.query({
  query: `
    UPDATE \`closer-automation.CloserAutomation.Clients\`
    SET attribution_mode = 'all_installments'
    WHERE attribution_mode IS NULL
  `,
  location: 'US',
});
```

### CREATE OR REPLACE VIEW

```javascript
// Source: Google Cloud Docs — Creating and using views
// https://cloud.google.com/bigquery/docs/views

// CREATE OR REPLACE VIEW is safe to run multiple times
// It replaces atomically — no gap where the view is unavailable

await bq.query({
  query: `
    CREATE OR REPLACE VIEW \`closer-automation.CloserAutomation.v_calls_joined_flat_prefixed\` AS
    SELECT
      -- [all existing column list here, unchanged]
      -- NEW: add this line at the end of the Calls section:
      c.total_payment_amount AS calls_total_payment_amount
    FROM \`closer-automation.CloserAutomation.Calls\` c
    LEFT JOIN \`closer-automation.CloserAutomation.Closers\` cl ON c.closer_id = cl.closer_id
    LEFT JOIN \`closer-automation.CloserAutomation.Clients\` ct ON c.client_id = ct.client_id
  `,
  location: 'US',
});
```

### Reading Existing View DDL

```javascript
// Source: Google Cloud Docs — INFORMATION_SCHEMA.VIEWS
// https://cloud.google.com/bigquery/docs/information-schema-views

const viewRows = await bq.query({
  query: `
    SELECT view_definition
    FROM \`closer-automation.CloserAutomation.INFORMATION_SCHEMA.VIEWS\`
    WHERE table_name = 'v_calls_joined_flat_prefixed'
  `,
  location: 'US',
});

if (viewRows.length > 0) {
  console.log('EXISTING VIEW DDL (save for rollback):\n', viewRows[0].view_definition);
}
```

### Verification Queries (Run After Migration)

```javascript
// Verify Calls column exists and returns NULL for old rows
const callsCheck = await bq.query({
  query: `SELECT calls_total_payment_amount FROM \`closer-automation.CloserAutomation.v_calls_joined_flat_prefixed\` LIMIT 1`,
  location: 'US',
});
// Should return row with null value — no error = view updated correctly

// Verify Clients column exists with default
const clientsCheck = await bq.query({
  query: `SELECT attribution_mode FROM \`closer-automation.CloserAutomation.Clients\` LIMIT 5`,
  location: 'US',
});
// Should return rows where attribution_mode = 'all_installments' (not null)

// Verify cash_collected still exists and is unchanged
const cashCheck = await bq.query({
  query: `SELECT cash_collected FROM \`closer-automation.CloserAutomation.Calls\` WHERE cash_collected IS NOT NULL LIMIT 1`,
  location: 'US',
});
// Should return existing data — no loss
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| BigQuery streaming insert for schema exploration | DML INSERT + ALTER TABLE for all mutations | BigQuery docs, 2021+ | Streaming buffer (90-min delay) prevents immediate updates. DML is required for this codebase. Already the established pattern. |
| Manual BigQuery Console schema changes | Migration script pattern | This codebase's initial build | Reproducible, auditable, re-runnable schema changes. |

**Deprecated/outdated:**
- `ADD COLUMN IF NOT EXISTS`: Not supported in BigQuery (as of 2026). Use INFORMATION_SCHEMA guard instead.
- Streaming inserts for schema migration: Never appropriate. Schema changes must use DML/DDL.

---

## Open Questions

1. **Historical `cash_collected` backfill strategy**
   - What we know: Existing `cash_collected` data on Closed-Won calls has accumulated ALL payments (not just the first), because the current PaymentService adds every payment to `cash_collected`. This means post-migration, old records have semantically incorrect `cash_collected` values.
   - What's unclear: Tyler has not decided whether to (a) backfill `cash_collected` to first-payment-only by looking at AuditLog, or (b) leave old data as-is and treat pre-migration records as having "legacy semantics."
   - STATE.md documents this as: "Historical backfill: PENDING Tyler decision"
   - Recommendation: Do NOT include backfill in this migration. Add a TODO comment in the migration file documenting the decision. The Phase 1 migration only adds columns and updates the view — backfill is a separate DBA task if Tyler decides to do it.

2. **Exact column list for `v_calls_joined_flat_prefixed`**
   - What we know: The view uses an explicit column list with `calls_*`, `closers_*`, `clients_*` prefixes. The existing DDL lives in BigQuery only — not in the repository.
   - What's unclear: The exact current column list. It may include columns added via BigQuery Console that are not in the codebase docs.
   - Recommendation: Before writing the migration, run the INFORMATION_SCHEMA.VIEWS query against production BigQuery to retrieve the current DDL. Use that as the base — append `c.total_payment_amount AS calls_total_payment_amount` to the Calls section.

3. **Attribution mode default value: `first_only` vs `all_installments`**
   - STATE.md records: "Attribution default: `all_installments` — matches current behavior, avoids day-one metric disruption"
   - FEATURES.md records: "Default: `first_only`" — domain reasoning (closers credited at close, not on collections)
   - There is a conflict. The REQUIREMENTS.md says `attribution_mode` should accept `first_only` or `all_installments` without specifying a default.
   - Recommendation: Use `all_installments` as the default per STATE.md decision. This preserves existing behavior for all current clients. Tyler can change per-client via admin tools after migration.

---

## Validation Architecture

`workflow.nyquist_validation` is not set in `.planning/config.json` (only `workflow.research: true` is present). The existing Backend test infrastructure uses Jest, so the validation section below covers the test approach for verification.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29+ (confirmed in `Backend/package.json` devDependencies) |
| Config location | `package.json` → `jest` key |
| Test match | `**/tests/**/*.test.js` |
| Quick run command | `cd /Users/user/CloserMetrix/Backend && npm test -- --testPathPattern=migrations` |
| Full suite command | `cd /Users/user/CloserMetrix/Backend && npm test` |

### Phase Requirements → Test Map

Phase 1 schema changes are DDL-only and cannot be fully unit-tested without a live BigQuery connection. The practical test approach:

| Req ID | Behavior | Test Type | Approach |
|--------|----------|-----------|---------|
| SCHM-02 | `total_payment_amount` column exists on Calls | Smoke (live BigQuery) | Run `SELECT total_payment_amount FROM Calls LIMIT 1` after migration — no error = pass |
| SCHM-03 | `attribution_mode` column exists on Clients with default | Smoke (live BigQuery) | Run `SELECT attribution_mode FROM Clients LIMIT 5` — should return `'all_installments'` for existing rows |
| SCHM-04 | View includes `total_payment_amount` | Smoke (live BigQuery) | Run `SELECT calls_total_payment_amount FROM v_calls_joined_flat_prefixed LIMIT 1` — no error = pass |
| SCHM-01 | `cash_collected` column unchanged | Smoke (live BigQuery) | Run `SELECT cash_collected FROM Calls WHERE cash_collected IS NOT NULL LIMIT 1` — should return existing data |
| Idempotency | Running migration twice produces no errors | Script test | Run `node src/db/migrations/run.js` twice — second run should complete with "skipping" log messages |

### Wave 0 Gaps

The migration itself is the artifact under test. No new unit test file is needed for Phase 1 beyond the smoke verification queries listed above. The migration file itself should include a `verify()` function that runs all five smoke queries and prints pass/fail. This is the practical testing approach for DDL migrations that cannot be meaningfully mocked.

```javascript
// Include in 004_payment_enhancement.js
async function verify(bq) {
  console.log('\nRunning post-migration verification...');

  // SCHM-02: total_payment_amount on Calls
  await bq.query({ query: `SELECT total_payment_amount FROM \`closer-automation.CloserAutomation.Calls\` LIMIT 1`, location: 'US' });
  console.log('  PASS: Calls.total_payment_amount exists');

  // SCHM-03: attribution_mode on Clients with default
  const clientRows = await bq.query({ query: `SELECT attribution_mode FROM \`closer-automation.CloserAutomation.Clients\` LIMIT 1`, location: 'US' });
  if (clientRows[0]?.attribution_mode !== 'all_installments') throw new Error('attribution_mode default not set');
  console.log('  PASS: Clients.attribution_mode exists with default');

  // SCHM-04: view includes new column
  await bq.query({ query: `SELECT calls_total_payment_amount FROM \`closer-automation.CloserAutomation.v_calls_joined_flat_prefixed\` LIMIT 1`, location: 'US' });
  console.log('  PASS: v_calls_joined_flat_prefixed includes calls_total_payment_amount');

  // SCHM-01: cash_collected unchanged
  await bq.query({ query: `SELECT cash_collected FROM \`closer-automation.CloserAutomation.Calls\` LIMIT 1`, location: 'US' });
  console.log('  PASS: Calls.cash_collected still exists (unchanged)');

  console.log('\nAll verification checks passed.');
}
```

---

## Sources

### Primary (HIGH confidence)

- `Backend/src/db/migrations/001_create_prospects.js` — Established migration file pattern for this codebase (direct code read)
- `Backend/src/db/migrations/002_create_audit_log.js` — Same pattern confirmed (direct code read)
- `Backend/src/db/migrations/run.js` — Migration runner structure, how to register new migration (direct code read)
- `Backend/src/db/BigQueryClient.js` — `bq.query()` runs DDL; confirmed method signature and error handling (direct code read)
- `Backend/CLAUDE.md` Section 5 — Exact Calls and Clients table schemas, existing column list, `cash_collected` current type = FLOAT (direct read)
- `.planning/research/STACK.md` — INFORMATION_SCHEMA guard pattern, ALTER TABLE DDL, no IF NOT EXISTS in BigQuery, BigQuery DDL via `bq.query()` (confirmed from Google Cloud Docs)
- `.planning/research/PITFALLS.md` — Pitfall 8 (idempotency via INFORMATION_SCHEMA), Pitfall 6 (closer_credit_attribution field), Pitfall 3 (view not updated after column add) — all Phase 1 relevant pitfalls (prior research synthesis)
- Google Cloud Docs — [Modifying table schemas](https://cloud.google.com/bigquery/docs/managing-table-schemas) — `ALTER TABLE ADD COLUMN`, no `IF NOT EXISTS` support, INFORMATION_SCHEMA check pattern (verified in prior research, HIGH confidence)
- Google Cloud Docs — [INFORMATION_SCHEMA.COLUMNS](https://cloud.google.com/bigquery/docs/information-schema-columns) — Column existence query pattern (HIGH confidence)
- Google Cloud Docs — [INFORMATION_SCHEMA.VIEWS](https://cloud.google.com/bigquery/docs/information-schema-views) — `view_definition` retrieval (HIGH confidence)

### Secondary (MEDIUM confidence)

- `.planning/STATE.md` — Attribution default decision: `all_installments` (project decision record)
- `.planning/research/ARCHITECTURE.md` — Build order Step 1 (schema migration), exact column names `total_payment_amount` and `closer_credit_attribution` (note: ARCHITECTURE.md uses `closer_credit_attribution` but REQUIREMENTS.md uses `attribution_mode` — REQUIREMENTS.md wins)
- `Frontend/server/db/queries/helpers.js` — Confirms view name `v_calls_joined_flat_prefixed`, prefixed column naming convention `calls_*`

### Tertiary (LOW confidence)

- None — all claims in this research are backed by direct code reads or official documentation.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages, verified existing `bq.query()` handles DDL
- Architecture: HIGH — established migration pattern from three existing files
- Pitfalls: HIGH — INFORMATION_SCHEMA guard, DEFAULT handling, view DDL retrieval all verified against Google Cloud Docs and codebase
- Open questions: Two questions require Tyler input before implementation (backfill, default value); one is resolvable by reading production BigQuery before migration

**Research date:** 2026-02-28
**Valid until:** 2026-05-28 (BigQuery DDL API is stable; this research should remain valid for months)

---

## Critical Implementation Notes for the Planner

These are non-obvious requirements that the planner MUST convert to explicit tasks:

1. **Retrieve production view DDL first** — Before writing any view DDL into the migration, the developer must run the INFORMATION_SCHEMA.VIEWS query against production BigQuery and record the output. This is a prerequisite task, not an assumption.

2. **Column naming discrepancy** — `.planning/research/ARCHITECTURE.md` uses `closer_credit_attribution` (on Calls table) and `credit_attribution` (on Clients table). The REQUIREMENTS.md specifies `attribution_mode` (on Clients table only). REQUIREMENTS.md is authoritative. The planner should use `attribution_mode` on Clients only — no column on Calls is needed in Phase 1.

3. **Two-column-name alignment** — Prior research (ARCHITECTURE.md) considered adding `closer_credit_attribution` as a denormalized column on Calls. REQUIREMENTS.md Phase 1 does NOT include this. Only `total_payment_amount` is added to Calls. `attribution_mode` is added to Clients only. The planner must not add `closer_credit_attribution` to Calls in Phase 1.

4. **Migration runner update required** — `Backend/src/db/migrations/run.js` must be updated to import and call `migration004.up()`. This is a file that must be edited — it is NOT auto-discovered.

5. **Test token for verification** — Use executive test token `af3016c9-5377-43f3-9d16-03428af0cc4d` (himym client, 6000+ calls) for post-migration smoke testing via Frontend. Confirms view changes are visible through the full stack.
