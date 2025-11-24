/**
 * Patient Mapper
 * 
 * Responsável por transformar dados entre o formato do banco de dados (snake_case)
 * e o formato do frontend (camelCase).
 * 
 * IMPORTANTE:
 * - Database usa snake_case (PostgreSQL convention)
 * - Frontend usa camelCase (JavaScript convention)
 */

import type { Patient, Address, EmergencyContact } from '@/types';

// ============================================================
// DATABASE TYPES (snake_case - match Supabase schema exactly)
// ============================================================

export interface DbPatient {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  phone: string;
  email?: string;
  cpf?: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  address?: any; // JSONB or string
  emergency_contact?: any; // JSONB or string
  emergency_phone?: string;
  medical_history?: string;
  treatment_type?: string;
  insurance?: string;
  notes?: string;
  is_active: boolean;
  is_minor?: boolean;
  guardian_id?: string;
  session_value?: number;
  clinic_id?: string;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Safely parse JSONB field from database
 * Handles both string (JSON) and object formats
 */
const parseJsonField = <T>(field: any, defaultValue: T): T => {
  if (!field) return defaultValue;
  
  // Se já é objeto, retornar
  if (typeof field === 'object') return field as T;
  
  // Se é string, tentar fazer parse
  if (typeof field === 'string') {
    try {
      const trimmed = field.trim();
      if (!trimmed) return defaultValue;
      return JSON.parse(trimmed) as T;
    } catch (error) {
      console.warn('Failed to parse JSONB field:', error);
      return defaultValue;
    }
  }
  
  return defaultValue;
};

/**
 * Stringify JSONB field for database
 */
const stringifyJsonField = (field: any): string | null => {
  if (!field) return null;
  if (typeof field === 'string') return field;
  return JSON.stringify(field);
};

// ============================================================
// MAIN MAPPERS
// ============================================================

/**
 * Convert database patient (snake_case) to frontend patient (camelCase)
 */
export const patientDbToFrontend = (dbPatient: DbPatient): Patient => {
  const defaultAddress: Address = {
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: ''
  };

  const defaultEmergencyContact: EmergencyContact = {
    name: '',
    relationship: '',
    phone: ''
  };

  return {
    id: dbPatient.id,
    fullName: dbPatient.full_name,
    phone: dbPatient.phone,
    email: dbPatient.email || '',
    cpf: dbPatient.cpf || '',
    birth_date: dbPatient.birth_date,
    gender: dbPatient.gender,
    address: parseJsonField(dbPatient.address, defaultAddress),
    emergencyContact: parseJsonField(dbPatient.emergency_contact, defaultEmergencyContact),
    emergencyPhone: dbPatient.emergency_phone || '',
    medicalHistory: dbPatient.medical_history || '',
    insurance: dbPatient.insurance || '',
    treatmentType: dbPatient.treatment_type || '',
    notes: dbPatient.notes || '',
    isActive: dbPatient.is_active,
    isMinor: dbPatient.is_minor || false,
    guardianId: dbPatient.guardian_id,
    createdAt: dbPatient.created_at,
    updatedAt: dbPatient.updated_at,
    appointments: [], // Populated separately if needed
    payments: [] // Populated separately if needed
  };
};

/**
 * Convert frontend patient (camelCase) to database format (snake_case)
 * Used for INSERT and UPDATE operations
 */
export const patientFrontendToDb = (patient: Partial<Patient>): Partial<DbPatient> => {
  const dbPatient: Partial<DbPatient> = {};

  // Map only provided fields
  if (patient.fullName !== undefined) {
    dbPatient.full_name = patient.fullName;
  }
  
  if (patient.phone !== undefined) {
    dbPatient.phone = patient.phone;
  }
  
  if (patient.email !== undefined) {
    dbPatient.email = patient.email;
  }
  
  if (patient.cpf !== undefined) {
    dbPatient.cpf = patient.cpf;
  }
  
  if (patient.birth_date !== undefined) {
    dbPatient.birth_date = patient.birth_date;
  }
  
  if (patient.gender !== undefined) {
    dbPatient.gender = patient.gender;
  }
  
  // JSONB fields - stringify if object
  if (patient.address !== undefined) {
    dbPatient.address = stringifyJsonField(patient.address);
  }
  
  if (patient.emergencyContact !== undefined) {
    dbPatient.emergency_contact = stringifyJsonField(patient.emergencyContact);
  }
  
  if (patient.emergencyPhone !== undefined) {
    dbPatient.emergency_phone = patient.emergencyPhone;
  }
  
  if (patient.medicalHistory !== undefined) {
    dbPatient.medical_history = patient.medicalHistory;
  }
  
  if (patient.treatmentType !== undefined) {
    dbPatient.treatment_type = patient.treatmentType;
  }
  
  if (patient.insurance !== undefined) {
    dbPatient.insurance = patient.insurance;
  }
  
  if (patient.notes !== undefined) {
    dbPatient.notes = patient.notes;
  }
  
  if (patient.isActive !== undefined) {
    dbPatient.is_active = patient.isActive;
  }
  
  if (patient.isMinor !== undefined) {
    dbPatient.is_minor = patient.isMinor;
  }
  
  if (patient.guardianId !== undefined) {
    dbPatient.guardian_id = patient.guardianId;
  }

  return dbPatient;
};

/**
 * Batch convert multiple patients from DB to Frontend
 */
export const patientsBatchDbToFrontend = (dbPatients: DbPatient[]): Patient[] => {
  return dbPatients.map(patientDbToFrontend);
};
