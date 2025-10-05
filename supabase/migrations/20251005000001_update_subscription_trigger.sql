-- Migration: Atualizar trigger para trabalhar com 1 subscription por clínica
-- Cada clínica tem 1 subscription criada no cadastro (status: trialing)
-- Quando payment é RECEIVED, apenas atualiza essa subscription

-- Função atualizada: sempre atualiza a subscription existente da clínica
CREATE OR REPLACE FUNCTION sync_subscription_from_payment()
RETURNS TRIGGER AS $$
DECLARE
  existing_subscription_id UUID;
  plan_period INTEGER;
  current_end_date TIMESTAMP WITH TIME ZONE;
  new_end_date TIMESTAMP WITH TIME ZONE;
  new_next_billing TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Só processa se o payment tem plan_id, clinic_id e status RECEIVED
  IF NEW.plan_id IS NULL OR NEW.clinic_id IS NULL OR NEW.status != 'RECEIVED' THEN
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
  
  -- ✅ Buscar a subscription da clínica (só deve ter 1 por clínica)
  SELECT id, end_date INTO existing_subscription_id, current_end_date
  FROM subscriptions
  WHERE clinic_id = NEW.clinic_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF existing_subscription_id IS NULL THEN
    -- 🚨 ERRO: Toda clínica deveria ter uma subscription criada no cadastro
    RAISE WARNING 'Subscription não encontrada para clinic_id %. Criando nova.', NEW.clinic_id;
    
    new_end_date := NOW() + (plan_period || ' days')::INTERVAL;
    new_next_billing := new_end_date;
    
    INSERT INTO subscriptions (
      clinic_id,
      plan_id,
      status,
      start_date,
      end_date,
      next_billing_date,
      last_payment_id,
      billing_cycle,
      asaas_subscription_id,
      created_at,
      updated_at
    ) VALUES (
      NEW.clinic_id,
      NEW.plan_id,
      'active',
      NOW(),
      new_end_date,
      new_next_billing,
      NEW.id,
      'monthly',
      NEW.asaas_subscription_id,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Nova subscription criada para clinic % (caso excepcional)', NEW.clinic_id;
  ELSE
    -- ✅ ATUALIZAR a subscription existente da clínica
    
    -- Calcular nova end_date:
    -- - Se subscription ainda está ativa (end_date > NOW), adicionar período ao fim
    -- - Se expirou (end_date <= NOW), começar do zero a partir de agora
    IF current_end_date > NOW() THEN
      new_end_date := current_end_date + (plan_period || ' days')::INTERVAL;
    ELSE
      new_end_date := NOW() + (plan_period || ' days')::INTERVAL;
    END IF;
    
    new_next_billing := new_end_date;
    
    UPDATE subscriptions
    SET 
      plan_id = NEW.plan_id,              -- Atualizar plano (pode ter mudado)
      status = 'active',                  -- ✅ ATIVAR!
      last_payment_id = NEW.id,           -- Vincular ao payment
      end_date = new_end_date,            -- Estender ou renovar período
      next_billing_date = new_next_billing,
      asaas_subscription_id = COALESCE(NEW.asaas_subscription_id, asaas_subscription_id), -- Manter se já existe
      updated_at = NOW()
    WHERE id = existing_subscription_id;
    
    RAISE NOTICE 'Subscription % atualizada: plan=%, status=active, end_date=%', 
                 existing_subscription_id, NEW.plan_id, new_end_date;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar o trigger
DROP TRIGGER IF EXISTS trigger_sync_subscription_on_payment ON payments;
CREATE TRIGGER trigger_sync_subscription_on_payment
  AFTER INSERT OR UPDATE OF status ON payments
  FOR EACH ROW
  EXECUTE FUNCTION sync_subscription_from_payment();

-- Comentários atualizados
COMMENT ON FUNCTION sync_subscription_from_payment() IS 
'Atualiza a subscription da clínica quando um payment com status RECEIVED é processado.
Cada clínica tem apenas 1 subscription (criada no cadastro).
Quando payment é pago, atualiza status para active e estende o período.';

COMMENT ON TRIGGER trigger_sync_subscription_on_payment ON payments IS
'Trigger que atualiza automaticamente a subscription da clínica quando payment é RECEIVED';
