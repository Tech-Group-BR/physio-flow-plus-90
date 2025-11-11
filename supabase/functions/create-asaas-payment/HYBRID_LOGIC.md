# Sistema Híbrido de Pagamento/Assinatura

## Estratégia Implementada

### TRIMESTRAL e SEMESTRAL → API de Subscriptions
- Usa `/subscriptions` do Asaas
- Recorrência automática (cycle: QUARTERLY ou SEMIANNUALLY)
- Renovação automática pelo Asaas

### ANUAL → API de Payments  
- Usa `/payments` do Asaas
- Parcelamento em 12x (`installmentCount: 12`)
- Controle manual de renovação pelo nosso sistema

## Mudanças Necessárias

### 1. create-asaas-payment/index.ts
```typescript
// Adicionar lógica condicional na linha ~120:

const isAnnualPlan = billingPeriod === 'annual'

if (isAnnualPlan) {
  // Criar PAYMENT com parcelamento 12x
  const paymentData = {
    customer: customerId,
    billingType: billingType,
    value: Number(value),
    dueDate: dueDate,
    description: description || 'Assinatura Anual PhysioFlow Plus (12x)',
    externalReference: externalReference,
    installmentCount: 12,
    installmentValue: Number((value / 12).toFixed(2)),
    creditCard,
    creditCardHolderInfo
  }
  
  const response = await fetch(`${asaasBaseUrl}/payments`, {
    method: 'POST',
    headers: {
      'access_token': asaasApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(paymentData)
  })
  
} else {
  // Criar SUBSCRIPTION com recorrência (QUARTERLY ou SEMIANNUALLY)
  const subscriptionData = {
    customer: customerId,
    billingType: billingType,
    value: Number(value),
    nextDueDate: dueDate,
    description: description || 'Assinatura PhysioFlow Plus',
    cycle: asaasCycle, // QUARTERLY ou SEMIANNUALLY
    externalReference: externalReference,
    creditCard,
    creditCardHolderInfo
  }
  
  const response = await fetch(`${asaasBaseUrl}/subscriptions`, {
    method: 'POST',
    headers: {
      'access_token': asaasApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(subscriptionData)
  })
}
```

### 2. Trigger de Renovação Anual
Criar função PostgreSQL que monitora payments anuais e renova automaticamente após 12 meses.

### 3. Webhook Handler
Atualizar webhook do Asaas para processar confirmações de pagamentos parcelados.
