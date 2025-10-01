import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Inicializar Supabase Admin Client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface PaymentRequest {
  customerId?: string
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD'
  value: number
  dueDate: string
  description?: string
  externalReference?: string
  clinicId?: string
  productId?: string
  creditCard?: {
    holderName: string
    number: string
    expiryMonth: string
    expiryYear: string
    ccv: string
  }
  creditCardHolderInfo?: {
    name: string
    email: string
    cpfCnpj: string
    postalCode: string
    addressNumber: string
    phone: string
  }
}

serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')
    const asaasBaseUrl = Deno.env.get('ASAAS_BASE_URL') || 'https://www.asaas.com/api/v3'

    if (!asaasApiKey) {
      throw new Error('ASAAS_API_KEY not configured')
    }

    const requestData = await req.json()
    const { 
      customerId, 
      billingType, 
      value, 
      dueDate, 
      description,
      externalReference,
      creditCard,
      creditCardHolderInfo,
      clinicId,
      productId
    } = requestData

    console.log('Creating payment for:', { customerId, value, billingType })

    // Validação básica
    if (!customerId || !billingType || !value || !dueDate) {
      return new Response(
        JSON.stringify({ error: 'Dados obrigatórios: customerId, billingType, value, dueDate' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Preparar dados do pagamento
    const paymentData: any = {
      customer: customerId,
      billingType: billingType,
      value: Number(value),
      dueDate: dueDate,
      description: description || 'Pagamento PhysioFlow Plus'
    }

    if (externalReference) {
      paymentData.externalReference = externalReference
    }

    // Se for cartão de crédito, incluir dados do cartão
    if (billingType === 'CREDIT_CARD' && creditCard && creditCardHolderInfo) {
      paymentData.creditCard = creditCard
      paymentData.creditCardHolderInfo = creditCardHolderInfo
    }

    const paymentResponse = await fetch(`${asaasBaseUrl}/payments`, {
      method: 'POST',
      headers: {
        'access_token': asaasApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    })

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text()
      throw new Error(`Failed to create payment: ${errorText}`)
    }

    const payment = await paymentResponse.json()

    // 3. Buscar informações do PIX se necessário
    let pixPayload = null
    if (billingType === 'PIX') {
      const pixResponse = await fetch(`${asaasBaseUrl}/payments/${payment.id}/pixQrCode`, {
        headers: {
          'access_token': asaasApiKey,
        },
      })

      if (pixResponse.ok) {
        const pixData = await pixResponse.json()
        pixPayload = pixData.payload
      }
    }

    // Salvar pagamento no Supabase
    const { error: dbError } = await supabaseClient
      .from('payments')
      .insert({
        asaas_payment_id: payment.id,
        clinic_id: clinicId,
        product_id: productId,
        customer_id: customerId,
        amount: value,
        status: payment.status,
        billing_type: billingType.toLowerCase(),
        due_date: dueDate,
        description: description || 'Pagamento PhysioFlow Plus',
        asaas_response: payment,
        created_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('Erro ao salvar pagamento no Supabase:', dbError)
      // Não retornar erro aqui pois o pagamento foi criado no Asaas
      // Apenas log do erro para análise posterior
    }

    // Para PIX, buscar QR Code com retry logic
    let pixQrCodeInfo = null
    if (billingType === 'PIX' && payment.id) {
      const maxRetries = 3
      const retryDelay = 2000 // 2 segundos
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔍 Tentativa ${attempt}/${maxRetries} - Buscando QR Code para payment:`, payment.id)
          
          // Se não for a primeira tentativa, aguardar um pouco
          if (attempt > 1) {
            console.log(`⏳ Aguardando ${retryDelay}ms antes da próxima tentativa...`)
            await new Promise(resolve => setTimeout(resolve, retryDelay))
          }
          
          const qrCodeResponse = await fetch(`${asaasBaseUrl}/payments/${payment.id}/pixQrCode`, {
            headers: {
              'access_token': asaasApiKey,
              'Content-Type': 'application/json'
            }
          })

          console.log(`📡 QR Code response status (tentativa ${attempt}):`, qrCodeResponse.status)
          
          if (qrCodeResponse.ok) {
            pixQrCodeInfo = await qrCodeResponse.json()
            console.log('✅ QR Code obtido com sucesso:', pixQrCodeInfo)
            break // Sucesso, sair do loop
          } else {
            const errorText = await qrCodeResponse.text()
            console.error(`❌ Erro na resposta QR Code (tentativa ${attempt}):`, errorText)
            
            // Se chegou na última tentativa e ainda não conseguiu
            if (attempt === maxRetries) {
              console.error('🔥 Todas as tentativas falharam para obter QR Code')
            }
          }
        } catch (error) {
          console.error(`💥 Erro ao buscar QR Code do PIX (tentativa ${attempt}):`, error)
          
          if (attempt === maxRetries) {
            console.error('🔥 Todas as tentativas falharam devido a erros de rede')
          }
        }
      }
    }

    // Salvar pagamento na nossa base de dados
    try {
      console.log('💾 Salvando pagamento no banco local...')
      
      // Primeiro, buscar dados do cliente no Asaas
      console.log('🔍 Buscando dados do cliente no Asaas:', customerId)
      const customerResponse = await fetch(`${asaasBaseUrl}/customers/${customerId}`, {
        headers: {
          'access_token': asaasApiKey,
          'Content-Type': 'application/json'
        }
      })

      let customerData = null
      if (customerResponse.ok) {
        customerData = await customerResponse.json()
        console.log('✅ Dados do cliente obtidos:', customerData.name)
      } else {
        console.error('❌ Erro ao buscar cliente no Asaas')
      }
      
      // Buscar ou criar o cliente na nossa base
      let { data: existingClient } = await supabaseAdmin
        .from('clients')
        .select('id')
        .eq('asaas_customer_id', customerId)
        .single()

      let clientId = existingClient?.id

      if (!existingClient && customerData) {
        console.log('🔍 Cliente não encontrado, criando registro local...')
        const { data: newClient, error: clientError } = await supabaseAdmin
          .from('clients')
          .insert({
            asaas_customer_id: customerId,
            cpf_cnpj: customerData.cpfCnpj,
            name: customerData.name,
            email: customerData.email,
            phone: customerData.phone
          })
          .select('id')
          .single()

        if (clientError) {
          console.error('❌ Erro ao criar cliente:', clientError)
        } else {
          clientId = newClient.id
          console.log('✅ Cliente criado com ID:', clientId)
        }
      }

      // Salvar o pagamento na nossa tabela
      const { data: localPayment, error: paymentError } = await supabaseAdmin
        .from('payments')
        .insert({
          client_id: clientId,
          asaas_payment_id: payment.id,
          status: payment.status,
          value: payment.value,
          billing_type: payment.billingType,
          due_date: payment.dueDate,
          description: payment.description,
          pix_payload: pixQrCodeInfo?.payload || null
        })
        .select()
        .single()

      if (paymentError) {
        console.error('❌ Erro ao salvar pagamento:', paymentError)
      } else {
        console.log('✅ Pagamento salvo com ID:', localPayment.id)
      }

      // Se é para uma clínica específica, criar entrada em accounts_receivable
      if (clinicId) {
        const { error: receivableError } = await supabaseAdmin
          .from('accounts_receivable')
          .insert({
            description: payment.description || 'Pagamento via Asaas',
            amount: payment.value,
            due_date: payment.dueDate,
            status: 'pendente',
            method: payment.billingType === 'PIX' ? 'pix' : 
                   payment.billingType === 'BOLETO' ? 'boleto' : 'credit_card',
            clinic_id: clinicId,
            notes: `Asaas Payment ID: ${payment.id}`
          })

        if (receivableError) {
          console.error('❌ Erro ao criar conta a receber:', receivableError)
        } else {
          console.log('✅ Conta a receber criada para clínica:', clinicId)
        }
      }

    } catch (dbError) {
      console.error('💥 Erro ao salvar no banco:', dbError)
      // Não retornar erro aqui pois o pagamento foi criado no Asaas
    }

    const responsePayload = {
      payment: payment,
      pixQrCode: pixQrCodeInfo,
      success: true
    }

    console.log('✅ Pagamento criado com sucesso:', payment.id)

    return new Response(
      JSON.stringify(responsePayload),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error: any) {
    console.error('Error in create-asaas-payment:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})