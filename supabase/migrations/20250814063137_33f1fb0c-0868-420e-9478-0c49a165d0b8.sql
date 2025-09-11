
-- Add missing columns to accounts_payable table
ALTER TABLE public.accounts_payable 
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Add missing updated_at column to accounts_receivable table
ALTER TABLE public.accounts_receivable
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create trigger function to automatically create accounts receivable when appointment is confirmed
CREATE OR REPLACE FUNCTION handle_appointment_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se o status mudou para confirmado
  IF NEW.status = 'confirmado' AND (OLD.status IS NULL OR OLD.status != 'confirmado') THEN
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
          'Sessão de fisioterapia - ' || COALESCE(patient_name, 'Paciente') || ' (' || NEW.date || ' às ' || NEW.time || ')',
          NEW.date,
          'pendente'
        );
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on appointments table
DROP TRIGGER IF EXISTS appointment_confirmation_trigger ON appointments;
CREATE TRIGGER appointment_confirmation_trigger
  AFTER UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION handle_appointment_confirmation();
