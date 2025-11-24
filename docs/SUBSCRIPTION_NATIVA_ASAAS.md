# 🔄 MUDANÇA PARA SUBSCRIPTION NATIVA DO ASAAS

## ✅ O QUE FOI ALTERADO

A função `create-asaas-payment` foi modificada para criar **subscriptions nativas** no Asaas, não apenas payments avulsos.

### ANTES (Payment Avulso):
```javascript
POST /payments
{
  customer: "cus_xxx",
  billingType: "PIX",
  value: 21.90,
  dueDate: "2025-10-12"
}
```
❌ Problema: Não aparecia no painel de Assinaturas do Asaas
❌ `asaas_subscription_id` ficava NULL

### AGORA (Subscription Nativa):
```javascript
POST /subscriptions
{
  customer: "cus_xxx",
  billingType: "PIX",
  value: 21.90,
  nextDueDate: "2025-10-12",
  cycle: "MONTHLY"
}
```
✅ Aparece no painel de Assinaturas do Asaas
✅ `asaas_subscription_id` é preenchido
✅ Asaas gera cobranças mensais automaticamente

---

## 📋 FLUXO COMPLETO AGORA

### 1. Usuário escolhe plano e paga
```
Frontend → create-asaas-payment → Asaas API /subscriptions
```

### 2. Asaas cria subscription + primeiro payment
```
Asaas retorna:
{
  id: "sub_xxx",           // subscription ID
  status: "ACTIVE",
  nextDueDate: "2025-11-05",
  cycle: "MONTHLY"
}

E gera automaticamente o primeiro payment
```

### 3. Sistema salva no banco
```sql
-- Tabela payments
INSERT INTO payments (
  asaas_payment_id: "pay_xxx",
  asaas_subscription_id: "sub_xxx",  -- ✅ PREENCHIDO!
  status: "PENDING",
  ...
)

-- Tabela subscriptions
INSERT INTO subscriptions (
  asaas_subscription_id: "sub_xxx",  -- ✅ PREENCHIDO!
  status: "pending_payment",
  ...
)
```

### 4. Webhook atualiza quando payment é pago
```
Asaas → Webhook PAYMENT_RECEIVED → Atualiza payment → Trigger ativa subscription
```

### 5. Próximas cobranças são automáticas
```
Asaas gera cobranças mensais automaticamente
→ Envia webhook PAYMENT_CREATED para cada nova cobrança
→ Sistema salva novo payment vinculado ao asaas_subscription_id
→ Trigger estende a subscription quando payment é RECEIVED
```

---

## 🎯 BENEFÍCIOS

1. **Aparece no painel do Asaas**: Você vê todas as assinaturas no dashboard
2. **Cobranças automáticas**: Asaas gera as mensalidades sozinho
3. **Rastreabilidade**: `asaas_subscription_id` vincula tudo
4. **Cancelamento fácil**: Pode cancelar direto no painel do Asaas
5. **Webhooks automáticos**: Asaas notifica sobre cada evento da subscription

---

## 🔧 PRÓXIMOS PASSOS

### Webhook precisa processar novos eventos:

1. **SUBSCRIPTION_CREATED**: Quando subscription é criada
2. **PAYMENT_CREATED**: Quando Asaas gera nova cobrança mensal
3. **PAYMENT_RECEIVED**: Quando mensalidade é paga (já tratado)
4. **SUBSCRIPTION_UPDATED**: Quando subscription é modificada
5. **SUBSCRIPTION_DELETED**: Quando subscription é cancelada

### Adaptar webhook handler:
```javascript
case 'PAYMENT_CREATED':
  // Vincular payment ao asaas_subscription_id
  INSERT INTO payments (..., asaas_subscription_id: event.payment.subscription)
  break;

case 'SUBSCRIPTION_DELETED':
  // Cancelar subscription local
  UPDATE subscriptions SET status = 'canceled' WHERE asaas_subscription_id = event.subscription
  break;
```

---

## 📊 VERIFICAÇÃO

Para testar se está funcionando:

1. Crie um novo pagamento pelo sistema
2. Verifique no painel do Asaas: https://www.asaas.com/subscriptions
3. Confirme que `asaas_subscription_id` não está NULL:
```sql
SELECT asaas_subscription_id, status 
FROM subscriptions 
WHERE clinic_id = 'sua-clinic-id';
```

Se aparecer a subscription no Asaas e o campo estiver preenchido, está funcionando! ✅
