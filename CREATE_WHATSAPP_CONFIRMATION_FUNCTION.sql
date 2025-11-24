-- ============================================
-- FUNÇÃO PARA PROCESSAR CONFIRMAÇÃO WHATSAPP
-- ============================================

CREATE OR REPLACE FUNCTION process_whatsapp_confirmation(
  p_phone TEXT,
  p_message_content TEXT,
  p_evolution_message_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_appointment_id UUID;
  v_patient_id UUID;
  v_patient_name TEXT;
  v_professional_id UUID;
  v_physio_phone TEXT;
  v_clinic_id UUID;
  v_appointment_date DATE;
  v_appointment_time TEXT;
  v_action TEXT;
  v_result JSON;
BEGIN
  -- Normalizar telefone (remover formatação)
  p_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
  
  -- Normalizar mensagem (remover espaços, lowercase)
  p_message_content := lower(trim(p_message_content));
  
  -- Buscar paciente pelo telefone
  SELECT id INTO v_patient_id
  FROM patients
  WHERE regexp_replace(phone, '[^0-9]', '', 'g') = p_phone
  LIMIT 1;
  
  IF v_patient_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Paciente não encontrado'
    );
  END IF;
  
  -- Buscar agendamento mais recente do paciente que tenha whatsapp enviado
  SELECT 
    a.id,
    a.professional_id,
    a.clinic_id,
    a.date,
    a.time,
    p.full_name
  INTO 
    v_appointment_id,
    v_professional_id,
    v_clinic_id,
    v_appointment_date,
    v_appointment_time,
    v_patient_name
  FROM appointments a
  JOIN patients p ON p.id = a.patient_id
  WHERE a.patient_id = v_patient_id
    AND a.whatsapp_sent_at IS NOT NULL
    AND a.whatsapp_confirmed IS NULL
    AND a.date >= CURRENT_DATE
    AND a.status IN ('marcado', 'confirmado')
  ORDER BY a.date ASC, a.time ASC
  LIMIT 1;
  
  IF v_appointment_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Nenhum agendamento pendente de confirmação encontrado'
    );
  END IF;
  
  -- Interpretar resposta do paciente
  -- Confirmar: "1", "sim", "confirmar", "confirmo", "ok"
  -- Cancelar: "2", "não", "nao", "cancelar", "cancelo"
  
  IF p_message_content IN ('1', 'sim', 'confirmar', 'confirmo', 'ok', 'confirmar presença', 'confirmo presença') THEN
    -- CONFIRMAR
    UPDATE appointments
    SET 
      whatsapp_confirmed = true,
      status = 'confirmado',
      updated_at = NOW()
    WHERE id = v_appointment_id;
    
    v_action := 'confirmed';
    
  ELSIF p_message_content IN ('2', 'não', 'nao', 'cancelar', 'cancelo', 'cancelar consulta') THEN
    -- CANCELAR
    UPDATE appointments
    SET 
      whatsapp_confirmed = false,
      status = 'cancelado',
      updated_at = NOW()
    WHERE id = v_appointment_id;
    
    v_action := 'cancelled';
    
  ELSE
    -- Resposta não reconhecida
    RETURN json_build_object(
      'success', false,
      'message', 'Resposta não reconhecida. Por favor, responda com 1 para confirmar ou 2 para cancelar.'
    );
  END IF;
  
  -- Buscar telefone do profissional
  SELECT phone INTO v_physio_phone
  FROM professionals
  WHERE id = v_professional_id;
  
  -- Retornar resultado com dados para notificação
  v_result := json_build_object(
    'success', true,
    'action', v_action,
    'appointment_id', v_appointment_id,
    'patient_name', v_patient_name,
    'appointment_date', v_appointment_date,
    'appointment_time', v_appointment_time,
    'physio_phone', v_physio_phone,
    'clinic_id', v_clinic_id,
    'message', CASE 
      WHEN v_action = 'confirmed' THEN 'Consulta confirmada com sucesso!'
      WHEN v_action = 'cancelled' THEN 'Consulta cancelada com sucesso!'
    END
  );
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'message', 'Erro ao processar confirmação: ' || SQLERRM
  );
END;
$$;

-- Comentário
COMMENT ON FUNCTION process_whatsapp_confirmation IS 'Processa confirmação de agendamento via WhatsApp';

-- Testar a função
SELECT process_whatsapp_confirmation('66992646592', '1', 'test-message-id');
