-- Adicionar campo session_value na tabela patients
ALTER TABLE public.patients 
ADD COLUMN session_value DECIMAL(10,2) DEFAULT 0.00;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.patients.session_value IS 'Valor da sessão de fisioterapia para este paciente';

-- Criar função para adicionar automaticamente no financeiro quando agendamento é confirmado
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

-- Criar trigger para executar a função
DROP TRIGGER IF EXISTS appointment_confirmation_trigger ON public.appointments;
CREATE TRIGGER appointment_confirmation_trigger
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_appointment_confirmation();

-- Criar view para relatórios financeiros por paciente
CREATE OR REPLACE VIEW public.patient_financial_report AS
SELECT 
  p.id as patient_id,
  p.full_name as patient_name,
  p.session_value,
  COUNT(a.id) as total_appointments,
  COUNT(CASE WHEN a.status = 'confirmado' THEN 1 END) as confirmed_appointments,
  COUNT(CASE WHEN a.status = 'realizado' THEN 1 END) as completed_appointments,
  COUNT(CASE WHEN a.status = 'cancelado' THEN 1 END) as cancelled_appointments,
  COUNT(CASE WHEN a.status = 'faltante' THEN 1 END) as missed_appointments,
  COALESCE(SUM(CASE WHEN a.status IN ('confirmado', 'realizado') THEN p.session_value ELSE 0 END), 0) as total_billed,
  COALESCE(SUM(ar.amount), 0) as total_receivable,
  COALESCE(SUM(CASE WHEN ar.status = 'pago' THEN ar.amount ELSE 0 END), 0) as total_received,
  COALESCE(SUM(CASE WHEN ar.status = 'pendente' THEN ar.amount ELSE 0 END), 0) as total_pending
FROM patients p
LEFT JOIN appointments a ON p.id = a.patient_id
LEFT JOIN accounts_receivable ar ON p.id = ar.patient_id
GROUP BY p.id, p.full_name, p.session_value
ORDER BY p.full_name;