/**
 * Professional Mapper
 * 
 * Responsável por transformar dados entre o formato do banco de dados (snake_case)
 * e o formato do frontend (camelCase) para profissionais/fisioterapeutas.
 */

import type { Professional } from '@/types';

// ============================================================
// DATABASE TYPES (snake_case)
// ============================================================

export interface DbProfessional {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  phone?: string;
  email?: string;
  crefito?: string;
  specialties?: string[];
  is_active: boolean;
  role?: string;
  bio?: string;
  profile_picture_url?: string;
  profile_id?: string;
  clinic_id?: string;
}

// ============================================================
// MAIN MAPPERS
// ============================================================

/**
 * Convert database professional (snake_case) to frontend professional (camelCase)
 */
export const professionalDbToFrontend = (dbProfessional: DbProfessional): Professional => {
  return {
    id: dbProfessional.id,
    name: dbProfessional.full_name,
    email: dbProfessional.email || '',
    phone: dbProfessional.phone || '',
    crefito: dbProfessional.crefito || '',
    specialties: dbProfessional.specialties || [],
    bio: dbProfessional.bio || '',
    isActive: dbProfessional.is_active,
    createdAt: dbProfessional.created_at,
    updatedAt: dbProfessional.updated_at
  };
};

/**
 * Convert frontend professional (camelCase) to database format (snake_case)
 */
export const professionalFrontendToDb = (professional: Partial<Professional>): Partial<DbProfessional> => {
  const dbProfessional: Partial<DbProfessional> = {};

  if (professional.name !== undefined) {
    dbProfessional.full_name = professional.name;
  }
  
  if (professional.email !== undefined) {
    dbProfessional.email = professional.email;
  }
  
  if (professional.phone !== undefined) {
    dbProfessional.phone = professional.phone;
  }
  
  if (professional.crefito !== undefined) {
    dbProfessional.crefito = professional.crefito;
  }
  
  if (professional.specialties !== undefined) {
    dbProfessional.specialties = professional.specialties;
  }
  
  if (professional.bio !== undefined) {
    dbProfessional.bio = professional.bio;
  }
  
  if (professional.isActive !== undefined) {
    dbProfessional.is_active = professional.isActive;
  }

  return dbProfessional;
};

/**
 * Batch convert multiple professionals from DB to Frontend
 */
export const professionalsBatchDbToFrontend = (dbProfessionals: DbProfessional[]): Professional[] => {
  return dbProfessionals.map(professionalDbToFrontend);
};
