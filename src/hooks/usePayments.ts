import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface PaymentCustomer {
  name: string
  email: string
  cpfCnpj: string
  phone?: string
  profileId?: string
}

interface CreditCardData {
  holderName: string
  number: string
  expiryMonth: string
  expiryYear: string
  ccv: string
}

interface CreditCardHolderInfo {
  name: string
  email: string
  cpfCnpj: string
  postalCode: string
  addressNumber: string
  phone: string
}

interface CreatePaymentRequest {
  customerId?: string
  customer: PaymentCustomer
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD'
  value: number
  dueDate: string
  description?: string
  clinicId?: string
  productId?: string
  creditCard?: CreditCardData
  creditCardHolderInfo?: CreditCardHolderInfo
}

interface PaymentResponse {
  payment: {
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
  pixQrCode?: {
    encodedImage: string
    payload: string
    expirationDate: string
  }
  success: boolean
}

export function usePayments() {
  const [loading, setLoading] = useState(false)

  const createCustomer = async (customerData: PaymentCustomer) => {
    try {
      setLoading(true)

      const { data, error } = await supabase.functions.invoke('create-asaas-customer', {
        body: {
          ...customerData,
          profileId: customerData.profileId
        }
      })

      if (error) throw error

      return data
    } catch (error: any) {
      console.error('Erro ao criar cliente:', error)
      toast.error('Erro ao criar cliente: ' + error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const createPayment = async (paymentData: CreatePaymentRequest): Promise<PaymentResponse> => {
    try {
      setLoading(true)

      // Primeiro, criar ou buscar o cliente
      let customerId = paymentData.customerId

      if (!customerId) {
        const customerResult = await createCustomer(paymentData.customer)
        customerId = customerResult.customer.id
      }

      // Criar o pagamento
      const { data, error } = await supabase.functions.invoke('create-asaas-payment', {
        body: {
          customerId,
          billingType: paymentData.billingType,
          value: paymentData.value,
          dueDate: paymentData.dueDate,
          description: paymentData.description,
          clinicId: paymentData.clinicId,
          productId: paymentData.productId,
          creditCard: paymentData.creditCard,
          creditCardHolderInfo: paymentData.creditCardHolderInfo
        }
      })

      if (error) throw error

      if (!data.success) {
        throw new Error(data.error || 'Erro ao criar pagamento')
      }

      toast.success('Pagamento criado com sucesso!')
      return data

    } catch (error: any) {
      console.error('Erro ao criar pagamento:', error)
      
      // Tentar extrair detalhes do erro
      if (error.context?.body) {
        console.error('Detalhes do erro:', error.context.body)
      }
      
      toast.error('Erro ao criar pagamento: ' + error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getPaymentStatus = async (paymentId: string) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('asaas_payment_id', paymentId)
        .single()

      if (error) throw error

      return data
    } catch (error: any) {
      console.error('Erro ao buscar status do pagamento:', error)
      toast.error('Erro ao buscar status do pagamento')
      throw error
    }
  }

  const getPaymentsByClinic = async (clinicId: string) => {
    try {
      // Usar any para evitar problemas de tipo complexo por enquanto
      const { data, error } = await (supabase as any)
        .from('payments')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error: any) {
      console.error('Erro ao buscar pagamentos:', error)
      toast.error('Erro ao buscar pagamentos')
      throw error
    }
  }

  const formatCpfCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    
    if (numbers.length <= 11) {
      // CPF: 000.000.000-00
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    } else {
      // CNPJ: 00.000.000/0000-00
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    
    if (numbers.length <= 10) {
      // Telefone fixo: (00) 0000-0000
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    } else {
      // Celular: (00) 00000-0000
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
  }

  const formatCreditCard = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{4})(?=\d)/g, '$1 ')
  }

  const formatExpiryDate = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length >= 2) {
      return numbers.replace(/(\d{2})(\d{0,2})/, '$1/$2')
    }
    return numbers
  }

  return {
    loading,
    createCustomer,
    createPayment,
    getPaymentStatus,
    getPaymentsByClinic,
    formatCpfCnpj,
    formatPhone,
    formatCreditCard,
    formatExpiryDate
  }
}