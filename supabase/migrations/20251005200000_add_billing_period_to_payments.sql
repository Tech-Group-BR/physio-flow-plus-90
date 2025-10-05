-- Adicionar coluna billing_period à tabela payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS billing_period TEXT DEFAULT 'monthly';

-- Atualizar trigger para usar billing_period do pagamento
CREATE OR REPLACE FUNCTION sync_subscription_from_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_end_date TIMESTAMP WITH TIME ZONE;
  v_period_days INTEGER;
BEGIN
  -- Calcular days baseado no billing_period
  CASE NEW.billing_period
    WHEN 'monthly' THEN v_period_days := 30;
    WHEN 'quarterly' THEN v_period_days := 90;
    WHEN 'semiannual' THEN v_period_days := 180;
    WHEN 'annual' THEN v_period_days := 365;
    ELSE v_period_days := 30; -- default
  END CASE;

  v_end_date := NOW() + (v_period_days || ' days')::INTERVAL;

  -- Log para debug
  RAISE NOTICE 'Sincronizando subscription da clínica % com período % (% dias)', NEW.clinic_id, NEW.billing_period, v_period_days;

  -- Atualizar subscription existente da clínica
  UPDATE subscriptions
  SET 
    status = 'active',
    start_date = NOW(),
    end_date = v_end_date,
    billing_period = NEW.billing_period,
    asaas_subscription_id = NEW.asaas_subscription_id,
    updated_at = NOW()
  WHERE clinic_id = NEW.clinic_id;

  -- Se não existe subscription, criar uma nova
  IF NOT FOUND THEN
    INSERT INTO subscriptions (
      clinic_id,
      product_id,
      status,
      start_date,
      end_date,
      billing_period,
      asaas_subscription_id
    ) VALUES (
      NEW.clinic_id,
      NEW.product_id,
      'active',
      NOW(),
      v_end_date,
      NEW.billing_period,
      NEW.asaas_subscription_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger
DROP TRIGGER IF EXISTS sync_subscription_on_payment ON payments;
CREATE TRIGGER sync_subscription_on_payment
  AFTER INSERT OR UPDATE OF status ON payments
  FOR EACH ROW
  WHEN (NEW.status = 'RECEIVED')
  EXECUTE FUNCTION sync_subscription_from_payment();
