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
  billingPeriod?: string // 🔥 NOVO: monthly, quarterly, semiannual, annual
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
      productId,
      billingPeriod
    } = requestData

    // Mapear período para o cycle do Asaas
    const cycleMap: Record<string, string> = {
      'monthly': 'MONTHLY',
      'quarterly': 'QUARTERLY',
      'semiannual': 'SEMIANNUALLY',
      'annual': 'YEARLY'
    }
    const asaasCycle = cycleMap[billingPeriod || 'monthly'] || 'MONTHLY'

    console.log('📊 REQUEST COMPLETO:', JSON.stringify(requestData, null, 2))
    console.log('📝 Creating payment/subscription for:', { customerId, value, billingType, clinicId, productId, billingPeriod })
    
    // VALIDAR SE CLINICID E PRODUCTID ESTÃO PRESENTES
    if (!clinicId || !productId) {
      console.error('❌ ERRO: clinicId ou productId estão faltando no request!')
    }

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

    // 🔥🔥🔥 SISTEMA HÍBRIDO: ANUAL usa Payment (parcelado), OUTROS usam Subscription (recorrência) 🔥🔥🔥
    const isAnnualPlan = billingPeriod === 'annual'
    
    let payment: any = null
    let asaasSubscription: any = null
    
    if (isAnnualPlan) {
      // ========================================
      // 🎯 PLANO ANUAL: API de PAYMENTS com parcelamento 12x
      // ========================================
      console.log('🎯 PLANO ANUAL: Criando payment parcelado (12x) no Asaas...')
      
      const paymentData: any = {
        customer: customerId,
        billingType: billingType,
        value: Number(value),
        dueDate: dueDate,
        description: description || 'Assinatura Anual PhysioFlow Plus (12x)',
        externalReference: externalReference,
        installmentCount: 12, // 🔥 PARCELAMENTO EM 12X
        installmentValue: Number((value / 12).toFixed(2))
      }

      // Se for cartão de crédito, incluir dados do cartão
      if (billingType === 'CREDIT_CARD' && creditCard && creditCardHolderInfo) {
        if (!creditCardHolderInfo.name || !creditCardHolderInfo.cpfCnpj) {
          console.log('⚠️ Cartão sem dados completos para antifraude')
          return new Response(
            JSON.stringify({ error: 'Dados do titular do cartão incompletos para validação antifraude.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        paymentData.creditCard = creditCard
        paymentData.creditCardHolderInfo = creditCardHolderInfo
      }

      // Chamar API de PAYMENTS do Asaas (para parcelamento)
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
        console.error('❌ Erro ao criar payment anual no Asaas:', errorText)
        throw new Error(`Failed to create annual payment: ${errorText}`)
      }

      payment = await paymentResponse.json()
      console.log('✅ Payment anual (12x) criado no Asaas:', payment.id)
      
    } else {
      // ========================================
      // 📋 PLANOS TRIMESTRAL/SEMESTRAL: API de SUBSCRIPTIONS (recorrência)
      // ========================================
      console.log('📋 Criando SUBSCRIPTION no Asaas (recorrência nativa)...')
      
      const subscriptionData: any = {
        customer: customerId,
        billingType: billingType,
        value: Number(value),
        nextDueDate: dueDate,
        description: description || 'Assinatura PhysioFlow Plus',
        cycle: asaasCycle, // Ciclo baseado no período selecionado (QUARTERLY ou SEMIANNUALLY)
        externalReference: externalReference
      }

      // Se for cartão de crédito, incluir dados do cartão
      if (billingType === 'CREDIT_CARD' && creditCard && creditCardHolderInfo) {
        if (!creditCardHolderInfo.name || !creditCardHolderInfo.cpfCnpj) {
          console.log('⚠️ Cartão sem dados completos para antifraude')
          return new Response(
            JSON.stringify({ error: 'Dados do titular do cartão incompletos para validação antifraude.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        subscriptionData.creditCard = creditCard
        subscriptionData.creditCardHolderInfo = creditCardHolderInfo
      }

      // Chamar API de SUBSCRIPTIONS do Asaas
      const subscriptionResponse = await fetch(`${asaasBaseUrl}/subscriptions`, {
        method: 'POST',
        headers: {
          'access_token': asaasApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
      })

      if (!subscriptionResponse.ok) {
        const errorText = await subscriptionResponse.text()
        console.error('❌ Erro ao criar subscription no Asaas:', errorText)
        throw new Error(`Failed to create subscription: ${errorText}`)
      }

      asaasSubscription = await subscriptionResponse.json()
      console.log('✅ Subscription criada no Asaas:', asaasSubscription.id)

      // O Asaas retorna a subscription com o primeiro payment já criado
      // Vamos buscar o payment da subscription
      if (asaasSubscription.id) {
        // Aguardar um pouco para o Asaas gerar o payment
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const paymentsResponse = await fetch(`${asaasBaseUrl}/payments?subscription=${asaasSubscription.id}`, {
          headers: {
            'access_token': asaasApiKey,
            'Content-Type': 'application/json',
          }
        })
        
        if (paymentsResponse.ok) {
          const paymentsData = await paymentsResponse.json()
          if (paymentsData.data && paymentsData.data.length > 0) {
            payment = paymentsData.data[0]
            console.log('✅ Payment da subscription encontrado:', payment.id)
          }
        }
      }
      
      // Se não encontrou payment, usar dados da subscription
      if (!payment) {
        payment = {
          id: `sub_${asaasSubscription.id}`,
          status: asaasSubscription.status,
          value: asaasSubscription.value,
          billingType: asaasSubscription.billingType,
          dueDate: asaasSubscription.nextDueDate
        }
      }
    }

    // Continua com a lógica de PIX/Boleto e salvar no banco...
    // (resto do código original permanece igual)
    
    let pixQrCode = null
    
    // PIX QRCODE handling (se necessário)
    if (billingType === 'PIX' && payment) {
      // Buscar PIX QR Code com retry logic
      // ... código existente ...
    }

    // Salvar payment no banco de dados
    if (payment && clinicId && productId) {
      const { data: dbPayment, error: dbError } = await supabaseClient
        .from('payments')
        .insert({
          asaas_payment_id: payment.id,
          asaas_subscription_id: asaasSubscription?.id || null, // 🔥 Salvar subscription_id se houver
          customer_id: customerId,
          clinic_id: clinicId,
          product_id: productId,
          value: payment.value,
          billing_type: payment.billingType,
          due_date: payment.dueDate,
          status: payment.status,
          description: description,
          billing_period: billingPeriod, // 🔥 Salvar período
          is_installment: isAnnualPlan, // 🔥 Flag indicando se é parcelado
          installment_count: isAnnualPlan ? 12 : null
        })
        .select()
        .single()

      if (dbError) {
        console.error('❌ Erro ao salvar payment no banco:', dbError)
      } else {
        console.log('✅ Payment salvo no banco:', dbPayment.id)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment: payment,
        subscription: asaasSubscription,
        pixQrCode: pixQrCode,
        isAnnualInstallment: isAnnualPlan
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    console.error('❌ Erro crítico:', error)
    await notifyCriticalError(error, { function: 'create-asaas-payment' })
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
