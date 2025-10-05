import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const payload = await req.json()
    
    console.log('Received Asaas webhook:', payload)

    // Log do webhook para auditoria
    const { error: logError } = await supabaseClient
      .from('asaas_webhook_log')
      .insert({
        event_type: payload.event,
        asaas_id: payload.payment?.id || payload.id,
        customer_id: payload.payment?.customer || payload.customer,
        payload: payload,
      })

    if (logError) {
      console.error('Error logging webhook:', logError)
    }

    // Processar diferentes tipos de eventos
    const eventType = payload.event
    const paymentData = payload.payment

    switch (eventType) {
      case 'PAYMENT_CREATED':
        await handlePaymentPending(supabaseClient, paymentData)
        break
      case 'PAYMENT_RECEIVED':
        await handlePaymentReceived(supabaseClient, paymentData)
        break
      case 'PAYMENT_CONFIRMED':
        await handlePaymentConfirmed(supabaseClient, paymentData)
        break
      case 'PAYMENT_OVERDUE':
        await handlePaymentOverdue(supabaseClient, paymentData)
        break
      case 'PAYMENT_REFUNDED':
        await handlePaymentRefunded(supabaseClient, paymentData)
        break
      case 'PAYMENT_DELETED':
        await handlePaymentCanceled(supabaseClient, paymentData)
        break
      case 'PAYMENT_CHARGEBACK_REQUESTED':
        await handleChargebackRequested(supabaseClient, paymentData)
        break
      default:
        console.log(`Unhandled event type: ${eventType}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error processing Asaas webhook:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

// Handler para PENDING - Cobrança criada, aguardando pagamento
async function handlePaymentPending(supabaseClient: any, payment: any) {
  console.log('🔄 Processing payment pending (creating):', payment.id)
  
  // Verificar se já existe o pagamento
  const { data: existingPayment } = await supabaseClient
    .from('payments')
    .select('id')
    .eq('asaas_payment_id', payment.id)
    .maybeSingle()

  if (existingPayment) {
    console.log('ℹ️ Payment already exists, updating status to PENDING')
    const { error: updateError } = await supabaseClient
      .from('payments')
      .update({ 
        status: 'PENDING',
        customer_id: payment.customer,
        updated_at: new Date().toISOString()
      })
      .eq('asaas_payment_id', payment.id)

    if (updateError) {
      console.error('❌ Error updating existing payment to PENDING:', updateError)
    } else {
      console.log('✅ Existing payment updated to PENDING')
    }
    return
  }

  // Buscar informações do cliente para obter clinic_id
  let clientId = null
  let clinicId = null
  
  if (payment.customer) {
    const { data: clientData } = await supabaseClient
      .from('clients')
      .select('id')
      .eq('asaas_customer_id', payment.customer)
      .maybeSingle()
    
    clientId = clientData?.id || null
    
    // Se não encontrou cliente local, tentar buscar clinic_id do externalReference
    if (payment.externalReference) {
      // Assumindo que externalReference pode conter clinic_id como clinic_123
      const clinicMatch = payment.externalReference.match(/clinic_([a-f0-9\-]+)/)
      if (clinicMatch) {
        clinicId = clinicMatch[1]
      }
    }
  }

  // Criar novo registro de pagamento
  const { error: paymentError } = await supabaseClient
    .from('payments')
    .insert({ 
      asaas_payment_id: payment.id,
      status: 'PENDING',
      customer_id: payment.customer,
      client_id: clientId,
      clinic_id: clinicId,
      value: payment.value,
      billing_type: payment.billingType?.toLowerCase() || 'unknown',
      due_date: payment.dueDate,
      description: payment.description || 'Pagamento via Asaas',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

  if (paymentError) {
    console.error('❌ Error creating payment:', paymentError)
  } else {
    console.log('✅ Payment created with PENDING status')
  }
}

// Handler para RECEIVED - Pagamento recebido pelo Asaas
async function handlePaymentReceived(supabaseClient: any, payment: any) {
  console.log('💰 Processing payment received:', payment.id)
  
  // Atualizar status na tabela payments
  // O trigger sync_subscription_from_payment() será automaticamente executado
  // e criará/atualizará a subscription correspondente
  const { error: paymentError } = await supabaseClient
    .from('payments')
    .update({ 
      status: 'RECEIVED',
      customer_id: payment.customer,
      updated_at: new Date().toISOString()
    })
    .eq('asaas_payment_id', payment.id)

  if (paymentError) {
    console.error('❌ Error updating payment to RECEIVED:', paymentError)
  } else {
    console.log('✅ Payment updated to RECEIVED - trigger will sync subscription automatically')
  }

  // NOTA: A subscription será automaticamente criada/atualizada pelo trigger
  // sync_subscription_from_payment() que monitora mudanças na tabela payments
  // Não precisamos gerenciar subscription manualmente aqui
}

// Handler para CONFIRMED - Pagamento liquidado na conta Asaas (confirmação final)
async function handlePaymentConfirmed(supabaseClient: any, payment: any) {
  console.log('✅ Processing payment confirmed:', payment.id)
  
  const { error: paymentError } = await supabaseClient
    .from('payments')
    .update({ 
      status: 'CONFIRMED',
      customer_id: payment.customer,
      updated_at: new Date().toISOString()
    })
    .eq('asaas_payment_id', payment.id)

  if (paymentError) {
    console.error('❌ Error updating payment to CONFIRMED:', paymentError)
    return
  }

  console.log('✅ Payment updated to CONFIRMED')
  // NOTA: Se payment já estava RECEIVED, a subscription já foi ativada pelo trigger
}

// Handler para OVERDUE - Cobrança vencida e não paga
async function handlePaymentOverdue(supabaseClient: any, payment: any) {
  console.log('Processing payment overdue:', payment.id)
  
  const { error: paymentError } = await supabaseClient
    .from('payments')
    .update({ 
      status: 'OVERDUE',
      customer_id: payment.customer,
      updated_at: new Date().toISOString()
    })
    .eq('asaas_payment_id', payment.id)

  if (paymentError) {
    console.error('Error updating payment to OVERDUE:', paymentError)
    return
  }

  console.log('✅ Payment updated to OVERDUE')

  // Buscar o payment para atualizar assinatura
  const { data: paymentRecord, error: fetchError } = await supabaseClient
    .from('payments')
    .select('clinic_id, product_id')
    .eq('asaas_payment_id', payment.id)
    .single()

  if (fetchError) {
    console.error('Error fetching payment record:', fetchError)
    return
  }

  // Marcar assinatura como past_due
  if (paymentRecord?.clinic_id && paymentRecord?.product_id) {
    const { error: subscriptionError } = await supabaseClient
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('clinic_id', paymentRecord.clinic_id)
      .eq('product_id', paymentRecord.product_id)

    if (subscriptionError) {
      console.error('Error updating subscription to past_due:', subscriptionError)
    } else {
      console.log('✅ Subscription marked as past_due')
    }
  }

  // TODO: Enviar notificação de cobrança ao cliente
}

// Handler para REFUNDED - Pagamento foi estornado
async function handlePaymentRefunded(supabaseClient: any, payment: any) {
  console.log('Processing payment refunded:', payment.id)
  
  const { error: paymentError } = await supabaseClient
    .from('payments')
    .update({ 
      status: 'REFUNDED',
      customer_id: payment.customer,
      updated_at: new Date().toISOString()
    })
    .eq('asaas_payment_id', payment.id)

  if (paymentError) {
    console.error('Error updating payment to REFUNDED:', paymentError)
    return
  }

  console.log('✅ Payment updated to REFUNDED')

  // Buscar o payment para revogar acesso
  const { data: paymentRecord, error: fetchError } = await supabaseClient
    .from('payments')
    .select('clinic_id, product_id')
    .eq('asaas_payment_id', payment.id)
    .single()

  if (fetchError) {
    console.error('Error fetching payment record:', fetchError)
    return
  }

  // Revogar acesso - marcar assinatura como canceled
  if (paymentRecord?.clinic_id && paymentRecord?.product_id) {
    const { error: subscriptionError } = await supabaseClient
      .from('subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('clinic_id', paymentRecord.clinic_id)
      .eq('product_id', paymentRecord.product_id)

    if (subscriptionError) {
      console.error('Error canceling subscription:', subscriptionError)
    } else {
      console.log('✅ Subscription canceled due to refund')
    }
  }
}

async function handlePaymentCanceled(supabaseClient: any, payment: any) {
  console.log('Processing payment canceled:', payment.id)
  
  const { error } = await supabaseClient
    .from('payments')
    .update({ 
      status: 'CANCELED',
      customer_id: payment.customer,
      updated_at: new Date().toISOString()
    })
    .eq('asaas_payment_id', payment.id)

  if (error) {
    console.error('Error updating payment to CANCELED:', error)
  } else {
    console.log('✅ Payment updated to CANCELED')
  }
}

// Handler para CHARGEBACK_REQUESTED - Cliente contestou a compra
async function handleChargebackRequested(supabaseClient: any, payment: any) {
  console.log('Processing chargeback requested:', payment.id)
  
  const { error: paymentError } = await supabaseClient
    .from('payments')
    .update({ 
      status: 'CHARGEBACK_REQUESTED',
      customer_id: payment.customer,
      updated_at: new Date().toISOString()
    })
    .eq('asaas_payment_id', payment.id)

  if (paymentError) {
    console.error('Error updating payment to CHARGEBACK_REQUESTED:', paymentError)
    return
  }

  console.log('✅ Payment updated to CHARGEBACK_REQUESTED')

  // Buscar o payment para revogar acesso imediatamente
  const { data: paymentRecord, error: fetchError } = await supabaseClient
    .from('payments')
    .select('clinic_id, product_id')
    .eq('asaas_payment_id', payment.id)
    .single()

  if (fetchError) {
    console.error('Error fetching payment record:', fetchError)
    return
  }

  // Revogar acesso imediatamente - marcar assinatura como inactive ou disputed
  if (paymentRecord?.clinic_id && paymentRecord?.product_id) {
    const { error: subscriptionError } = await supabaseClient
      .from('subscriptions')
      .update({
        status: 'disputed',
        updated_at: new Date().toISOString()
      })
      .eq('clinic_id', paymentRecord.clinic_id)
      .eq('product_id', paymentRecord.product_id)

    if (subscriptionError) {
      console.error('Error marking subscription as disputed:', subscriptionError)
    } else {
      console.log('✅ Subscription marked as disputed due to chargeback')
    }
  }
}