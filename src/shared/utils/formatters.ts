/**
 * Data formatting and normalization utilities
 * Consolidated from utils/formatters.ts
 */

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Normalize phone number to standard format: numbers only with area code
 * Removes all non-numeric characters and ensures area code
 * 
 * @param phone - Phone number in any format
 * @returns Normalized phone (numbers only with area code)
 * 
 * @example
 * normalizePhone("(66) 99951-6222") // "66999516222"
 * normalizePhone("66 9 9951-6222")  // "66999516222"
 * normalizePhone("999516222")       // "66999516222" (adds default area code 66)
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If no area code (less than 10 digits for landline, 11 for mobile)
  if (cleaned.length === 8 || cleaned.length === 9) {
    // Add default area code 66 (Mato Grosso)
    return '66' + cleaned;
  }
  
  // If has country code 55, remove it
  if (cleaned.startsWith('55') && cleaned.length > 11) {
    return cleaned.substring(2);
  }
  
  return cleaned;
}

/**
 * Normalize CPF to standard format: numbers only
 * Removes all non-numeric characters
 * 
 * @param cpf - CPF in any format
 * @returns Normalized CPF (numbers only)
 * 
 * @example
 * normalizeCPF("123.456.789-00") // "12345678900"
 * normalizeCPF("123 456 789 00") // "12345678900"
 */
export function normalizeCPF(cpf: string): string {
  if (!cpf) return '';
  return cpf.replace(/\D/g, '');
}

/**
 * Format phone number for display
 * @param phone - Phone number (normalized)
 * @returns Formatted phone number
 */
export function formatPhone(phone: string): string {
  if (!phone) return '';
  const cleaned = normalizePhone(phone);
  
  if (cleaned.length === 10) {
    // Landline: (XX) XXXX-XXXX
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11) {
    // Mobile: (XX) 9XXXX-XXXX
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone;
}

/**
 * Format CPF for display
 * @param cpf - CPF (normalized)
 * @returns Formatted CPF (XXX.XXX.XXX-XX)
 */
export function formatCPF(cpf: string): string {
  if (!cpf) return '';
  const cleaned = normalizeCPF(cpf);
  
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  }
  
  return cpf;
}

/**
 * Format date for display (Brazilian format)
 * @param date - Date string or Date object
 * @returns Formatted date (dd/MM/yyyy)
 */
export function formatDate(date: string | Date): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return '';
  }
}

/**
 * Format date and time for display (Brazilian format)
 * @param date - Date string or Date object
 * @returns Formatted date and time (dd/MM/yyyy HH:mm)
 */
export function formatDateTime(date: string | Date): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: ptBR });
  } catch {
    return '';
  }
}

/**
 * Format currency to Brazilian Real
 * @param value - Numeric value
 * @returns Formatted currency (R$ X.XXX,XX)
 */
export function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numValue);
}

/**
 * Validate CPF
 * @param cpf - CPF string
 * @returns True if valid CPF
 */
export function validateCPF(cpf: string): boolean {
  const cleaned = normalizeCPF(cpf);
  
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false; // All same digits
  
  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned[10])) return false;
  
  return true;
}

/**
 * Validate email
 * @param email - Email string
 * @returns True if valid email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Brazilian)
 * @param phone - Phone string
 * @returns True if valid phone
 */
export function validatePhone(phone: string): boolean {
  const cleaned = normalizePhone(phone);
  return cleaned.length === 10 || cleaned.length === 11;
}

/**
 * Formata data evitando problemas de fuso horário
 * Interpreta a data como local em vez de UTC para evitar deslocamento de um dia
 * 
 * @param dateString - String de data (YYYY-MM-DD ou ISO)
 * @param formatStr - Formato desejado (padrão: 'dd/MM/yyyy')
 * @param locale - Locale para formatação (padrão: ptBR)
 * @returns Data formatada
 * 
 * @example
 * formatLocalDate("2023-12-25") // "25/12/2023"
 * formatLocalDate("2023-12-25T10:30:00", 'dd/MM/yyyy HH:mm') // "25/12/2023 10:30"
 */
export function formatLocalDate(dateString: string, formatStr: string = 'dd/MM/yyyy', locale: any = undefined): string {
  if (!dateString) return '';
  
  // Se a data contém 'T' (tem horário), usar como está
  if (dateString.includes('T')) {
    return format(new Date(dateString), formatStr, { locale });
  }
  
  // Se é apenas data (YYYY-MM-DD), adicionar horário para evitar problemas de fuso
  const dateWithTime = dateString + 'T12:00:00';
  return format(new Date(dateWithTime), formatStr, { locale });
}

/**
 * Formata telefone para exibição: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 * 
 * @param phone - Telefone normalizado (apenas números)
 * @returns Telefone formatado para exibição
 * 
 * @example
 * formatPhoneDisplay("66999516222") // "(66) 99951-6222"
 * formatPhoneDisplay("6632251234")  // "(66) 3225-1234"
 */
export function formatPhoneDisplay(phone: string): string {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  // Celular: (XX) XXXXX-XXXX
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  
  // Fixo: (XX) XXXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  
  // Sem DDD: XXXXX-XXXX ou XXXX-XXXX
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }
  
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }
  
  return phone;
}

/**
 * Formata CPF para exibição: XXX.XXX.XXX-XX
 * 
 * @param cpf - CPF normalizado (apenas números)
 * @returns CPF formatado para exibição
 * 
 * @example
 * formatCPFDisplay("12345678900") // "123.456.789-00"
 */
export function formatCPFDisplay(cpf: string): string {
  if (!cpf) return '';
  
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  }
  
  return cpf;
}

/**
 * Valida CPF (versão simplificada para desenvolvimento)
 * 
 * @param cpf - CPF para validar (pode ter formatação)
 * @returns true se CPF é válido
 */
export function isValidCPF(cpf: string): boolean {
  if (!cpf) return false;
  
  const cleaned = cpf.replace(/\D/g, '');
  
  // Validação simplificada para desenvolvimento
  // Em produção, implementar validação completa dos dígitos verificadores
  return cleaned.length === 11 && !/^(\d)\1{10}$/.test(cleaned);
}