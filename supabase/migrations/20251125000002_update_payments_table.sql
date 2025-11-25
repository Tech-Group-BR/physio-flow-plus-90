-- ============================================
-- ATUALIZAR TABELA PAYMENTS
-- Seguindo PAYMENT_FLOW_COMPLETE.md
-- ============================================

-- Adicionar subscription_id se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'subscription_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN subscription_id UUID REFERENCES subscriptions(id);
  END IF;
END $$;

-- Adicionar customer_id se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN customer_id UUID REFERENCES clients(id);
  END IF;
END $$;

-- Adicionar asaas_payment_id se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'asaas_payment_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN asaas_payment_id TEXT UNIQUE;
  END IF;
END $$;

-- Adicionar amount se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'amount'
  ) THEN
    ALTER TABLE payments ADD COLUMN amount DECIMAL(10,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Adicionar payment_method se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE payments ADD COLUMN payment_method TEXT;
  END IF;
END $$;

-- Adicionar due_date se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE payments ADD COLUMN due_date DATE;
  END IF;
END $$;

-- Adicionar payment_date se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'payment_date'
  ) THEN
    ALTER TABLE payments ADD COLUMN payment_date DATE;
  END IF;
END $$;

-- Adicionar confirmed_at se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'confirmed_at'
  ) THEN
    ALTER TABLE payments ADD COLUMN confirmed_at TIMESTAMPTZ;
  END IF;
END $$;

-- Adicionar invoice_url se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'invoice_url'
  ) THEN
    ALTER TABLE payments ADD COLUMN invoice_url TEXT;
  END IF;
END $$;

-- Adicionar bank_slip_url se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'bank_slip_url'
  ) THEN
    ALTER TABLE payments ADD COLUMN bank_slip_url TEXT;
  END IF;
END $$;

-- Adicionar description se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'description'
  ) THEN
    ALTER TABLE payments ADD COLUMN description TEXT;
  END IF;
END $$;

-- Adicionar external_reference se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'external_reference'
  ) THEN
    ALTER TABLE payments ADD COLUMN external_reference TEXT;
  END IF;
END $$;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_asaas_id ON payments(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);

-- Comentários
COMMENT ON COLUMN payments.subscription_id IS 'Referência à assinatura relacionada';
COMMENT ON COLUMN payments.customer_id IS 'Referência ao cliente na tabela clients';
COMMENT ON COLUMN payments.asaas_payment_id IS 'ID do pagamento na Asaas';
COMMENT ON COLUMN payments.payment_method IS 'CREDIT_CARD, BOLETO, PIX';
COMMENT ON COLUMN payments.amount IS 'Valor do pagamento';
COMMENT ON COLUMN payments.due_date IS 'Data de vencimento';
COMMENT ON COLUMN payments.payment_date IS 'Data em que foi pago';
COMMENT ON COLUMN payments.confirmed_at IS 'Timestamp de confirmação do pagamento';
COMMENT ON COLUMN payments.invoice_url IS 'URL da fatura';
COMMENT ON COLUMN payments.bank_slip_url IS 'URL do boleto (se aplicável)';
COMMENT ON COLUMN payments.description IS 'Descrição do pagamento';
COMMENT ON COLUMN payments.external_reference IS 'Referência externa para rastreamento';
