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

    const url = new URL(req.url)
    const paymentId = url.searchParams.get('paymentId')

    if (!paymentId) {
      throw new Error('Payment ID is required')
    }

    // Buscar pagamento no banco local
    const { data: payment, error } = await supabaseClient
      .from('payments')
      .select(`
        *,
        clients(name, email, cpf_cnpj),
        products(name, price)
      `)
      .eq('asaas_payment_id', paymentId)
      .single()

    if (error) {
      throw new Error(`Payment not found: ${error.message}`)
    }

    // Buscar status atualizado na Asaas (opcional)
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')
    const asaasBaseUrl = Deno.env.get('ASAAS_BASE_URL') || 'https://www.asaas.com/api/v3'

    let asaasPayment = null
    if (asaasApiKey) {
      const asaasResponse = await fetch(`${asaasBaseUrl}/payments/${paymentId}`, {
        headers: {
          'access_token': asaasApiKey,
        },
      })

      if (asaasResponse.ok) {
        asaasPayment = await asaasResponse.json()
        
        // Atualizar status local se diferente
        if (asaasPayment.status !== payment.status) {
          await supabaseClient
            .from('payments')
            .update({ 
              status: asaasPayment.status,
              updated_at: new Date().toISOString()
            })
            .eq('id', payment.id)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment: {
          id: payment.id,
          asaasPaymentId: payment.asaas_payment_id,
          status: asaasPayment?.status || payment.status,
          value: payment.value,
          billingType: payment.billing_type,
          dueDate: payment.due_date,
          pixPayload: payment.pix_payload,
          client: payment.clients,
          product: payment.products,
          createdAt: payment.created_at,
          updatedAt: payment.updated_at,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error getting payment status:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})