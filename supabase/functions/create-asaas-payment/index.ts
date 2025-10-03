import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// Utilitário simples para log estruturado
function logEvent(level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>) {
  const log = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta
  }
  console.log(JSON.stringify(log))
}

// Simulação de notificação de falha crítica (pode ser integrado com e-mail, Slack, etc)
async function notifyCriticalError(error: any, context: Record<string, unknown> = {}) {
  // Aqui você pode integrar com um serviço externo
  logEvent('error', 'CRITICAL ERROR', { error: error?.message || error, ...context })
}
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
    const asaasBaseUrl = Deno.env.get('ASAAS_BASE_URL') 

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

    console.log('📝 Creating payment for:', { customerId, value, billingType, clinicId, productId })

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
      // Validação antifraude simples: checar se o nome do titular e CPF/CNPJ estão presentes
      if (!creditCardHolderInfo.name || !creditCardHolderInfo.cpfCnpj) {
        console.log('⚠️ Cartão sem dados completos para antifraude', { creditCardHolderInfo })
        return new Response(
          JSON.stringify({ error: 'Dados do titular do cartão incompletos para validação antifraude.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
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

    // PIX payload será buscado depois com retry logic

    // Buscar informações do cliente para obter client_id e clinic_id
    let clientId = null
    let resolvedClinicId = clinicId // Usar o clinicId do request se disponível
    
    console.log('🏥 Clinic ID recebido no request:', clinicId)
    console.log('🏥 Resolved Clinic ID inicial:', resolvedClinicId)
    
    // Se o clinicId chegou vazio/null, tentar obter de outras formas
    if (!clinicId) {
      console.log('⚠️ clinicId está vazio/null no request!')
    }
    
    if (customerId) {
      const { data: clientData } = await supabaseClient
        .from('clients')
        .select('id, profile_id')
        .eq('asaas_customer_id', customerId)
        .maybeSingle()
      
      clientId = clientData?.id || null
      
      // Se não temos clinicId do request, buscar via profile do cliente
      if (!resolvedClinicId && clientData?.profile_id) {
        console.log('🔍 Buscando clinic_id via profile_id:', clientData.profile_id)
        const { data: profileData } = await supabaseClient
          .from('profiles')
          .select('clinic_id')
          .eq('id', clientData.profile_id)
          .maybeSingle()
          
        resolvedClinicId = profileData?.clinic_id || null
        console.log('🏥 Clinic ID obtido via profile:', resolvedClinicId)
      } else {
        console.log('🏥 Usando clinic_id do request ou não há profile_id')
      }
    }

    // Salvar pagamento no Supabase com todos os campos corretos
    console.log('💾 Salvando pagamento com:', {
      asaas_payment_id: payment.id,
      client_id: clientId,
      clinic_id: resolvedClinicId,
      customer_id: customerId,
      plan_id: productId
    })
    
    const { error: dbError } = await supabaseClient
      .from('payments')
      .insert({
        asaas_payment_id: payment.id,
        client_id: clientId,
        clinic_id: resolvedClinicId,
        customer_id: customerId,
        plan_id: productId,
        value: value,
        status: payment.status,
        billing_type: billingType.toLowerCase(),
        due_date: dueDate,
        description: description || 'Pagamento PhysioFlow Plus',
        pix_payload: null, // Será preenchido depois se for PIX
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('Erro ao salvar pagamento no Supabase:', dbError)
      // Não retornar erro aqui pois o pagamento foi criado no Asaas
      // Apenas log do erro para análise posterior
    } else {
      console.log('✅ Payment saved successfully in database')
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
            
            // Atualizar o pagamento com o PIX payload
            if (pixQrCodeInfo?.payload) {
              await supabaseClient
                .from('payments')
                .update({ pix_payload: pixQrCodeInfo.payload })
                .eq('asaas_payment_id', payment.id)
              console.log('✅ PIX payload salvo no banco')
            }
            
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

    // O pagamento já foi salvo no primeiro bloco acima, não precisamos duplicar

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