/**
 * Appointments Service
 * 
 * Camada de serviço para operações de banco de dados relacionadas a agendamentos.
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  appointmentDbToFrontend, 
  appointmentFrontendToDb, 
  appointmentsBatchDbToFrontend,
  type DbAppointment 
} from '@/services/mappers/appointment.mapper';
import type { Appointment } from '@/types';

export class AppointmentsService {
  /**
   * Fetch all appointments for a clinic
   */
  static async fetchAll(clinicId: string): Promise<Appointment[]> {
    console.log('🔍 [AppointmentsService] Fetching all appointments for clinic:', clinicId);
    
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .order('date', { ascending: false })
      .order('time', { ascending: true });

    if (error) {
      console.error('❌ [AppointmentsService] Error fetching appointments:', error);
      throw new Error(`Failed to fetch appointments: ${error.message}`);
    }

    console.log(`✅ [AppointmentsService] Fetched ${data?.length || 0} appointments`);
    return appointmentsBatchDbToFrontend(data || []);
  }

  /**
   * Fetch appointments by date range
   */
  static async fetchByDateRange(clinicId: string, startDate: string, endDate: string): Promise<Appointment[]> {
    console.log('🔍 [AppointmentsService] Fetching appointments from', startDate, 'to', endDate);
    
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      console.error('❌ [AppointmentsService] Error fetching appointments by date range:', error);
      throw new Error(`Failed to fetch appointments: ${error.message}`);
    }

    console.log(`✅ [AppointmentsService] Fetched ${data?.length || 0} appointments in range`);
    return appointmentsBatchDbToFrontend(data || []);
  }

  /**
   * Fetch a single appointment by ID
   */
  static async fetchById(id: string): Promise<Appointment> {
    console.log('🔍 [AppointmentsService] Fetching appointment by ID:', id);
    
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ [AppointmentsService] Error fetching appointment:', error);
      throw new Error(`Failed to fetch appointment: ${error.message}`);
    }

    if (!data) {
      throw new Error('Appointment not found');
    }

    console.log('✅ [AppointmentsService] Appointment fetched');
    return appointmentDbToFrontend(data);
  }

  /**
   * Create a new appointment
   */
  static async create(
    clinicId: string, 
    appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Appointment> {
    console.log('➕ [AppointmentsService] Creating appointment for patient:', appointment.patientId);
    
    const dbAppointment = appointmentFrontendToDb(appointment);
    
    const insertData: any = {
      ...dbAppointment,
      clinic_id: clinicId
    };

    const { data, error } = await supabase
      .from('appointments')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ [AppointmentsService] Error creating appointment:', error);
      throw new Error(`Failed to create appointment: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to create appointment: No data returned');
    }

    console.log('✅ [AppointmentsService] Appointment created with ID:', data.id);
    return appointmentDbToFrontend(data);
  }

  /**
   * Update an existing appointment
   */
  static async update(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    console.log('📝 [AppointmentsService] Updating appointment:', id);
    
    const dbUpdates = appointmentFrontendToDb(updates);
    
    const updateData = {
      ...dbUpdates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ [AppointmentsService] Error updating appointment:', error);
      throw new Error(`Failed to update appointment: ${error.message}`);
    }

    if (!data) {
      throw new Error('Appointment not found or update failed');
    }

    console.log('✅ [AppointmentsService] Appointment updated');
    return appointmentDbToFrontend(data);
  }

  /**
   * Delete an appointment
   */
  static async delete(id: string): Promise<void> {
    console.log('🗑️ [AppointmentsService] Soft deleting appointment:', id);
    
    // Soft delete: marcar como cancelado e definir deleted_at
    const { error } = await supabase
      .from('appointments')
      .update({
        status: 'cancelado',
        deleted_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('❌ [AppointmentsService] Error soft deleting appointment:', error);
      throw new Error(`Failed to delete appointment: ${error.message}`);
    }

    console.log('✅ [AppointmentsService] Appointment soft deleted (status: cancelado, deleted_at set)');
  }

  /**
   * Fetch appointments by patient
   */
  static async fetchByPatient(patientId: string): Promise<Appointment[]> {
    console.log('🔍 [AppointmentsService] Fetching appointments for patient:', patientId);
    
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)
      .is('deleted_at', null)
      .order('date', { ascending: false });

    if (error) {
      console.error('❌ [AppointmentsService] Error fetching patient appointments:', error);
      throw new Error(`Failed to fetch appointments: ${error.message}`);
    }

    console.log(`✅ [AppointmentsService] Fetched ${data?.length || 0} appointments for patient`);
    return appointmentsBatchDbToFrontend(data || []);
  }

  /**
   * Fetch appointments by professional
   */
  static async fetchByProfessional(professionalId: string): Promise<Appointment[]> {
    console.log('🔍 [AppointmentsService] Fetching appointments for professional:', professionalId);
    
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('professional_id', professionalId)
      .is('deleted_at', null)
      .order('date', { ascending: false });

    if (error) {
      console.error('❌ [AppointmentsService] Error fetching professional appointments:', error);
      throw new Error(`Failed to fetch appointments: ${error.message}`);
    }

    console.log(`✅ [AppointmentsService] Fetched ${data?.length || 0} appointments for professional`);
    return appointmentsBatchDbToFrontend(data || []);
  }

  /**
   * Update WhatsApp confirmation status
   */
  static async updateWhatsAppStatus(id: string, confirmed: boolean): Promise<void> {
    console.log('📱 [AppointmentsService] Updating WhatsApp status for appointment:', id);
    
    const { error } = await supabase
      .from('appointments')
      .update({
        whatsapp_confirmed: confirmed,
        whatsapp_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('❌ [AppointmentsService] Error updating WhatsApp status:', error);
      throw new Error(`Failed to update WhatsApp status: ${error.message}`);
    }

    console.log('✅ [AppointmentsService] WhatsApp status updated');
  }
}
