import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from "../_shared/cors.ts"

const ASAAS_BASE_URL = "https://sandbox.asaas.com/api/v3"
const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')

interface CreateCustomerData {
  name: string
  cpfCnpj: string
  email: string
  phone?: string
  mobilePhone?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { name, cpfCnpj, email, phone, profileId } = await req.json()

    if (!name || !cpfCnpj || !email) {
      return new Response(
        JSON.stringify({ error: 'Dados obrigatórios: name, cpfCnpj, email' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verificar se cliente já existe
    const searchResponse = await fetch(
      `${ASAAS_BASE_URL}/customers?cpfCnpj=${cpfCnpj}`,
      {
        headers: {
          'access_token': ASAAS_API_KEY!,
          'Content-Type': 'application/json'
        }
      }
    )

    const searchData = await searchResponse.json()
    
    // Se cliente já existe, verificar se existe na tabela local
    if (searchData.data && searchData.data.length > 0) {
      console.log('Cliente já existe no Asaas:', searchData.data[0].id)
      
      // Verificar se já existe na tabela clients local
      const { data: existingClient } = await supabaseClient
        .from('clients')
        .select('*')
        .eq('asaas_customer_id', searchData.data[0].id)
        .maybeSingle()
        
      if (!existingClient && profileId) {
        // Salvar cliente na tabela local se não existir
        const { error: clientError } = await supabaseClient
          .from('clients')
          .insert({
            profile_id: profileId,
            asaas_customer_id: searchData.data[0].id,
            cpf_cnpj: cpfCnpj,
            name: name,
            email: email,
            phone: phone || null
          })
          
        if (clientError) {
          console.error('Erro ao salvar cliente na tabela local:', clientError)
        }
      }
      
      return new Response(
        JSON.stringify({ 
          customer: searchData.data[0],
          existed: true 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Criar novo cliente
    const customerData: CreateCustomerData = {
      name,
      cpfCnpj,
      email
    }

    if (phone) {
      // Limpar telefone (remover caracteres especiais)
      const cleanPhone = phone.replace(/\D/g, '')
      if (cleanPhone.length >= 10) {
        customerData.mobilePhone = cleanPhone
      }
    }

    const createResponse = await fetch(`${ASAAS_BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'access_token': ASAAS_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(customerData)
    })

    const responseData = await createResponse.json()

    if (!createResponse.ok) {
      console.error('Erro ao criar cliente no Asaas:', responseData)
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao criar cliente no Asaas',
          details: responseData
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Cliente criado no Asaas:', responseData.id)

    // Salvar cliente na tabela local do Supabase
    if (profileId) {
      const { error: clientError } = await supabaseClient
        .from('clients')
        .insert({
          profile_id: profileId,
          asaas_customer_id: responseData.id,
          cpf_cnpj: cpfCnpj,
          name: name,
          email: email,
          phone: phone || null
        })
        
      if (clientError) {
        console.error('Erro ao salvar cliente na tabela local:', clientError)
        // Não falhar a requisição se houver erro ao salvar localmente
      } else {
        console.log('Cliente salvo na tabela local com sucesso')
      }
    }

    return new Response(
      JSON.stringify({ 
        customer: responseData,
        existed: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Erro no create-asaas-customer:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})