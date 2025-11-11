# 🔐 SISTEMA DE PARCELAMENTO ANUAL SEGURO

## ⚠️ IMPORTANTE: SEGURANÇA DE DADOS DE CARTÃO

**NUNCA guardamos dados reais de cartão!** Isso é:
- ❌ Contra PCI-DSS (regulamentação de segurança de cartões)
- ❌ Ilegal em vários países
- ❌ Passível de multas pesadas
- ❌ Risco de processo se vazar dados

## ✅ SOLUÇÃO IMPLEMENTADA: Tokenização Asaas

Em vez de guardar o cartão, usamos **tokenização**:

```
Cliente informa cartão
    ↓
Asaas TOKENIZA o cartão (criptografia forte)
    ↓
Asaas retorna TOKEN (string segura)
    ↓
Guardamos apenas o TOKEN no banco
    ↓
Todo mês usamos o TOKEN para cobrar
```

## 🎯 COMO FUNCIONA

### 1. Cliente escolhe Plano Anual Parcelado

```typescript
{
  billingPeriod: 'annual',
  billingType: 'CREDIT_CARD',
  value: 1188, // Valor total anual
  creditCard: { number, cvv, ... },
  creditCardHolderInfo: { name, cpf, ... }
}
```

### 2. Edge Function `create-asaas-payment`

```typescript
// Tokeniza o cartão
POST /creditCard/tokenize
Response: { creditCardToken: "tok_abc123..." }

// Cria apenas a 1ª parcela
POST /payments
{
  value: 99, // 1188 / 12
  creditCardToken: "tok_abc123...",
  description: "Parcela 1/12"
}

// Salva no banco
payments {
  value: 99,
  installment_count: 12,
  current_installment: 1,
  asaas_card_token: "tok_abc123...",  // ✅ TOKEN (seguro)
  auto_charge_enabled: true,
  next_charge_date: "2025-12-11" // 30 dias depois
}
```

### 3. Edge Function `process-monthly-installments` (CRON)

Roda **TODO DIA** para verificar cobranças pendentes:

```typescript
// Busca pagamentos com next_charge_date <= HOJE
SELECT * FROM payments 
WHERE auto_charge_enabled = true
  AND is_installment_plan = true
  AND next_charge_date <= TODAY()
  AND current_installment < 12

// Para cada pagamento:
1. Usa o TOKEN para criar nova cobrança
2. Cria novo registro no banco (parcela 2/12, 3/12, etc)
3. Atualiza next_charge_date para +30 dias
4. Se for parcela 12, desabilita auto_charge_enabled
```

## 📊 ESTRUTURA DO BANCO

### Tabela: payments

```sql
-- Campos existentes
id, asaas_payment_id, customer_id, clinic_id, value, status, etc.

-- Campos para parcelamento (migration 20240122000000)
installment_count INTEGER      -- Total de parcelas (12)
current_installment INTEGER    -- Parcela atual (1-12)
is_installment_plan BOOLEAN    -- true se for anual parcelado

-- Campos para tokenização (migration 20251111210000)
asaas_card_token TEXT          -- TOKEN do Asaas (não dados reais!)
auto_charge_enabled BOOLEAN    -- true para cobrar automaticamente
next_charge_date DATE          -- Próxima data de cobrança
```

## 🔄 FLUXO COMPLETO

### Mês 1 (Cliente assina)
```
Cliente → Frontend → create-asaas-payment
    ↓
Tokeniza cartão: tok_abc123
    ↓
Cria pagamento 1/12: R$ 99
    ↓
Salva no banco:
  payments {
    asaas_payment_id: "pay_001",
    value: 99,
    current_installment: 1,
    asaas_card_token: "tok_abc123",
    next_charge_date: "2025-12-11"
  }
```

### Mês 2 (CRON automático)
```
CRON diário → process-monthly-installments
    ↓
Busca payments com next_charge_date <= hoje
    ↓
Usa tok_abc123 para criar nova cobrança
    ↓
Cria novo registro:
  payments {
    asaas_payment_id: "pay_002",
    value: 99,
    current_installment: 2,
    asaas_card_token: "tok_abc123",
    next_charge_date: "2026-01-11"
  }
```

### Meses 3-12
```
Mesmo processo se repete automaticamente
Na parcela 12:
  - auto_charge_enabled = false
  - next_charge_date = null
  - Sistema para de cobrar
```

