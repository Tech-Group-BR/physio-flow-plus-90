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
      productId,
      billingPeriod,
      installments
    } = requestData

    // Mapear período para o cycle do Asaas
    const cycleMap: Record<string, string> = {
      'monthly': 'MONTHLY',
      'quarterly': 'QUARTERLY',
      'semiannual': 'SEMIANNUALLY',
      'annual': 'YEARLY'
    }
    const asaasCycle = cycleMap[billingPeriod || 'monthly'] || 'MONTHLY'
    
    // Número de parcelas (padrão 1 se não informado)
    const installmentCount = installments || 1

    console.log('[HYBRID] REQUEST COMPLETO:', JSON.stringify(requestData, null, 2))
    console.log('[HYBRID] Creating payment for:', { customerId, value, billingType, clinicId, productId, billingPeriod, installments: installmentCount })
    
    // VALIDAR SE CLINICID E PRODUCTID ESTÃO PRESENTES
    if (!clinicId || !productId) {
      console.error('[ERROR] clinicId ou productId estão faltando no request!')
      console.error('clinicId:', clinicId)
      console.error('productId:', productId)
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

    // 🔥 HYBRID PAYMENT LOGIC: Annual = Payments API (12x), Quarterly/Semiannual = Subscriptions API (recurring)
    const isAnnualPlan = billingPeriod === 'annual'
    
    let asaasSubscription: any = null
    let payment: any = null

    if (isAnnualPlan) {
      // 💳 ANUAL PARCELADO: Tokenizar cartão e cobrar 1ª parcela, depois seu sistema cobra as outras 11
      console.log('[ANNUAL] Plano ANUAL detectado - Tokenizando cartão e criando 1ª parcela...')
      
      let cardToken = null
      
      // Se for cartão de crédito, TOKENIZAR primeiro (não enviar dados crus)
      if (billingType === 'CREDIT_CARD' && creditCard && creditCardHolderInfo) {
        if (!creditCardHolderInfo.name || !creditCardHolderInfo.cpfCnpj) {
          console.log('[WARNING] Cartão sem dados completos para antifraude', { creditCardHolderInfo })
          return new Response(
            JSON.stringify({ error: 'Dados do titular do cartão incompletos para validação antifraude.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // TOKENIZAR CARTÃO (Asaas guarda o cartão criptografado e retorna token)
        console.log('[TOKENIZATION] Tokenizando cartão no Asaas...')
        const tokenizeResponse = await fetch(`${asaasBaseUrl}/creditCard/tokenize`, {
          method: 'POST',
          headers: {
            'access_token': asaasApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customer: customerId,
            creditCard: creditCard,
            creditCardHolderInfo: creditCardHolderInfo
          })
        })

        if (tokenizeResponse.ok) {
          const tokenData = await tokenizeResponse.json()
          cardToken = tokenData.creditCardToken
          console.log('[SUCCESS] Cartão tokenizado:', cardToken)
        } else {
          const errorText = await tokenizeResponse.text()
          console.error('[ERROR] Erro ao tokenizar cartão:', errorText)
        }
      }

      // Criar pagamento com parcelamento (usa installmentCount da request ou 12 por padrão)
      const finalInstallments = installmentCount || 12
      const installmentValue = Number((value / finalInstallments).toFixed(2))
      
      const paymentData: any = {
        customer: customerId,
        billingType: billingType,
        value: value, // Valor total
        dueDate: dueDate,
        description: description || `Assinatura Anual PhysioFlow Plus - ${finalInstallments}x`,
        externalReference: externalReference
      }
      
      // Adicionar parcelamento se cartão de crédito
      if (billingType === 'CREDIT_CARD') {
        paymentData.installmentCount = finalInstallments
        paymentData.installmentValue = installmentValue
        
        // Se tiver token, usar ele (mais seguro)
        if (cardToken) {
          paymentData.creditCardToken = cardToken
        } else if (creditCard) {
          // Fallback: enviar dados do cartão diretamente
          paymentData.creditCard = creditCard
          paymentData.creditCardHolderInfo = creditCardHolderInfo
        }
      }

      // Chamar API de PAYMENTS do Asaas (apenas 1ª parcela!)
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
        console.error('[ERROR] Erro ao criar payment anual no Asaas:', errorText)
        throw new Error(`Failed to create annual payment: ${errorText}`)
      }

      payment = await paymentResponse.json()
      console.log('[SUCCESS] Pagamento parcelado criado no Asaas:', payment.id, `(${finalInstallments}x de R$ ${installmentValue})`)
      
      // Guardar informações de parcelamento
      payment.installmentCount = finalInstallments
      payment.installmentValue = installmentValue
      if (cardToken) {
        payment.cardToken = cardToken
        console.log('[INFO] Token guardado para as parcelas')
      }
      
    } else {
      // 🔄 TRIMESTRAL/SEMESTRAL: Usar API de SUBSCRIPTIONS (recorrência nativa)
      console.log('[RECURRING] Plano TRIMESTRAL/SEMESTRAL detectado - Criando SUBSCRIPTION no Asaas (recorrência nativa)...')
      
      const subscriptionData: any = {
        customer: customerId,
        billingType: billingType,
        value: Number(value),
        nextDueDate: dueDate,
        description: description || 'Assinatura PhysioFlow Plus',
        cycle: asaasCycle, // QUARTERLY ou SEMIANNUALLY
        externalReference: externalReference
      }

      // Se for cartão de crédito, incluir dados do cartão
      if (billingType === 'CREDIT_CARD' && creditCard && creditCardHolderInfo) {
        if (!creditCardHolderInfo.name || !creditCardHolderInfo.cpfCnpj) {
          console.log('[WARNING] Cartão sem dados completos para antifraude', { creditCardHolderInfo })
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
        console.error('[ERROR] Erro ao criar subscription no Asaas:', errorText)
        throw new Error(`Failed to create subscription: ${errorText}`)
      }

      asaasSubscription = await subscriptionResponse.json()
      console.log('[SUCCESS] Subscription criada no Asaas:', asaasSubscription.id)

      // Buscar o payment da subscription
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
            console.log('[SUCCESS] Payment da subscription encontrado:', payment.id)
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

    // PIX payload será buscado depois com retry logic

    // Buscar informações do cliente para obter client_id e clinic_id
    let clientId = null
    let resolvedClinicId = clinicId // Usar o clinicId do request se disponível
    
    console.log('[CLINIC] Clinic ID recebido no request:', clinicId)
    console.log('[CLINIC] Resolved Clinic ID inicial:', resolvedClinicId)
    
    // Se o clinicId chegou vazio/null, tentar obter de outras formas
    if (!clinicId) {
      console.log('[WARNING] clinicId está vazio/null no request!')
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
        console.log('[LOOKUP] Buscando clinic_id via profile_id:', clientData.profile_id)
        const { data: profileData } = await supabaseClient
          .from('profiles')
          .select('clinic_id')
          .eq('id', clientData.profile_id)
          .maybeSingle()
          
        resolvedClinicId = profileData?.clinic_id || null
        console.log('[CLINIC] Clinic ID obtido via profile:', resolvedClinicId)
      } else {
        console.log('[CLINIC] Usando clinic_id do request ou não há profile_id')
      }
    }

    // Salvar pagamento no Supabase com todos os campos corretos
    const finalInstallmentCount = isAnnualPlan ? (installmentCount || 12) : 1
    const installmentValue = isAnnualPlan ? Number((value / finalInstallmentCount).toFixed(2)) : value
    const nextChargeDate = isAnnualPlan && finalInstallmentCount > 1 
      ? new Date(new Date(dueDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
      : null
    
    console.log('[DB] Salvando pagamento com:', {
      asaas_payment_id: payment.id,
      asaas_subscription_id: asaasSubscription?.id || null,
      client_id: clientId,
      clinic_id: resolvedClinicId,
      customer_id: customerId,
      plan_id: productId,
      is_installment_plan: isAnnualPlan,
      installment_count: finalInstallmentCount,
      installment_value: installmentValue,
      asaas_card_token: payment.cardToken || null,
      auto_charge_enabled: isAnnualPlan && finalInstallmentCount > 1 && !!payment.cardToken,
      next_charge_date: nextChargeDate
    })
    
    const { error: dbError } = await supabaseClient
      .from('payments')
      .insert({
        asaas_payment_id: payment.id,
        asaas_subscription_id: asaasSubscription?.id || null, // Vincula ao subscription se existir
        client_id: clientId,
        clinic_id: resolvedClinicId,
        customer_id: customerId,
        plan_id: productId,
        value: installmentValue, // Valor da parcela
        status: payment.status,
        billing_type: billingType.toLowerCase(),
        due_date: dueDate,
        description: description || (isAnnualPlan ? `Assinatura Anual PhysioFlow Plus - ${finalInstallmentCount}x de R$ ${installmentValue}` : 'Assinatura PhysioFlow Plus'),
        pix_payload: null, // Será preenchido depois se for PIX
        is_installment_plan: isAnnualPlan, // True se for plano anual
        installment_count: finalInstallmentCount, // Número de parcelas escolhido
        current_installment: 1, // Primeira parcela
        asaas_card_token: payment.cardToken || null, // TOKEN do cartão (NÃO dados reais)
        auto_charge_enabled: isAnnualPlan && !!payment.cardToken, // Auto-charge habilitado se tiver token
        next_charge_date: nextChargeDate, // Próxima cobrança daqui 30 dias
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('[ERROR] Erro ao salvar pagamento no Supabase:', dbError)
      // Não retornar erro aqui pois o pagamento foi criado no Asaas
      // Apenas log do erro para análise posterior
    } else {
      console.log('[SUCCESS] Payment saved successfully in database')
      
      // Atualizar subscription existente da clínica (não criar nova!)
      // A subscription já foi criada no cadastro com status 'trialing'
      if (productId && resolvedClinicId) {
        console.log('[DB] Atualizando subscription existente da clínica:', resolvedClinicId)
        
        const subscriptionUpdateData: any = {
          plan_id: productId, // Atualizar plano escolhido
          billing_period: billingPeriod, // Período de cobrança (quarterly, semiannual, annual)
          status: 'pending_payment', // Aguardando confirmação do pagamento
          updated_at: new Date().toISOString()
        }
        
        // Se for subscription recorrente, vincular ao asaas_subscription_id
        if (!isAnnualPlan && asaasSubscription?.id) {
          subscriptionUpdateData.asaas_subscription_id = asaasSubscription.id
          subscriptionUpdateData.billing_cycle = asaasCycle
        }
        
        const { error: subError } = await supabaseClient
          .from('subscriptions')
          .update(subscriptionUpdateData)
          .eq('clinic_id', resolvedClinicId)
        
        if (subError) {
          console.error('[WARNING] Erro ao atualizar subscription:', subError)
        } else {
          console.log('[SUCCESS] Subscription atualizada:', {
            clinic_id: resolvedClinicId,
            plan_id: productId,
            billing_period: billingPeriod,
            is_annual: isAnnualPlan,
            asaas_subscription_id: asaasSubscription?.id || null
          })
        }
      }
    }

    // Para PIX, buscar QR Code com retry logic
    let pixQrCodeInfo = null
    if (billingType === 'PIX' && payment.id) {
      const maxRetries = 3
      const retryDelay = 2000 // 2 segundos
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[PIX] Tentativa ${attempt}/${maxRetries} - Buscando QR Code para payment:`, payment.id)
          
          // Se não for a primeira tentativa, aguardar um pouco
          if (attempt > 1) {
            console.log(`[PIX] Aguardando ${retryDelay}ms antes da próxima tentativa...`)
            await new Promise(resolve => setTimeout(resolve, retryDelay))
          }
          
          const qrCodeResponse = await fetch(`${asaasBaseUrl}/payments/${payment.id}/pixQrCode`, {
            headers: {
              'access_token': asaasApiKey,
              'Content-Type': 'application/json'
            }
          })

          console.log(`[PIX] QR Code response status (tentativa ${attempt}):`, qrCodeResponse.status)
          
          if (qrCodeResponse.ok) {
            pixQrCodeInfo = await qrCodeResponse.json()
            console.log('[SUCCESS] QR Code obtido com sucesso:', pixQrCodeInfo)
            
            // Atualizar o pagamento com o PIX payload
            if (pixQrCodeInfo?.payload) {
              await supabaseClient
                .from('payments')
                .update({ pix_payload: pixQrCodeInfo.payload })
                .eq('asaas_payment_id', payment.id)
              console.log('[SUCCESS] PIX payload salvo no banco')
            }
            
            break // Sucesso, sair do loop
          } else {
            const errorText = await qrCodeResponse.text()
            console.error(`[ERROR] Erro na resposta QR Code (tentativa ${attempt}):`, errorText)
            
            // Se chegou na última tentativa e ainda não conseguiu
            if (attempt === maxRetries) {
              console.error('[ERROR] Todas as tentativas falharam para obter QR Code')
            }
          }
        } catch (error) {
          console.error(`[ERROR] Erro ao buscar QR Code do PIX (tentativa ${attempt}):`, error)
          
          if (attempt === maxRetries) {
            console.error('[ERROR] Todas as tentativas falharam devido a erros de rede')
          }
        }
      }
    }

    const responsePayload = {
      payment: payment,
      subscription: asaasSubscription,
      pixQrCode: pixQrCodeInfo,
      success: true,
      isAnnual: isAnnualPlan,
      installments: finalInstallmentCount,
      installmentValue: installmentValue
    }

    console.log('[SUCCESS] Pagamento criado com sucesso:', payment.id)

    return new Response(
      JSON.stringify(responsePayload),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error: any) {
    console.error('[ERROR] Error in create-asaas-payment:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
