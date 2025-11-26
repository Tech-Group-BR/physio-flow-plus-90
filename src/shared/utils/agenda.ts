/**
 * Agenda and appointment utility functions
 * Consolidated from utils/agendaUtils.ts
 */

import { isSameDay } from 'date-fns';

/**
 * Map appointment status to color classes
 * @param status - Appointment status
 * @returns CSS classes for color styling
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'confirmado': 
      return 'bg-green-100 text-green-800 border-green-300 rounded-sm';
    case 'marcado': 
      return 'bg-blue-50 text-blue-700 border-blue-200 rounded-sm';
    case 'faltante': 
      return 'bg-red-50 text-red-700 border-red-200 rounded-sm';
    case 'cancelado': 
      return 'bg-red-100 text-red-800 border-red-300 rounded-sm';
    case 'realizado': 
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 rounded-sm';
    default: 
      return 'bg-blue-50 text-blue-700 border-blue-200 rounded-sm';
  }
};

/**
 * Get human-readable status label
 * @param status - Appointment status
 * @returns Localized status label
 */
export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'confirmado': return 'Confirmado';
    case 'marcado': return 'Marcado';
    case 'faltante': return 'Faltante';
    case 'cancelado': return 'Cancelado';
    case 'realizado': return 'Realizado';
    default: return 'Marcado';
  }
};

/**
 * Time slots for appointments (30-minute intervals)
 * From 07:00 to 19:30
 */
export const timeSlots = [
  '07:00', '07:30', '08:00', '08:30', 
  '09:00', '09:30', '10:00', '10:30', 
  '11:00', '11:30', '12:00', '12:30', 
  '13:00', '13:30', '14:00', '14:30', 
  '15:00', '15:30', '16:00', '16:30', 
  '17:00', '17:30', '18:00', '18:30', 
  '19:00', '19:30'
];

/**
 * Duration options for appointments
 */
export const durationOptions = [
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1h 30min' },
  { value: 120, label: '2 horas' }
];

/**
 * Calculate how many time slots an appointment should occupy
 * @param duration - Duration in minutes
 * @returns Number of 30-minute slots
 */
export const calculateSlotsForDuration = (duration: number): number => {
  return Math.ceil(duration / 30); // 30 minutes = 1 slot
};

/**
 * Check if an appointment conflicts with existing appointments
 * @param newStart - New appointment start time
 * @param newEnd - New appointment end time
 * @param existingAppointments - Array of existing appointments
 * @returns True if there's a conflict
 */
export const hasTimeConflict = (
  newStart: Date,
  newEnd: Date,
  existingAppointments: Array<{ startTime: Date; endTime: Date; id: string }>,
  excludeId?: string
): boolean => {
  return existingAppointments.some(appointment => {
    if (excludeId && appointment.id === excludeId) return false;
    
    return (
      (newStart >= appointment.startTime && newStart < appointment.endTime) ||
      (newEnd > appointment.startTime && newEnd <= appointment.endTime) ||
      (newStart <= appointment.startTime && newEnd >= appointment.endTime)
    );
  });
};

/**
 * Generate available time slots for a given date and professional
 * @param date - Target date
 * @param duration - Appointment duration in minutes
 * @param existingAppointments - Existing appointments for the date
 * @param workingHours - Professional's working hours
 * @returns Array of available time slots
 */
export const getAvailableTimeSlots = (
  date: Date,
  duration: number,
  existingAppointments: Array<{ startTime: Date; endTime: Date }> = [],
  workingHours: { start: string; end: string } = { start: '07:00', end: '19:30' }
): string[] => {
  const available: string[] = [];
  const slotsNeeded = calculateSlotsForDuration(duration);
  
  const startHour = parseInt(workingHours.start.split(':')[0]);
  const startMinute = parseInt(workingHours.start.split(':')[1]);
  const endHour = parseInt(workingHours.end.split(':')[0]);
  const endMinute = parseInt(workingHours.end.split(':')[1]);
  
  for (let i = 0; i < timeSlots.length; i++) {
    const slot = timeSlots[i];
    const [hour, minute] = slot.split(':').map(n => parseInt(n));
    
    // Check if slot is within working hours
    if (hour < startHour || (hour === startHour && minute < startMinute) ||
        hour > endHour || (hour === endHour && minute > endMinute)) {
      continue;
    }
    
    // Check if we have enough consecutive slots
    if (i + slotsNeeded > timeSlots.length) continue;
    
    // Create date objects for the slot
    const slotStart = new Date(date);
    slotStart.setHours(hour, minute, 0, 0);
    
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + duration);
    
    // Check for conflicts
    if (!hasTimeConflict(slotStart, slotEnd, existingAppointments)) {
      available.push(slot);
    }
  }
  
  return available;
};

/**
 * Format appointment duration for display
 * @param minutes - Duration in minutes
 * @returns Formatted duration string
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  } else if (minutes === 60) {
    return '1 hora';
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    } else {
      return `${hours}h ${remainingMinutes}min`;
    }
  }
};