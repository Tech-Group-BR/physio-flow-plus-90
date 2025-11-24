/**
 * Leads Service
 * 
 * Serviço isolado para operações de leads (CRM).
 * Responsável apenas por operações de banco de dados.
 */

import { supabase } from '@/integrations/supabase/client';
import {
  type DbLead,
  dbToLead,
  dbToLeadList,
  leadToDb
} from '@/services/mappers/lead.mapper';
import type { Lead } from '@/types';

export class LeadsService {
  /**
   * Fetch all leads for a clinic
   */
  static async fetchAll(clinicId: string): Promise<Lead[]> {
    console.log('🔍 [LeadsService] Fetching all leads for clinic:', clinicId);
    
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [LeadsService] Error fetching leads:', error);
      throw new Error(`Failed to fetch leads: ${error.message}`);
    }

    return dbToLeadList(data as DbLead[]);
  }

  /**
   * Fetch single lead by ID
   */
  static async fetchById(id: string): Promise<Lead> {
    console.log('🔍 [LeadsService] Fetching lead:', id);
    
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ [LeadsService] Error fetching lead:', error);
      throw new Error(`Failed to fetch lead: ${error.message}`);
    }

    return dbToLead(data as DbLead);
  }

  /**
   * Create new lead
   */
  static async create(clinicId: string, lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
    console.log('➕ [LeadsService] Creating lead:', lead.name);
    
    const dbData = leadToDb(lead);
    const insertData: any = {
      ...dbData,
      clinic_id: clinicId
    };

    const { data, error } = await supabase
      .from('leads')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ [LeadsService] Error creating lead:', error);
      throw new Error(`Failed to create lead: ${error.message}`);
    }

    return dbToLead(data as DbLead);
  }

  /**
   * Update lead
   */
  static async update(id: string, updates: Partial<Lead>): Promise<Lead> {
    console.log('📝 [LeadsService] Updating lead:', id);
    
    const dbData = leadToDb(updates);

    const { data, error } = await supabase
      .from('leads')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ [LeadsService] Error updating lead:', error);
      throw new Error(`Failed to update lead: ${error.message}`);
    }

    return dbToLead(data as DbLead);
  }

  /**
   * Delete lead
   */
  static async delete(id: string): Promise<void> {
    console.log('🗑️ [LeadsService] Deleting lead:', id);
    
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ [LeadsService] Error deleting lead:', error);
      throw new Error(`Failed to delete lead: ${error.message}`);
    }
  }

  /**
   * Update lead status (for CRM pipeline)
   */
  static async updateStatus(
    id: string, 
    status: Lead['status']
  ): Promise<Lead> {
    console.log('📊 [LeadsService] Updating lead status:', id, status);
    
    return this.update(id, { status });
  }

  /**
   * Fetch leads by status (for Kanban board)
   */
  static async fetchByStatus(
    clinicId: string, 
    status: Lead['status']
  ): Promise<Lead[]> {
    console.log('🔍 [LeadsService] Fetching leads by status:', status);
    
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [LeadsService] Error fetching leads by status:', error);
      throw new Error(`Failed to fetch leads by status: ${error.message}`);
    }

    return dbToLeadList(data as DbLead[]);
  }

  /**
   * Search leads by name, email or phone
   */
  static async search(clinicId: string, query: string): Promise<Lead[]> {
    console.log('🔎 [LeadsService] Searching leads:', query);
    
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('clinic_id', clinicId)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [LeadsService] Error searching leads:', error);
      throw new Error(`Failed to search leads: ${error.message}`);
    }

    return dbToLeadList(data as DbLead[]);
  }

  /**
   * Get leads count by status (for dashboard)
   */
  static async getCountByStatus(clinicId: string): Promise<Record<Lead['status'], number>> {
    console.log('📊 [LeadsService] Getting leads count by status for clinic:', clinicId);
    
    const { data, error } = await supabase
      .from('leads')
      .select('status')
      .eq('clinic_id', clinicId);

    if (error) {
      console.error('❌ [LeadsService] Error getting count by status:', error);
      throw new Error(`Failed to get count by status: ${error.message}`);
    }

    const counts: Record<Lead['status'], number> = {
      novo: 0,
      contatado: 0,
      interessado: 0,
      agendado: 0,
      cliente: 0,
      perdido: 0
    };

    data.forEach((lead: { status: Lead['status'] }) => {
      counts[lead.status]++;
    });

    return counts;
  }
}
