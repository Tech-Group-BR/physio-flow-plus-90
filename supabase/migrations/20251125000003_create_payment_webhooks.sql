-- ============================================
-- CRIAR TABELA PAYMENT_WEBHOOKS
-- Seguindo PAYMENT_FLOW_COMPLETE.md
-- ============================================

CREATE TABLE IF NOT EXISTS payment_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  payment_id UUID REFERENCES payments(id),
  asaas_payment_id TEXT,
  raw_payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_event_type ON payment_webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_asaas_id ON payment_webhooks(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_processed ON payment_webhooks(processed);

-- Habilitar RLS
ALTER TABLE payment_webhooks ENABLE ROW LEVEL SECURITY;

-- Policy para admin visualizar webhooks
CREATE POLICY "Admin pode visualizar webhooks"
  ON payment_webhooks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Comentários
COMMENT ON TABLE payment_webhooks IS 'Log de webhooks recebidos da Asaas';
COMMENT ON COLUMN payment_webhooks.event_type IS 'Tipo do evento: PAYMENT_CREATED, PAYMENT_CONFIRMED, etc';
COMMENT ON COLUMN payment_webhooks.raw_payload IS 'Payload completo recebido do webhook';
COMMENT ON COLUMN payment_webhooks.processed IS 'Se o webhook já foi processado';
