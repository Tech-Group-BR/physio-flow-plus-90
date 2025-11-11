-- Add card tokenization for annual installment plans
-- Store Asaas credit card token (NOT raw card data) for recurring monthly charges

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS asaas_card_token TEXT,
ADD COLUMN IF NOT EXISTS auto_charge_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS next_charge_date DATE;

-- Add comments for security documentation
COMMENT ON COLUMN payments.asaas_card_token IS 'Asaas tokenized credit card (NEVER store raw card data)';
COMMENT ON COLUMN payments.auto_charge_enabled IS 'True if automatic monthly charges are enabled for installment plan';
COMMENT ON COLUMN payments.next_charge_date IS 'Date for next installment charge (for annual 12x plans)';

-- Create index for scheduled charge queries
CREATE INDEX IF NOT EXISTS idx_payments_next_charge 
ON payments(next_charge_date, auto_charge_enabled) 
WHERE auto_charge_enabled = true AND is_installment_plan = true;
