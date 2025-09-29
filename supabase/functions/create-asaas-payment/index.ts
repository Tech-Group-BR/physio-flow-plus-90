import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface PaymentRequest {
  profileId: string // Adicionar profileId obrigatório
  customer: {
    name: string
    email: string
    cpfCnpj: string
  }
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD'
  value: number
  dueDate: string
  description?: string
  productId?: string
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

    const { profileId, customer, billingType, value, dueDate, description, productId }: PaymentRequest = await req.json()

    console.log('Creating payment for:', { profileId, customer: customer.name, value, billingType })

    // 1. Verificar se cliente já existe na Asaas ou criar novo
    let asaasCustomerId = null
    let clientId = null

    // Verificar se cliente já existe no nosso banco vinculado ao profile
    const { data: existingClient } = await supabaseClient
      .from('clients')
      .select('asaas_customer_id, id')
      .eq('profile_id', profileId)
      .single()

    if (existingClient) {
      asaasCustomerId = existingClient.asaas_customer_id
      clientId = existingClient.id
    } else {
      // Criar cliente na Asaas
      const customerResponse = await fetch(`${asaasBaseUrl}/customers`, {
        method: 'POST',
        headers: {
          'access_token': asaasApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: customer.name,
          email: customer.email,
          cpfCnpj: customer.cpfCnpj,
        }),
      })

      if (!customerResponse.ok) {
        const errorText = await customerResponse.text()
        throw new Error(`Failed to create customer: ${errorText}`)
      }

      const customerData = await customerResponse.json()
      asaasCustomerId = customerData.id

      // Salvar cliente no nosso banco
      const { data: newClient, error: clientError } = await supabaseClient
        .from('clients')
        .insert({
          profile_id: profileId, // Vincular ao profile do usuário
          asaas_customer_id: asaasCustomerId,
          cpf_cnpj: customer.cpfCnpj,
          name: customer.name,
          email: customer.email,
        })
        .select('id')
        .single()

      if (clientError) {
        console.error('Error saving client:', clientError)
        throw new Error(`Failed to save client: ${clientError.message}`)
      }

      clientId = newClient.id
    }

    // 2. Criar cobrança na Asaas
    const paymentData: any = {
      customer: asaasCustomerId,
      billingType: billingType,
      value: value,
      dueDate: dueDate,
      description: description || 'GoPhysioTech - Assinatura do Sistema',
    }

    // Configurações específicas por tipo de pagamento
    if (billingType === 'PIX') {
      paymentData.pixAddressKey = Deno.env.get('ASAAS_PIX_KEY') // Chave PIX da conta
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

    // 4. Salvar pagamento no nosso banco
    const { error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        client_id: clientId, // Usar o ID do cliente correto
        product_id: productId || null,
        asaas_payment_id: payment.id,
        status: 'PENDING',
        value: value,
        billing_type: billingType,
        due_date: dueDate,
        pix_payload: pixPayload,
      })

    if (paymentError) {
      console.error('Error saving payment:', paymentError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment: {
          id: payment.id,
          status: payment.status,
          value: payment.value,
          dueDate: payment.dueDate,
          billingType: payment.billingType,
          invoiceUrl: payment.invoiceUrl,
          bankSlipUrl: payment.bankSlipUrl,
          pixQrCodeId: payment.pixQrCodeId,
          pixCopyAndPaste: pixPayload,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
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