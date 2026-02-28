# Project Research Summary

**Project:** CloserMetrix — Payment Webhook Enhancement
**Domain:** Payment matching, split-pay tracking, dual-column revenue attribution, configurable closer credit
**Researched:** 2026-02-28
**Confidence:** HIGH

## Executive Summary

This milestone enhances an already-working payment webhook system in a Node.js / BigQuery backend. The core work is a semantic redefinition of `cash_collected` (from "accumulates all payments" to "first payment only"), the addition of a new `total_payment_amount` column that accumulates all installments, a three-tier call-matching chain (email → exact name → fuzzy name), and a per-client configurable closer credit attribution mode. The approach is surgical: one new npm package (`natural` for Jaro-Winkler name matching), two new backend service files (`MatchingService.js`, `FuzzyMatcher.js`), one new migration, and targeted modifications to `PaymentService.js`, `calls.js` queries, and Frontend financial queries. No new tables, no new infrastructure.

The recommended architecture is a strict build order driven by hard schema dependencies. The BigQuery schema migration (ALTER TABLE Calls, ALTER TABLE Clients, CREATE OR REPLACE VIEW) must go first — every other piece of work depends on those columns existing. The three-tier matching chain and dual-column payment logic can then be built in parallel, followed by the Frontend display layer. The fuzzy match component is isolated in a standalone `FuzzyMatcher` utility with no BigQuery calls, making it independently testable.

The dominant risks are data-correctness issues rather than technical unknowns. Fuzzy matching must be scoped to payers only (a SQL WHERE constraint, not an application filter) to prevent false attributions. Refund logic must be updated simultaneously with dual-column payment logic — shipping them separately corrupts payment data. The BigQuery view `v_calls_joined_flat_prefixed` will silently hide new columns from the Frontend unless explicitly recreated, and webhook idempotency must be in place before any dual-column logic goes live to prevent double-counted installments from automation retries.

---

## Key Findings

### Recommended Stack

The stack is almost entirely unchanged. The only new dependency is `natural@^8.1.1`, which provides `JaroWinklerDistance()` for fuzzy name matching. Jaro-Winkler is the research-validated best algorithm for personal names (peer-reviewed at 97.4% sensitivity at 0.80 threshold), and `natural` is the only actively maintained library that packages it. All alternatives (`string-similarity`, `fuse.js`, standalone `jaro-winkler`) are either abandoned, architecturally mismatched for pairwise scoring, or single-purpose with no maintenance.

BigQuery schema changes use the existing `bq.query()` DDL pattern with INFORMATION_SCHEMA guards because BigQuery does not support `IF NOT EXISTS` on `ADD COLUMN`. Idempotent migration scripts are a hard requirement. Full details: [STACK.md](.planning/research/STACK.md).

**Core technologies:**
- `Node.js 22+ / Express 4`: Runtime and webhook layer — no changes, already in use
- `@google-cloud/bigquery@^7.9.0`: All data persistence — DDL via `bq.query()`, DML UPDATE for payment writes
- `natural@^8.1.1` (NEW): Jaro-Winkler distance for name matching — only new npm install required
- `uuid@^11.1.0`, `winston@^3.17.0`: ID generation and audit logging — already installed, no changes

**Critical version note:** The `natural` threshold constant must be stored as `FUZZY_MATCH_THRESHOLD = 0.82` in config (not hardcoded) to allow tuning without code deploys. The ARCHITECTURE.md recommends 0.85 as a starting point; STACK.md argues 0.82 based on peer-reviewed literature. Use 0.82, document it, tune from there.

### Expected Features

Research confirms the milestone scope from PROJECT.md. All features are P1 for this sprint. Full details: [FEATURES.md](.planning/research/FEATURES.md).

