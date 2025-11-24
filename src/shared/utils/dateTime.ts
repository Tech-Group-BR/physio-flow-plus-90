/**
 * Date and time utility functions
 * Consolidated date operations for consistency across the application
 */

import { 
  format, 
  parseISO, 
  isSameDay, 
  isAfter, 
  isBefore, 
  addDays, 
  subDays, 
  startOfDay, 
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Format date for Brazilian locale
 */
export function formatBRDate(date: string | Date, pattern: string = 'dd/MM/yyyy'): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, pattern, { locale: ptBR });
  } catch {
    return '';
  }
}

/**
 * Format time for display
 */
export function formatTime(date: string | Date): string {
  return formatBRDate(date, 'HH:mm');
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: string | Date): string {
  return formatBRDate(date, 'dd/MM/yyyy HH:mm');
}

/**
 * Check if date is today
 */
export function isToday(date: string | Date): boolean {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isSameDay(dateObj, new Date());
  } catch {
    return false;
  }
}

/**
 * Check if date is in the past
 */
export function isPastDate(date: string | Date): boolean {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isBefore(dateObj, startOfDay(new Date()));
  } catch {
    return false;
  }
}

/**
 * Check if date is in the future
 */
export function isFutureDate(date: string | Date): boolean {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isAfter(dateObj, endOfDay(new Date()));
  } catch {
    return false;
  }
}

/**
 * Get date range for current month
 */
export function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfMonth(now),
    end: endOfMonth(now)
  };
}

/**
 * Get date range for current week
 */
export function getCurrentWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfWeek(now, { locale: ptBR }),
    end: endOfWeek(now, { locale: ptBR })
  };
}

/**
 * Calculate age from birth date
 */
export function calculateAge(birthDate: string | Date): number {
  if (!birthDate) return 0;
  
  try {
    const birth = typeof birthDate === 'string' ? parseISO(birthDate) : birthDate;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return Math.max(0, age);
  } catch {
    return 0;
  }
}

/**
 * Get relative time description (hoje, ontem, amanhã, etc.)
 */
export function getRelativeTime(date: string | Date): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const today = new Date();
    
    if (isSameDay(dateObj, today)) {
      return 'Hoje';
    } else if (isSameDay(dateObj, subDays(today, 1))) {
      return 'Ontem';
    } else if (isSameDay(dateObj, addDays(today, 1))) {
      return 'Amanhã';
    } else {
      return formatBRDate(dateObj);
    }
  } catch {
    return '';
  }
}

/**
 * Convert time string to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  if (!time) return 0;
  
  const [hours, minutes] = time.split(':').map(num => parseInt(num, 10));
  return (hours * 60) + (minutes || 0);
}

/**
 * Convert minutes since midnight to time string
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}