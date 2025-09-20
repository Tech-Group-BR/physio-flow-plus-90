import { supabase } from "@/integrations/supabase/client";

interface ClinicSettings {
  id: string | null;
  consultation_price: number | null;
}

/**
 * Busca o ID da clínica e o preço da consulta na tabela 'clinic_settings'.
 * @returns Um objeto com o ID e o preço da consulta, ou null se não for encontrado.
 */
export async function fetchClinicSettings(): Promise<ClinicSettings | null> {
  try {
    const { data, error } = await supabase
      .from('clinic_settings')
      .select('id, consultation_price')
      .single();

    if (error) {
      console.error('Erro ao buscar as configurações da clínica:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro inesperado ao buscar dados da clínica:', error);
    return null;
  }
}