**Must have (table stakes):**
- `cash_collected` = first payment only — the "cash on close" metric; closer's core performance indicator
- `total_payment_amount` = cumulative sum of all installments — full contract value metric
- Refund logic for both columns — refunds must reduce the correct column; shipping this after dual-column logic corrupts data
- Three-tier matching chain (email → exact name → fuzzy/payers-only) — email covers 80-90%; name matching covers the rest
- Configurable closer credit attribution (`first_only` vs `all_installments`) per client — stored in Clients table, read at webhook time
- Idempotency / duplicate webhook prevention — Zapier/GHL retry is expected behavior, not an edge case
- BigQuery view update — new columns are invisible to the Frontend until `CREATE OR REPLACE VIEW` is run
- Frontend dual-column scorecards (labeled "Cash on Close" vs "Total Collected")
- Data Analysis page payment column correctness

**Should have (competitive advantage):**
- Payment matching audit trail with `match_tier` and `match_confidence` in AuditLog metadata — low effort, high debugging value
- Payment plan health metric (% installments received) — high value for 3-pay/4-pay clients

**Defer (v2+):**
- Fuzzy threshold per-client configuration — add only if false-match complaints emerge
- Multi-currency support — requires exchange rate handling
- Payment schedule storage for dunning — requires new payload fields and a schedule table
- Closer leaderboard by `total_payment_amount` — valuable once 30+ days of dual-column history exists

**Anti-features to avoid:**
- Separate PaymentEvents log table — Tyler explicitly out-of-scope; AuditLog covers event history
- Direct payment processor integrations (Stripe/PayPal SDK) — processor-agnostic webhook is correct for this stage
- Invoice generation, payment reminders/dunning — separate products

### Architecture Approach

The architecture is a modification of the existing service layer, not a rewrite. `PaymentService.js` is the primary orchestrator and remains so; the main change is delegating call matching to a new `MatchingService.js`. A standalone `FuzzyMatcher.js` utility encapsulates the scoring algorithm with no side effects. One new migration file handles all schema changes. The Frontend changes are additive only — existing queries continue to work; new SELECT expressions and scorecards are added alongside them. Full details: [ARCHITECTURE.md](.planning/research/ARCHITECTURE.md).

**Major components:**
1. `MatchingService.js` (NEW) — encapsulates three-tier matching chain; returns `{ call, matchTier, matchMethod, score }`
2. `FuzzyMatcher.js` (NEW utility) — pure name scoring, no BigQuery calls, independently testable
3. `PaymentService.js` (MODIFY) — replace email-only match with `MatchingService.matchCall()`; add first-payment gate for dual columns; update refund logic; read client credit attribution config
4. `calls.js` (MODIFY) — add `findCallByName()`, `findCallsByPayers()` query methods
5. `004_payment_enhancement.js` (NEW migration) — ALTER Calls, ALTER Clients, CREATE OR REPLACE VIEW
6. `Frontend/server/db/queries/financial.js` (MODIFY) — add `total_payment_amount` to scorecard, timeseries, and closer SQL
7. `FinancialPage.jsx` (MODIFY) — add dual-column Scorecard components with correct labels

### Critical Pitfalls

Top pitfalls identified across research. Full details: [PITFALLS.md](.planning/research/PITFALLS.md).

1. **Fuzzy match against non-payers** — The fuzzy match pool MUST be filtered in SQL to `cash_collected > 0 OR total_payment_amount > 0`. Application-level filtering is insufficient; someone will remove it. Make it a hard WHERE clause in `findCallsByPayers()`.

2. **`cash_collected` semantic shift breaks payment logic** — The check for "is this the first payment?" reads `call.cash_collected` before writing. Subsequent installments must never accumulate into `cash_collected`. Use explicit branch: `if (!call.cash_collected || call.cash_collected === 0) { updates.cash_collected = amount; }`.

3. **BigQuery view silently missing new column** — `v_calls_joined_flat_prefixed` uses an explicit column list. Adding `total_payment_amount` to the Calls table does NOT make it appear in the view. The Frontend will show dashes/undefined. Bundle `CREATE OR REPLACE VIEW` in the same migration script as `ALTER TABLE`.

