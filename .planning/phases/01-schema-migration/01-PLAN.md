---
phase: 01-schema-migration
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - Backend/src/db/migrations/004_payment_enhancement.js
  - Backend/src/db/migrations/run.js
autonomous: true
requirements: [SCHM-01, SCHM-02, SCHM-03, SCHM-04]

must_haves:
  truths:
    - "total_payment_amount column exists on Calls table and accepts FLOAT64 values"
    - "attribution_mode column exists on Clients table with 'all_installments' as default for existing rows"
    - "v_calls_joined_flat_prefixed view includes calls_total_payment_amount in its SELECT list"
    - "cash_collected column on Calls table is structurally unchanged (no DDL touches it)"
    - "Running the migration twice produces no errors (idempotent)"
  artifacts:
    - path: "Backend/src/db/migrations/004_payment_enhancement.js"
      provides: "Idempotent migration: adds total_payment_amount to Calls, attribution_mode to Clients, recreates view"
      exports: ["up"]
    - path: "Backend/src/db/migrations/run.js"
      provides: "Migration runner updated to call migration004.up()"
      contains: "migration004"
  key_links:
    - from: "Backend/src/db/migrations/run.js"
      to: "Backend/src/db/migrations/004_payment_enhancement.js"
      via: "require and up() call"
      pattern: "require.*004_payment_enhancement"
    - from: "Backend/src/db/migrations/004_payment_enhancement.js"
      to: "BigQuery INFORMATION_SCHEMA"
      via: "Column existence guard before ALTER TABLE"
      pattern: "INFORMATION_SCHEMA\\.COLUMNS"
    - from: "Backend/src/db/migrations/004_payment_enhancement.js"
      to: "BigQuery INFORMATION_SCHEMA.VIEWS"
      via: "Reads existing view DDL before CREATE OR REPLACE VIEW"
      pattern: "INFORMATION_SCHEMA\\.VIEWS"
---

<objective>
Create an idempotent BigQuery migration that adds `total_payment_amount` (FLOAT64) to the Calls table, `attribution_mode` (STRING) to the Clients table with a default of `'all_installments'` for existing rows, and recreates `v_calls_joined_flat_prefixed` to include the new column. The existing `cash_collected` column must not be touched by any DDL.

Purpose: Every downstream phase (matching, payments, attribution) depends on these columns existing. This migration is the root dependency for the entire milestone.

Output: `004_payment_enhancement.js` migration file with `up()` and `verify()` functions, and an updated `run.js` that calls it.
</objective>

<execution_context>
@/Users/user/.claude/get-shit-done/workflows/execute-plan.md
@/Users/user/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-schema-migration/01-RESEARCH.md
@Backend/src/db/migrations/001_create_prospects.js
@Backend/src/db/migrations/run.js
@Backend/src/config/index.js

<interfaces>
From Backend/src/db/migrations/001_create_prospects.js (established migration pattern):
```javascript
const { BigQuery } = require('@google-cloud/bigquery');
const config = require('../../config');

async function up() {
  const bq = new BigQuery({ projectId: config.bigquery.projectId });
  // ... migration logic
}

module.exports = { up };
```

From Backend/src/config/index.js:
```javascript
config.bigquery.projectId  // 'closer-automation'
config.bigquery.dataset    // 'CloserAutomation'
```

