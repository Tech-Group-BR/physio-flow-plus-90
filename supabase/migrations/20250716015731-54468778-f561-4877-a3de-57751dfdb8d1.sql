-- Notificar todas as confirmações pendentes
DO $$
DECLARE
  appointment_rec RECORD;
BEGIN
  -- Para cada agendamento confirmado mas não notificado
  FOR appointment_rec IN 
    SELECT a.id, a.status, p.full_name as patient_name, pr.full_name as physio_name, pr.phone as physio_phone
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN profiles pr ON a.professional_id = pr.id
    WHERE a.whatsapp_confirmed = true 
    AND a.physio_notified_at IS NULL
    LIMIT 3
  LOOP
    -- Atualizar como notificado
    UPDATE appointments 
    SET physio_notified_at = NOW()
    WHERE id = appointment_rec.id;
    
    -- Log da ação
    INSERT INTO whatsapp_logs (
      appointment_id,
      patient_phone,
      message_type,
      message_content,
      status,
      evolution_message_id
    ) VALUES (
      appointment_rec.id,
      appointment_rec.physio_phone,
      'confirmation',
      'Notificação de confirmação enviada para ' || appointment_rec.physio_name || ' sobre paciente ' || appointment_rec.patient_name,
      'pending_send',
      'MANUAL_' || extract(epoch from now())::text
    );
    
    RAISE NOTICE 'Agendamento % marcado para notificação: % - %', appointment_rec.id, appointment_rec.patient_name, appointment_rec.physio_name;
  END LOOP;
END $$;