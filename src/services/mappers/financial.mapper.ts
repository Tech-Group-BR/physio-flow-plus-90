/**
 * Financial Mapper
 * 
 * Mappers para transformação entre tipos do banco (snake_case) e tipos do frontend (camelCase)
 * para contas a pagar e contas a receber.
 */

import type { AccountsPayable, AccountsReceivable } from '@/types';
import type { Database } from '@/integrations/supabase/types';

// ============================================
// Accounts Payable Types
// ============================================

export interface DbAccountsPayable {
  id: string;
  clinic_id: string;
  description: string;
  amount: number;
  due_date: string;
  paid_date?: string | null;
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  category: string;
  notes?: string | null;
  patient_id?: string | null;
  professional_id?: string | null;
  payment_method?: Database['public']['Enums']['payment_method_enum'] | null;
  receipt_url?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export function dbToAccountsPayable(db: DbAccountsPayable): AccountsPayable {
  return {
    id: db.id,
    description: db.description,
    amount: db.amount,
    dueDate: db.due_date,
    paidDate: db.paid_date || undefined,
    status: db.status,
    category: db.category,
    notes: db.notes || undefined,
    patient_id: db.patient_id || undefined,
    professional_id: db.professional_id || undefined,
    payment_method: db.payment_method || undefined,
    receipt_url: db.receipt_url || undefined,
    createdAt: db.created_at,
    updatedAt: db.updated_at || undefined
  };
}

export function accountsPayableToDb(ap: Partial<AccountsPayable>): Partial<DbAccountsPayable> {
  const db: Partial<DbAccountsPayable> = {};
  
  if (ap.description !== undefined) db.description = ap.description;
  if (ap.amount !== undefined) db.amount = ap.amount;
  if (ap.dueDate !== undefined) db.due_date = ap.dueDate;
  if (ap.paidDate !== undefined) db.paid_date = ap.paidDate;
  if (ap.status !== undefined) db.status = ap.status;
  if (ap.category !== undefined) db.category = ap.category;
  if (ap.notes !== undefined) db.notes = ap.notes;
  if (ap.patient_id !== undefined) db.patient_id = ap.patient_id;
  if (ap.professional_id !== undefined) db.professional_id = ap.professional_id;
  if (ap.payment_method !== undefined) db.payment_method = ap.payment_method;
  if (ap.receipt_url !== undefined) db.receipt_url = ap.receipt_url;
  
  return db;
}

export function dbToAccountsPayableList(dbList: DbAccountsPayable[]): AccountsPayable[] {
  return dbList.map(dbToAccountsPayable);
}

// ============================================
// Accounts Receivable Types
// ============================================

export interface DbAccountsReceivable {
  id: string;
  clinic_id: string;
  patient_id?: string | null;
  professional_id?: string | null;
  description: string;
  amount: number;
  due_date: string;
  received_date?: string | null;
  status: Database['public']['Enums']['account_status'] | null;
  method?: Database['public']['Enums']['payment_method_enum'] | null;
  notes?: string | null;
  appointment_id?: string | null;
  service_id?: string | null;
  discount_amount?: number | null;
  patient_package_id?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export function dbToAccountsReceivable(db: DbAccountsReceivable): AccountsReceivable {
  return {
    id: db.id,
    patientId: db.patient_id || undefined,
    professional_id: db.professional_id || undefined,
    description: db.description,
    amount: db.amount,
    dueDate: db.due_date,
    receivedDate: db.received_date || undefined,
    status: db.status,
    method: db.method || undefined,
    notes: db.notes || undefined,
    appointment_id: db.appointment_id || undefined,
    service_id: db.service_id || undefined,
    discount_amount: db.discount_amount || undefined,
    patient_package_id: db.patient_package_id || undefined,
    createdAt: db.created_at,
    updatedAt: db.updated_at || undefined
  };
}

export function accountsReceivableToDb(ar: Partial<AccountsReceivable>): Partial<DbAccountsReceivable> {
  const db: Partial<DbAccountsReceivable> = {};
  
  if (ar.patientId !== undefined) db.patient_id = ar.patientId;
  if (ar.professional_id !== undefined) db.professional_id = ar.professional_id;
  if (ar.description !== undefined) db.description = ar.description;
  if (ar.amount !== undefined) db.amount = ar.amount;
  if (ar.dueDate !== undefined) db.due_date = ar.dueDate;
  if (ar.receivedDate !== undefined) db.received_date = ar.receivedDate;
  if (ar.status !== undefined) db.status = ar.status;
  if (ar.method !== undefined) db.method = ar.method;
  if (ar.notes !== undefined) db.notes = ar.notes;
  if (ar.appointment_id !== undefined) db.appointment_id = ar.appointment_id;
  if (ar.service_id !== undefined) db.service_id = ar.service_id;
  if (ar.discount_amount !== undefined) db.discount_amount = ar.discount_amount;
  if (ar.patient_package_id !== undefined) db.patient_package_id = ar.patient_package_id;
  
  return db;
}

export function dbToAccountsReceivableList(dbList: DbAccountsReceivable[]): AccountsReceivable[] {
  return dbList.map(dbToAccountsReceivable);
}