From Backend/src/db/migrations/run.js:
```javascript
const migration001 = require('./001_create_prospects');
// ... each migration imported and called sequentially in runAll()
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create migration 004_payment_enhancement.js</name>
  <files>Backend/src/db/migrations/004_payment_enhancement.js</files>
  <action>
Create `Backend/src/db/migrations/004_payment_enhancement.js` following the established migration pattern (see 001_create_prospects.js). The file must:

1. **Import pattern**: Use `require('@google-cloud/bigquery')` and `require('../../config')` — same as existing migrations. Create a new `BigQuery` instance directly (NOT the singleton BigQueryClient).

2. **Helper function `addColumnIfNotExists(bq, dataset, tableName, columnName, columnDef)`**:
   - Query `INFORMATION_SCHEMA.COLUMNS` to check if the column already exists
   - Use parameterized query with `@tableName` and `@columnName` params
   - If column does NOT exist, run `ALTER TABLE` to add it
   - Log "Added column: {table}.{column}" or "Column already exists, skipping: {table}.{column}"
   - The dataset and projectId come from `config.bigquery.projectId` and `config.bigquery.dataset`

3. **`up()` function** — runs these steps IN ORDER:
   - **Step 1 (SCHM-02):** Call `addColumnIfNotExists` for `Calls.total_payment_amount FLOAT64`
   - **Step 2 (SCHM-03):** Call `addColumnIfNotExists` for `Clients.attribution_mode STRING`
   - **Step 3 (SCHM-03 continued):** Run UPDATE to set default: `UPDATE Clients SET attribution_mode = 'all_installments' WHERE attribution_mode IS NULL` — this is idempotent (WHERE clause ensures no-op if already set)
   - **Step 4 (SCHM-04):** Retrieve existing view DDL from `INFORMATION_SCHEMA.VIEWS` where `table_name = 'v_calls_joined_flat_prefixed'`. Log the existing DDL for rollback reference. Then use string manipulation to inject `c.total_payment_amount AS calls_total_payment_amount` into the existing view's SELECT list (insert it right before the FROM clause). Run `CREATE OR REPLACE VIEW` with the modified DDL. If the view does NOT exist in INFORMATION_SCHEMA (fresh environment), log a warning: "View does not exist — skipping view update. The view must be created manually or by the Frontend deployment." Do NOT attempt to create the full view from scratch (the complete column list is not in the codebase and creating an incomplete view would break Frontend queries).
   - **Step 5 (SCHM-01):** Add a comment-only log: `console.log('  SCHM-01: cash_collected semantics redefined to first-payment-only (no DDL change)');`

4. **`verify(bq, dataset)` function** — runs post-migration smoke checks:
   - Query `SELECT total_payment_amount FROM Calls LIMIT 1` — no error = column exists
   - Query `SELECT attribution_mode FROM Clients LIMIT 1` — verify value is `'all_installments'`
   - Query `SELECT calls_total_payment_amount FROM v_calls_joined_flat_prefixed LIMIT 1` — no error = view updated (wrap in try/catch — if view was skipped because it didn't exist, log warning instead of failing)
   - Query `SELECT cash_collected FROM Calls LIMIT 1` — no error = column unchanged
   - Log PASS/FAIL for each check

5. **Export:** `module.exports = { up };` — same pattern as existing migrations.

6. **SCHM-01 note:** Add a JSDoc comment at the top of the file: "SCHM-01: cash_collected is semantically redefined to mean first-payment-only. No DDL change needed — the column already exists as FLOAT64. The semantic change is enforced by PaymentService logic in Phase 3."

7. **Historical backfill TODO:** Add a comment: "// TODO: Tyler decision pending — historical cash_collected may need backfill. See STATE.md."

CRITICAL CONSTRAINTS:
- Do NOT write any DDL that references `cash_collected` — it must remain untouched
- Do NOT hardcode the full view DDL — read it from INFORMATION_SCHEMA at runtime
- All BigQuery queries must use `location: 'US'`
- Use template literals with `config.bigquery.projectId` and `config.bigquery.dataset` for fully-qualified table names (pattern: `` `${projectId}.${dataset}.TableName` ``)
- The `addColumnIfNotExists` helper must use parameterized queries for table/column names in the INFORMATION_SCHEMA lookup (use `@tableName` and `@columnName` params), but the ALTER TABLE DDL itself uses template literals (BigQuery DDL does not support parameterized identifiers)
  </action>
  <verify>
    <automated>node -e "const m = require('./Backend/src/db/migrations/004_payment_enhancement'); console.log('up:', typeof m.up === 'function' ? 'PASS' : 'FAIL');"</automated>
  </verify>
  <done>
    - 004_payment_enhancement.js exists with exported `up()` function
    - `addColumnIfNotExists` helper uses INFORMATION_SCHEMA guard
    - Step 1 adds `total_payment_amount` to Calls
    - Step 2 adds `attribution_mode` to Clients
    - Step 3 sets default `'all_installments'` for existing rows
    - Step 4 reads existing view DDL and injects new column (or skips gracefully if view absent)
    - Step 5 logs SCHM-01 semantic note
    - verify() function runs smoke queries
    - No DDL touches cash_collected
  </done>
</task>

<task type="auto">
  <name>Task 2: Register migration 004 in run.js</name>
  <files>Backend/src/db/migrations/run.js</files>
  <action>
Edit `Backend/src/db/migrations/run.js` to import and call migration 004:

1. Add import line after the existing migration imports:
   ```javascript
   const migration004 = require('./004_payment_enhancement');
   ```

2. Add `await migration004.up();` after the `await migration003.up();` line inside the `runAll()` function's try block.

That's it — two lines added. Do NOT change any existing imports or calls.
  </action>
  <verify>
    <automated>grep -q "migration004" Backend/src/db/migrations/run.js && grep -q "004_payment_enhancement" Backend/src/db/migrations/run.js && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>
    - run.js imports 004_payment_enhancement
    - run.js calls migration004.up() after migration003.up()
    - Existing migration imports and calls are unchanged
  </done>
</task>

</tasks>

<verification>
1. `node -e "const m = require('./Backend/src/db/migrations/004_payment_enhancement'); console.log('exports:', Object.keys(m));"` — should output `['up']`
2. `grep -c "migration004" Backend/src/db/migrations/run.js` — should output `2` (one import, one call)
3. `grep "cash_collected" Backend/src/db/migrations/004_payment_enhancement.js` — should only appear in comments and the verify() function's SELECT, never in ALTER TABLE or UPDATE statements
4. `grep "INFORMATION_SCHEMA" Backend/src/db/migrations/004_payment_enhancement.js` — should appear at least twice (once for COLUMNS check, once for VIEWS read)
5. `grep "all_installments" Backend/src/db/migrations/004_payment_enhancement.js` — should appear in the UPDATE default-setting query

Note: Full end-to-end verification (running the migration against BigQuery) is a post-plan checkpoint. The automated checks above verify the code structure is correct without requiring a live BigQuery connection.
</verification>

<success_criteria>
- Migration file `004_payment_enhancement.js` exists and exports `up()`
- Migration uses INFORMATION_SCHEMA guards for idempotent column additions
- Migration reads existing view DDL before replacing (does not hardcode view)
- Migration sets `attribution_mode = 'all_installments'` for existing rows
- Migration does NOT modify `cash_collected` in any DDL statement
- `run.js` imports and calls migration 004 after 003
- All automated verification commands pass
</success_criteria>

<output>
After completion, create `.planning/phases/01-schema-migration/01-01-SUMMARY.md`
</output>
