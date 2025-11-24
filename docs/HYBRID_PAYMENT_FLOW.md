# 🔄 HYBRID PAYMENT SYSTEM - FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                    PHYSIOFLOW PLUS PAYMENT                      │
│                        HYBRID SYSTEM                            │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   Frontend Request     │
                    │   (PaymentSystem)      │
                    │                        │
                    │  - customerId          │
                    │  - billingType         │
                    │  - value               │
                    │  - billingPeriod       │
                    │  - clinicId            │
                    │  - productId           │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Edge Function         │
                    │  create-asaas-payment  │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  Check billingPeriod   │
                    └────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
                 ▼                               ▼
    ┌──────────────────────┐        ┌──────────────────────┐
    │   'annual'           │        │  'quarterly' or      │
    │   (Installments)     │        │  'semiannual'        │
    │                      │        │  (Recurring)         │
    └──────────────────────┘        └──────────────────────┘
                 │                               │
                 ▼                               ▼
    ┌──────────────────────┐        ┌──────────────────────┐
    │  Asaas Payments API  │        │ Asaas Subscriptions  │
    │  POST /payments      │        │ API                  │
    │                      │        │ POST /subscriptions  │
    │  {                   │        │                      │
    │   installmentCount:12│        │  {                   │
    │   installmentValue:  │        │   cycle: QUARTERLY   │
    │      value/12        │        │   or SEMIANNUALLY    │
    │  }                   │        │  }                   │
    └──────────────────────┘        └──────────────────────┘
                 │                               │
                 ▼                               ▼
    ┌──────────────────────┐        ┌──────────────────────┐
    │  Response:           │        │  Response:           │
    │  payment_id          │        │  subscription_id     │
    │  (no subscription)   │        │  + payment_id        │
    └──────────────────────┘        └──────────────────────┘
                 │                               │
                 └───────────────┬───────────────┘
                                 ▼
                    ┌────────────────────────┐
                    │  Save to Database      │
                    └────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
                 ▼                               ▼
    ┌──────────────────────┐        ┌──────────────────────┐
    │  payments table      │        │  payments table      │
    │                      │        │                      │
    │  is_installment_plan │        │  is_installment_plan │
    │    = true            │        │    = false           │
    │  installment_count   │        │  installment_count   │
    │    = 12              │        │    = 1               │
    │  asaas_subscription  │        │  asaas_subscription  │
    │    _id = null        │        │    _id = sub_xxx     │
    └──────────────────────┘        └──────────────────────┘
                 │                               │
                 ▼                               ▼
    ┌──────────────────────┐        ┌──────────────────────┐
    │  subscriptions table │        │  subscriptions table │
    │                      │        │                      │
    │  billing_period      │        │  billing_period      │
    │    = 'annual'        │        │    = 'quarterly' or  │
    │                      │        │      'semiannual'    │
    │  asaas_subscription  │        │  asaas_subscription  │
    │    _id = null        │        │    _id = sub_xxx     │
    │                      │        │  billing_cycle       │
    │  (Not recurring)     │        │    = QUARTERLY or    │
    │                      │        │      SEMIANNUALLY    │
    │                      │        │                      │
    │                      │        │  (Auto-renewing)     │
    └──────────────────────┘        └──────────────────────┘
                 │                               │
                 └───────────────┬───────────────┘
                                 ▼
                    ┌────────────────────────┐
                    │  Return to Frontend    │
                    │                        │
                    │  {                     │
                    │   success: true,       │
                    │   payment: {...},      │
                    │   subscription: {...}, │
                    │   isAnnual: boolean,   │
                    │   installments: 1|12   │
                    │  }                     │
                    └────────────────────────┘
```

## 📊 DATA FLOW COMPARISON

### ANNUAL PLAN (12x Installments)
```
User Payment
     ↓
Edge Function (billingPeriod='annual')
     ↓
Asaas POST /payments {installmentCount: 12}
     ↓
payment_id returned (NO subscription_id)
     ↓
Database:
  ├─ payments {
  │    is_installment_plan: true,
  │    installment_count: 12,
  │    asaas_subscription_id: null
  │  }
  └─ subscriptions {
       billing_period: 'annual',
       asaas_subscription_id: null
     }
     ↓
User pays 12 monthly installments
     ↓
After 12 months: Subscription expires
     ↓
Need to create NEW payment for renewal
```

### QUARTERLY/SEMIANNUAL PLAN (Recurring)
```
User Payment
     ↓
Edge Function (billingPeriod='quarterly'|'semiannual')
     ↓
Asaas POST /subscriptions {cycle: QUARTERLY|SEMIANNUALLY}
     ↓
subscription_id + payment_id returned
     ↓
Database:
  ├─ payments {
  │    is_installment_plan: false,
  │    installment_count: 1,
  │    asaas_subscription_id: sub_xxx
  │  }
  └─ subscriptions {
       billing_period: 'quarterly'|'semiannual',
       asaas_subscription_id: sub_xxx,
       billing_cycle: 'QUARTERLY'|'SEMIANNUALLY'
     }
     ↓
User pays single charge
     ↓
After 3/6 months: Asaas AUTO-CHARGES next payment
     ↓
Webhook notifies: New payment created
     ↓
Update database with new payment
     ↓
Cycle continues (auto-renewing)
```

## 🔑 KEY DIFFERENCES

| Aspect | Annual (12x) | Quarterly/Semiannual (Recurring) |
|--------|-------------|----------------------------------|
| **API** | `/payments` | `/subscriptions` |
| **Asaas Object** | Payment with installments | Subscription |
| **Auto-Renewal** | ❌ No | ✅ Yes |
| **Payment Frequency** | 12 monthly charges | 1 charge every 3/6 months |
| **DB: is_installment_plan** | ✅ true | ❌ false |
| **DB: installment_count** | 12 | 1 |
| **DB: asaas_subscription_id** | null | sub_xxx |
| **Manual Renewal Needed** | ✅ Yes (after 12mo) | ❌ No (auto) |
| **Cancellation** | Cannot cancel (committed to 12x) | Can cancel anytime |

## 🎯 WHY THIS ARCHITECTURE?

### Problem:
- Asaas Subscriptions API doesn't support installments
- Need to offer annual plan with 12 monthly payments
- Need quarterly/semiannual with automatic renewal

### Solution:
- **Annual**: Use Payments API with `installmentCount: 12`
  - Client commits to 12 payments
  - Each payment auto-charged monthly
  - No subscription object (one-time commitment)
  
- **Quarterly/Semiannual**: Use Subscriptions API
  - Creates recurring subscription
  - Auto-renews every period
  - Can be cancelled anytime

### Benefits:
✅ Flexible payment options for clients
✅ Proper handling in Asaas system
✅ Clear database tracking
✅ Correct billing automation
✅ Easy to monitor and report

---

**Implementation Date**: 2024-01-22  
**System**: PhysioFlow Plus - Hybrid Payment Architecture
