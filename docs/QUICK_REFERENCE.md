# 🚀 QUICK REFERENCE - HYBRID PAYMENT SYSTEM

## 📦 ONE-COMMAND DEPLOYMENT
```powershell
.\deploy-hybrid-payment.ps1
```

## 🔧 MANUAL COMMANDS

### Deploy Migration
```bash
npx supabase db push
```

### Deploy Edge Function
```bash
npx supabase functions deploy create-asaas-payment --no-verify-jwt
```

### View Logs
```bash
npx supabase functions logs create-asaas-payment --follow
```

### Regenerate Types
```bash
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```

## 🧪 TEST REQUESTS

### Test Annual (12x Installments)
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/create-asaas-payment \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cus_xxx",
    "billingType": "CREDIT_CARD",
    "value": 1188,
    "dueDate": "2024-01-22",
    "billingPeriod": "annual",
    "clinicId": "xxx",
    "productId": "xxx",
    "creditCard": {
      "holderName": "John Doe",
      "number": "5162306219378829",
      "expiryMonth": "05",
      "expiryYear": "2027",
      "ccv": "318"
    },
    "creditCardHolderInfo": {
      "name": "John Doe",
      "email": "john@example.com",
      "cpfCnpj": "12345678901",
      "postalCode": "12345000",
      "addressNumber": "123",
      "phone": "11999999999"
    }
  }'
```

### Test Quarterly (Recurring)
```bash
# Same as above but change:
"billingPeriod": "quarterly",
"value": 297
```

### Test Semiannual (Recurring)
```bash
# Same as above but change:
"billingPeriod": "semiannual",
"value": 594
```

## 🔍 DATABASE QUERIES

### Check Annual Installment Payments
```sql
SELECT * FROM payments 
WHERE is_installment_plan = true 
AND installment_count = 12
ORDER BY created_at DESC;
```

### Check Recurring Subscriptions
```sql
SELECT * FROM subscriptions 
WHERE asaas_subscription_id IS NOT NULL
AND billing_period IN ('quarterly', 'semiannual')
ORDER BY created_at DESC;
```

### Verify Payment-Subscription Link
```sql
SELECT 
  p.asaas_payment_id,
  p.value,
  p.is_installment_plan,
  p.installment_count,
  s.billing_period,
  s.asaas_subscription_id,
  s.billing_cycle
FROM payments p
LEFT JOIN subscriptions s ON s.clinic_id = p.clinic_id
WHERE p.clinic_id = 'YOUR_CLINIC_ID'
ORDER BY p.created_at DESC;
```

### Count Payments by Type
```sql
SELECT 
  CASE 
    WHEN is_installment_plan = true THEN 'Annual (12x)'
    ELSE 'Recurring'
  END as payment_type,
  COUNT(*) as total,
  SUM(value) as total_value
