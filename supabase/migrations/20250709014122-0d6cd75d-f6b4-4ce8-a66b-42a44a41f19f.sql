-- Configurar webhook URL para receber confirmações do WhatsApp
UPDATE public.whatsapp_settings 
SET 
  webhook_url = 'https://chgvegvnyflldpjoummj.supabase.co/functions/v1/whatsapp-webhook',
  updated_at = now()
WHERE is_active = true;

-- Verificar se existe a função process_whatsapp_confirmation (se não existir, criar)
CREATE OR REPLACE FUNCTION public.process_whatsapp_confirmation(p_phone text, p_message_content text, p_evolution_message_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  appointment_record RECORD;
  result JSON;
BEGIN
  -- Buscar agendamento por telefone do paciente
  SELECT a.*, p.full_name as patient_name, p.phone as patient_phone
  INTO appointment_record
  FROM appointments a
  JOIN patients p ON a.patient_id = p.id
  WHERE p.phone = p_phone 
    AND a.date >= CURRENT_DATE
    AND a.status IN ('marcado', 'confirmado')
  ORDER BY a.date ASC, a.time ASC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Nenhum agendamento encontrado para este número'
    );
  END IF;

  -- Verificar se é confirmação (SIM, CONFIRMO, OK, etc.)
  IF LOWER(TRIM(p_message_content)) ~ '^(sim|confirmo|ok|confirmar|s|1|yes)' THEN
    -- Confirmar agendamento
    UPDATE appointments 
    SET 
      status = 'confirmado',
      whatsapp_confirmed = true,
      patient_confirmed_at = NOW(),
      updated_at = NOW()
    WHERE id = appointment_record.id;

    -- Log da confirmação
    INSERT INTO whatsapp_logs (
      appointment_id,
      patient_phone,
      message_type,
      message_content,
      status,
      evolution_message_id,
      response_content
    ) VALUES (
      appointment_record.id,
      p_phone,
      'confirmation_response',
      'Confirmação recebida: ' || p_message_content,
      'delivered',
      p_evolution_message_id,
      p_message_content
    );

    result := json_build_object(
      'success', true,
      'message', 'Agendamento confirmado com sucesso',
      'appointment_id', appointment_record.id,
      'action', 'confirmed'
    );

  ELSIF LOWER(TRIM(p_message_content)) ~ '^(não|nao|cancelar|cancel|n|2|no)' THEN
    -- Cancelar agendamento
    UPDATE appointments 
    SET 
      status = 'cancelado',
      whatsapp_confirmed = false,
      updated_at = NOW()
    WHERE id = appointment_record.id;

    -- Log do cancelamento
    INSERT INTO whatsapp_logs (
      appointment_id,
      patient_phone,
      message_type,
      message_content,
      status,
      evolution_message_id,
      response_content
    ) VALUES (
      appointment_record.id,
      p_phone,
      'cancellation_response',
      'Cancelamento recebido: ' || p_message_content,
      'delivered',
      p_evolution_message_id,
      p_message_content
    );

    result := json_build_object(
      'success', true,
      'message', 'Agendamento cancelado',
      'appointment_id', appointment_record.id,
      'action', 'cancelled'
    );

  ELSE
    -- Resposta não reconhecida
    INSERT INTO whatsapp_logs (
      appointment_id,
      patient_phone,
      message_type,
      message_content,
      status,
      evolution_message_id,
      response_content
    ) VALUES (
      appointment_record.id,
      p_phone,
      'unknown_response',
      'Resposta não reconhecida: ' || p_message_content,
      'delivered',
      p_evolution_message_id,
      p_message_content
    );

    result := json_build_object(
      'success', false,
      'message', 'Resposta não reconhecida. Responda SIM para confirmar ou NÃO para cancelar.',
      'appointment_id', appointment_record.id,
      'action', 'unknown'
    );
  END IF;

  RETURN result;
END;
$function$;

-- Garantir que o trigger existe para criar contas a receber automaticamente
CREATE OR REPLACE FUNCTION public.handle_appointment_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o status mudou de não confirmado para confirmado
  IF OLD.status != 'confirmado' AND NEW.status = 'confirmado' THEN
    -- Buscar o valor da sessão do paciente
    DECLARE
      patient_session_value DECIMAL(10,2);
      patient_name TEXT;
    BEGIN
      SELECT p.session_value, p.full_name INTO patient_session_value, patient_name
      FROM patients p 
      WHERE p.id = NEW.patient_id;
      
      -- Se tem valor definido, criar conta a receber
      IF patient_session_value > 0 THEN
        INSERT INTO public.accounts_receivable (
          patient_id,
          amount,
          description,
          due_date,
          status
        ) VALUES (
          NEW.patient_id,
          patient_session_value,
          'Sessão de fisioterapia - ' || patient_name || ' (' || NEW.date || ' às ' || NEW.time || ')',
          NEW.date,
          'pendente'
        );
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar o trigger se não existir
DROP TRIGGER IF EXISTS appointment_confirmation_trigger ON public.appointments;
CREATE TRIGGER appointment_confirmation_trigger
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_appointment_confirmation();