# 🔥 HYBRID PAYMENT SYSTEM - IMPLEMENTATION COMPLETE

## Overview
Sistema de pagamento híbrido implementado para PhysioFlow Plus que diferencia planos anuais (pagos em 12x via Asaas Payments API) de planos trimestrais/semestrais (recorrentes via Asaas Subscriptions API).

## Architecture

### Annual Plans (12x Installments)
- **API Used**: Asaas `/payments` endpoint
- **Payment Type**: Single payment with 12 installments (`installmentCount: 12`)
- **Database**: Saves to `payments` table with `is_installment_plan=true` and `installment_count=12`
- **Subscription Tracking**: Updates `subscriptions` table with `billing_period='annual'` but NO `asaas_subscription_id` (not a recurring subscription)

### Quarterly/Semiannual Plans (Recurring)
- **API Used**: Asaas `/subscriptions` endpoint
- **Payment Type**: Recurring subscription with automatic billing
- **Billing Cycle**: `QUARTERLY` or `SEMIANNUALLY`
- **Database**: Saves to `payments` table with `asaas_subscription_id` linking to Asaas subscription
- **Subscription Tracking**: Updates `subscriptions` table with `asaas_subscription_id` and `billing_cycle`

## Database Schema Changes

### Migration Applied
File: `supabase/migrations/20240122000000_add_installment_tracking_to_payments.sql`

```sql
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS installment_count integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_installment integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_installment_plan boolean DEFAULT false;
```

### Existing Schema (Already in Place)
- `payments.asaas_subscription_id` → Links payments to recurring subscriptions
- `subscriptions.asaas_subscription_id` → Links clinic subscriptions to Asaas subscriptions
- `subscriptions.billing_period` → Enum: 'monthly' | 'quarterly' | 'semiannual' | 'annual'
- `subscriptions.billing_cycle` → String: 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY'

## Edge Function Logic

### Request Flow
```typescript
billingPeriod = 'annual' | 'quarterly' | 'semiannual'

if (billingPeriod === 'annual') {
  // Call Asaas Payments API
  POST /payments
  Body: {
    customer, billingType, value, dueDate,
    installmentCount: 12,
    installmentValue: value / 12
  }
  
  // Save to payments table
  is_installment_plan: true
  installment_count: 12
  current_installment: 1
  asaas_subscription_id: null
  
  // Update subscriptions table
  billing_period: 'annual'
  asaas_subscription_id: null (not recurring)
  
} else {
  // Call Asaas Subscriptions API
  POST /subscriptions
  Body: {
    customer, billingType, value, nextDueDate,
    cycle: 'QUARTERLY' | 'SEMIANNUALLY'
  }
  
  // Save to payments table
  is_installment_plan: false
  installment_count: 1
  asaas_subscription_id: <subscription_id>
  
  // Update subscriptions table
  billing_period: 'quarterly' | 'semiannual'
  asaas_subscription_id: <subscription_id>
  billing_cycle: 'QUARTERLY' | 'SEMIANNUALLY'
}
```

## Files Modified

### 1. Edge Function - create-asaas-payment
- **File**: `supabase/functions/create-asaas-payment/index.ts`
- **Backup**: `supabase/functions/create-asaas-payment/index-backup-original.ts`
- **Changes**:
  - Added `isAnnualPlan` detection logic
  - Conditional API calls based on `billingPeriod`
  - Database insert with installment tracking fields
  - Subscription update differentiating annual vs recurring

### 2. Database Migration
- **File**: `supabase/migrations/20240122000000_add_installment_tracking_to_payments.sql`
- **Added Columns**:
  - `installment_count` (integer, default 1)
  - `current_installment` (integer, default 1)
  - `is_installment_plan` (boolean, default false)
- **Index**: `idx_payments_installment_plan` for performance

## Deployment Steps

### 1. Apply Database Migration
```bash
npx supabase db push
```

### 2. Deploy Edge Function
```bash
npx supabase functions deploy create-asaas-payment --no-verify-jwt
```

### 3. Regenerate Types (if needed)
```bash
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```

## Testing Guide

### Test 1: Quarterly Subscription
```json
POST /create-asaas-payment
{
  "customerId": "cus_xxx",
  "billingType": "CREDIT_CARD",
  "value": 297,
  "dueDate": "2024-01-22",
  "billingPeriod": "quarterly",
  "clinicId": "xxx",
  "productId": "xxx",
  "creditCard": {...},
  "creditCardHolderInfo": {...}
}
```

