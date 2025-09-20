-- Enable Row Level Security on tables that need it
ALTER TABLE public.patient_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_packages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users

-- Patient packages policies
CREATE POLICY "Authenticated users can view patient packages" 
ON public.patient_packages 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create patient packages" 
ON public.patient_packages 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update patient packages" 
ON public.patient_packages 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete patient packages" 
ON public.patient_packages 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Professionals policies
CREATE POLICY "Authenticated users can view professionals" 
ON public.professionals 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create professionals" 
ON public.professionals 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update professionals" 
ON public.professionals 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete professionals" 
ON public.professionals 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Services policies
CREATE POLICY "Authenticated users can view services" 
ON public.services 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create services" 
ON public.services 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update services" 
ON public.services 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete services" 
ON public.services 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Session packages policies
CREATE POLICY "Authenticated users can view session packages" 
ON public.session_packages 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create session packages" 
ON public.session_packages 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update session packages" 
ON public.session_packages 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete session packages" 
ON public.session_packages 
FOR DELETE 
USING (auth.role() = 'authenticated');