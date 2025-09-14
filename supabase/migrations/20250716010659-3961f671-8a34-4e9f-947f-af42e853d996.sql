-- Criar função para escutar mudanças em appointments e atualizar real-time
-- Habilitar realtime para appointments
ALTER TABLE appointments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;

-- Corrigir function de confirmação WhatsApp para retornar appointment_time
CREATE OR REPLACE FUNCTION public.process_whatsapp_confirmation(
  p_phone text, 
  p_message_content text, 
  p_evolution_message_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  appointment_record RECORD;
  physio_record RECORD;
  result JSON;
  phone_clean TEXT;
BEGIN
  -- Limpar telefone para busca (remover todos os não dígitos)
  phone_clean := regexp_replace(p_phone, '\D', '', 'g');
  
  -- Buscar agendamento por telefone do paciente (tentar várias formatações)
  SELECT a.*, p.full_name as patient_name, p.phone as patient_phone
  INTO appointment_record
  FROM appointments a
  JOIN patients p ON a.patient_id = p.id
  WHERE (
    regexp_replace(p.phone, '\D', '', 'g') = phone_clean OR
    regexp_replace(p.phone, '\D', '', 'g') = ('55' || phone_clean) OR
    regexp_replace(p.phone, '\D', '', 'g') = substring(phone_clean, 3) OR
    p.phone LIKE '%' || right(phone_clean, 9) || '%'
  )
    AND a.date >= CURRENT_DATE - INTERVAL '1 day'
    AND a.status IN ('marcado', 'confirmado')
  ORDER BY a.date ASC, a.time ASC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Nenhum agendamento encontrado para este número',
      'phone_searched', phone_clean
    );
  END IF;

  -- Buscar dados do fisioterapeuta
  SELECT * INTO physio_record
  FROM profiles 
  WHERE id = appointment_record.professional_id;

  -- Verificar se é confirmação (SIM, CONFIRMO, OK, etc.)
  IF LOWER(TRIM(p_message_content)) ~ '^(sim|confirmo|ok|confirmar|s|1|yes|confirmado)' THEN
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
      'action', 'confirmed',
      'patient_name', appointment_record.patient_name,
      'appointment_date', appointment_record.date,
      'appointment_time', appointment_record.time,
      'physio_name', physio_record.full_name,
      'physio_phone', physio_record.phone
    );

  ELSIF LOWER(TRIM(p_message_content)) ~ '^(não|nao|cancelar|cancel|n|2|no|recusar)' THEN
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
      'action', 'cancelled',
      'patient_name', appointment_record.patient_name,
      'appointment_date', appointment_record.date,
      'appointment_time', appointment_record.time,
      'physio_name', physio_record.full_name,
      'physio_phone', physio_record.phone
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