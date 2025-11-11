-- Add installment tracking columns to payments table
-- These columns are needed to track annual subscriptions paid in 12 installments via Asaas Payments API

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS installment_count integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_installment integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_installment_plan boolean DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN payments.installment_count IS 'Total number of installments (12 for annual plans)';
COMMENT ON COLUMN payments.current_installment IS 'Current installment number (1-12)';
COMMENT ON COLUMN payments.is_installment_plan IS 'True if this is part of an installment plan (annual subscription)';

-- Create index for better query performance on installment queries
CREATE INDEX IF NOT EXISTS idx_payments_installment_plan 
ON payments(is_installment_plan, clinic_id) 
WHERE is_installment_plan = true;
