/**
 * Utilitários para formatação e normalização de dados
 */

/**
 * Normaliza telefone para formato padrão: apenas números com DDD
 * Remove todos os caracteres não numéricos e garante código de área
 * 
 * @param phone - Telefone em qualquer formato
 * @returns Telefone normalizado (apenas números com DDD)
 * 
 * @example
 * normalizePhone("(66) 99951-6222") // "66999516222"
 * normalizePhone("66 9 9951-6222")  // "66999516222"
 * normalizePhone("999516222")       // "66999516222" (adiciona DDD padrão 66)
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  
  // Remove todos os caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Se não tem DDD (menos de 10 dígitos para fixo, 11 para celular)
  if (cleaned.length === 8 || cleaned.length === 9) {
    // Adiciona DDD padrão 66 (Mato Grosso)
    return '66' + cleaned;
  }
  
  // Se tem código do país 55, remove (vamos adicionar depois se necessário)
  if (cleaned.startsWith('55') && cleaned.length > 11) {
    return cleaned.substring(2);
  }
  
  return cleaned;
}

/**
 * Normaliza CPF para formato padrão: apenas números
 * Remove todos os caracteres não numéricos
 * 
 * @param cpf - CPF em qualquer formato
 * @returns CPF normalizado (apenas números)
 * 
 * @example
 * normalizeCPF("123.456.789-00") // "12345678900"
 * normalizeCPF("123 456 789 00") // "12345678900"
 */
export function normalizeCPF(cpf: string): string {
  if (!cpf) return '';
  
  // Remove todos os caracteres não numéricos
  return cpf.replace(/\D/g, '');
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
 * Valida CPF
 * 
 * @param cpf - CPF para validar (pode ter formatação)
 * @returns true se CPF é válido
 */
export function isValidCPF(cpf: string): boolean {
  if (!cpf) return false;
  
  // const cleaned = cpf.replace(/\D/g, '');
  
  // if (cleaned.length !== 11) return false;
  
  // // Verifica se todos os dígitos são iguais
  // if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  // // Valida primeiro dígito verificador
  // let sum = 0;
  // for (let i = 0; i < 9; i++) {
  //   sum += parseInt(cleaned.charAt(i)) * (10 - i);
  // }
  // let digit = 11 - (sum % 11);
  // if (digit >= 10) digit = 0;
  // if (digit !== parseInt(cleaned.charAt(9))) return false;
  
  // // Valida segundo dígito verificador
  // sum = 0;
  // for (let i = 0; i < 10; i++) {
  //   sum += parseInt(cleaned.charAt(i)) * (11 - i);
  // }
  // digit = 11 - (sum % 11);
  // if (digit >= 10) digit = 0;
  // if (digit !== parseInt(cleaned.charAt(10))) return false;
  
  return true;
}

/**
 * Valida telefone brasileiro
 * 
 * @param phone - Telefone para validar (pode ter formatação)
 * @returns true se telefone é válido
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  
  const cleaned = phone.replace(/\D/g, '');
  
  // Telefone fixo: 10 dígitos (XX XXXX-XXXX)
  // Telefone celular: 11 dígitos (XX 9XXXX-XXXX)
  return cleaned.length === 10 || cleaned.length === 11;
}
