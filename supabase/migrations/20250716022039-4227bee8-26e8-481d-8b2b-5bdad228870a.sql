-- Permitir que edge functions chamem outras edge functions
-- e acessem todas as tabelas necessárias

-- Garantir que o webhook pode processar confirmações e notificar fisioterapeutas
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Permitir inserção nos logs do WhatsApp para o sistema
ALTER TABLE whatsapp_logs DISABLE ROW LEVEL SECURITY;
GRANT ALL ON whatsapp_logs TO anon, authenticated, service_role;

-- Atualizar a função process_whatsapp_confirmation para notificar automaticamente a fisioterapeuta
CREATE OR REPLACE FUNCTION public.process_whatsapp_confirmation(p_phone text, p_message_content text, p_evolution_message_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  appointment_record RECORD;
  physio_record RECORD;
  patient_record RECORD;
  settings_record RECORD;
  result JSON;
  phone_clean TEXT;
  physio_message TEXT;
  physio_phone_formatted TEXT;
  api_response TEXT;
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

  -- Buscar dados do paciente
  SELECT * INTO patient_record
  FROM patients
  WHERE id = appointment_record.patient_id;

  -- Buscar configurações do WhatsApp
  SELECT * INTO settings_record
  FROM whatsapp_settings
  WHERE is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

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

    -- Preparar mensagem para fisioterapeuta
    physio_message := '✅ *CONSULTA CONFIRMADA*

👤 Paciente: ' || patient_record.full_name || '
📅 Data: ' || to_char(appointment_record.date, 'DD/MM/YYYY') || '
🕐 Horário: ' || appointment_record.time || '

✅ O paciente CONFIRMOU a presença!

📱 Resposta: "' || p_message_content || '"';

    result := json_build_object(
      'success', true,
      'message', 'Agendamento confirmado com sucesso',
      'appointment_id', appointment_record.id,
      'action', 'confirmed',
      'patient_name', appointment_record.patient_name,
      'appointment_date', appointment_record.date,
      'appointment_time', appointment_record.time,
      'physio_name', physio_record.full_name,
      'physio_phone', physio_record.phone,
      'notify_physio', true
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

    -- Preparar mensagem para fisioterapeuta
    physio_message := '❌ *CONSULTA CANCELADA*

👤 Paciente: ' || patient_record.full_name || '
📅 Data: ' || to_char(appointment_record.date, 'DD/MM/YYYY') || '
🕐 Horário: ' || appointment_record.time || '

❌ O paciente CANCELOU a consulta!

📱 Resposta: "' || p_message_content || '"';

    result := json_build_object(
      'success', true,
      'message', 'Agendamento cancelado',
      'appointment_id', appointment_record.id,
      'action', 'cancelled',
      'patient_name', appointment_record.patient_name,
      'appointment_date', appointment_record.date,
      'appointment_time', appointment_record.time,
      'physio_name', physio_record.full_name,
      'physio_phone', physio_record.phone,
      'notify_physio', true
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
      'action', 'unknown',
      'notify_physio', false
    );
  END IF;

  -- Se deve notificar fisioterapeuta e temos as configurações
  IF (result->>'notify_physio')::boolean = true AND settings_record.api_key IS NOT NULL AND physio_record.phone IS NOT NULL THEN
    -- Formatar telefone do fisioterapeuta
    physio_phone_formatted := '55' || regexp_replace(physio_record.phone, '\D', '', 'g');
    
    -- Tentar enviar mensagem para fisioterapeuta (via HTTP request)
    BEGIN
      SELECT content INTO api_response FROM http((
        'POST',
        settings_record.base_url || '/message/sendText/' || settings_record.instance_name,
        ARRAY[
          http_header('Content-Type', 'application/json'),
          http_header('apikey', settings_record.api_key)
        ],
        'application/json',
        json_build_object(
          'number', physio_phone_formatted,
          'text', physio_message
        )::text
      ));

      -- Log da notificação para fisioterapeuta
      INSERT INTO whatsapp_logs (
        appointment_id,
        patient_phone,
        message_type,
        message_content,
        status,
        evolution_message_id
      ) VALUES (
        appointment_record.id,
        physio_record.phone,
        'physio_notification',
        physio_message,
        'sent',
        'PHYSIO_NOTIFY_' || appointment_record.id
      );

      -- Atualizar agendamento com dados da notificação
      UPDATE appointments
      SET 
        physio_notified_at = NOW(),
        physio_message_id = 'PHYSIO_' || appointment_record.id
      WHERE id = appointment_record.id;

    EXCEPTION WHEN OTHERS THEN
      -- Log do erro ao notificar fisioterapeuta
      INSERT INTO whatsapp_logs (
        appointment_id,
        patient_phone,
        message_type,
        message_content,
        status,
        evolution_message_id,
        error_message
      ) VALUES (
        appointment_record.id,
        physio_record.phone,
        'physio_notification_error',
        physio_message,
        'error',
        'PHYSIO_ERROR_' || appointment_record.id,
        SQLERRM
      );
    END;
  END IF;

  RETURN result;
END;
$function$;