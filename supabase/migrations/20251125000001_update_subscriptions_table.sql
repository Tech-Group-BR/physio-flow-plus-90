-- ============================================
-- ATUALIZAR TABELA SUBSCRIPTIONS
-- Seguindo PAYMENT_FLOW_COMPLETE.md
-- ============================================

-- Adicionar customer_id se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN customer_id UUID REFERENCES clients(id);
  END IF;
END $$;

-- Adicionar current_price se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'current_price'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN current_price DECIMAL(10,2);
  END IF;
END $$;

-- Adicionar notes se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'notes'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN notes TEXT;
  END IF;
END $$;

-- Renomear asaas_subscription_id se existir (não usado no fluxo manual)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'asaas_subscription_id'
  ) THEN
    ALTER TABLE subscriptions DROP COLUMN asaas_subscription_id;
  END IF;
END $$;

-- Atualizar constraint de status
DO $$ 
BEGIN
  ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS valid_status;
  ALTER TABLE subscriptions ADD CONSTRAINT valid_status 
    CHECK (status IN ('ACTIVE', 'CANCELLED', 'SUSPENDED', 'EXPIRED'));
END $$;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_clinic ON subscriptions(clinic_id);

-- Comentários
COMMENT ON COLUMN subscriptions.customer_id IS 'Referência ao cliente na tabela clients';
COMMENT ON COLUMN subscriptions.current_price IS 'Preço atual da assinatura (pode mudar ao longo do tempo)';
COMMENT ON COLUMN subscriptions.next_billing_date IS 'Data da próxima cobrança';
COMMENT ON COLUMN subscriptions.notes IS 'Observações sobre a assinatura';
