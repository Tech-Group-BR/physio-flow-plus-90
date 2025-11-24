-- ============================================
-- SISTEMA DE PAGAMENTOS COMPLETO - PhysioFlow Plus
-- Baseado em: docs/PAYMENT_FLOW_COMPLETE.md
-- ============================================

-- ============================================
-- 1. CLIENTS - Clientes (Cadastro Asaas)
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinic_settings(id) ON DELETE CASCADE,
  
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
  
  -- Relação com profile (usuário que criou/gerencia)
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Metadados
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_clients_clinic_id ON clients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clients_asaas_customer_id ON clients(asaas_customer_id) WHERE asaas_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_profile_id ON clients(profile_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_cpf_cnpj ON clients(cpf_cnpj) WHERE cpf_cnpj IS NOT NULL;

-- Comentários
COMMENT ON TABLE clients IS 'Clientes para integração com gateway de pagamento Asaas';
COMMENT ON COLUMN clients.asaas_customer_id IS 'ID do cliente no sistema Asaas';
COMMENT ON COLUMN clients.cpf_cnpj IS 'CPF ou CNPJ do cliente';

-- RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view clients from their clinic" ON clients;
CREATE POLICY "Users can view clients from their clinic"
  ON clients FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert clients in their clinic" ON clients;
CREATE POLICY "Users can insert clients in their clinic"
  ON clients FOR INSERT
  WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update clients from their clinic" ON clients;
CREATE POLICY "Users can update clients from their clinic"
  ON clients FOR UPDATE
  USING (
    clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Only admins can delete clients" ON clients;
CREATE POLICY "Only admins can delete clients"
  ON clients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
        AND clinic_id = clients.clinic_id
        AND role IN ('admin', 'super')
    )
  );

-- ============================================
-- 2. SUBSCRIPTION_PLANS - Planos Disponíveis
-- ============================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- Ex: "Plano Básico", "Plano Premium"
  description TEXT,
  price DECIMAL(10,2) NOT NULL,          -- Valor mensal base
  billing_period TEXT NOT NULL DEFAULT 'MONTHLY',  -- 'MONTHLY', 'QUARTERLY', 'YEARLY'
  features JSONB,                        -- Lista de funcionalidades
  max_professionals INTEGER,
  max_patients INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_billing_period CHECK (billing_period IN ('MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'YEARLY', 'ANNUAL'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active) WHERE is_active = true;

-- Comentários
COMMENT ON TABLE subscription_plans IS 'Planos de assinatura disponíveis para clínicas';
COMMENT ON COLUMN subscription_plans.price IS 'Preço mensal base do plano';
COMMENT ON COLUMN subscription_plans.billing_period IS 'Período de cobrança padrão do plano';

-- RLS (todos podem ver planos ativos)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active plans" ON subscription_plans;
CREATE POLICY "Anyone can view active plans"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Only super admins can manage plans" ON subscription_plans;
CREATE POLICY "Only super admins can manage plans"
  ON subscription_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
        AND role = 'super'
    )
  );