4. **Refund wrong column reduction** — Current `_processRefund()` reduces only `cash_collected`. After dual-column introduction, partial installment refunds must reduce `total_payment_amount` always and only reduce `cash_collected` if the refund amount >= first payment amount. Refund and payment logic must ship together — never sequentially.

5. **Duplicate webhook double-counts installments** — Zapier/GHL retry behavior is expected. Without idempotency, the same installment gets double-counted in `total_payment_amount`. Use a deterministic dedup key from `(client_id, prospect_email, payment_amount, payment_date)` checked against recent AuditLog entries. Idempotency must ship before dual-column logic goes live.

---

## Implications for Roadmap

Research reveals strict sequential dependencies. Every phase is blocked by the schema migration. Fuzzy matching depends on dual-column columns for its payer scope. Frontend work is blocked on the view update. This imposes a clear build order.

### Phase 1: Schema Migration
**Rationale:** The root dependency. Every other phase is blocked until `total_payment_amount` exists on Calls, `closer_credit_attribution` exists on Clients, and the view is updated. Zero code elsewhere works correctly without this.
**Delivers:** Updated BigQuery schema; `v_calls_joined_flat_prefixed` includes new column; migration is idempotent and reversible.
**Addresses:** Table stakes for dual-column support, view visibility for Frontend, Clients table field for attribution config.
**Avoids:** Pitfall 3 (view silently missing column), Pitfall 6 (attribution config missing from Clients), Pitfall 8 (non-idempotent migration re-run errors).

### Phase 2: FuzzyMatcher Utility + New Call Queries
**Rationale:** FuzzyMatcher has zero dependencies (pure function, no BigQuery). New call queries depend on Phase 1 columns (`total_payment_amount` in the payer scope filter). These two can be built in parallel with each other, unblocking Phase 3.
**Delivers:** `Backend/src/utils/FuzzyMatcher.js` with `findBestMatch(name, callsArray)` method; `findCallByName()` and `findCallsByPayers()` added to `calls.js`.
**Uses:** `natural.JaroWinklerDistance` with `FUZZY_MATCH_THRESHOLD = 0.82` constant in config.
**Avoids:** Pitfall 1 (wrong pool — `findCallsByPayers()` embeds the payer SQL filter), Pitfall 7 (threshold too lenient — Jaro-Winkler at 0.82 > Levenshtein).

### Phase 3: MatchingService + PaymentService Refactor
**Rationale:** Depends on Phase 2 (FuzzyMatcher, new queries). This is the core logic phase — three-tier matching, dual-column payment semantics, updated refund logic, closer credit attribution, and idempotency all go live together. They cannot be split: dual-column payment logic and refund logic must ship simultaneously to maintain data integrity.
**Delivers:** `MatchingService.js` with three-tier chain; `PaymentService.js` refactored for dual columns, first-payment gate, correct refund semantics, client attribution config read, and idempotency check.
**Implements:** Ordered Fallback pattern, First-Payment Gate pattern, Configurable Credit Attribution pattern, Soft Refund Semantics pattern (all from ARCHITECTURE.md).
**Avoids:** Pitfall 2 (`cash_collected` semantic shift), Pitfall 4 (wrong refund column), Pitfall 5 (duplicate installments), Pitfall 9 (installment attributed to wrong call on retry).

### Phase 4: Frontend Financial Display
**Rationale:** Blocked on Phase 1 (view update) and Phase 3 (accurate backend data). All Frontend changes are additive — existing queries and components continue to work while new ones are layered on.
**Delivers:** Updated `financial.js` and `overview.js` queries with `total_payment_amount`; new `Scorecard` components in `FinancialPage.jsx` labeled "Cash on Close" (first payment) and "Total Collected" (all installments); `computePageData.js` financial section updated.
**Addresses:** Frontend dual-column scorecards, Data Analysis page payment correctness.
**Avoids:** UX pitfall of unlabeled dual columns causing Tyler confusion.

