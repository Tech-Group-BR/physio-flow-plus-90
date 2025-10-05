-- Migration: Sincronizar subscriptions com payments
-- Quando um payment com status RECEIVED é criado/atualizado, 
-- cria ou atualiza a subscription correspondente

-- Função para calcular end_date e next_billing_date baseado no período do plano
CREATE OR REPLACE FUNCTION calculate_subscription_dates(
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_plan_id UUID
) RETURNS TABLE(end_date TIMESTAMP WITH TIME ZONE, next_billing_date TIMESTAMP WITH TIME ZONE) AS $$
DECLARE
  plan_period INTEGER;
BEGIN
  -- Buscar período do plano (em dias)
  SELECT period INTO plan_period FROM products WHERE id = p_plan_id;
  
  IF plan_period IS NULL THEN
    plan_period := 30; -- Default: 30 dias
  END IF;
  
  -- Calcular datas
  RETURN QUERY SELECT 
    p_start_date + (plan_period || ' days')::INTERVAL AS end_date,
    p_start_date + (plan_period || ' days')::INTERVAL AS next_billing_date;
END;
$$ LANGUAGE plpgsql;

-- Função principal que sincroniza payment -> subscription
CREATE OR REPLACE FUNCTION sync_subscription_from_payment()
RETURNS TRIGGER AS $$
DECLARE
  existing_subscription_id UUID;
  calculated_end_date TIMESTAMP WITH TIME ZONE;
  calculated_next_billing TIMESTAMP WITH TIME ZONE;
  plan_period INTEGER;
BEGIN
  -- Só processa se o payment tem plan_id e status RECEIVED
  IF NEW.plan_id IS NULL OR NEW.status != 'RECEIVED' THEN
    RETURN NEW;
  END IF;
  
  -- Se mudou de outro status para RECEIVED
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
    RETURN NEW; -- Evitar processamento duplicado
  END IF;
  
  -- Buscar período do plano
  SELECT period INTO plan_period FROM products WHERE id = NEW.plan_id;
  IF plan_period IS NULL THEN
    plan_period := 30;
  END IF;
  
  -- Buscar subscription existente para essa clínica e plano
  SELECT id INTO existing_subscription_id
  FROM subscriptions
  WHERE clinic_id = NEW.clinic_id 
    AND plan_id = NEW.plan_id
    AND status IN ('active', 'pending_payment', 'trialing')
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF existing_subscription_id IS NOT NULL THEN
    -- ATUALIZAR subscription existente
    -- Se já está ativa, estender o período
    UPDATE subscriptions
    SET 
      status = 'active',
      last_payment_id = NEW.id,
      -- Se já tem end_date futura, adicionar período a partir dela; senão, a partir de agora
      end_date = CASE 
        WHEN end_date > NOW() THEN end_date + (plan_period || ' days')::INTERVAL
        ELSE NOW() + (plan_period || ' days')::INTERVAL
      END,
      next_billing_date = CASE 
        WHEN end_date > NOW() THEN end_date + (plan_period || ' days')::INTERVAL
        ELSE NOW() + (plan_period || ' days')::INTERVAL
      END,
      updated_at = NOW()
    WHERE id = existing_subscription_id;
    
    RAISE NOTICE 'Subscription % atualizada com payment %', existing_subscription_id, NEW.id;
  ELSE
    -- CRIAR nova subscription
    calculated_end_date := NOW() + (plan_period || ' days')::INTERVAL;
    calculated_next_billing := calculated_end_date;
    
    INSERT INTO subscriptions (
      clinic_id,
      plan_id,
      status,
      start_date,
      end_date,
      next_billing_date,
      last_payment_id,
      billing_cycle,
      created_at,
      updated_at
    ) VALUES (
      NEW.clinic_id,
      NEW.plan_id,
      'active',
      NOW(),
      calculated_end_date,
      calculated_next_billing,
      NEW.id,
      'monthly', -- ou derivar do plan_period
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Nova subscription criada para clinic % com payment %', NEW.clinic_id, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: quando um payment é inserido ou atualizado
DROP TRIGGER IF EXISTS trigger_sync_subscription_on_payment ON payments;
CREATE TRIGGER trigger_sync_subscription_on_payment
  AFTER INSERT OR UPDATE OF status ON payments
  FOR EACH ROW
  EXECUTE FUNCTION sync_subscription_from_payment();

-- Comentários
COMMENT ON FUNCTION sync_subscription_from_payment() IS 
'Sincroniza subscriptions quando um payment com status RECEIVED é criado/atualizado. 
Cria nova subscription ou estende a existente baseado no período do plano.';

COMMENT ON TRIGGER trigger_sync_subscription_on_payment ON payments IS
'Trigger que automaticamente cria ou atualiza subscription quando um payment é marcado como RECEIVED';
