import { supabase } from '@/integrations/supabase/client'

export async function testAsaasIntegration() {
  console.log('🧪 Testando integração Asaas...')
  
  try {
    // Testar criação de cliente
    console.log('1. Testando criação de cliente...')
    const { data: customerData, error: customerError } = await supabase.functions.invoke('create-asaas-customer', {
      body: {
        name: 'Teste Cliente',
        email: 'teste@teste.com',
        cpfCnpj: '12345678901',
        phone: '11999999999'
      }
    })

    if (customerError) {
      console.error('❌ Erro ao criar cliente:', customerError)
      return { success: false, error: customerError }
    }

    console.log('✅ Cliente criado/encontrado:', customerData)

    // Testar criação de pagamento PIX
    console.log('2. Testando criação de pagamento PIX...')
    const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-asaas-payment', {
      body: {
        customerId: customerData.customer.id,
        billingType: 'PIX',
        value: 10.00,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: 'Teste PhysioFlow Plus',
        clinicId: 'teste-clinic',
        productId: 'teste-product'
      }
    })

    if (paymentError) {
      console.error('❌ Erro ao criar pagamento:', paymentError)
      return { success: false, error: paymentError }
    }

    console.log('✅ Pagamento PIX criado:', paymentData)

    return {
      success: true,
      customer: customerData,
      payment: paymentData
    }

  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
    return { success: false, error }
  }
}