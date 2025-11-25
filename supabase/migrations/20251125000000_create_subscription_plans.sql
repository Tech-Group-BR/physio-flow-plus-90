-- ============================================
-- CRIAR TABELA SUBSCRIPTION_PLANS
-- Seguindo PAYMENT_FLOW_COMPLETE.md como referência
-- ============================================

-- Criar tabela subscription_plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  billing_period TEXT NOT NULL CHECK (billing_period IN ('MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL')),
  features JSONB,
  max_professionals INTEGER,
  max_patients INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_billing_period ON subscription_plans(billing_period);

-- Habilitar RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Policy para permitir leitura pública dos planos ativos
CREATE POLICY "Planos ativos são públicos"
  ON subscription_plans
  FOR SELECT
  USING (is_active = true);

-- Policy para admin gerenciar planos
CREATE POLICY "Admin pode gerenciar planos"
  ON subscription_plans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Comentários na tabela
COMMENT ON TABLE subscription_plans IS 'Planos de assinatura disponíveis para PhysioFlow Plus';
COMMENT ON COLUMN subscription_plans.billing_period IS 'MONTHLY, QUARTERLY, SEMIANNUAL ou ANNUAL';
COMMENT ON COLUMN subscription_plans.features IS 'Array JSON de funcionalidades do plano';
COMMENT ON COLUMN subscription_plans.max_professionals IS 'Limite de profissionais (NULL = ilimitado)';
COMMENT ON COLUMN subscription_plans.max_patients IS 'Limite de pacientes (NULL = ilimitado)';
