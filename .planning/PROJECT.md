# CloserMetrix — Payment Webhook Enhancement

## What This Is

Enhancement to CloserMetrix's existing payment webhook system. The Backend already has a PaymentService, ProspectService, and `/webhooks/payment` endpoint (Phase 5 complete). This milestone brings the payment system in line with Tyler's updated requirements: proper first-payment vs total-payment tracking, a three-tier matching chain (email → exact name → fuzzy name against previous payers), configurable closer credit attribution, and refund handling that reduces both columns.

## Core Value

When a payment webhook arrives, it must find the right call record and correctly track first payment vs total payments — even when the payment email doesn't match perfectly.

## Requirements

### Validated

- Existing PaymentService processes payments and refunds
- Existing webhook at `POST /webhooks/payment` accepts standardized payloads
- ProspectService finds/creates prospects by email + client_id
- Refunds subtract from cash_collected and can revert call outcome to Lost
- Chargeback alerts fire via AlertService
- Audit logging for all payment events

### Active

- [ ] Redefine `cash_collected` on Calls table to mean **first payment amount only**
- [ ] Add `total_payment_amount` column to Calls table = sum of all payments (first + subsequent)
- [ ] Three-tier matching chain: email match → exact name match → fuzzy name match (against callers who already have a payment)
- [ ] Configurable closer credit attribution per client (all installments vs first only)
- [ ] Refunds reduce both `cash_collected` (if first payment refunded) and `total_payment_amount`
- [ ] Single endpoint handles payments and refunds (via `payment_type` field)
- [ ] Support split-pay / payment plan tracking (3-pay, 4-pay, 6-pay, etc.)
- [ ] Product name optional in payload
- [ ] Update BigQuery view (`v_calls_joined_flat_prefixed`) to include `total_payment_amount`
- [ ] Frontend dashboard surfaces both first payment and total payment metrics
- [ ] Data Analysis page reflects payment data correctly

### Out of Scope

- Separate PaymentEvents log table — Tyler wants aggregates only on Calls table
- Payment processor integrations (Stripe, PayPal direct) — clients send via their own Zapier/GHL automation
- Invoice generation or billing management
- Payment reminders or dunning

## Context

### Existing Payment System (Backend)

The Backend already has a complete payment pipeline:
- `Backend/src/routes/webhooks/payment.js` — webhook route with validation
- `Backend/src/services/PaymentService.js` — orchestrates payment processing
- `Backend/src/services/ProspectService.js` — prospect record management
- `Backend/src/middleware/webhookAuth.js` — per-client webhook auth
- `Backend/src/middleware/clientIsolation.js` — client ID resolution

**Current behavior that needs to change:**
1. `cash_collected` currently accumulates ALL payments — needs to be first payment only
2. Matching is email-only via ProspectService → needs three-tier chain
3. No `total_payment_amount` column exists
4. No fuzzy name matching against previous payers

### Payment Payload (standardized, processor-agnostic)

```json
{
  "client_id": "xxx",
  "prospect_email": "john@example.com",
  "prospect_name": "John Smith",
  "payment_amount": 5000,
  "payment_date": "2026-02-15",
  "payment_type": "full",
  "product_name": "Coaching Program",
  "notes": "Paid via Stripe"
}
```

Required: `client_id`, `prospect_email`, `payment_amount`
Optional: `prospect_name`, `payment_date`, `payment_type`, `product_name`, `notes`
Valid types: `"full"`, `"deposit"`, `"payment_plan"`, `"refund"`, `"chargeback"`

### Matching Chain (Priority Order)

1. **Email match** → payment email against `prospect_email` in Calls table for this client
2. **Exact name match** → `prospect_name` from payment against `prospect_name` in Calls table
3. **Fuzzy name match** → closest name match, BUT only against callers **who already have a payment** (`cash_collected > 0` or `total_payment_amount > 0`)

### Column Semantics

| Column | Meaning | When Updated |
|--------|---------|--------------|
| `cash_collected` | First payment amount only | Set on first payment for a call, reduced if first payment refunded |
| `total_payment_amount` | Sum of ALL payments (first + subsequent) | Updated on every payment, reduced on refunds |

### Split Pay / Payment Plans

Programs are often split: 3-pay, 4-pay, 6-pay, 10-pay, 12-pay, or paid in full. The first payment is the initial installment. Subsequent payments from the same person for the same program are additional installments.

### Closer Credit Attribution

Configurable per client:
- **All installments** — closer gets revenue credit for every payment
- **First only** — closer gets credit for the close; installments are fulfillment
- Default: configurable (needs a field on Clients table)

## Constraints

- **BigQuery**: Soft deletes only, never fully delete. Live subqueries, never computed columns
- **Existing views**: `v_calls_joined_flat_prefixed` must be updated with new columns via `CREATE OR REPLACE VIEW`
- **Tron dark theme**: All frontend uses `COLORS` and `LAYOUT` from `client/src/theme/constants.js`
- **Tier system**: `basic`, `insight`, `executive` — payment features may be tier-gated

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Aggregates on Calls table, no separate events log | Tyler wants simplicity, no audit trail for individual payment events beyond what AuditLog provides | — Pending |
| Three-tier matching with fuzzy against payers only | Prevents matching to wrong person; fuzzy restricted to known payers reduces false matches | — Pending |
| cash_collected = first payment only | Aligns with "cash collected on close" metric Tyler wants to track separately | — Pending |

---
*Last updated: 2026-02-28 after initialization*
