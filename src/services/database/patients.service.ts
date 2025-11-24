/**
 * Patients Service
 * 
 * Camada de serviço para operações de banco de dados relacionadas a pacientes.
 * Todas as queries Supabase são isoladas aqui.
 * 
 * Responsabilidades:
 * - Queries Supabase isoladas
 * - Transformação DB ↔ Frontend via mappers
 * - Tratamento de erros
 * - Validação de dados
 * - Multi-tenancy (clinic_id)
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  patientDbToFrontend, 
  patientFrontendToDb, 
  patientsBatchDbToFrontend,
  type DbPatient 
} from '@/services/mappers/patient.mapper';
import type { Patient } from '@/types';

/**
 * Service class for Patient database operations
 */
export class PatientsService {
  /**
   * Fetch all patients for a clinic
   * @param clinicId - Clinic ID for multi-tenancy
   * @returns Array of patients in frontend format
   */
  static async fetchAll(clinicId: string): Promise<Patient[]> {
    console.log('🔍 [PatientsService] Fetching all patients for clinic:', clinicId);
    
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('❌ [PatientsService] Error fetching patients:', error);
      throw new Error(`Failed to fetch patients: ${error.message}`);
    }

    console.log(`✅ [PatientsService] Fetched ${data?.length || 0} patients`);
    return patientsBatchDbToFrontend(data || []);
  }

  /**
   * Fetch a single patient by ID
   * @param id - Patient ID
   * @returns Patient in frontend format
   */
  static async fetchById(id: string): Promise<Patient> {
    console.log('🔍 [PatientsService] Fetching patient by ID:', id);
    
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ [PatientsService] Error fetching patient:', error);
      throw new Error(`Failed to fetch patient: ${error.message}`);
    }

    if (!data) {
      throw new Error('Patient not found');
    }

    console.log('✅ [PatientsService] Patient fetched:', data.full_name);
    return patientDbToFrontend(data);
  }

  /**
   * Create a new patient
   * @param clinicId - Clinic ID for multi-tenancy
   * @param patient - Patient data in frontend format (without id)
   * @returns Created patient in frontend format
   */
  static async create(
    clinicId: string, 
    patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'appointments' | 'payments'>
  ): Promise<Patient> {
    console.log('➕ [PatientsService] Creating patient:', patient.fullName);
    
    // Convert to DB format
    const dbPatient = patientFrontendToDb(patient);
    
    // Add clinic_id for multi-tenancy
    const insertData: any = {
      ...dbPatient,
      clinic_id: clinicId
    };

    console.log('📤 [PatientsService] Insert data:', insertData);

    const { data, error } = await supabase
      .from('patients')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ [PatientsService] Error creating patient:', error);
      throw new Error(`Failed to create patient: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to create patient: No data returned');
    }

    console.log('✅ [PatientsService] Patient created with ID:', data.id);
    return patientDbToFrontend(data);
  }

  /**
   * Update an existing patient
   * @param id - Patient ID
   * @param updates - Partial patient data to update
   * @returns Updated patient in frontend format
   */
  static async update(id: string, updates: Partial<Patient>): Promise<Patient> {
    console.log('📝 [PatientsService] Updating patient:', id);
    
    // Convert to DB format
    const dbUpdates = patientFrontendToDb(updates);
    
    // Add updated_at timestamp
    const updateData = {
      ...dbUpdates,
      updated_at: new Date().toISOString()
    };

    console.log('📤 [PatientsService] Update data:', updateData);

    const { data, error } = await supabase
      .from('patients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ [PatientsService] Error updating patient:', error);
      throw new Error(`Failed to update patient: ${error.message}`);
    }

    if (!data) {
      throw new Error('Patient not found or update failed');
    }

    console.log('✅ [PatientsService] Patient updated:', data.full_name);
    return patientDbToFrontend(data);
  }

  /**
   * Soft delete a patient (set is_active = false)
   * @param id - Patient ID
   */
  static async softDelete(id: string): Promise<void> {
    console.log('🗑️ [PatientsService] Soft deleting patient:', id);
    
    const { error } = await supabase
      .from('patients')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('❌ [PatientsService] Error soft deleting patient:', error);
      throw new Error(`Failed to soft delete patient: ${error.message}`);
    }

    console.log('✅ [PatientsService] Patient soft deleted');
  }

  /**
   * Hard delete a patient (permanent deletion)
   * ⚠️ WARNING: This operation cannot be undone
   * @param id - Patient ID
   */
  static async hardDelete(id: string): Promise<void> {
    console.log('🗑️ [PatientsService] Hard deleting patient:', id);
    
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ [PatientsService] Error hard deleting patient:', error);
      throw new Error(`Failed to delete patient: ${error.message}`);
    }

    console.log('✅ [PatientsService] Patient permanently deleted');
  }

  /**
   * Fetch patients by guardian ID (for minor patients)
   * @param guardianId - Guardian profile ID
   * @returns Array of patients in frontend format
   */
  static async fetchByGuardianId(guardianId: string): Promise<Patient[]> {
    console.log('🔍 [PatientsService] Fetching patients by guardian ID:', guardianId);
    
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('guardian_id', guardianId)
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('❌ [PatientsService] Error fetching patients by guardian:', error);
      throw new Error(`Failed to fetch patients: ${error.message}`);
    }

    console.log(`✅ [PatientsService] Fetched ${data?.length || 0} patients for guardian`);
    return patientsBatchDbToFrontend(data || []);
  }

  /**
   * Search patients by name or phone
   * @param clinicId - Clinic ID for multi-tenancy
   * @param searchTerm - Search term (name or phone)
   * @returns Array of matching patients
   */
  static async search(clinicId: string, searchTerm: string): Promise<Patient[]> {
    console.log('🔍 [PatientsService] Searching patients:', searchTerm);
    
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('clinic_id', clinicId)
      .or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
      .eq('is_active', true)
      .order('full_name', { ascending: true })
      .limit(20);

    if (error) {
      console.error('❌ [PatientsService] Error searching patients:', error);
      throw new Error(`Failed to search patients: ${error.message}`);
    }

    console.log(`✅ [PatientsService] Found ${data?.length || 0} matching patients`);
    return patientsBatchDbToFrontend(data || []);
  }

  /**
   * Check if patient exists by CPF
   * @param clinicId - Clinic ID for multi-tenancy
   * @param cpf - Patient CPF
   * @returns Boolean indicating if patient exists
   */
  static async existsByCpf(clinicId: string, cpf: string): Promise<boolean> {
    console.log('🔍 [PatientsService] Checking if patient exists by CPF');
    
    const { data, error } = await supabase
      .from('patients')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('cpf', cpf)
      .maybeSingle();

    if (error) {
      console.error('❌ [PatientsService] Error checking patient by CPF:', error);
      throw new Error(`Failed to check patient: ${error.message}`);
    }

    return !!data;
  }

  /**
   * Get patient count for a clinic
   * @param clinicId - Clinic ID
   * @returns Number of active patients
   */
  static async getCount(clinicId: string): Promise<number> {
    console.log('🔢 [PatientsService] Getting patient count for clinic:', clinicId);
    
    const { count, error } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('is_active', true);

    if (error) {
      console.error('❌ [PatientsService] Error getting patient count:', error);
      throw new Error(`Failed to get patient count: ${error.message}`);
    }

    console.log(`✅ [PatientsService] Patient count: ${count}`);
    return count || 0;
  }
}
