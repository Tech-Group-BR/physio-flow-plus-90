-- Adicionar campos necessários para integração com Evolution API
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS confirmation_message_id TEXT,
ADD COLUMN IF NOT EXISTS physio_message_id TEXT,
ADD COLUMN IF NOT EXISTS patient_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS physio_notified_at TIMESTAMP WITH TIME ZONE;

-- Criar função para processar confirmações via WhatsApp
CREATE OR REPLACE FUNCTION public.process_whatsapp_confirmation(
  p_phone TEXT,
  p_message_content TEXT,
  p_evolution_message_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  appointment_record RECORD;
  patient_record RECORD;
  result JSON;
BEGIN
  -- Buscar agendamento por telefone do paciente
  SELECT a.*, p.full_name as patient_name, p.phone as patient_phone
  INTO appointment_record, patient_record
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
$$;