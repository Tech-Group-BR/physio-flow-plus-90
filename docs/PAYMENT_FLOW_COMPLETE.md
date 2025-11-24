# Sistema de Pagamentos - Fluxo Completo

## Arquitetura Geral

O sistema de pagamentos do PhysioFlow Plus utiliza a API Asaas para processamento de pagamentos recorrentes, implementando controle manual de recorrência através de Supabase Edge Functions.

### Decisões Arquiteturais

**✅ Usar**: API `/payments` da Asaas (pagamentos individuais)  
**❌ Evitar**: API `/subscriptions` da Asaas (complexidade desnecessária)

**Motivo**: Maior controle sobre o ciclo de vida das assinaturas, flexibilidade para regras de negócio customizadas e simplicidade na implementação.

---

## Estrutura do Banco de Dados

### Tabelas Essenciais (5 recomendadas)

#### 1. `subscription_plans` - Planos Disponíveis
```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,                    -- Ex: "Plano Básico", "Plano Premium"
  description TEXT,
  price DECIMAL(10,2) NOT NULL,          -- Valor mensal
  billing_period TEXT NOT NULL,          -- 'MONTHLY', 'QUARTERLY', 'YEARLY'
  features JSONB,                        -- Lista de funcionalidades
  max_professionals INTEGER,
  max_patients INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. `subscriptions` - Assinaturas Ativas (Simplificada)
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id),
  plan_id UUID REFERENCES subscription_plans(id),
  
  -- Dados do Cliente
  customer_id UUID REFERENCES clients(id),
  
  -- Status da Assinatura
  status TEXT NOT NULL,                  -- 'ACTIVE', 'CANCELLED', 'SUSPENDED', 'EXPIRED'
  
  -- Datas
  start_date DATE NOT NULL,
  next_billing_date DATE,                -- Próxima cobrança
  end_date DATE,                         -- Null se ativa
  cancelled_at TIMESTAMPTZ,
  
  -- Financeiro
  current_price DECIMAL(10,2) NOT NULL,  -- Preço atual (pode mudar)
  billing_cycle TEXT NOT NULL,           -- 'MONTHLY', 'QUARTERLY', 'YEARLY'
  
  -- Metadados
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('ACTIVE', 'CANCELLED', 'SUSPENDED', 'EXPIRED'))
);
```

#### 3. `payments` - Histórico de Pagamentos
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id),
  clinic_id UUID REFERENCES clinics(id),
  customer_id UUID REFERENCES clients(id),
  
  -- Integração Asaas
  asaas_payment_id TEXT UNIQUE,          -- ID do pagamento na Asaas
  
  -- Detalhes do Pagamento
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT,                   -- 'CREDIT_CARD', 'BOLETO', 'PIX'
  status TEXT NOT NULL,                  -- 'PENDING', 'CONFIRMED', 'RECEIVED', 'OVERDUE', 'REFUNDED'
  
  -- Parcelamento
  installment_count INTEGER DEFAULT 1,
  installment_number INTEGER DEFAULT 1,
  
  -- Datas
  due_date DATE NOT NULL,
  payment_date DATE,
  confirmed_at TIMESTAMPTZ,
  
  -- Links
  invoice_url TEXT,
  bank_slip_url TEXT,
  
  -- Metadados
  description TEXT,
  external_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. `clients` - Clientes (Cadastro Asaas)
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id),
  
  -- Integração Asaas
  asaas_customer_id TEXT UNIQUE,         -- ID do cliente na Asaas
  
  -- Dados Pessoais
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  cpf_cnpj TEXT,
  phone TEXT,
  mobile_phone TEXT,
  
  -- Endereço
  address TEXT,
  address_number TEXT,
  complement TEXT,
  province TEXT,
  postal_code TEXT,
  
  -- Metadados
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5. `payment_webhooks` - Log de Webhooks
```sql
CREATE TABLE payment_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,              -- 'PAYMENT_CREATED', 'PAYMENT_CONFIRMED', etc.
  payment_id UUID REFERENCES payments(id),
  asaas_payment_id TEXT,
  raw_payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6. `plan_history` - Histórico de Mudanças (Opcional)
```sql
CREATE TABLE plan_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id),
  old_plan_id UUID REFERENCES subscription_plans(id),
  new_plan_id UUID REFERENCES subscription_plans(id),
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2),
  change_reason TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabelas para Remover

**❌ `subscription_pricing`** - Redundante (informação já está em `subscription_plans` e `subscriptions`)

---

