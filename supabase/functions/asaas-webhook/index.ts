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
        payload: payload,
      })

    if (logError) {
      console.error('Error logging webhook:', logError)
    }

    // Processar diferentes tipos de eventos
    if (payload.event === 'PAYMENT_RECEIVED') {
      await handlePaymentReceived(supabaseClient, payload.payment)
    } else if (payload.event === 'PAYMENT_OVERDUE') {
      await handlePaymentOverdue(supabaseClient, payload.payment)
    } else if (payload.event === 'PAYMENT_DELETED') {
      await handlePaymentCanceled(supabaseClient, payload.payment)
    } else if (payload.event === 'PAYMENT_REFUNDED') {
      await handlePaymentRefunded(supabaseClient, payload.payment)
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
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

async function handlePaymentReceived(supabaseClient: any, payment: any) {
  console.log('Processing payment received:', payment.id)
  
  const { error } = await supabaseClient
    .from('payments')
    .update({ 
      status: 'RECEIVED',
      updated_at: new Date().toISOString()
    })
    .eq('asaas_payment_id', payment.id)

  if (error) {
    console.error('Error updating payment to RECEIVED:', error)
  }
}

async function handlePaymentOverdue(supabaseClient: any, payment: any) {
  console.log('Processing payment overdue:', payment.id)
  
  const { error } = await supabaseClient
    .from('payments')
    .update({ 
      status: 'OVERDUE',
      updated_at: new Date().toISOString()
    })
    .eq('asaas_payment_id', payment.id)

  if (error) {
    console.error('Error updating payment to OVERDUE:', error)
  }
}

async function handlePaymentCanceled(supabaseClient: any, payment: any) {
  console.log('Processing payment canceled:', payment.id)
  
  const { error } = await supabaseClient
    .from('payments')
    .update({ 
      status: 'CANCELED',
      updated_at: new Date().toISOString()
    })
    .eq('asaas_payment_id', payment.id)

  if (error) {
    console.error('Error updating payment to CANCELED:', error)
  }
}

async function handlePaymentRefunded(supabaseClient: any, payment: any) {
  console.log('Processing payment refunded:', payment.id)
  
  const { error } = await supabaseClient
    .from('payments')
    .update({ 
      status: 'REFUNDED',
      updated_at: new Date().toISOString()
    })
    .eq('asaas_payment_id', payment.id)

  if (error) {
    console.error('Error updating payment to REFUNDED:', error)
  }
}