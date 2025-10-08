import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

// Inicializar Supabase Admin Client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

interface SignupRequest {
  email: string
  password: string
  fullName: string
  phone?: string
  role: string
  clinicName: string
  clinicAddress?: string
  clinicPhone?: string
}

// Função para gerar código único da clínica
function generateClinicCode(): string {
  const chars = '0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Função para verificar se o código já existe
async function isClinicCodeUnique(code: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('clinic_settings')
    .select('clinic_code')
    .eq('clinic_code', code)
    .single()

  // Se não encontrou nenhum dado, e o erro é "no rows", então é único
  if (!data && error && (error.code === 'PGRST116' || error.message?.toLowerCase().includes('no rows'))) {
    return true;
  }
  // Se encontrou dado, não é único
  if (data) return false;
  // Se não há dado nem erro, é único (fallback)
  if (!data && !error) return true;
  // Qualquer outro erro, trate como não único para evitar colisão
  return false;
}

// Gerar código único
async function generateUniqueClinicCode(): Promise<string> {
  let code = generateClinicCode()
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    if (await isClinicCodeUnique(code)) {
      return code
    }
    code = generateClinicCode()
    attempts++
  }

  throw new Error('Não foi possível gerar um código único para a clínica')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestData: SignupRequest = await req.json()
    
    const { 
      email, 
      password, 
      fullName, 
      phone, 
      role, 
      clinicName, 
      clinicAddress, 
      clinicPhone 
    } = requestData

    console.log('📝 Iniciando processo de signup completo:', { email, fullName, clinicName })

    // Validação básica
    if (!email || !password || !fullName || !clinicName) {
      return new Response(
        JSON.stringify({ error: 'Dados obrigatórios: email, password, fullName, clinicName' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 1. Criar clínica primeiro
    console.log('🏥 Criando clínica...')
    const clinicCode = await generateUniqueClinicCode()
    const { data: clinic, error: clinicError } = await supabaseAdmin
      .from('clinic_settings')
      .insert({
        name: clinicName,
        email: email, // Email do admin como email da clínica
        phone: clinicPhone,
        address: clinicAddress,
        clinic_code: clinicCode,
        is_active: true
      })
      .select()
      .single()

    if (clinicError) {
      console.error('❌ Erro ao criar clínica:', clinicError)
      return new Response(
        JSON.stringify({ error: `Erro ao criar clínica: ${clinicError.message}` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    console.log('✅ Clínica criada com ID:', clinic.id, 'Código:', clinicCode)

    // 2. Gerar e-mail sintético e criar usuário no Supabase Auth
    const [name, domain] = email.trim().split('@');
    const syntheticEmail = `${name}+${clinicCode}@${domain}`;
    console.log('🔐 Criando usuário na autenticação com email sintético:', syntheticEmail);
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: syntheticEmail,
      password: password,
      email_confirm: true, 
      user_metadata: {
        full_name: fullName,
        phone: phone,
        role: role || 'admin',
        clinic_code: clinicCode,
        clinic_id: clinic.id,
        is_active: true
      }
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário:', authError);
      // Cleanup: remover clínica se criação do usuário falhou
      await supabaseAdmin.from('clinic_settings').delete().eq('id', clinic.id);
      return new Response(
        JSON.stringify({ error: `Erro ao criar usuário: ${authError.message}` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    console.log('✅ Usuário criado com ID:', authUser.user.id);

    // 2.1 Criar perfil e dar permissões de admin automaticamente
    console.log('👑 Configurando perfil como admin...')
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email: email, // Email real do usuário
        full_name: fullName,
        phone: phone,
        role: 'admin', // Sempre admin para quem cria a clínica
        clinic_id: clinic.id,
        is_active: true
      })

    if (profileError) {
      console.error('❌ Erro ao criar perfil:', profileError);
      // Cleanup
      await supabaseAdmin.from('clinic_settings').delete().eq('id', clinic.id);
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return new Response(
        JSON.stringify({ error: `Erro ao criar perfil: ${profileError.message}` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // 2.2 Aplicar permissões de admin
    console.log('🔐 Aplicando permissões de administrador...')
    const { error: permissionsError } = await supabaseAdmin.rpc('apply_role_preset_permissions', {
      target_user_id: authUser.user.id,
      target_role: 'admin'
    });

    if (permissionsError) {
      console.warn('⚠️ Aviso: Erro ao aplicar permissões:', permissionsError.message);
      // Não vamos falhar o signup por isso, mas vamos logar
    } else {
      console.log('✅ Permissões de admin aplicadas com sucesso');
    }

    // 3. Criar dados iniciais da clínica (opcional)
    console.log('📋 Criando configurações iniciais...')
    // Criar sala padrão
    await supabaseAdmin
      .from('rooms')
      .insert({
        name: 'Sala 1',
        capacity: 1,
        clinic_id: clinic.id,
        is_active: true
      })

    // Criar assinatura de teste (trialing)
    console.log('📄 Criando assinatura de teste...')
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 7) // 7 dias de teste
    
    const subscriptionEndDate = new Date()
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30) // 30 dias total

    await supabaseAdmin
      .from('subscriptions')
      .insert({
        clinic_id: clinic.id,
        plan_id: null, // Será definido quando escolher um plano
        status: 'trialing',
        start_date: new Date().toISOString(),
        end_date: trialEndDate.toISOString(),
        trial_ends_at: trialEndDate.toISOString(),
        billing_cycle: 'monthly',
        metadata: {
          signup_date: new Date().toISOString(),
          trial_days: 7
        }
      })

    // Criar configurações do WhatsApp
    console.log('💬 Criando configurações WhatsApp...')
    await supabaseAdmin
      .from('whatsapp_settings')
      .insert({
        instance_name: clinicName,
        api_key: '', // Será configurado posteriormente pelo usuário
        base_url: 'https://api.grupotech.cloud/',
        webhook_url: 'https://vqkooseljxkelclexipo.supabase.co/functions/v1/whatsapp-response-webhook',
        auto_confirm_enabled: true,
        confirmation_template: 'Olá {nome}! Você tem consulta marcada para {data} às {horario} com {fisioterapeuta}. Confirme sua presença respondendo SIM.',
        reminder_template: 'Lembrete: Sua consulta é amanhã ({data}) às {horario}. Compareça pontualmente!',
        followup_template: 'Olá {nome}! Como você está se sentindo após a consulta? Lembre-se de seguir as orientações.',
        welcome_template: 'Olá {nome}! Bem-vindo(a) à nossa clínica. Estamos aqui para cuidar da sua saúde!',
        reminder_hours_before: 2,
        confirmation_hours_before: 24,
        followup_hours_after: 24,
        welcome_enabled: true,
        reminder_enabled: true,
        followup_enabled: false,
        is_active: true,
        integration_enabled: true,
        api_url: 'https://api.grupotech.cloud/',
        api_token: '', // Será configurado posteriormente pelo usuário
        clinic_id: clinic.id
      })

    console.log('✅ Configurações iniciais criadas')

    const responseData = {
      success: true,
      user: {
        id: authUser.user.id,
        email: authUser.user.email,
        full_name: fullName
      },
      clinic: {
        id: clinic.id,
        name: clinic.name,
        clinic_code: clinicCode
      }
      // O perfil será criado automaticamente pela trigger
    }

    console.log('🎉 Signup completo realizado com sucesso!')
    console.log('📤 Retornando dados:', JSON.stringify(responseData, null, 2))

    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('💥 Erro no processo de signup:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno do servidor',
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})