## Fluxo Completo do Sistema

### 1️⃣ Criação de Planos

**Página**: Admin → Gerenciar Planos

```typescript
// src/services/subscriptionPlans.ts
export async function createSubscriptionPlan(planData: {
  name: string;
  description: string;
  price: number;
  billingPeriod: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  features: string[];
  maxProfessionals: number;
  maxPatients: number;
}) {
  const { data, error } = await supabase
    .from('subscription_plans')
    .insert({
      name: planData.name,
      description: planData.description,
      price: planData.price,
      billing_period: planData.billingPeriod,
      features: planData.features,
      max_professionals: planData.maxProfessionals,
      max_patients: planData.maxPatients,
      is_active: true
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

---

### 2️⃣ Compra de Assinatura (Novo Cliente)

**Fluxo**:
1. Cliente escolhe um plano
2. Sistema cria/atualiza cliente na Asaas
3. Cria assinatura no banco local
4. Gera primeiro pagamento via Asaas
5. Cliente realiza pagamento

#### 2.1 Criar Cliente na Asaas

```typescript
// src/services/asaas/customers.ts
export async function createAsaasCustomer(customerData: {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
}) {
  const response = await fetch('https://sandbox.asaas.com/api/v3/customers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': process.env.ASAAS_API_KEY!
    },
    body: JSON.stringify({
      name: customerData.name,
      email: customerData.email,
      cpfCnpj: customerData.cpfCnpj,
      phone: customerData.phone,
      mobilePhone: customerData.mobilePhone,
      address: customerData.address,
      addressNumber: customerData.addressNumber,
      complement: customerData.complement,
      province: customerData.province,
      postalCode: customerData.postalCode?.replace(/\D/g, '')
    })
  });

  if (!response.ok) throw new Error('Erro ao criar cliente na Asaas');
  
  const asaasCustomer = await response.json();
  
  // Salvar no banco local
  const { data, error } = await supabase
    .from('clients')
    .insert({
      asaas_customer_id: asaasCustomer.id,
      clinic_id: customerData.clinicId,
      name: customerData.name,
      email: customerData.email,
      cpf_cnpj: customerData.cpfCnpj,
      phone: customerData.phone,
      mobile_phone: customerData.mobilePhone,
      address: customerData.address,
      address_number: customerData.addressNumber,
      complement: customerData.complement,
      province: customerData.province,
      postal_code: customerData.postalCode
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

#### 2.2 Criar Assinatura

```typescript
// src/services/subscriptions.ts
export async function createSubscription(data: {
  clinicId: string;
  planId: string;
  customerId: string;
  startDate: Date;
}) {
  // Buscar informações do plano
  const { data: plan, error: planError } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', data.planId)
    .single();

  if (planError) throw planError;

  // Calcular próxima data de cobrança
  const nextBillingDate = new Date(data.startDate);
  if (plan.billing_period === 'MONTHLY') {
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
  } else if (plan.billing_period === 'QUARTERLY') {
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
  } else if (plan.billing_period === 'YEARLY') {
    nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
  }

  // Criar assinatura
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .insert({
      clinic_id: data.clinicId,
      plan_id: data.planId,
      customer_id: data.customerId,
      status: 'ACTIVE',
      start_date: data.startDate,
      next_billing_date: nextBillingDate,
      current_price: plan.price,
      billing_cycle: plan.billing_period
    })
    .select()
    .single();

  if (error) throw error;
  return subscription;
}
```

#### 2.3 Criar Pagamento na Asaas

```typescript
// src/services/asaas/payments.ts
export async function createAsaasPayment(paymentData: {
  customerId: string;      // asaas_customer_id
  subscriptionId: string;  // nossa subscription_id
  value: number;
  dueDate: string;         // 'YYYY-MM-DD'
  description: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  installmentCount?: number;
  externalReference?: string;
}) {
  const response = await fetch('https://sandbox.asaas.com/api/v3/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': process.env.ASAAS_API_KEY!
    },
    body: JSON.stringify({
      customer: paymentData.customerId,
      billingType: paymentData.billingType,
      value: paymentData.value,
      dueDate: paymentData.dueDate,
      description: paymentData.description,
      installmentCount: paymentData.installmentCount || 1,
      externalReference: paymentData.externalReference
    })
  });

  if (!response.ok) throw new Error('Erro ao criar pagamento na Asaas');
  
  const asaasPayment = await response.json();
  
  // Salvar no banco local
  const { data, error } = await supabase
    .from('payments')
    .insert({
      subscription_id: paymentData.subscriptionId,
      clinic_id: paymentData.clinicId,
      customer_id: paymentData.localCustomerId,
      asaas_payment_id: asaasPayment.id,
      amount: paymentData.value,
      payment_method: paymentData.billingType,
      status: 'PENDING',
      due_date: paymentData.dueDate,
      installment_count: paymentData.installmentCount || 1,
      installment_number: 1,
      invoice_url: asaasPayment.invoiceUrl,
      bank_slip_url: asaasPayment.bankSlipUrl,
      description: paymentData.description,
      external_reference: paymentData.externalReference
    })
    .select()
    .single();

  if (error) throw error;
  
  return {
    payment: data,
    asaasData: asaasPayment
  };
}
```

---

### 3️⃣ Processamento de Webhooks

**Endpoint**: `supabase/functions/asaas-webhook/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const payload = await req.json();
    
    // Log do webhook
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Registrar webhook
    await supabase.from('payment_webhooks').insert({
      event_type: payload.event,
      asaas_payment_id: payload.payment?.id,
      raw_payload: payload,
      processed: false
    });

    // Processar evento
    switch (payload.event) {
      case 'PAYMENT_CREATED':
        await handlePaymentCreated(supabase, payload);
        break;
      
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
        await handlePaymentConfirmed(supabase, payload);
        break;
      
      case 'PAYMENT_OVERDUE':
        await handlePaymentOverdue(supabase, payload);
        break;
      
      case 'PAYMENT_REFUNDED':
        await handlePaymentRefunded(supabase, payload);
        break;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

async function handlePaymentConfirmed(supabase: any, payload: any) {
  const paymentId = payload.payment.id;
  
  // Atualizar pagamento
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .update({
      status: 'CONFIRMED',
      payment_date: new Date().toISOString(),
      confirmed_at: new Date().toISOString()
    })
    .eq('asaas_payment_id', paymentId)
    .select()
    .single();

  if (paymentError) throw paymentError;

  // Atualizar status da assinatura (se necessário)
  if (payment.subscription_id) {
    await supabase
      .from('subscriptions')
      .update({ status: 'ACTIVE' })
      .eq('id', payment.subscription_id);
  }

  // Marcar webhook como processado
  await supabase  
    .from('payment_webhooks')
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq('asaas_payment_id', paymentId);

  // Enviar email de confirmação (opcional)
  // await sendPaymentConfirmationEmail(payment);
}

async function handlePaymentOverdue(supabase: any, payload: any) {
  const paymentId = payload.payment.id;
  
  // Atualizar status do pagamento
  await supabase
    .from('payments')
    .update({ status: 'OVERDUE' })
    .eq('asaas_payment_id', paymentId);

  // Buscar assinatura relacionada
  const { data: payment } = await supabase
    .from('payments')
    .select('subscription_id')
    .eq('asaas_payment_id', paymentId)
    .single();

  if (payment?.subscription_id) {
    // Suspender assinatura após X dias de atraso
    await supabase
      .from('subscriptions')
      .update({ status: 'SUSPENDED' })
      .eq('id', payment.subscription_id);
    
    // Enviar email de aviso
    // await sendOverdueNotification(payment);
  }
}
```

---

### 4️⃣ Renovação Automática (Cron Job)

**Edge Function**: `supabase/functions/process-renewals/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Buscar assinaturas que precisam renovar hoje
    const today = new Date().toISOString().split('T')[0];
    
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        subscription_plans(*),
        clients(*)
      `)
      .eq('status', 'ACTIVE')
      .eq('next_billing_date', today);

    if (error) throw error;

    console.log(`Processando ${subscriptions.length} renovações`);

    for (const subscription of subscriptions) {
      try {
        // Criar novo pagamento na Asaas
        const response = await fetch('https://sandbox.asaas.com/api/v3/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': Deno.env.get('ASAAS_API_KEY')!
          },
          body: JSON.stringify({
            customer: subscription.clients.asaas_customer_id,
            billingType: 'BOLETO', // ou método preferencial do cliente
            value: subscription.current_price,
            dueDate: today,
            description: `Renovação ${subscription.subscription_plans.name}`,
            externalReference: subscription.id
          })
        });

        const asaasPayment = await response.json();

        // Registrar pagamento no banco
        await supabase.from('payments').insert({
          subscription_id: subscription.id,
          clinic_id: subscription.clinic_id,
          customer_id: subscription.customer_id,
          asaas_payment_id: asaasPayment.id,
          amount: subscription.current_price,
          payment_method: 'BOLETO',
          status: 'PENDING',
          due_date: today,
          invoice_url: asaasPayment.invoiceUrl,
          bank_slip_url: asaasPayment.bankSlipUrl,
          description: `Renovação ${subscription.subscription_plans.name}`
        });

        // Atualizar próxima data de cobrança
        const nextBillingDate = new Date(subscription.next_billing_date);
        if (subscription.billing_cycle === 'MONTHLY') {
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        } else if (subscription.billing_cycle === 'QUARTERLY') {
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
        } else if (subscription.billing_cycle === 'YEARLY') {
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
        }

        await supabase
          .from('subscriptions')
          .update({
            next_billing_date: nextBillingDate.toISOString().split('T')[0]
          })
          .eq('id', subscription.id);

        console.log(`✅ Renovação criada para assinatura ${subscription.id}`);
        
        // Enviar email/notificação ao cliente
        // await sendRenewalNotification(subscription, asaasPayment);
        
      } catch (error) {
        console.error(`❌ Erro ao processar assinatura ${subscription.id}:`, error);
        // Registrar erro no banco
        await supabase.from('renewal_errors').insert({
          subscription_id: subscription.id,
          error_message: error.message,
          occurred_at: new Date().toISOString()
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: subscriptions.length 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Process renewals error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

**Configurar Cron Job** (Supabase Dashboard):
```sql
-- Executar todos os dias às 6h da manhã
SELECT cron.schedule(
  'process-renewals',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://seu-projeto.supabase.co/functions/v1/process-renewals',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    )
  );
  $$
);
```

---

### 5️⃣ Cancelamento de Assinatura

```typescript
// src/services/subscriptions.ts
export async function cancelSubscription(
  subscriptionId: string,
  reason?: string
) {
  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      status: 'CANCELLED',
      cancelled_at: new Date().toISOString(),
      notes: reason
    })
    .eq('id', subscriptionId)
    .select()
    .single();

  if (error) throw error;

  // Cancelar pagamentos pendentes na Asaas (opcional)
  const { data: pendingPayments } = await supabase
    .from('payments')
    .select('asaas_payment_id')
    .eq('subscription_id', subscriptionId)
    .eq('status', 'PENDING');

  if (pendingPayments) {
    for (const payment of pendingPayments) {
      await fetch(
        `https://sandbox.asaas.com/api/v3/payments/${payment.asaas_payment_id}`,
        {
          method: 'DELETE',
          headers: {
            'access_token': process.env.ASAAS_API_KEY!
          }
        }
      );
    }
  }

  return data;
}
```

---

### 6️⃣ Mudança de Plano (Upgrade/Downgrade)

```typescript
// src/services/subscriptions.ts
export async function changeSubscriptionPlan(
  subscriptionId: string,
  newPlanId: string,
  changeReason?: string
) {
  // Buscar assinatura atual
  const { data: currentSub, error: subError } = await supabase
    .from('subscriptions')
    .select('*, subscription_plans(*)')
    .eq('id', subscriptionId)
    .single();

  if (subError) throw subError;

  // Buscar novo plano
  const { data: newPlan, error: planError } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', newPlanId)
    .single();

  if (planError) throw planError;

  // Registrar histórico
  await supabase.from('plan_history').insert({
    subscription_id: subscriptionId,
    old_plan_id: currentSub.plan_id,
    new_plan_id: newPlanId,
    old_price: currentSub.current_price,
    new_price: newPlan.price,
    change_reason: changeReason
  });

  // Atualizar assinatura
  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      plan_id: newPlanId,
      current_price: newPlan.price,
      billing_cycle: newPlan.billing_period,
      updated_at: new Date().toISOString()
    })
    .eq('id', subscriptionId)
    .select()
    .single();

  if (error) throw error;

  // Calcular valor proporcional se aplicável
  // Criar cobrança de diferença ou crédito
  // ...

  return data;
}
```

---

## Componentes React

### Página de Seleção de Planos

```typescript
// src/pages/subscription/PlansPage.tsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function PlansPage() {
  const { data: plans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price');
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Escolha seu Plano</h1>
      
      <div className="grid md:grid-cols-3 gap-6">
        {plans?.map(plan => (
          <Card key={plan.id} className="p-6">
            <h3 className="text-2xl font-bold">{plan.name}</h3>
            <p className="text-muted-foreground mb-4">{plan.description}</p>
            
            <div className="text-4xl font-bold mb-6">
              R$ {plan.price.toFixed(2)}
              <span className="text-sm text-muted-foreground">
                /{plan.billing_period === 'MONTHLY' ? 'mês' : 'ano'}
              </span>
            </div>

            <ul className="space-y-2 mb-6">
              {plan.features?.map((feature: string, i: number) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>

            <Button 
              className="w-full"
              onClick={() => handleSelectPlan(plan.id)}
            >
              Assinar
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## Checklist de Implementação

### Backend (Supabase)

- [ ] Criar/atualizar migrations para tabelas
- [ ] Implementar RLS (Row Level Security) policies
- [ ] Criar Edge Function `asaas-webhook`
- [ ] Criar Edge Function `process-renewals`
- [ ] Configurar Cron Job para renovações
- [ ] Configurar webhooks na Asaas
- [ ] Criar índices para performance:
  ```sql
  CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date);
  CREATE INDEX idx_payments_status ON payments(status);
  CREATE INDEX idx_payments_asaas_id ON payments(asaas_payment_id);
  ```

### Frontend

- [ ] Página de listagem de planos (`PlansPage`)
- [ ] Formulário de checkout (`CheckoutForm`)
- [ ] Componente de seleção de método de pagamento
- [ ] Página de gerenciamento de assinatura
- [ ] Histórico de pagamentos do cliente
- [ ] Botão de cancelamento com confirmação
- [ ] Opção de upgrade/downgrade de plano

### Serviços

- [ ] `subscriptionPlans.ts` - CRUD de planos
- [ ] `subscriptions.ts` - Gestão de assinaturas
- [ ] `asaas/customers.ts` - Integração clientes Asaas
- [ ] `asaas/payments.ts` - Criação de pagamentos
- [ ] Tratamento de erros e retries

### Notificações

- [ ] Email de boas-vindas após assinatura
- [ ] Email de confirmação de pagamento
- [ ] Email de cobrança próxima (3 dias antes)
- [ ] Email de pagamento vencido
- [ ] Email de cancelamento confirmado

---

## Testes Recomendados

### Cenários de Teste

1. **Criação de Assinatura**
   - ✅ Novo cliente assina plano mensal
   - ✅ Pagamento confirmado via webhook
   - ✅ Status da assinatura atualizado

2. **Renovação Automática**
   - ✅ Cron job executa diariamente
   - ✅ Gera novo pagamento na data correta
   - ✅ Atualiza next_billing_date

3. **Pagamento Atrasado**
   - ✅ Webhook de PAYMENT_OVERDUE recebido
   - ✅ Assinatura suspensa após X dias
   - ✅ Email de aviso enviado

4. **Cancelamento**
   - ✅ Cliente cancela assinatura
   - ✅ Status atualizado para CANCELLED
   - ✅ Pagamentos pendentes cancelados na Asaas

5. **Mudança de Plano**
   - ✅ Upgrade para plano superior
   - ✅ Downgrade para plano inferior
   - ✅ Cálculo proporcional (se aplicável)
   - ✅ Histórico registrado em plan_history

---

## Observações Importantes

### Segurança

- **NUNCA** exponha `ASAAS_API_KEY` no frontend
- Use Supabase Edge Functions para chamadas à API Asaas
- Configure RLS em todas as tabelas
- Valide webhooks com assinatura HMAC (se disponível)

### Performance

- Crie índices em colunas frequentemente consultadas
- Use `select('*')` apenas quando necessário
- Implemente cache para lista de planos
- Considere paginação para histórico de pagamentos

### Manutenção

- Monitore logs de Edge Functions regularmente
- Configure alertas para falhas em renovações
- Mantenha backup da tabela `payment_webhooks` (dados raw)
- Revise e limpe webhooks antigos periodicamente

### Compliance

- Armazene dados de pagamento conforme LGPD
- Não armazene dados completos de cartão de crédito
- Mantenha logs de auditoria (plan_history)
- Implemente consentimento explícito para cobranças recorrentes

---

## Recursos Adicionais

### Documentação Asaas
- [Customers API](https://docs.asaas.com/reference/criar-novo-cliente)
- [Payments API](https://docs.asaas.com/reference/criar-nova-cobranca)
- [Webhooks](https://docs.asaas.com/docs/webhooks)

### Supabase
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Cron Jobs](https://supabase.com/docs/guides/functions/schedule-functions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Última atualização**: 21 de novembro de 2025  
**Versão**: 1.0  
**Autor**: PhysioFlow Plus Team
