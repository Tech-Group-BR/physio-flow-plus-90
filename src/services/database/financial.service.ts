/**
 * Financial Service
 * 
 * Serviço isolado para operações de contas a pagar e contas a receber.
 * Responsável apenas por operações de banco de dados.
 */

import { supabase } from '@/integrations/supabase/client';
import {
  type DbAccountsPayable,
  type DbAccountsReceivable,
  dbToAccountsPayable,
  dbToAccountsPayableList,
  dbToAccountsReceivable,
  dbToAccountsReceivableList,
  accountsPayableToDb,
  accountsReceivableToDb
} from '@/services/mappers/financial.mapper';
import type { AccountsPayable, AccountsReceivable } from '@/types';

// ============================================
// Accounts Payable Operations
// ============================================

export class AccountsPayableService {
  /**
   * Fetch all accounts payable for a clinic
   */
  static async fetchAll(clinicId: string): Promise<AccountsPayable[]> {
    console.log('🔍 [AccountsPayableService] Fetching all accounts payable for clinic:', clinicId);
    
    const { data, error } = await supabase
      .from('accounts_payable')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('due_date', { ascending: false });

    if (error) {
      console.error('❌ [AccountsPayableService] Error fetching accounts payable:', error);
      throw new Error(`Failed to fetch accounts payable: ${error.message}`);
    }

    return dbToAccountsPayableList(data as DbAccountsPayable[]);
  }

  /**
   * Fetch single account payable by ID
   */
  static async fetchById(id: string): Promise<AccountsPayable> {
    console.log('🔍 [AccountsPayableService] Fetching account payable:', id);
    
    const { data, error } = await supabase
      .from('accounts_payable')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ [AccountsPayableService] Error fetching account payable:', error);
      throw new Error(`Failed to fetch account payable: ${error.message}`);
    }

    return dbToAccountsPayable(data as DbAccountsPayable);
  }

  /**
   * Create new account payable
   */
  static async create(clinicId: string, payable: Omit<AccountsPayable, 'id' | 'createdAt'>): Promise<AccountsPayable> {
    console.log('➕ [AccountsPayableService] Creating account payable');
    
    const dbData = accountsPayableToDb(payable);
    const insertData: any = {
      ...dbData,
      clinic_id: clinicId
    };

    const { data, error } = await supabase
      .from('accounts_payable')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ [AccountsPayableService] Error creating account payable:', error);
      throw new Error(`Failed to create account payable: ${error.message}`);
    }

    return dbToAccountsPayable(data as DbAccountsPayable);
  }

  /**
   * Update account payable
   */
  static async update(id: string, updates: Partial<AccountsPayable>): Promise<AccountsPayable> {
    console.log('📝 [AccountsPayableService] Updating account payable:', id);
    
    const dbData = accountsPayableToDb(updates);

    const { data, error } = await supabase
      .from('accounts_payable')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ [AccountsPayableService] Error updating account payable:', error);
      throw new Error(`Failed to update account payable: ${error.message}`);
    }

    return dbToAccountsPayable(data as DbAccountsPayable);
  }

  /**
   * Delete account payable
   */
  static async delete(id: string): Promise<void> {
    console.log('🗑️ [AccountsPayableService] Deleting account payable:', id);
    
    const { error } = await supabase
      .from('accounts_payable')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ [AccountsPayableService] Error deleting account payable:', error);
      throw new Error(`Failed to delete account payable: ${error.message}`);
    }
  }

  /**
   * Mark account payable as paid
   */
  static async markAsPaid(id: string, paidDate: string): Promise<AccountsPayable> {
    console.log('💰 [AccountsPayableService] Marking as paid:', id);
    
    return this.update(id, {
      status: 'pago',
      paidDate
    });
  }

  /**
   * Bulk delete accounts payable
   */
  static async bulkDelete(ids: string[]): Promise<void> {
    console.log('🗑️ [AccountsPayableService] Bulk deleting accounts payable:', ids.length);
    
    const { error } = await supabase
      .from('accounts_payable')
      .delete()
      .in('id', ids);

    if (error) {
      console.error('❌ [AccountsPayableService] Error bulk deleting accounts payable:', error);
      throw new Error(`Failed to bulk delete accounts payable: ${error.message}`);
    }
  }
}

// ============================================
// Accounts Receivable Operations
// ============================================

