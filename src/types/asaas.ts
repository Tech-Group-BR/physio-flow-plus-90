// Tipos para integração com Asaas
export interface AsaasClient {
  id: string
  profile_id?: string
  asaas_customer_id: string
  cpf_cnpj: string
  name: string
  email: string
  created_at: string
}

export interface AsaasProduct {
  id: string
  name: string
  description?: string
  price: number
  is_active: boolean
  created_at: string
}

export type PaymentStatus = 'PENDING' | 'RECEIVED' | 'OVERDUE' | 'CANCELED' | 'REFUNDED'
export type BillingType = 'PIX' | 'BOLETO' | 'CREDIT_CARD'

export interface AsaasPayment {
  id: string
  client_id?: string
  product_id?: string
  asaas_payment_id: string
  status: PaymentStatus
  value: number
  billing_type: BillingType
  due_date: string
  pix_payload?: string
  created_at: string
  updated_at?: string
}

export interface AsaasWebhookLog {
  id: string
  event_type: string
  asaas_id?: string
  payload: any // JSON payload from Asaas
  received_at: string
}

// Tipos para as APIs da Asaas
export interface AsaasCustomerRequest {
  name: string
  email: string
  cpfCnpj: string
}

export interface AsaasPaymentRequest {
  customer: string // Customer ID from Asaas
  billingType: BillingType
  value: number
  dueDate: string
  description?: string
  pixAddressKey?: string
}

export interface AsaasPaymentResponse {
  id: string
  status: string
  value: number
  dueDate: string
  billingType: string
  invoiceUrl?: string
  bankSlipUrl?: string
  pixQrCodeId?: string
}

// Tipos para o frontend
export interface PaymentFormData {
  customer: {
    name: string
    email: string
    cpfCnpj: string
  }
  billingType: BillingType
  value: number
  dueDate: string
  description?: string
  productId?: string
}

export interface PaymentResult {
  success: boolean
  payment?: {
    id: string
    status: string
    value: number
    dueDate: string
    billingType: string
    invoiceUrl?: string
    bankSlipUrl?: string
    pixQrCodeId?: string
    pixCopyAndPaste?: string
  }
  error?: string
}