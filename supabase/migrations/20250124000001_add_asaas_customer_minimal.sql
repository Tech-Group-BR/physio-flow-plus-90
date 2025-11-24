-- Adicionar coluna asaas_customer_id na tabela profiles (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='asaas_customer_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN asaas_customer_id TEXT;
    CREATE INDEX idx_profiles_asaas_customer_id ON profiles(asaas_customer_id);
    COMMENT ON COLUMN profiles.asaas_customer_id IS 'ID do cliente no sistema Asaas (gateway de pagamento)';
  END IF;
END $$;
