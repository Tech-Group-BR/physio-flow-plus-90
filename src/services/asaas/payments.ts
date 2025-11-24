/**
 * Asaas Payment Service
 * 
 * Service for creating and managing payments through Asaas API
 * Uses Edge Functions for secure payment processing
 */

import { supabase } from '@/integrations/supabase/client';

export type BillingType = 'PIX' | 'BOLETO' | 'CREDIT_CARD';
export type BillingPeriod = 'monthly' | 'quarterly' | 'semiannual' | 'annual';

export interface PaymentCreationData {
  customerId: string; // Asaas customer ID
  billingType: BillingType;
  value: number;
  dueDate: string; // YYYY-MM-DD
  description?: string;
  billingPeriod?: BillingPeriod;
  clinicId: string;
  productId?: string;
  externalReference?: string;
  creditCard?: CreditCardData;
  creditCardHolderInfo?: CreditCardHolderInfo;
}

export interface CreditCardData {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface CreditCardHolderInfo {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  phone: string;
}

export interface PaymentResponse {
  payment: {
    id: string;
    status: string;
    value: number;
    dueDate: string;
    billingType: string;
    invoiceUrl?: string;
    bankSlipUrl?: string;
    cardToken?: string;
  };
  subscription?: {
    id: string;
    status: string;
    value: number;
    billingType: string;
    nextDueDate: string;
    cycle: string;
  };
  pixQrCode?: {
    payload: string;
    encodedImage: string;
    expirationDate: string;
  };
  success: boolean;
  isAnnual: boolean;
  installments: number;
}

/**
 * Create payment using hybrid logic:
 * - Annual: 12x installments via /payments API
 * - Quarterly/Semiannual: Recurring via /subscriptions API
 */
export async function createPayment(paymentData: PaymentCreationData): Promise<PaymentResponse> {
  try {
    console.log('Creating payment with data:', {
      ...paymentData,
      creditCard: paymentData.creditCard ? '***HIDDEN***' : undefined
    });

    // Call Edge Function create-asaas-payment
    const { data, error } = await supabase.functions.invoke('create-asaas-payment', {
      body: {
        customerId: paymentData.customerId,
        billingType: paymentData.billingType,
        value: paymentData.value,
        dueDate: paymentData.dueDate,
        description: paymentData.description,
        billingPeriod: paymentData.billingPeriod || 'monthly',
        clinicId: paymentData.clinicId,
        productId: paymentData.productId,
        externalReference: paymentData.externalReference,
        creditCard: paymentData.creditCard,
        creditCardHolderInfo: paymentData.creditCardHolderInfo
      }
    });

    if (error) {
      console.error('Error creating payment:', error);
      throw new Error(`Failed to create payment: ${error.message}`);
    }

    if (!data.success) {
      throw new Error('Payment creation failed');
    }

    return data;
  } catch (error: any) {
    console.error('Error in createPayment:', error);
    throw error;
  }
}

/**
 * Get payment status from local database
 */
export async function getPaymentStatus(paymentId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get payment by Asaas payment ID
 */
export async function getPaymentByAsaasId(asaasPaymentId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('asaas_payment_id', asaasPaymentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

/**
 * Get all payments for a clinic
 */
export async function getClinicPayments(clinicId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Get pending payments for a clinic
 */
export async function getPendingPayments(clinicId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('status', 'PENDING')
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Get overdue payments for a clinic
 */
export async function getOverduePayments(clinicId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('status', 'OVERDUE')
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Calculate total amount for billing period
 */
export function calculatePaymentAmount(
  monthlyPrice: number,
  billingPeriod: BillingPeriod,
  discountPercent: number = 0
): { totalAmount: number; monthlyAmount: number; discount: number } {
  let months = 1;
  
  switch (billingPeriod) {
    case 'monthly':
      months = 1;
      break;
    case 'quarterly':
      months = 3;
      discountPercent = discountPercent || 5; // Default 5% for quarterly
      break;
    case 'semiannual':
      months = 6;
      discountPercent = discountPercent || 10; // Default 10% for semiannual
      break;
    case 'annual':
      months = 12;
      discountPercent = discountPercent || 15; // Default 15% for annual
      break;
  }

  const subtotal = monthlyPrice * months;
  const discount = (subtotal * discountPercent) / 100;
  const totalAmount = subtotal - discount;

  return {
    totalAmount: Math.round(totalAmount * 100) / 100,
    monthlyAmount: monthlyPrice,
    discount: Math.round(discount * 100) / 100
  };
}

/**
 * Format currency for display (BRL)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Format date for Asaas API (YYYY-MM-DD)
 */
export function formatDateForAsaas(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Calculate due date (default: 7 days from now)
 */
export function calculateDueDate(daysFromNow: number = 7): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return formatDateForAsaas(date);
}

/**
 * Validate credit card data
 */
export function validateCreditCard(card: CreditCardData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate holder name
  if (!card.holderName || card.holderName.length < 3) {
    errors.push('Nome do titular inválido');
  }

  // Validate card number (basic length check)
  const cardNumber = card.number.replace(/\D/g, '');
  if (cardNumber.length < 13 || cardNumber.length > 19) {
    errors.push('Número do cartão inválido');
  }

  // Validate expiry
  const currentYear = new Date().getFullYear() % 100; // Last 2 digits
  const currentMonth = new Date().getMonth() + 1;
  const expiryYear = parseInt(card.expiryYear);
  const expiryMonth = parseInt(card.expiryMonth);

  if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
    errors.push('Cartão expirado');
  }

  if (expiryMonth < 1 || expiryMonth > 12) {
    errors.push('Mês de expiração inválido');
  }

  // Validate CCV
  if (!card.ccv || card.ccv.length < 3 || card.ccv.length > 4) {
    errors.push('CVV inválido');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get payment method label in Portuguese
 */
export function getPaymentMethodLabel(billingType: BillingType): string {
  const labels: Record<BillingType, string> = {
    PIX: 'PIX',
    BOLETO: 'Boleto Bancário',
    CREDIT_CARD: 'Cartão de Crédito'
  };
  return labels[billingType];
}

/**
 * Get payment status label in Portuguese
 */
export function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pendente',
    RECEIVED: 'Recebido',
    CONFIRMED: 'Confirmado',
    OVERDUE: 'Vencido',
    CANCELED: 'Cancelado',
    REFUNDED: 'Reembolsado'
  };
  return labels[status] || status;
}

/**
 * Get payment status color for UI
 */
export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'yellow',
    RECEIVED: 'green',
    CONFIRMED: 'green',
    OVERDUE: 'red',
    CANCELED: 'gray',
    REFUNDED: 'orange'
  };
  return colors[status] || 'gray';
}

/**
 * Check if payment is overdue
 */
export function isPaymentOverdue(dueDate: string): boolean {
  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return due < now;
}

/**
 * Get days until due date
 */
export function getDaysUntilDue(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = due.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
