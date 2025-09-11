-- Criar função para testar envio direto de mensagem
CREATE OR REPLACE FUNCTION test_send_physio_notification(
  p_appointment_id uuid,
  p_action text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  appointment_data RECORD;
  physio_data RECORD;
  patient_data RECORD;
  settings_data RECORD;
  message_text text;
  result json;
BEGIN
  -- Buscar dados do agendamento
  SELECT * INTO appointment_data 
  FROM appointments 
  WHERE id = p_appointment_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Agendamento não encontrado');
  END IF;
  
  -- Buscar dados do fisioterapeuta
  SELECT * INTO physio_data 
  FROM profiles 
  WHERE id = appointment_data.physiotherapist_id;
  
  -- Buscar dados do paciente
  SELECT * INTO patient_data 
  FROM patients 
  WHERE id = appointment_data.patient_id;
  
  -- Buscar configurações
  SELECT * INTO settings_data 
  FROM whatsapp_settings 
  WHERE is_active = true 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- Preparar mensagem
  IF p_action = 'confirmed' THEN
    message_text := '✅ *CONSULTA CONFIRMADA*

👤 Paciente: ' || patient_data.full_name || '
📅 Data: ' || to_char(appointment_data.date, 'DD/MM/YYYY') || '
🕐 Horário: ' || appointment_data.time || '

✅ O paciente CONFIRMOU a presença!';
  ELSE
    message_text := '❌ *CONSULTA CANCELADA*

👤 Paciente: ' || patient_data.full_name || '
📅 Data: ' || to_char(appointment_data.date, 'DD/MM/YYYY') || '
🕐 Horário: ' || appointment_data.time || '

❌ O paciente CANCELOU a consulta!';
  END IF;
  
  -- Log da tentativa
  INSERT INTO whatsapp_logs (
    appointment_id,
    patient_phone,
    message_type,
    message_content,
    status,
    evolution_message_id
  ) VALUES (
    p_appointment_id,
    physio_data.phone,
    p_action || '_notification_test',
    message_text,
    'test_sent',
    'TEST_' || extract(epoch from now())::text
  );
  
  RETURN json_build_object(
    'success', true,
    'appointment_id', p_appointment_id,
    'physio_phone', physio_data.phone,
    'patient_name', patient_data.full_name,
    'message', message_text,
    'settings_found', settings_data.instance_name IS NOT NULL
  );
END;
$$;