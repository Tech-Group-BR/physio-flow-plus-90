# EXECUTAR NO SUPABASE - ORDEM EXATA

## ⚠️ IMPORTANTE: Execute na ordem abaixo!

## 1️⃣ Criar Tabela subscription_plans
```sql
-- Arquivo: supabase/migrations/20251125000000_create_subscription_plans.sql
-- Copie e execute TODO o conteúdo desse arquivo no Supabase SQL Editor
```

## 2️⃣ Atualizar Tabela subscriptions  
```sql
-- Arquivo: supabase/migrations/20251125000001_update_subscriptions_table.sql
-- Copie e execute TODO o conteúdo desse arquivo no Supabase SQL Editor
```

## 3️⃣ Atualizar Tabela payments
```sql
-- Arquivo: supabase/migrations/20251125000002_update_payments_table.sql
-- Copie e execute TODO o conteúdo desse arquivo no Supabase SQL Editor
```

## 4️⃣ Criar Tabela payment_webhooks
```sql
-- Arquivo: supabase/migrations/20251125000003_create_payment_webhooks.sql
-- Copie e execute TODO o conteúdo desse arquivo no Supabase SQL Editor
```

## 5️⃣ Popular subscription_plans com os 4 planos
```sql
-- Arquivo: POPULATE_SUBSCRIPTION_PLANS.sql
-- Copie e execute TODO o conteúdo desse arquivo no Supabase SQL Editor
```

## ✅ Verificação Final

Após executar todos os SQLs, rode:

```sql
-- Deve retornar 4 planos
SELECT COUNT(*) FROM subscription_plans WHERE is_active = true;

-- Deve mostrar os 4 planos
SELECT name, price, billing_period FROM subscription_plans ORDER BY price;
```

## 🔄 Limpar Cache do Browser

Abra o DevTools Console (F12) e execute:
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

## 📋 Checklist

- [ ] Executei `20251125000000_create_subscription_plans.sql`
- [ ] Executei `20251125000001_update_subscriptions_table.sql`
- [ ] Executei `20251125000002_update_payments_table.sql`
- [ ] Executei `20251125000003_create_payment_webhooks.sql`
- [ ] Executei `POPULATE_SUBSCRIPTION_PLANS.sql`
- [ ] Verifiquei: 4 planos na tabela subscription_plans
- [ ] Limpei cache do browser
- [ ] Recarreguei a landing page
- [ ] Vejo os 4 planos com features detalhadas

---

**Data**: 25 de novembro de 2025  
**Seguindo**: PAYMENT_FLOW_COMPLETE.md como BÍBLIA  
**Status**: ✅ Migrations criadas, aguardando execução no Supabase
