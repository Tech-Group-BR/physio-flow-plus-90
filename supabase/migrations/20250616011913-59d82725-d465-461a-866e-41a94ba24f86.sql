
-- Criar enum para tipos de usuário
CREATE TYPE user_role AS ENUM ('admin', 'Professional', 'guardian');

-- Criar enum para gênero
CREATE TYPE gender_type AS ENUM ('male', 'female');

-- Criar enum para status de agendamento
CREATE TYPE appointment_status AS ENUM ('marcado', 'confirmado', 'realizado', 'cancelado', 'faltante');

-- Criar enum para método de pagamento
CREATE TYPE payment_method AS ENUM ('dinheiro', 'pix', 'cartao', 'transferencia');

-- Criar enum para status de pagamento
CREATE TYPE payment_status AS ENUM ('pendente', 'pago', 'cancelado', 'vencido');

-- Criar enum para tipo de pagamento
CREATE TYPE payment_type AS ENUM ('consulta', 'mensalidade', 'avaliacao', 'pacote', 'outro');

-- Criar enum para status de lead
CREATE TYPE lead_status AS ENUM ('novo', 'contatado', 'interessado', 'agendado', 'cliente', 'perdido');

-- Criar enum para status de contas
CREATE TYPE account_status AS ENUM ('pendente', 'pago', 'vencido', 'cancelado');

-- Tabela de perfis de usuário (conectada ao auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'guardian',
  crefito TEXT,
  specialties TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de salas
CREATE TABLE public.rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  capacity INTEGER DEFAULT 1,
  equipment TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de pacientes
CREATE TABLE public.patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  cpf TEXT,
  birth_date DATE,
  gender gender_type,
  address JSONB,
  emergency_contact JSONB,
  emergency_phone TEXT,
  medical_history TEXT,
  insurance TEXT,
  treatment_type TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  is_minor BOOLEAN DEFAULT false,
  guardian_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de agendamentos
CREATE TABLE public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  professional_id UUID REFERENCES public.profiles(id) NOT NULL,
  room_id UUID REFERENCES public.rooms(id),
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration INTEGER DEFAULT 60,
  treatment_type TEXT,
  status appointment_status DEFAULT 'marcado',
  notes TEXT,
  whatsapp_confirmed BOOLEAN DEFAULT false,
  whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de prontuários médicos
CREATE TABLE public.medical_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  anamnesis JSONB,
  files TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de evoluções
CREATE TABLE public.evolutions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id UUID REFERENCES public.medical_records(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  professional_id UUID REFERENCES public.profiles(id) NOT NULL,
  observations TEXT NOT NULL,
  pain_scale INTEGER CHECK (pain_scale >= 0 AND pain_scale <= 10),
  mobility_scale INTEGER CHECK (mobility_scale >= 0 AND mobility_scale <= 10),
  treatment_performed TEXT NOT NULL,
  next_session TEXT,
  files TEXT[],
  media TEXT[],
  visible_to_guardian BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de pagamentos
CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id),
  amount DECIMAL(10,2) NOT NULL,
  method payment_method NOT NULL,
  status payment_status DEFAULT 'pendente',
  type payment_type NOT NULL,
  due_date DATE,
  paid_date TIMESTAMP WITH TIME ZONE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de contas a pagar
CREATE TABLE public.accounts_payable (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  status account_status DEFAULT 'pendente',
  category TEXT,
  supplier TEXT,
  paid_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de contas a receber
CREATE TABLE public.accounts_receivable (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  status account_status DEFAULT 'pendente',
  paid_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de leads (CRM)
CREATE TABLE public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  source TEXT,
  status lead_status DEFAULT 'novo',
  notes TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  last_contact TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de responsáveis (para pacientes menores)
CREATE TABLE public.guardians (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  relationship TEXT,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;

-- Função para obter o papel do usuário atual
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Políticas RLS para profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.get_current_user_role() = 'admin');

-- Políticas RLS para rooms (apenas admins e fisioterapeutas)
CREATE POLICY "Physios and admins can view rooms" ON public.rooms
  FOR SELECT USING (public.get_current_user_role() IN ('admin', 'Professional'));

-- Políticas RLS para patients
CREATE POLICY "Physios and admins can manage patients" ON public.patients
  FOR ALL USING (public.get_current_user_role() IN ('admin', 'Professional'));

CREATE POLICY "Guardians can view their patients" ON public.patients
  FOR SELECT USING (guardian_id = auth.uid());

-- Políticas RLS para appointments
CREATE POLICY "Physios and admins can manage appointments" ON public.appointments
  FOR ALL USING (public.get_current_user_role() IN ('admin', 'Professional'));

-- Políticas RLS para medical_records
CREATE POLICY "Physios and admins can manage medical records" ON public.medical_records
  FOR ALL USING (public.get_current_user_role() IN ('admin', 'Professional'));

-- Políticas RLS para evolutions
CREATE POLICY "Physios and admins can manage evolutions" ON public.evolutions
  FOR ALL USING (public.get_current_user_role() IN ('admin', 'Professional'));

CREATE POLICY "Guardians can view visible evolutions" ON public.evolutions
  FOR SELECT USING (
    visible_to_guardian = true AND
    EXISTS (
      SELECT 1 FROM public.patients p
      JOIN public.medical_records mr ON p.id = mr.patient_id
      WHERE mr.id = record_id AND p.guardian_id = auth.uid()
    )
  );

-- Políticas RLS para payments
CREATE POLICY "Physios and admins can manage payments" ON public.payments
  FOR ALL USING (public.get_current_user_role() IN ('admin', 'Professional'));

-- Políticas RLS para accounts_payable (apenas admins)
CREATE POLICY "Admins can manage accounts payable" ON public.accounts_payable
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- Políticas RLS para accounts_receivable
CREATE POLICY "Physios and admins can manage accounts receivable" ON public.accounts_receivable
  FOR ALL USING (public.get_current_user_role() IN ('admin', 'Professional'));

-- Políticas RLS para leads
CREATE POLICY "Physios and admins can manage leads" ON public.leads
  FOR ALL USING (public.get_current_user_role() IN ('admin', 'Professional'));

-- Políticas RLS para guardians
CREATE POLICY "Physios and admins can manage guardians" ON public.guardians
  FOR ALL USING (public.get_current_user_role() IN ('admin', 'Professional'));

CREATE POLICY "Guardians can view their own data" ON public.guardians
  FOR SELECT USING (user_id = auth.uid());

-- Trigger para criar perfil automaticamente quando usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'guardian')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Inserir dados iniciais para desenvolvimento
INSERT INTO public.rooms (name, capacity, equipment) VALUES
  ('Sala 1 - Ortopedia', 1, ARRAY['Maca', 'Theraband', 'Halteres']),
  ('Sala 2 - Neurologia', 1, ARRAY['Paralelas', 'Bola Suíça', 'Esteira']);
