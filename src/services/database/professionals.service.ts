/**
 * Professionals Service
 * 
 * Camada de serviço para operações de banco de dados relacionadas a profissionais/fisioterapeutas.
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  professionalDbToFrontend, 
  professionalFrontendToDb, 
  professionalsBatchDbToFrontend,
  type DbProfessional 
} from '@/services/mappers/professional.mapper';
import type { Professional } from '@/types';

export class ProfessionalsService {
  /**
   * Fetch all professionals for a clinic
   */
  static async fetchAll(clinicId: string): Promise<Professional[]> {
    console.log('🔍 [ProfessionalsService] Fetching all professionals for clinic:', clinicId);
    
    const { data, error } = await supabase
      .from('professionals')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('❌ [ProfessionalsService] Error fetching professionals:', error);
      throw new Error(`Failed to fetch professionals: ${error.message}`);
    }

    console.log(`✅ [ProfessionalsService] Fetched ${data?.length || 0} professionals`);
    return professionalsBatchDbToFrontend(data || []);
  }

  /**
   * Fetch a single professional by ID
   */
  static async fetchById(id: string): Promise<Professional> {
    console.log('🔍 [ProfessionalsService] Fetching professional by ID:', id);
    
    const { data, error } = await supabase
      .from('professionals')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ [ProfessionalsService] Error fetching professional:', error);
      throw new Error(`Failed to fetch professional: ${error.message}`);
    }

    if (!data) {
      throw new Error('Professional not found');
    }

    console.log('✅ [ProfessionalsService] Professional fetched:', data.full_name);
    return professionalDbToFrontend(data);
  }

  /**
   * Create a new professional
   */
  static async create(
    clinicId: string, 
    professional: Omit<Professional, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Professional> {
    console.log('➕ [ProfessionalsService] Creating professional:', professional.name);
    
    const dbProfessional = professionalFrontendToDb(professional);
    
    const insertData: any = {
      ...dbProfessional,
      clinic_id: clinicId
    };

    const { data, error } = await supabase
      .from('professionals')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ [ProfessionalsService] Error creating professional:', error);
      throw new Error(`Failed to create professional: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to create professional: No data returned');
    }

    console.log('✅ [ProfessionalsService] Professional created with ID:', data.id);
    return professionalDbToFrontend(data);
  }

  /**
   * Update an existing professional
   */
  static async update(id: string, updates: Partial<Professional>): Promise<Professional> {
    console.log('📝 [ProfessionalsService] Updating professional:', id);
    
    const dbUpdates = professionalFrontendToDb(updates);
    
    const updateData = {
      ...dbUpdates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('professionals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ [ProfessionalsService] Error updating professional:', error);
      throw new Error(`Failed to update professional: ${error.message}`);
    }

    if (!data) {
      throw new Error('Professional not found or update failed');
    }

    console.log('✅ [ProfessionalsService] Professional updated:', data.full_name);
    return professionalDbToFrontend(data);
  }

  /**
   * Soft delete a professional
   */
  static async softDelete(id: string): Promise<void> {
    console.log('🗑️ [ProfessionalsService] Soft deleting professional:', id);
    
    const { error } = await supabase
      .from('professionals')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('❌ [ProfessionalsService] Error soft deleting professional:', error);
      throw new Error(`Failed to soft delete professional: ${error.message}`);
    }

    console.log('✅ [ProfessionalsService] Professional soft deleted');
  }

  /**
   * Hard delete a professional
   */
  static async hardDelete(id: string): Promise<void> {
    console.log('🗑️ [ProfessionalsService] Hard deleting professional:', id);
    
    const { error } = await supabase
      .from('professionals')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ [ProfessionalsService] Error hard deleting professional:', error);
      throw new Error(`Failed to delete professional: ${error.message}`);
    }

    console.log('✅ [ProfessionalsService] Professional permanently deleted');
  }

  /**
   * Fetch active professionals only
   */
  static async fetchActive(clinicId: string): Promise<Professional[]> {
    console.log('🔍 [ProfessionalsService] Fetching active professionals');
    
    const { data, error } = await supabase
      .from('professionals')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('❌ [ProfessionalsService] Error fetching active professionals:', error);
      throw new Error(`Failed to fetch active professionals: ${error.message}`);
    }

    console.log(`✅ [ProfessionalsService] Fetched ${data?.length || 0} active professionals`);
    return professionalsBatchDbToFrontend(data || []);
  }
}
