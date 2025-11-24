/**
 * Asaas Customer Service
 * 
 * Service for managing customers in Asaas payment gateway
 * Uses Edge Functions for secure API communication
 */

import { supabase } from '@/integrations/supabase/client';

export interface AsaasCustomerData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  clinicId?: string;
  profileId?: string;
}

export interface AsaasCustomerResponse {
  id: string; // Asaas customer ID
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
}

/**
 * Create or update customer in Asaas
 * Also saves customer in local database (clients table)
 */
export async function createAsaasCustomer(customerData: AsaasCustomerData): Promise<{
  asaasCustomer: AsaasCustomerResponse;
  localCustomer: any;
}> {
  try {
    // Call Edge Function to create customer in Asaas
    const { data, error } = await supabase.functions.invoke('create-asaas-customer', {
      body: {
        name: customerData.name,
        email: customerData.email,
        cpfCnpj: customerData.cpfCnpj.replace(/\D/g, ''), // Remove formatting
        phone: customerData.phone,
        mobilePhone: customerData.mobilePhone,
        address: customerData.address,
        addressNumber: customerData.addressNumber,
        complement: customerData.complement,
        province: customerData.province,
        postalCode: customerData.postalCode?.replace(/\D/g, ''),
        profileId: customerData.profileId,
        clinicId: customerData.clinicId
      }
    });

    if (error) {
      console.error('Error creating Asaas customer:', error);
      throw new Error(`Failed to create customer: ${error.message}`);
    }

    return data;
  } catch (error: any) {
    console.error('Error in createAsaasCustomer:', error);
    throw error;
  }
}

/**
 * Get customer from local database by Asaas ID
 */
export async function getCustomerByAsaasId(asaasCustomerId: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('asaas_customer_id', asaasCustomerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return data;
}

/**
 * Get customer from local database by clinic ID
 */
export async function getCustomerByClinicId(clinicId: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('clinic_id', clinicId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Update customer in local database
 */
export async function updateLocalCustomer(
  customerId: string,
  updates: Partial<AsaasCustomerData>
) {
  const { data, error } = await supabase
    .from('clients')
    .update({
      name: updates.name,
      email: updates.email,
      cpf_cnpj: updates.cpfCnpj,
      phone: updates.phone,
      mobile_phone: updates.mobilePhone,
      address: updates.address,
      address_number: updates.addressNumber,
      complement: updates.complement,
      province: updates.province,
      postal_code: updates.postalCode,
      updated_at: new Date().toISOString()
    })
    .eq('id', customerId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get or create customer - checks if customer exists first
 */
export async function getOrCreateCustomer(
  customerData: AsaasCustomerData,
  clinicId: string
): Promise<{
  asaasCustomerId: string;
  localCustomerId: string;
  isNew: boolean;
}> {
  // First, check if customer already exists for this clinic
  const existingCustomer = await getCustomerByClinicId(clinicId);

  if (existingCustomer) {
    return {
      asaasCustomerId: existingCustomer.asaas_customer_id,
      localCustomerId: existingCustomer.id,
      isNew: false
    };
  }

  // Create new customer
  const { asaasCustomer, localCustomer } = await createAsaasCustomer({
    ...customerData,
    clinicId
  });

  return {
    asaasCustomerId: asaasCustomer.id,
    localCustomerId: localCustomer.id,
    isNew: true
  };
}

/**
 * Validate CPF/CNPJ format
 */
export function validateCpfCnpj(cpfCnpj: string): boolean {
  const cleaned = cpfCnpj.replace(/\D/g, '');
  return cleaned.length === 11 || cleaned.length === 14;
}

/**
 * Format CPF/CNPJ for display
 */
export function formatCpfCnpj(cpfCnpj: string): string {
  const cleaned = cpfCnpj.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    // CPF: 000.000.000-00
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (cleaned.length === 14) {
    // CNPJ: 00.000.000/0000-00
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  return cpfCnpj;
}

/**
 * Format phone number
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    // Mobile: (00) 00000-0000
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    // Landline: (00) 0000-0000
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format postal code (CEP)
 */
export function formatPostalCode(postalCode: string): string {
  const cleaned = postalCode.replace(/\D/g, '');
  if (cleaned.length === 8) {
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  return postalCode;
}