export class AccountsReceivableService {
  /**
   * Fetch all accounts receivable for a clinic
   */
  static async fetchAll(clinicId: string): Promise<AccountsReceivable[]> {
    console.log('🔍 [AccountsReceivableService] Fetching all accounts receivable for clinic:', clinicId);
    
    const { data, error } = await supabase
      .from('accounts_receivable')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('due_date', { ascending: false });

    if (error) {
      console.error('❌ [AccountsReceivableService] Error fetching accounts receivable:', error);
      throw new Error(`Failed to fetch accounts receivable: ${error.message}`);
    }

    return dbToAccountsReceivableList(data as DbAccountsReceivable[]);
  }

  /**
   * Fetch single account receivable by ID
   */
  static async fetchById(id: string): Promise<AccountsReceivable> {
    console.log('🔍 [AccountsReceivableService] Fetching account receivable:', id);
    
    const { data, error } = await supabase
      .from('accounts_receivable')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ [AccountsReceivableService] Error fetching account receivable:', error);
      throw new Error(`Failed to fetch account receivable: ${error.message}`);
    }

    return dbToAccountsReceivable(data as DbAccountsReceivable);
  }

  /**
   * Create new account receivable
   */
  static async create(clinicId: string, receivable: Omit<AccountsReceivable, 'id' | 'createdAt'>): Promise<AccountsReceivable> {
    console.log('➕ [AccountsReceivableService] Creating account receivable');
    
    const dbData = accountsReceivableToDb(receivable);
    const insertData: any = {
      ...dbData,
      clinic_id: clinicId
    };

    const { data, error } = await supabase
      .from('accounts_receivable')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ [AccountsReceivableService] Error creating account receivable:', error);
      throw new Error(`Failed to create account receivable: ${error.message}`);
    }

    return dbToAccountsReceivable(data as DbAccountsReceivable);
  }

  /**
   * Update account receivable
   */
  static async update(id: string, updates: Partial<AccountsReceivable>): Promise<AccountsReceivable> {
    console.log('📝 [AccountsReceivableService] Updating account receivable:', id);
    
    const dbData = accountsReceivableToDb(updates);

    const { data, error } = await supabase
      .from('accounts_receivable')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ [AccountsReceivableService] Error updating account receivable:', error);
      throw new Error(`Failed to update account receivable: ${error.message}`);
    }

    return dbToAccountsReceivable(data as DbAccountsReceivable);
  }

  /**
   * Delete account receivable
   */
  static async delete(id: string): Promise<void> {
    console.log('🗑️ [AccountsReceivableService] Deleting account receivable:', id);
    
    const { error } = await supabase
      .from('accounts_receivable')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ [AccountsReceivableService] Error deleting account receivable:', error);
      throw new Error(`Failed to delete account receivable: ${error.message}`);
    }
  }

  /**
   * Mark account receivable as received
   */
  static async markAsReceived(id: string, receivedDate: string): Promise<AccountsReceivable> {
    console.log('💰 [AccountsReceivableService] Marking as received:', id);
    
    return this.update(id, {
      status: 'pago',
      receivedDate
    });
  }

  /**
   * Bulk delete accounts receivable
   */
  static async bulkDelete(ids: string[]): Promise<void> {
    console.log('🗑️ [AccountsReceivableService] Bulk deleting accounts receivable:', ids.length);
    
    const { error } = await supabase
      .from('accounts_receivable')
      .delete()
      .in('id', ids);

    if (error) {
      console.error('❌ [AccountsReceivableService] Error bulk deleting accounts receivable:', error);
      throw new Error(`Failed to bulk delete accounts receivable: ${error.message}`);
    }
  }

  /**
   * Fetch accounts receivable by patient
   */
  static async fetchByPatient(patientId: string): Promise<AccountsReceivable[]> {
    console.log('🔍 [AccountsReceivableService] Fetching by patient:', patientId);
    
    const { data, error } = await supabase
      .from('accounts_receivable')
      .select('*')
      .eq('patient_id', patientId)
      .order('due_date', { ascending: false });

    if (error) {
      console.error('❌ [AccountsReceivableService] Error fetching by patient:', error);
      throw new Error(`Failed to fetch by patient: ${error.message}`);
    }

    return dbToAccountsReceivableList(data as DbAccountsReceivable[]);
  }
}
