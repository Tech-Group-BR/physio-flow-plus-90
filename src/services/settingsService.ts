import { supabase } from "@/integrations/supabase/client";

export interface ClinicSettings {
  id: string | null;
  consultation_price: number | null;
}

export async function fetchClinicSettings(clinicId: string | undefined): Promise<ClinicSettings | null> {
  if (!clinicId) {
    console.warn('clinicId está indefinido!');
    return null;
  }
  try {
    const { data, error } = await supabase
      .from('clinic_settings')
      .select('id,consultation_price')
      .eq('id', clinicId)
      .single();

    if (error) throw error;

    return data as ClinicSettings;
  } catch (error) {
    console.error('Erro inesperado ao buscar dados da clínica:', error);
    return null;
  }
}