### Phase 5: Audit Trail Enhancement (Post-Launch)
**Rationale:** Adds `match_tier` and `match_confidence` to AuditLog metadata on every payment attribution. Low effort, high debugging value. Deferred to post-launch so it doesn't block the core milestone, but should ship soon after.
**Delivers:** Every payment in AuditLog records how it was matched (email / exact_name / fuzzy_name) and the fuzzy confidence score when applicable. Tyler can audit false positives from the data, not from logs.
**Addresses:** P2 feature: payment matching audit trail with tier-reason.

### Phase Ordering Rationale

- **Schema-first is non-negotiable.** BigQuery view explicit column list means any code that reads `total_payment_amount` from the view before the migration has run will see `undefined`. The Frontend queries the view. The Backend payer scope filter depends on `total_payment_amount` existing. Nothing works before Phase 1.
- **FuzzyMatcher before MatchingService** because MatchingService imports FuzzyMatcher. FuzzyMatcher has zero dependencies so it can be built and unit-tested in isolation before BigQuery integration work is needed.
- **Payment + Refund logic in one phase** because the two columns are semantically interdependent. Shipping payment logic without updated refund logic would corrupt data the first time any installment is refunded.
- **Idempotency in Phase 3, not Phase 4** because idempotency must be in place before dual-column logic goes live — a duplicate webhook against dual-column code double-counts `total_payment_amount`.
- **Frontend last** because it has no dependencies that aren't satisfied by Phases 1-3 and gains nothing until the backend data is accurate.

### Research Flags

Phases with well-documented patterns (skip `/gsd:research-phase`):
- **Phase 1 (Schema Migration):** BigQuery DDL pattern is documented in STACK.md with verified INFORMATION_SCHEMA guard pattern. Migration structure follows existing `migrations/00X_*.js` convention.
- **Phase 4 (Frontend Display):** Additive changes to existing query patterns. View column availability is the only risk, and it's resolved by Phase 1.
- **Phase 5 (Audit Trail):** Pure metadata additions to existing AuditLogger calls. No new infrastructure.

Phases that may benefit from deeper research during planning:
- **Phase 3 (MatchingService + PaymentService):** The fuzzy threshold value (0.82 vs 0.85 — STACK.md and ARCHITECTURE.md differ) should be validated against a sample of real prospect names from the executive test client before going live. The idempotency dedup window (60 seconds vs 24 hours) needs a decision with Tyler.
- **Phase 3 (Refund logic specifically):** The heuristic for "which column does this refund reduce?" uses `total_payment_amount - refund_amount < cash_collected` as the decision boundary. This should be verified against real refund scenarios before implementation.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing codebase read directly; `natural` package verified on GitHub; BigQuery DDL pattern confirmed via official docs |
| Features | HIGH | Requirements from PROJECT.md (primary source); external payment matching patterns are MEDIUM from WebSearch |
| Architecture | HIGH | All integration points traced via direct codebase inspection; build order derived from actual code dependencies |
| Pitfalls | HIGH | Critical pitfalls derived from codebase behavior + BigQuery constraints documented in CLAUDE.md; external fuzzy matching pitfalls are MEDIUM from WebSearch |

**Overall confidence:** HIGH

### Gaps to Address

