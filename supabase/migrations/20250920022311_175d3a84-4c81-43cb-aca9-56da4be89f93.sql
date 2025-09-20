-- Criar tabela de configurações da clínica para multi-tenancy
CREATE TABLE public.clinic_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  working_hours JSONB DEFAULT '{"start": "08:00", "end": "18:00", "lunchStart": "12:00", "lunchEnd": "14:00"}'::jsonb,
  consultation_price NUMERIC DEFAULT 180.00,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;

-- Política RLS para clinic_settings
CREATE POLICY "Authenticated users can manage clinic settings"
ON public.clinic_settings
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Adicionar clinic_id a todas as tabelas existentes (mantendo dados)
ALTER TABLE public.patients ADD COLUMN clinic_id UUID REFERENCES public.clinic_settings(id);
ALTER TABLE public.professionals ADD COLUMN clinic_id UUID REFERENCES public.clinic_settings(id);
ALTER TABLE public.appointments ADD COLUMN clinic_id UUID REFERENCES public.clinic_settings(id);
ALTER TABLE public.rooms ADD COLUMN clinic_id UUID REFERENCES public.clinic_settings(id);
ALTER TABLE public.medical_records ADD COLUMN clinic_id UUID REFERENCES public.clinic_settings(id);
ALTER TABLE public.evolutions ADD COLUMN clinic_id UUID REFERENCES public.clinic_settings(id);
ALTER TABLE public.accounts_payable ADD COLUMN clinic_id UUID REFERENCES public.clinic_settings(id);
ALTER TABLE public.accounts_receivable ADD COLUMN clinic_id UUID REFERENCES public.clinic_settings(id);
ALTER TABLE public.leads ADD COLUMN clinic_id UUID REFERENCES public.clinic_settings(id);
ALTER TABLE public.patient_packages ADD COLUMN clinic_id UUID REFERENCES public.clinic_settings(id);
ALTER TABLE public.session_packages ADD COLUMN clinic_id UUID REFERENCES public.clinic_settings(id);
ALTER TABLE public.guardians ADD COLUMN clinic_id UUID REFERENCES public.clinic_settings(id);
ALTER TABLE public.whatsapp_settings ADD COLUMN clinic_id UUID REFERENCES public.clinic_settings(id);
ALTER TABLE public.whatsapp_logs ADD COLUMN clinic_id UUID REFERENCES public.clinic_settings(id);

-- Inserir uma clínica padrão
INSERT INTO public.clinic_settings (id, name, email, phone, address, consultation_price)
VALUES ('00000000-0000-0000-0000-000000000001', 'FisioTech Sistema', 'contato@fisiotech.com.br', '(11) 99999-9999', 'Rua das Flores, 123, São Paulo - SP', 180.00);

-- Atualizar todos os registros existentes com o clinic_id padrão
UPDATE public.patients SET clinic_id = '00000000-0000-0000-0000-000000000001' WHERE clinic_id IS NULL;
UPDATE public.professionals SET clinic_id = '00000000-0000-0000-0000-000000000001' WHERE clinic_id IS NULL;
UPDATE public.appointments SET clinic_id = '00000000-0000-0000-0000-000000000001' WHERE clinic_id IS NULL;
UPDATE public.rooms SET clinic_id = '00000000-0000-0000-0000-000000000001' WHERE clinic_id IS NULL;
UPDATE public.medical_records SET clinic_id = '00000000-0000-0000-0000-000000000001' WHERE clinic_id IS NULL;
UPDATE public.evolutions SET clinic_id = '00000000-0000-0000-0000-000000000001' WHERE clinic_id IS NULL;
UPDATE public.accounts_payable SET clinic_id = '00000000-0000-0000-0000-000000000001' WHERE clinic_id IS NULL;
UPDATE public.accounts_receivable SET clinic_id = '00000000-0000-0000-0000-000000000001' WHERE clinic_id IS NULL;
UPDATE public.leads SET clinic_id = '00000000-0000-0000-0000-000000000001' WHERE clinic_id IS NULL;
UPDATE public.patient_packages SET clinic_id = '00000000-0000-0000-0000-000000000001' WHERE clinic_id IS NULL;
UPDATE public.session_packages SET clinic_id = '00000000-0000-0000-0000-000000000001' WHERE clinic_id IS NULL;
UPDATE public.guardians SET clinic_id = '00000000-0000-0000-0000-000000000001' WHERE clinic_id IS NULL;
UPDATE public.whatsapp_settings SET clinic_id = '00000000-0000-0000-0000-000000000001' WHERE clinic_id IS NULL;
UPDATE public.whatsapp_logs SET clinic_id = '00000000-0000-0000-0000-000000000001' WHERE clinic_id IS NULL;

-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_clinic_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamps
CREATE TRIGGER update_clinic_settings_updated_at
  BEFORE UPDATE ON public.clinic_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_clinic_settings_updated_at();