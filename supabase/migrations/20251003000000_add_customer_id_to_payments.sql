-- Add customer_id column to payments table to store Asaas customer ID
ALTER TABLE payments ADD COLUMN IF NOT EXISTS customer_id TEXT;

-- Add customer_id column to asaas_webhook_log table
ALTER TABLE asaas_webhook_log ADD COLUMN IF NOT EXISTS customer_id TEXT;

-- Add index for faster lookups by customer_id
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_asaas_webhook_log_customer_id ON asaas_webhook_log(customer_id);