- **Fuzzy threshold disagreement:** STACK.md recommends 0.82 (PubMed-backed); ARCHITECTURE.md uses 0.85 in code examples. Decision: use 0.82 in the config constant, document the rationale. Tune upward if false-positive reports come in from real prospect name data. Define this threshold in `Backend/src/config/index.js` with an environment variable override.
- **Idempotency window:** FEATURES.md suggests 60-second window; PITFALLS.md mentions 24 hours for a stronger guarantee. Decision: implement the deterministic key approach (not time-window) using `(client_id, prospect_email, payment_amount, payment_date)` checked against AuditLog — avoids the window question entirely.
- **Historical `cash_collected` backfill:** Existing records have accumulated multi-payment totals in `cash_collected`. After the semantic change, these records will have incorrect `cash_collected > total_payment_amount` values. Decision required from Tyler before implementation: backfill from AuditLog history, or document the pre-migration data as having different semantics and move forward with clean data from migration date onward.
- **Attribution default value:** FEATURES.md says default should be `'first_only'`; PITFALLS.md suggests `'all_installments'` for backward compatibility with current behavior. These are genuinely different choices. Current behavior accumulates all payments into `cash_collected`, which most closely resembles `'all_installments'`. Recommendation: use `'all_installments'` as the default to avoid immediately changing closer metrics for all existing clients, and let Tyler set `'first_only'` per client going forward.

---

## Sources

### Primary (HIGH confidence)
- `/Users/user/CloserMetrix/.planning/PROJECT.md` — milestone requirements, column semantics, matching chain specification, anti-features
- `/Users/user/CloserMetrix/Backend/src/services/PaymentService.js` — existing payment pipeline behavior
- `/Users/user/CloserMetrix/Backend/src/services/ProspectService.js` — existing prospect management
- `/Users/user/CloserMetrix/Backend/src/db/queries/calls.js` — existing query methods and patterns
- `/Users/user/CloserMetrix/Backend/src/db/BigQueryClient.js` — DML UPDATE pattern, streaming insert constraint
- `/Users/user/CloserMetrix/Backend/CLAUDE.md` — BigQuery streaming buffer, DML decision, build patterns
- `/Users/user/CloserMetrix/Frontend/CLAUDE.md` — view explicit column list constraint confirmed
- [NaturalNode/natural GitHub](https://github.com/NaturalNode/natural) — JaroWinklerDistance API, version 8.1.1
- [Google Cloud Docs — Modifying table schemas](https://docs.cloud.google.com/bigquery/docs/managing-table-schemas) — ALTER TABLE ADD COLUMN, IF NOT EXISTS not supported
- [PubMed — Real world performance of approximate string comparators](https://pubmed.ncbi.nlm.nih.gov/15360771/) — Jaro-Winkler 97.4% sensitivity

### Secondary (MEDIUM confidence)
- [Flagright — Jaro-Winkler vs Levenshtein for name matching](https://www.flagright.com/post/jaro-winkler-vs-levenshtein-choosing-the-right-algorithm-for-aml-screening) — algorithm selection for names
- [Financial Crime Academy — Fuzzy Matching in Compliance](https://financialcrimeacademy.org/fuzzy-matching-in-financial-compliance/) — restricting fuzzy scope to reduce false positives
- [Medium — Handling Payment Webhooks Reliably](https://medium.com/@sohail_saifii/handling-payment-webhooks-reliably-idempotency-retries-validation-69b762720bf5) — idempotency patterns
- [Payment Matching Systems — duplicatepayments.co.uk](https://www.duplicatepayments.co.uk/post/2026/02/16/payment-matching-systems) — three-confidence-tier matching pattern
- [Transaction Matching — solvexia.com](https://www.solvexia.com/glossary/transaction-matching) — industry standard tiered matching

### Tertiary (LOW confidence)
- [WinPure — Fuzzy Matching Common Mistakes](https://winpure.com/fuzzy-matching-common-mistakes/) — general pitfalls, not domain-specific
- [GoHighLevel Payments playbook](https://ghl-services-playbooks-automation-crm-marketing.ghost.io/gohighlevel-payments-accept-online-payments-automate-invoices-and-track-transactions/) — GHL payment automation context (marketing content)
- [level6.com — Split Credit Rules for Team Sales](https://www.level6.com/split-credit-rules-sales/) — closer credit attribution patterns

---
*Research completed: 2026-02-28*
*Ready for roadmap: yes*