**Expected**:
- Asaas creates `/subscriptions` with `cycle: QUARTERLY`
- Database `payments` has `is_installment_plan=false`, `asaas_subscription_id=<id>`
- Database `subscriptions` has `asaas_subscription_id=<id>`, `billing_period='quarterly'`

### Test 2: Semiannual Subscription
```json
POST /create-asaas-payment
{
  "customerId": "cus_xxx",
  "billingType": "CREDIT_CARD",
  "value": 594,
  "dueDate": "2024-01-22",
  "billingPeriod": "semiannual",
  "clinicId": "xxx",
  "productId": "xxx",
  "creditCard": {...},
  "creditCardHolderInfo": {...}
}
```

**Expected**:
- Asaas creates `/subscriptions` with `cycle: SEMIANNUALLY`
- Database `payments` has `is_installment_plan=false`, `asaas_subscription_id=<id>`
- Database `subscriptions` has `asaas_subscription_id=<id>`, `billing_period='semiannual'`

### Test 3: Annual Installment Payment
```json
POST /create-asaas-payment
{
  "customerId": "cus_xxx",
  "billingType": "CREDIT_CARD",
  "value": 1188,
  "dueDate": "2024-01-22",
  "billingPeriod": "annual",
  "clinicId": "xxx",
  "productId": "xxx",
  "creditCard": {...},
  "creditCardHolderInfo": {...}
}
```

**Expected**:
- Asaas creates `/payments` with `installmentCount: 12`, `installmentValue: 99`
- Database `payments` has `is_installment_plan=true`, `installment_count=12`, `current_installment=1`, `asaas_subscription_id=null`
- Database `subscriptions` has `asaas_subscription_id=null`, `billing_period='annual'`

## Log Prefixes
For easier debugging, all logs use prefixes:
- `[HYBRID]` - General flow
- `[ANNUAL]` - Annual plan (installment) path
- `[RECURRING]` - Quarterly/Semiannual (subscription) path
- `[DB]` - Database operations
- `[CLINIC]` - Clinic ID resolution
- `[PIX]` - PIX QR Code operations
- `[SUCCESS]` - Successful operations
- `[ERROR]` - Error conditions
- `[WARNING]` - Non-critical issues

## Response Format
```typescript
{
  payment: {
    id: string,
    status: string,
    value: number,
    ...
  },
  subscription: {
    id: string, // Only for recurring plans
    ...
  } | null,
  pixQrCode: {
    payload: string,
    ...
  } | null,
  success: true,
  isAnnual: boolean,
  installments: 1 | 12
}
```

## Monitoring

### Key Metrics
1. **Annual Plans**: Check `payments` table for `is_installment_plan=true` and `installment_count=12`
2. **Recurring Plans**: Check `subscriptions` table for non-null `asaas_subscription_id`
3. **Payment Linking**: Verify `payments.asaas_subscription_id` matches `subscriptions.asaas_subscription_id` for recurring

### Database Queries
```sql
-- Annual installment payments
SELECT * FROM payments 
WHERE is_installment_plan = true 
AND installment_count = 12;

-- Recurring subscriptions
SELECT * FROM subscriptions 
WHERE asaas_subscription_id IS NOT NULL
AND billing_period IN ('quarterly', 'semiannual');

-- Verify payment-subscription linkage
SELECT p.*, s.billing_period, s.billing_cycle
FROM payments p
LEFT JOIN subscriptions s ON s.asaas_subscription_id = p.asaas_subscription_id
WHERE p.clinic_id = '<clinic_id>';
```

## Rollback Plan
If issues occur, rollback by:
1. Restore original edge function: `cp index-backup-original.ts index.ts`
2. Deploy old version: `npx supabase functions deploy create-asaas-payment --no-verify-jwt`
3. Migration rollback is safe - new columns have defaults and won't break existing code

## Next Steps
- [ ] Deploy to production
- [ ] Test with real Asaas credentials
- [ ] Monitor logs for both payment types
- [ ] Set up alerts for failed payment creations
- [ ] Update frontend to show installment information for annual plans

---
**Implementation Date**: 2024-01-22  
**Status**: ✅ COMPLETE - Ready for deployment and testing
