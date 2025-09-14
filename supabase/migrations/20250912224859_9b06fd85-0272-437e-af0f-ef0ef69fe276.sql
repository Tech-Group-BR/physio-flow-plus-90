-- Criar tipos ENUM necessários
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'Professional', 'guardian');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE gender AS ENUM ('masculino', 'feminino', 'outro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM ('marcado', 'confirmado', 'realizado', 'cancelado', 'faltou');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_status AS ENUM ('novo', 'contatado', 'qualificado', 'convertido', 'perdido');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('dinheiro', 'cartao_debito', 'cartao_credito', 'pix', 'transferencia');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pendente', 'pago', 'cancelado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_type AS ENUM ('receita', 'despesa');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE account_status AS ENUM ('pendente', 'pago', 'vencido', 'cancelado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Garantir que a tabela profiles existe com estrutura correta
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY,
    full_name text NOT NULL,
    email text,
    phone text,
    role user_role NOT NULL DEFAULT 'guardian',
    crefito text,
    specialties text[],
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Garantir que a tabela patients existe
CREATE TABLE IF NOT EXISTS public.patients (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name text NOT NULL,
    phone text NOT NULL,
    email text,
    cpf text,
    birth_date date,
    gender gender,
    address jsonb,
    emergency_contact jsonb,
    emergency_phone text,
    medical_history text,
    insurance text,
    treatment_type text,
    notes text,
    session_value numeric(10,2) DEFAULT 0.00,
    is_active boolean DEFAULT true,
    is_minor boolean DEFAULT false,
    guardian_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Garantir que a tabela rooms existe
CREATE TABLE IF NOT EXISTS public.rooms (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    capacity integer DEFAULT 1,
    equipment text[],
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- Garantir que a tabela appointments existe
CREATE TABLE IF NOT EXISTS public.appointments (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid NOT NULL,
    professional_id uuid NOT NULL,
    room_id uuid,
    date date NOT NULL,
    time time NOT NULL,
    duration integer DEFAULT 60,
    treatment_type text,
    notes text,
    status appointment_status DEFAULT 'marcado',
    whatsapp_confirmed boolean DEFAULT false,
    whatsapp_sent_at timestamp with time zone,
    whatsapp_message_id text,
    whatsapp_status text DEFAULT 'pending',
    confirmation_sent_at timestamp with time zone,
    confirmation_message_id text,
    reminder_sent_at timestamp with time zone,
    followup_sent_at timestamp with time zone,
    patient_confirmed_at timestamp with time zone,
    physio_notified_at timestamp with time zone,
    physio_message_id text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Garantir que a tabela medical_records existe
CREATE TABLE IF NOT EXISTS public.medical_records (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid NOT NULL,
    anamnesis jsonb,
    files text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Garantir que a tabela evolutions existe
CREATE TABLE IF NOT EXISTS public.evolutions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    record_id uuid NOT NULL,
    date date NOT NULL,
    professional_id uuid NOT NULL,
    observations text NOT NULL,
    treatment_performed text NOT NULL,
    next_session text,
    pain_scale integer CHECK (pain_scale >= 0 AND pain_scale <= 10),
    mobility_scale integer CHECK (mobility_scale >= 0 AND mobility_scale <= 10),
    files text[],
    media text[],
    visible_to_guardian boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- Garantir que a tabela leads existe
CREATE TABLE IF NOT EXISTS public.leads (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    phone text NOT NULL,
    email text,
    source text,
    notes text,
    status lead_status DEFAULT 'novo',
    assigned_to uuid,
    last_contact timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Garantir que a tabela payments existe
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid,
    appointment_id uuid,
    amount numeric(10,2) NOT NULL,
    method payment_method NOT NULL,
    type payment_type NOT NULL,
    status payment_status DEFAULT 'pendente',
    description text,
    due_date date,
    paid_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- Garantir que a tabela accounts_receivable existe
CREATE TABLE IF NOT EXISTS public.accounts_receivable (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid,
    amount numeric(10,2) NOT NULL,
    description text NOT NULL,
    due_date date NOT NULL,
    status account_status DEFAULT 'pendente',
    method text DEFAULT 'dinheiro',
    notes text,
    paid_date timestamp with time zone,
    received_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Garantir que a tabela accounts_payable existe
CREATE TABLE IF NOT EXISTS public.accounts_payable (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    description text NOT NULL,
    amount numeric(10,2) NOT NULL,
    due_date date NOT NULL,
    status account_status DEFAULT 'pendente',
    category text,
    supplier text,
    notes text,
    paid_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Garantir que a tabela guardians existe
CREATE TABLE IF NOT EXISTS public.guardians (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    phone text NOT NULL,
    email text,
    relationship text,
    patient_id uuid NOT NULL,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now()
);

-- Garantir que a tabela whatsapp_settings existe
CREATE TABLE IF NOT EXISTS public.whatsapp_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    instance_name text NOT NULL,
    api_key text NOT NULL,
    base_url text NOT NULL DEFAULT 'https://evolution-api.com',
    webhook_url text,
    integration_enabled boolean DEFAULT true,
    auto_confirm_enabled boolean NOT NULL DEFAULT true,
    confirmation_template text NOT NULL DEFAULT 'Olá {nome}! Você tem consulta marcada para {data} às {horario} com {fisioterapeuta}. Confirme sua presença respondendo SIM.',
    reminder_template text NOT NULL DEFAULT 'Lembrete: Sua consulta é amanhã ({data}) às {horario}. Compareça pontualmente!',
    followup_template text NOT NULL DEFAULT 'Olá {nome}! Como você está se sentindo após a consulta? Lembre-se de seguir as orientações.',
    welcome_template text NOT NULL DEFAULT 'Olá {nome}! Bem-vindo(a) à nossa clínica. Estamos aqui para cuidar da sua saúde!',
    reminder_hours_before integer NOT NULL DEFAULT 2,
    confirmation_hours_before integer NOT NULL DEFAULT 24,
    followup_hours_after integer NOT NULL DEFAULT 24,
    welcome_enabled boolean NOT NULL DEFAULT true,
    reminder_enabled boolean NOT NULL DEFAULT true,
    followup_enabled boolean NOT NULL DEFAULT false,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Garantir que a tabela whatsapp_logs existe
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_id uuid,
    patient_phone text NOT NULL,
    message_type text NOT NULL,
    message_content text NOT NULL,
    status text NOT NULL DEFAULT 'sent',
    evolution_message_id text,
    response_content text,
    error_message text,
    sent_at timestamp with time zone NOT NULL DEFAULT now(),
    delivered_at timestamp with time zone,
    read_at timestamp with time zone
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS básicas para acesso autenticado
CREATE POLICY IF NOT EXISTS "Authenticated users can manage profiles" ON public.profiles FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "Authenticated users can manage patients" ON public.patients FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "Authenticated users can manage rooms" ON public.rooms FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "Authenticated users can manage appointments" ON public.appointments FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "Authenticated users can manage medical records" ON public.medical_records FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "Authenticated users can manage evolutions" ON public.evolutions FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "Authenticated users can manage leads" ON public.leads FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "Authenticated users can manage payments" ON public.payments FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "Authenticated users can manage accounts receivable" ON public.accounts_receivable FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "Authenticated users can manage accounts payable" ON public.accounts_payable FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "Authenticated users can manage guardians" ON public.guardians FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

-- Políticas específicas para WhatsApp
CREATE POLICY IF NOT EXISTS "Admins can manage WhatsApp settings" ON public.whatsapp_settings FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY IF NOT EXISTS "Service role can access whatsapp_settings" ON public.whatsapp_settings FOR ALL TO service_role USING (true);

CREATE POLICY IF NOT EXISTS "Staff can view WhatsApp logs" ON public.whatsapp_logs FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'Professional'))
);

CREATE POLICY IF NOT EXISTS "Service role can manage whatsapp_logs" ON public.whatsapp_logs FOR ALL TO service_role USING (true);

-- Inserir dados de teste
INSERT INTO public.profiles (id, full_name, email, phone, role, is_active) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Administrador', 'admin@sistema.com', '(66) 99999-9999', 'admin', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role;

-- Inserir fisioterapeuta de teste
INSERT INTO public.profiles (id, full_name, email, phone, role, crefito, specialties, is_active) 
VALUES ('00000000-0000-0000-0000-000000000002', 'Dr. Maria Silva', 'maria@clinica.com', '(66) 98888-8888', 'Professional', 'CREFITO-8 12345', ARRAY['Ortopedia', 'Neurologia'], true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    crefito = EXCLUDED.crefito,
    specialties = EXCLUDED.specialties;

-- Inserir responsável de teste
INSERT INTO public.profiles (id, full_name, email, phone, role, is_active) 
VALUES ('00000000-0000-0000-0000-000000000003', 'João Santos', 'joao@email.com', '(66) 97777-7777', 'guardian', true)
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role;

-- Inserir salas de teste
INSERT INTO public.rooms (id, name, capacity, equipment) 
VALUES 
    ('00000000-0000-0000-0000-000000000011', 'Sala 1', 1, ARRAY['Maca', 'Aparelho de ultrassom']),
    ('00000000-0000-0000-0000-000000000012', 'Sala 2', 2, ARRAY['Tatame', 'Bolas de pilates'])
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    capacity = EXCLUDED.capacity,
    equipment = EXCLUDED.equipment;

-- Inserir pacientes de teste
INSERT INTO public.patients (id, full_name, phone, email, birth_date, gender, session_value, guardian_id) 
VALUES 
    ('00000000-0000-0000-0000-000000000021', 'Ana Costa', '(66) 96666-6666', 'ana@email.com', '1990-05-15', 'feminino', 80.00, null),
    ('00000000-0000-0000-0000-000000000022', 'Pedro Silva', '(66) 95555-5555', 'pedro@email.com', '2010-08-20', 'masculino', 60.00, '00000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    session_value = EXCLUDED.session_value;

-- Inserir leads de teste
INSERT INTO public.leads (id, name, phone, email, source, status, assigned_to) 
VALUES 
    ('00000000-0000-0000-0000-000000000031', 'Carlos Lima', '(66) 94444-4444', 'carlos@email.com', 'Site', 'novo', '00000000-0000-0000-0000-000000000002'),
    ('00000000-0000-0000-0000-000000000032', 'Fernanda Oliveira', '(66) 93333-3333', 'fernanda@email.com', 'Indicação', 'contatado', '00000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    status = EXCLUDED.status;

-- Inserir agendamentos de teste
INSERT INTO public.appointments (id, patient_id, professional_id, room_id, date, time, status) 
VALUES 
    ('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000011', CURRENT_DATE + INTERVAL '1 day', '09:00', 'marcado'),
    ('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000012', CURRENT_DATE + INTERVAL '2 days', '14:00', 'confirmado')
ON CONFLICT (id) DO UPDATE SET 
    date = EXCLUDED.date,
    time = EXCLUDED.time,
    status = EXCLUDED.status;

-- Inserir configuração WhatsApp de teste
INSERT INTO public.whatsapp_settings (id, instance_name, api_key, base_url, auto_confirm_enabled, is_active) 
VALUES ('00000000-0000-0000-0000-000000000051', 'clinica-instance', 'test-api-key', 'https://evolution-api.com', true, false)
ON CONFLICT (id) DO UPDATE SET 
    instance_name = EXCLUDED.instance_name,
    auto_confirm_enabled = EXCLUDED.auto_confirm_enabled;