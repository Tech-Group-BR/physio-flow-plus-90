import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendWelcomeRequest {
  patientId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { patientId }: SendWelcomeRequest = body;

    if (!patientId) {
      return new Response(
        JSON.stringify({ error: 'patientId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('👋 Enviando boas-vindas para paciente:', patientId);

    // Buscar dados do paciente
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    if (patientError || !patient) {
      console.error('❌ Paciente não encontrado:', patientError);
      return new Response(
        JSON.stringify({ error: 'Paciente não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar configurações do WhatsApp da clínica
    console.log('🔍 Buscando configurações WhatsApp para clínica:', patient.clinic_id);
    const { data: settings, error: settingsError } = await supabase
      .from('whatsapp_settings')
      .select('*')
      .eq('clinic_id', patient.clinic_id)
      .eq('is_active', true)
      .single();

    if (settingsError) {
      console.error('❌ Erro ao buscar configurações:', settingsError);
      return new Response(
        JSON.stringify({ error: 'Configurações do WhatsApp não encontradas' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!settings) {
      console.error('❌ Configurações não encontradas');
      return new Response(
        JSON.stringify({ error: 'Configurações do WhatsApp não encontradas' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!settings.welcome_enabled) {
      console.log('⚠️ Boas-vindas não habilitadas para esta clínica');
      return new Response(
        JSON.stringify({ error: 'Boas-vindas não habilitadas para esta clínica' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Configurações WhatsApp encontradas');

    // Verificar se paciente tem telefone
    if (!patient.phone) {
      console.log('⚠️ Paciente sem telefone cadastrado');
      return new Response(
        JSON.stringify({ error: 'Paciente sem telefone cadastrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se existe template
    if (!settings.welcome_template) {
      console.error('❌ Template de boas-vindas não configurado');
      return new Response(
        JSON.stringify({ error: 'Template de boas-vindas não configurado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar nome da clínica na tabela clinic_settings
    console.log('🔍 Buscando dados da clínica:', patient.clinic_id);
    const { data: clinicSettings } = await supabase
      .from('clinic_settings')
      .select('name')
      .eq('id', patient.clinic_id)
      .single();

    const clinicName = clinicSettings?.name || 'nossa clínica';
    console.log('✅ Clínica encontrada:', clinicName);

    // Formatar mensagem
    console.log('📝 Formatando mensagem com template:', settings.welcome_template);
    const message = settings.welcome_template
      .replace(/{nome}/g, patient.full_name)
      .replace(/{clinica}/g, clinicName);
    
    console.log('✅ Mensagem formatada:', message);

    // Limpar e formatar telefone
    console.log('📱 Telefone original:', patient.phone);
    let cleanPhone = patient.phone.replace(/\D/g, '');
    console.log('📱 Telefone limpo:', cleanPhone);
    
    if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
      cleanPhone = cleanPhone.substring(2);
    }
    
    let formattedPhone = cleanPhone;
    if (cleanPhone.length === 10) {
      formattedPhone = '55' + cleanPhone;
    } else if (cleanPhone.length === 11) {
      formattedPhone = '55' + cleanPhone;
    }
    console.log('📱 Telefone formatado:', formattedPhone);

    // Verificar configurações da API
    console.log('🔧 Configurações API:', {
      base_url: settings.base_url,
      instance: settings.instance_name,
      hasApiKey: !!settings.api_key
    });

    // Enviar via Evolution API
    const apiUrl = `${settings.base_url}message/sendText/${settings.instance_name}`;
    console.log('📤 Enviando para:', apiUrl);
    
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': settings.api_key
      },
      body: JSON.stringify({
        number: formattedPhone,
        text: message
      })
    });
    
    console.log('📥 Status da resposta:', apiResponse.status);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      throw new Error(`API WhatsApp erro: ${apiResponse.status} - ${errorText}`);
    }

    const apiResult = await apiResponse.json();
    const messageId = apiResult.key?.id || `msg-${Date.now()}`;

    // Salvar log
    await supabase.from('whatsapp_logs').insert({
      patient_phone: patient.phone,
      message_type: 'welcome',
      message_content: message,
      status: 'delivered',
      evolution_message_id: messageId,
      clinic_id: patient.clinic_id
    });

    // Atualizar paciente - marcar welcome_message como true
    await supabase
      .from('patients')
      .update({ welcome_message: true })
      .eq('id', patientId);

    console.log('✅ Boas-vindas enviadas com sucesso');

    return new Response(
      JSON.stringify({ 
        success: true,
        messageId,
        message: 'Mensagem de boas-vindas enviada com sucesso'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-welcome-message:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
