/**
 * Leads Mapper
 * 
 * Mappers para transformação entre tipos do banco (snake_case) e tipos do frontend (camelCase)
 * para leads do CRM.
 */

import type { Lead } from '@/types';

export interface DbLead {
  id: string;
  clinic_id: string;
  name: string;
  email: string;
  phone: string;
  source: 'google_ads' | 'facebook_ads' | 'instagram_ads' | 'indicacao' | 'site' | 'outros';
  status: 'novo' | 'contatado' | 'interessado' | 'agendado' | 'cliente' | 'perdido';
  treatment_interest?: string | null;
  notes?: string | null;
  last_contact?: string | null;
  next_follow_up?: string | null;
  created_at: string;
  updated_at: string;
}

export function dbToLead(db: DbLead): Lead {
  return {
    id: db.id,
    name: db.name,
    email: db.email,
    phone: db.phone,
    source: db.source,
    status: db.status,
    treatmentInterest: db.treatment_interest || undefined,
    notes: db.notes || undefined,
    lastContact: db.last_contact || undefined,
    nextFollowUp: db.next_follow_up || undefined,
    createdAt: db.created_at,
    updatedAt: db.updated_at
  };
}

export function leadToDb(lead: Partial<Lead>): Partial<DbLead> {
  const db: Partial<DbLead> = {};
  
  if (lead.name !== undefined) db.name = lead.name;
  if (lead.email !== undefined) db.email = lead.email;
  if (lead.phone !== undefined) db.phone = lead.phone;
  if (lead.source !== undefined) db.source = lead.source;
  if (lead.status !== undefined) db.status = lead.status;
  if (lead.treatmentInterest !== undefined) db.treatment_interest = lead.treatmentInterest;
  if (lead.notes !== undefined) db.notes = lead.notes;
  if (lead.lastContact !== undefined) db.last_contact = lead.lastContact;
  if (lead.nextFollowUp !== undefined) db.next_follow_up = lead.nextFollowUp;
  
  return db;
}

export function dbToLeadList(dbList: DbLead[]): Lead[] {
  return dbList.map(dbToLead);
}
