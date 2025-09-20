-- Fix RLS policy exists but RLS disabled error
-- Enable RLS on tables that have policies but RLS is not enabled

ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_settings ENABLE ROW LEVEL SECURITY;