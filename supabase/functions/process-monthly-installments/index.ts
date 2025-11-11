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

    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')
    const asaasBaseUrl = Deno.env.get('ASAAS_BASE_URL')

    if (!asaasApiKey) {
      throw new Error('ASAAS_API_KEY not configured')
    }

    const today = new Date().toISOString().split('T')[0]

    console.log('[CRON] Verificando pagamentos pendentes para hoje:', today)

    // Buscar pagamentos que precisam ser cobrados hoje
    const { data: pendingPayments, error: fetchError } = await supabaseClient
      .from('payments')
      .select('*')
      .eq('auto_charge_enabled', true)
      .eq('is_installment_plan', true)
      .lte('next_charge_date', today)
      .lt('current_installment', 12)
      .eq('status', 'CONFIRMED') // Apenas se a parcela anterior foi confirmada

    if (fetchError) {
      console.error('[ERROR] Erro ao buscar pagamentos pendentes:', fetchError)
      throw fetchError
    }

    console.log(`[INFO] Encontrados ${pendingPayments?.length || 0} pagamentos para processar`)

    const results = []

    for (const originalPayment of pendingPayments || []) {
      try {
        console.log(`[PROCESSING] Processando pagamento ${originalPayment.id} - Parcela ${originalPayment.current_installment + 1}/12`)

        // Criar novo payment no Asaas usando o token
        const nextInstallment = originalPayment.current_installment + 1
        const nextDueDate = new Date(originalPayment.next_charge_date)
        
        const paymentData = {
          customer: originalPayment.customer_id,
          billingType: 'CREDIT_CARD',
          value: originalPayment.value,
          dueDate: nextDueDate.toISOString().split('T')[0],
          description: `Assinatura Anual PhysioFlow Plus - Parcela ${nextInstallment}/12`,
          creditCardToken: originalPayment.asaas_card_token, // USA O TOKEN (seguro!)
        }

        console.log('[ASAAS] Criando cobrança no Asaas com token...')
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
          console.error(`[ERROR] Erro ao criar cobrança no Asaas:`, errorText)
          
          results.push({
            payment_id: originalPayment.id,
            installment: nextInstallment,
            status: 'failed',
            error: errorText
          })
          continue
        }

        const newAsaasPayment = await paymentResponse.json()
        console.log(`[SUCCESS] Cobrança criada no Asaas:`, newAsaasPayment.id)

        // Calcular próxima data de cobrança (mais 30 dias)
        const nextChargeDate = new Date(nextDueDate.getTime() + 30 * 24 * 60 * 60 * 1000)
        const isLastInstallment = nextInstallment >= 12

        // Criar novo registro de payment no banco
        const { error: insertError } = await supabaseClient
          .from('payments')
          .insert({
            asaas_payment_id: newAsaasPayment.id,
            asaas_subscription_id: originalPayment.asaas_subscription_id,
            client_id: originalPayment.client_id,
            clinic_id: originalPayment.clinic_id,
            customer_id: originalPayment.customer_id,
            plan_id: originalPayment.plan_id,
            value: originalPayment.value,
            status: newAsaasPayment.status,
            billing_type: 'credit_card',
            due_date: nextDueDate.toISOString().split('T')[0],
            description: `Assinatura Anual PhysioFlow Plus - Parcela ${nextInstallment}/12`,
            is_installment_plan: true,
            installment_count: 12,
            current_installment: nextInstallment,
            asaas_card_token: originalPayment.asaas_card_token,
            auto_charge_enabled: !isLastInstallment, // Desabilitar se for última parcela
            next_charge_date: isLastInstallment ? null : nextChargeDate.toISOString().split('T')[0],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (insertError) {
          console.error('[ERROR] Erro ao salvar novo payment:', insertError)
        } else {
          console.log(`[SUCCESS] Parcela ${nextInstallment}/12 salva no banco`)
        }

        results.push({
          payment_id: originalPayment.id,
          installment: nextInstallment,
          status: 'success',
          asaas_payment_id: newAsaasPayment.id
        })

      } catch (error) {
        console.error(`[ERROR] Erro ao processar pagamento ${originalPayment.id}:`, error)
        results.push({
          payment_id: originalPayment.id,
          status: 'failed',
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results: results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('[ERROR] Erro geral:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
