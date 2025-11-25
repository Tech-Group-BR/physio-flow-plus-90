import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface PaymentCustomer {
  name: string
  email: string
  cpfCnpj: string
  phone?: string
  profileId?: string
  clinicId?: string
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
  billingPeriod?: string // Período de cobrança: monthly, quarterly, semiannual, annual
  installments?: number // Número de parcelas (1-12, apenas para planos anuais no cartão)
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

      console.log('📤 Enviando para create-asaas-customer:', JSON.stringify(customerData, null, 2))

      const { data, error } = await supabase.functions.invoke('create-asaas-customer', {
        body: {
          ...customerData,
          profileId: customerData.profileId
        }
      })

      console.log('📥 Resposta create-asaas-customer:', { data, error })

      if (error) {
        console.error('❌ Erro da Edge Function:', error)
        
        // Tentar ler o corpo da resposta de erro
        let errorMessage = 'Erro ao criar cliente no Asaas'
        
        try {
          // O erro tem um context.Response que podemos ler
          if (error.context && error.context instanceof Response) {
            const errorBody = await error.context.json()
            console.error('❌ Body do erro:', errorBody)
            
            if (errorBody.error) {
              errorMessage = errorBody.error
              
              if (errorBody.details) {
                console.error('❌ Detalhes do Asaas:', errorBody.details)
                
                // Se details tem erros específicos do Asaas
                if (typeof errorBody.details === 'object') {
                  if (errorBody.details.errors) {
                    const asaasErrors = errorBody.details.errors
                    const errorMessages = Object.entries(asaasErrors)
                      .map(([field, msgs]: [string, any]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                      .join('; ')
                    errorMessage += ` - ${errorMessages}`
                  } else if (typeof errorBody.details === 'string') {
                    errorMessage += ` - ${errorBody.details}`
                  }
                }
              }
            }
          }
        } catch (parseError) {
          console.error('❌ Erro ao parsear resposta:', parseError)
        }
        
        // Se data também tem erro (fallback)
        if (data?.error) {
          errorMessage = data.error
        } else if (!errorMessage.includes('Erro ao criar cliente')) {
          errorMessage = error.message || errorMessage
        }
        
        toast.error(errorMessage)
        throw new Error(errorMessage)
      }

      if (!data?.customer) {
        throw new Error('Resposta inválida do servidor')
      }

      return data
    } catch (error: any) {
      console.error('Erro ao criar cliente:', error)
      if (!error.message.includes('Erro ao criar cliente')) {
        toast.error('Erro ao criar cliente: ' + error.message)
      }
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
          billingPeriod: paymentData.billingPeriod || 'monthly',
          installments: paymentData.installments || 1, // Parcelamento
          creditCard: paymentData.creditCard,
          creditCardHolderInfo: paymentData.creditCardHolderInfo
        }
      })

      if (error) {
        console.error('❌ Erro ao criar pagamento:', error)
        
        let errorMessage = 'Erro ao criar pagamento'
        
        try {
          // Tentar ler o corpo da resposta de erro
          if (error.context && error.context instanceof Response) {
            const errorBody = await error.context.json()
            console.error('❌ Body do erro:', errorBody)
            
            if (errorBody.error) {
              errorMessage = errorBody.error
              
              if (errorBody.details) {
                console.error('❌ Detalhes do Asaas:', errorBody.details)
                
                if (typeof errorBody.details === 'object' && errorBody.details.errors) {
                  const asaasErrors = errorBody.details.errors
                  const errorMessages = Object.entries(asaasErrors)
                    .map(([field, msgs]: [string, any]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                    .join('; ')
                  errorMessage += ` - ${errorMessages}`
                }
              }
            }
          }
        } catch (parseError) {
          console.error('❌ Erro ao parsear resposta:', parseError)
        }
        
        // Fallback para data.error
        if (data?.error) {
          errorMessage = data.error
        } else if (!errorMessage.includes('Erro ao criar')) {
          errorMessage = error.message || errorMessage
        }
        
        toast.error(errorMessage)
        throw new Error(errorMessage)
      }

      if (!data?.success) {
        const errorMsg = data?.error || 'Erro ao criar pagamento'
        toast.error(errorMsg)
        throw new Error(errorMsg)
      }

      toast.success('Pagamento criado com sucesso!')
      return data

    } catch (error: any) {
      console.error('Erro ao criar pagamento:', error)
      if (!error.message?.includes('Erro ao criar')) {
        toast.error('Erro: ' + error.message)
      }
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