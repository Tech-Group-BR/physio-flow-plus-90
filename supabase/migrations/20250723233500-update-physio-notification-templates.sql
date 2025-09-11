
-- Atualizar função process_whatsapp_confirmation com templates personalizados
CREATE OR REPLACE FUNCTION public.process_whatsapp_confirmation(p_phone text, p_message_content text, p_evolution_message_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  appointment_record RECORD;
  physio_record RECORD;
  patient_record RECORD;
  settings_record RECORD;
  room_record RECORD;
  result JSON;
  phone_clean TEXT;
  physio_message TEXT;
  physio_phone_formatted TEXT;
  api_response http_response;
  api_request_body TEXT;
  notification_success BOOLEAN DEFAULT false;
  local_atendimento TEXT;
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
  WHERE id = appointment_record.physiotherapist_id;

  -- Buscar dados do paciente
  SELECT * INTO patient_record
  FROM patients
  WHERE id = appointment_record.patient_id;

  -- Buscar dados da sala
  SELECT * INTO room_record
  FROM rooms
  WHERE id = appointment_record.room_id;

  -- Definir local de atendimento
  local_atendimento := COALESCE(room_record.name, 'Clínica de Fisioterapia');

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

    -- Preparar mensagem personalizada para fisioterapeuta - CONFIRMAÇÃO
    physio_message := '📅 *Consulta confirmada!*

O paciente *' || patient_record.full_name || '* confirmou o atendimento agendado para *' || to_char(appointment_record.date, 'DD/MM/YYYY') || '* às *' || appointment_record.time || '*.

📍 Local: ' || local_atendimento;

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

    -- Preparar mensagem personalizada para fisioterapeuta - CANCELAMENTO
    physio_message := '⚠️ *Consulta cancelada!*

O paciente *' || patient_record.full_name || '* cancelou o atendimento que estava agendado para *' || to_char(appointment_record.date, 'DD/MM/YYYY') || '* às *' || appointment_record.time || '*.

📌 Por favor, reorganize a agenda caso necessário.';

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
    result := json_build_object(
      'success', false,
      'message', 'Resposta não reconhecida. Responda SIM para confirmar ou NÃO para cancelar.',
      'appointment_id', appointment_record.id,
      'action', 'unknown',
      'notify_physio', false
    );
  END IF;

  -- Tentar notificar fisioterapeuta se necessário
  IF (result->>'notify_physio')::boolean = true AND settings_record.api_key IS NOT NULL AND physio_record.phone IS NOT NULL THEN
    -- Formatar telefone do fisioterapeuta
    physio_phone_formatted := regexp_replace(physio_record.phone, '\D', '', 'g');
    
    -- Adicionar código do país se necessário
    IF length(physio_phone_formatted) = 11 THEN
      physio_phone_formatted := '55' || physio_phone_formatted;
    ELSIF length(physio_phone_formatted) = 9 THEN
      physio_phone_formatted := '5566' || physio_phone_formatted;
    ELSIF NOT physio_phone_formatted LIKE '55%' THEN
      physio_phone_formatted := '55' || physio_phone_formatted;
    END IF;
    
    -- Preparar corpo da requisição
    api_request_body := json_build_object(
      'number', physio_phone_formatted,
      'text', physio_message
    )::text;
    
    -- Tentar enviar mensagem para fisioterapeuta via HTTP
    BEGIN
      SELECT * INTO api_response FROM http((
        'POST',
        settings_record.base_url || '/message/sendText/' || settings_record.instance_name,
        ARRAY[
          http_header('Content-Type', 'application/json'),
          http_header('apikey', settings_record.api_key)
        ],
        'application/json',
        api_request_body
      ));

      -- Verificar se foi enviado com sucesso
      IF api_response.status = 200 OR api_response.status = 201 THEN
        notification_success := true;
        
        -- Atualizar agendamento com dados da notificação
        UPDATE appointments
        SET 
          physio_notified_at = NOW(),
          physio_message_id = 'PHYSIO_' || appointment_record.id || '_' || extract(epoch from now())::text
        WHERE id = appointment_record.id;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      -- Se der erro, apenas continuar sem notificar
      notification_success := false;
    END;
    
    -- Adicionar informações da notificação ao resultado
    result := result || json_build_object(
      'physio_notified', notification_success,
      'physio_phone_formatted', physio_phone_formatted,
      'api_status', COALESCE(api_response.status, 0)
    );
  ELSE
    -- Não deve notificar
    result := result || json_build_object(
      'physio_notified', false,
      'physio_notification_reason', 
      CASE 
        WHEN (result->>'notify_physio')::boolean = false THEN 'Não deve notificar'
        WHEN settings_record.api_key IS NULL THEN 'API key não encontrada'
        WHEN physio_record.phone IS NULL THEN 'Telefone da fisioterapeuta não encontrado'
        ELSE 'Motivo desconhecido'
      END
    );
  END IF;

  -- Log básico sem usar constraints problemáticas
  BEGIN
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
      'patient_response',
      p_message_content,
      'processed',
      p_evolution_message_id,
      (result->>'action')::text
    );
  EXCEPTION WHEN OTHERS THEN
    -- Se der erro no log, continuar sem bloquear
    NULL;
  END;

  RETURN result;
END;
$$;