-- ============================================
-- 3. SUBSCRIPTIONS - Assinaturas Ativas
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinic_settings(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  
  -- Dados do Cliente
  customer_id UUID REFERENCES clients(id),
  
  -- Status da Assinatura
  status TEXT NOT NULL DEFAULT 'ACTIVE',  -- 'ACTIVE', 'CANCELLED', 'SUSPENDED', 'EXPIRED'
  
  -- Datas
  start_date DATE NOT NULL,
  next_billing_date DATE,                -- Próxima cobrança
  end_date DATE,                         -- Null se ativa
  cancelled_at TIMESTAMPTZ,
  
  -- Financeiro
  current_price DECIMAL(10,2) NOT NULL,  -- Preço atual (pode mudar)
  billing_cycle TEXT NOT NULL,           -- 'MONTHLY', 'QUARTERLY', 'YEARLY'
  
  -- Integração Asaas (se usar subscriptions da Asaas)
  asaas_subscription_id TEXT UNIQUE,
  
  -- Metadados
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_subscription_status CHECK (status IN ('ACTIVE', 'CANCELLED', 'SUSPENDED', 'EXPIRED'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_subscriptions_clinic_id ON subscriptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing_date ON subscriptions(next_billing_date) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_subscriptions_asaas_id ON subscriptions(asaas_subscription_id) WHERE asaas_subscription_id IS NOT NULL;

-- Comentários
COMMENT ON TABLE subscriptions IS 'Assinaturas ativas das clínicas';
COMMENT ON COLUMN subscriptions.next_billing_date IS 'Data da próxima cobrança automática';
COMMENT ON COLUMN subscriptions.current_price IS 'Preço atual (pode ser diferente do plano se houve promoção)';

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view subscriptions from their clinic" ON subscriptions;
CREATE POLICY "Users can view subscriptions from their clinic"
  ON subscriptions FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage subscriptions from their clinic" ON subscriptions;
CREATE POLICY "Users can manage subscriptions from their clinic"
  ON subscriptions FOR ALL
  USING (
    clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================
-- 4. PAYMENTS - Histórico de Pagamentos
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  clinic_id UUID REFERENCES clinic_settings(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Integração Asaas
  asaas_payment_id TEXT UNIQUE,          -- ID do pagamento na Asaas
  asaas_subscription_id TEXT,            -- ID da subscription na Asaas (se aplicável)
  
  -- Detalhes do Pagamento
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT,                   -- 'CREDIT_CARD', 'BOLETO', 'PIX'
  status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'CONFIRMED', 'RECEIVED', 'OVERDUE', 'REFUNDED'
  
  -- Parcelamento (para pagamentos anuais com 12x)
  installment_count INTEGER DEFAULT 1,
  installment_number INTEGER DEFAULT 1,
  
  -- Datas
  due_date DATE NOT NULL,
  payment_date DATE,
  confirmed_at TIMESTAMPTZ,
  
  -- Links e Documentos
  invoice_url TEXT,
  bank_slip_url TEXT,
  pix_qr_code TEXT,
  pix_copy_paste TEXT,
  
  -- Metadados
  description TEXT,
  external_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_payment_status CHECK (status IN ('PENDING', 'CONFIRMED', 'RECEIVED', 'OVERDUE', 'REFUNDED', 'CANCELLED'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_payments_clinic_id ON payments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_asaas_payment_id ON payments(asaas_payment_id) WHERE asaas_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);

-- Comentários
COMMENT ON TABLE payments IS 'Histórico de todos os pagamentos realizados ou pendentes';
COMMENT ON COLUMN payments.asaas_payment_id IS 'ID do pagamento no gateway Asaas';
COMMENT ON COLUMN payments.installment_count IS 'Número total de parcelas (ex: 12 para anual)';
COMMENT ON COLUMN payments.installment_number IS 'Número da parcela atual (ex: 1 de 12)';

-- RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view payments from their clinic" ON payments;
CREATE POLICY "Users can view payments from their clinic"
  ON payments FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage payments from their clinic" ON payments;
CREATE POLICY "Users can manage payments from their clinic"
  ON payments FOR ALL
  USING (
    clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================
-- 5. PAYMENT_WEBHOOKS - Log de Webhooks
-- ============================================
CREATE TABLE IF NOT EXISTS payment_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,              -- 'PAYMENT_CREATED', 'PAYMENT_CONFIRMED', etc.
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  asaas_payment_id TEXT,
  raw_payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_asaas_id ON payment_webhooks(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_processed ON payment_webhooks(processed, created_at) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_event_type ON payment_webhooks(event_type);

-- Comentários
COMMENT ON TABLE payment_webhooks IS 'Log de eventos de webhook do Asaas para auditoria e reprocessamento';
COMMENT ON COLUMN payment_webhooks.raw_payload IS 'Payload completo do webhook em JSON';

-- RLS (apenas service role pode acessar)
ALTER TABLE payment_webhooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only service role can access webhooks" ON payment_webhooks;
CREATE POLICY "Only service role can access webhooks"
  ON payment_webhooks FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 6. PLAN_HISTORY - Histórico de Mudanças
-- ============================================
CREATE TABLE IF NOT EXISTS plan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  old_plan_id UUID REFERENCES subscription_plans(id),
  new_plan_id UUID REFERENCES subscription_plans(id),
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2),
  change_reason TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_plan_history_subscription_id ON plan_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_plan_history_changed_at ON plan_history(changed_at DESC);

-- Comentários
COMMENT ON TABLE plan_history IS 'Histórico de mudanças de plano para auditoria e análise';

-- RLS
ALTER TABLE plan_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view plan history from their subscriptions" ON plan_history;
CREATE POLICY "Users can view plan history from their subscriptions"
  ON plan_history FOR SELECT
  USING (
    subscription_id IN (
      SELECT id FROM subscriptions 
      WHERE clinic_id IN (
        SELECT clinic_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
SELECT 
  'Tabelas criadas com sucesso!' as message,
  COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'clients',
    'subscription_plans', 
    'subscriptions', 
    'payments', 
    'payment_webhooks',
    'plan_history'
  );

-- Listar todas as colunas das tabelas criadas
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name IN (
    'clients',
    'subscription_plans', 
    'subscriptions', 
    'payments', 
    'payment_webhooks',
    'plan_history'
  )
ORDER BY table_name, ordinal_position;