## 🚀 DEPLOYMENT

### 1. Aplicar Migrations
```bash
npx supabase db push
```

Aplica:
- `20240122000000_add_installment_tracking_to_payments.sql`
- `20251111210000_add_card_token_for_installments.sql`

### 2. Deploy Edge Functions
```bash
# Função de criação de pagamento (atualizada com tokenização)
npx supabase functions deploy create-asaas-payment --no-verify-jwt

# Função de cobrança mensal (nova!)
npx supabase functions deploy process-monthly-installments --no-verify-jwt
```

### 3. Configurar CRON no Supabase

No dashboard do Supabase:
1. Ir em **Database** → **Cron Jobs**
2. Criar novo job:

```sql
SELECT cron.schedule(
  'process-monthly-installments',
  '0 9 * * *', -- Todo dia às 9h
  $$
  SELECT 
    net.http_post(
      url:='https://YOUR_PROJECT.supabase.co/functions/v1/process-monthly-installments',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
      body:='{}'::jsonb
    ) AS request_id;
  $$
);
```

## 🔍 MONITORAMENTO

### Ver próximas cobranças agendadas
```sql
SELECT 
  id,
  customer_id,
  current_installment,
  installment_count,
  next_charge_date,
  value,
  auto_charge_enabled
FROM payments
WHERE is_installment_plan = true
  AND auto_charge_enabled = true
ORDER BY next_charge_date;
```

### Ver histórico de parcelas de um cliente
```sql
SELECT 
  asaas_payment_id,
  current_installment,
  value,
  status,
  due_date,
  created_at
FROM payments
WHERE customer_id = 'cus_xxx'
  AND is_installment_plan = true
ORDER BY current_installment;
```

### Ver cobranças de hoje
```sql
SELECT * FROM payments
WHERE next_charge_date = CURRENT_DATE
  AND auto_charge_enabled = true;
```

## ⚠️ SEGURANÇA

### O que É guardado no banco:
✅ Token do Asaas: `tok_abc123...` (criptografado pelo Asaas)
✅ ID do cliente
✅ Valores das parcelas
✅ Datas de cobrança

### O que NÃO é guardado:
❌ Número do cartão
❌ CVV
❌ Data de validade
❌ Qualquer dado real do cartão

### Como o Asaas protege:
- Tokenização com criptografia AES-256
- PCI-DSS Level 1 compliance
- Token não pode ser revertido para número real
- Token só funciona na conta do Asaas que criou

## 🧪 TESTES

### Teste 1: Criar assinatura anual
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/create-asaas-payment \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cus_xxx",
    "billingType": "CREDIT_CARD",
    "value": 1188,
    "dueDate": "2025-11-11",
    "billingPeriod": "annual",
    "clinicId": "xxx",
    "productId": "xxx",
    "creditCard": {...},
    "creditCardHolderInfo": {...}
  }'
```

Verificar:
- Response contém `cardToken`
- Banco tem `asaas_card_token` preenchido
- `auto_charge_enabled = true`
- `next_charge_date` daqui 30 dias

### Teste 2: Executar cobrança mensal manualmente
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/process-monthly-installments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -d '{}'
```

Verificar:
- Novo registro criado com `current_installment = 2`
- Novo `asaas_payment_id`
- `next_charge_date` atualizado

## 🎯 COMPARAÇÃO COM SUBSCRIPTIONS

| Item | Subscriptions Asaas | Sistema Próprio (Tokenização) |
|------|---------------------|-------------------------------|
| **Quem gerencia** | Asaas | Você |
| **Flexibilidade** | Baixa | Alta |
| **Parcelamento** | Não suporta | Suporta 12x |
| **Controle** | Limitado | Total |
| **Complexidade** | Simples | Média |
| **Segurança** | PCI-DSS compliant | PCI-DSS compliant (via token) |
| **Webhooks** | Automático | Manual |
| **Renovação** | Automática | Manual (via CRON) |

## 📝 RESUMO

✅ **Plano Trimestral/Semestral**: Subscriptions API do Asaas (renovação automática)
✅ **Plano Anual À Vista**: Subscriptions API do Asaas (renovação automática)
✅ **Plano Anual Parcelado 12x**: Sistema próprio com tokenização segura

**Segurança garantida**: Nunca guardamos dados reais de cartão, apenas tokens do Asaas!

---

**Última atualização**: 2025-11-11
**Status**: ✅ Pronto para produção
