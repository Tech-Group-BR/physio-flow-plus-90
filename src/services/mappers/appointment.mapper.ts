/**
 * Appointment Mapper
 * 
 * Responsável por transformar dados entre o formato do banco de dados (snake_case)
 * e o formato do frontend (camelCase) para agendamentos.
 */

import type { Appointment } from '@/types';

// ============================================================
// DATABASE TYPES (snake_case)
// ============================================================

export interface DbAppointment {
  id: string;
  created_at: string;
  updated_at: string;
  patient_id: string;
  professional_id: string;
  room_id?: string;
  date: string;
  time: string;
  duration?: number;
  treatment_type?: string;
  status: 'marcado' | 'confirmado' | 'cancelado' | 'realizado' | 'faltante';
  notes?: string;
  price?: number;
  whatsapp_confirmed?: boolean;
  whatsapp_sent_at?: string;
  clinic_id?: string;
}

// ============================================================
// MAIN MAPPERS
// ============================================================

/**
 * Convert database appointment (snake_case) to frontend appointment (camelCase)
 */
export const appointmentDbToFrontend = (dbAppointment: DbAppointment): Appointment => {
  return {
    id: dbAppointment.id,
    patientId: dbAppointment.patient_id,
    professionalId: dbAppointment.professional_id,
    roomId: dbAppointment.room_id || '',
    date: dbAppointment.date,
    time: dbAppointment.time,
    duration: dbAppointment.duration || 60,
    treatmentType: dbAppointment.treatment_type || '',
    status: dbAppointment.status,
    notes: dbAppointment.notes,
    price: dbAppointment.price || 0,
    whatsappConfirmed: dbAppointment.whatsapp_confirmed,
    whatsappSentAt: dbAppointment.whatsapp_sent_at,
    createdAt: dbAppointment.created_at,
    updatedAt: dbAppointment.updated_at
  };
};

/**
 * Convert frontend appointment (camelCase) to database format (snake_case)
 */
export const appointmentFrontendToDb = (appointment: Partial<Appointment>): Partial<DbAppointment> => {
  const dbAppointment: Partial<DbAppointment> = {};

  if (appointment.patientId !== undefined) {
    dbAppointment.patient_id = appointment.patientId;
  }
  
  if (appointment.professionalId !== undefined) {
    dbAppointment.professional_id = appointment.professionalId;
  }
  
  if (appointment.roomId !== undefined) {
    dbAppointment.room_id = appointment.roomId;
  }
  
  if (appointment.date !== undefined) {
    dbAppointment.date = appointment.date;
  }
  
  if (appointment.time !== undefined) {
    dbAppointment.time = appointment.time;
  }
  
  if (appointment.duration !== undefined) {
    dbAppointment.duration = appointment.duration;
  }
  
  if (appointment.treatmentType !== undefined) {
    dbAppointment.treatment_type = appointment.treatmentType;
  }
  
  if (appointment.status !== undefined) {
    dbAppointment.status = appointment.status;
  }
  
  if (appointment.notes !== undefined) {
    dbAppointment.notes = appointment.notes;
  }
  
  if (appointment.price !== undefined) {
    dbAppointment.price = appointment.price;
  }
  
  if (appointment.whatsappConfirmed !== undefined) {
    dbAppointment.whatsapp_confirmed = appointment.whatsappConfirmed;
  }
  
  if (appointment.whatsappSentAt !== undefined) {
    dbAppointment.whatsapp_sent_at = appointment.whatsappSentAt;
  }

  return dbAppointment;
};

/**
 * Batch convert multiple appointments from DB to Frontend
 */
export const appointmentsBatchDbToFrontend = (dbAppointments: DbAppointment[]): Appointment[] => {
  return dbAppointments.map(appointmentDbToFrontend);
};