FROM payments
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY is_installment_plan;
```

## 🎯 EXPECTED LOG PATTERNS

### Annual Plan
```
[HYBRID] REQUEST COMPLETO: {...billingPeriod: "annual"...}
[ANNUAL] Plano ANUAL detectado - Criando payment com 12 parcelas no Asaas...
[SUCCESS] Payment anual com 12 parcelas criado no Asaas: pay_xxx
[DB] Salvando pagamento com: {is_installment_plan: true, installment_count: 12}
[SUCCESS] Payment saved successfully in database
[SUCCESS] Subscription atualizada: {is_annual: true}
[SUCCESS] Pagamento criado com sucesso: pay_xxx
```

### Quarterly/Semiannual Plan
```
[HYBRID] REQUEST COMPLETO: {...billingPeriod: "quarterly"...}
[RECURRING] Plano TRIMESTRAL/SEMESTRAL detectado - Criando SUBSCRIPTION no Asaas...
[SUCCESS] Subscription criada no Asaas: sub_xxx
[SUCCESS] Payment da subscription encontrado: pay_yyy
[DB] Salvando pagamento com: {is_installment_plan: false, asaas_subscription_id: sub_xxx}
[SUCCESS] Payment saved successfully in database
[SUCCESS] Subscription atualizada: {asaas_subscription_id: sub_xxx}
[SUCCESS] Pagamento criado com sucesso: pay_yyy
```

## ⚠️ TROUBLESHOOTING

### Error: "clinicId ou productId estão faltando"
**Fix**: Ensure frontend sends both `clinicId` and `productId` in request

### Error: "Dados do titular do cartão incompletos"
**Fix**: Ensure all creditCardHolderInfo fields are present (name, cpfCnpj, email, postalCode, addressNumber, phone)

### Annual payment shows asaas_subscription_id
**Fix**: This is incorrect! Annual should have `asaas_subscription_id = null`
- Check logs for `[ANNUAL]` prefix
- Verify `billingPeriod` is exactly 'annual'

### Recurring missing asaas_subscription_id
**Fix**: This is incorrect! Recurring should have subscription ID
- Check logs for `[RECURRING]` prefix
- Verify Asaas subscription was created successfully
- Check for Asaas API errors

## 📊 HEALTH CHECK QUERIES

### Data Integrity Check
```sql
-- Should return 0 (annual with subscription ID is wrong)
SELECT COUNT(*) as errors_annual_with_sub_id
FROM payments
WHERE is_installment_plan = true
AND installment_count = 12
AND asaas_subscription_id IS NOT NULL;

-- Should return 0 (recurring without subscription ID is wrong)
SELECT COUNT(*) as errors_recurring_without_sub_id
FROM payments
WHERE is_installment_plan = false
AND asaas_subscription_id IS NULL
AND created_at > NOW() - INTERVAL '1 day';
```

### Recent Payments Summary
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_payments,
  SUM(CASE WHEN is_installment_plan = true THEN 1 ELSE 0 END) as annual_count,
  SUM(CASE WHEN is_installment_plan = false THEN 1 ELSE 0 END) as recurring_count,
  SUM(value) as total_value
FROM payments
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## 🔄 ROLLBACK

### Quick Rollback
```bash
# Restore original function
cp supabase/functions/create-asaas-payment/index-backup-original.ts supabase/functions/create-asaas-payment/index.ts

# Deploy old version
npx supabase functions deploy create-asaas-payment --no-verify-jwt
```

## 📚 DOCUMENTATION FILES

- `IMPLEMENTATION_SUMMARY.md` - Complete overview
- `HYBRID_PAYMENT_COMPLETE.md` - Detailed technical docs
- `HYBRID_PAYMENT_FLOW.md` - Visual flow diagrams
- `QUICK_REFERENCE.md` - This file (commands reference)
- `deploy-hybrid-payment.ps1` - Automated deployment script

## ✅ PRE-DEPLOYMENT CHECKLIST

- [ ] Supabase project connected: `npx supabase status`
- [ ] Asaas credentials configured (ASAAS_API_KEY, ASAAS_BASE_URL)
- [ ] Database backup created (optional but recommended)
- [ ] Read all documentation
- [ ] Understand the flow differences (annual vs recurring)
- [ ] Test environment ready

## 🎯 POST-DEPLOYMENT CHECKLIST

- [ ] Migration applied successfully
- [ ] Edge function deployed
- [ ] Logs showing `[HYBRID]` prefix
- [ ] Test annual plan (verify 12 installments)
- [ ] Test quarterly plan (verify subscription created)
- [ ] Test semiannual plan (verify subscription created)
- [ ] Database integrity check passes
- [ ] Frontend updated to show installment info (if needed)

---

**Need Help?**
- Check logs: `npx supabase functions logs create-asaas-payment --follow`
- Review docs: Open `IMPLEMENTATION_SUMMARY.md`
- Database issues: Run health check queries above
- Flow confusion: See `HYBRID_PAYMENT_FLOW.md`

**Status**: ✅ READY FOR PRODUCTION DEPLOYMENT
