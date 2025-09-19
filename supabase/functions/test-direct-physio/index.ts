import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 TESTE DIRETO: Enviando mensagem para fisioterapeuta...');

    // Criar cliente Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar configurações do banco
    const { data: settingsData, error: settingsError } = await supabase
      .from('whatsapp_settings')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    if (settingsError) {
      console.error('❌ Erro ao buscar configurações:', settingsError);
      throw new Error(`Erro ao buscar configurações: ${settingsError.message}`);
    }

    if (!settingsData) {
      console.error('❌ Nenhuma configuração WhatsApp ativa encontrada');
      throw new Error('Nenhuma configuração WhatsApp ativa encontrada');
    }

    const settings = {
      base_url: settingsData.base_url,
      instance_name: settingsData.instance_name,
      api_key: settingsData.api_key
    };

    console.log('✅ Configurações encontradas:', {
      base_url: settings.base_url,
      instance_name: settings.instance_name,
      hasApiKey: !!settings.api_key
    });

    // Dados da fisioterapeuta
    const physioPhone = '66992646592';
    const formattedPhysioPhone = `55${physioPhone}`;

    // Mensagem de teste
    const physioMessage = `🧪 *TESTE DE NOTIFICAÇÃO*

✅ Sistema de notificação funcionando!

📱 Este é um teste direto para verificar se as mensagens chegam até você.

⏰ Enviado em: ${new Date().toLocaleString('pt-BR')}

Se você recebeu esta mensagem, o sistema está funcionando corretamente! 🎉`;

    console.log('📱 Enviando para:', formattedPhysioPhone);
    console.log('📝 Mensagem:', physioMessage);

    // Enviar mensagem via API
    const whatsappResponse = await fetch(`https://api.grupotech.cloud/manager/instance/7b03de0b-0264-40f6-a899-04aed4831530/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'B3E45D21CD1E-4570-95EB-7F14E5F7FDA4'
      },
      body: JSON.stringify({
        number: 5566992646592,
        text: physioMessage
      })
    });

    console.log('📡 Status da API:', whatsappResponse.status, whatsappResponse.statusText);

    if (!whatsappResponse.ok) {
      const errorText = await whatsappResponse.text();
      console.error('❌ Erro da API:', errorText);
      throw new Error(`API retornou erro: ${whatsappResponse.status} - ${errorText}`);
    }

    const whatsappResult = await whatsappResponse.json();
    console.log('✅ Resposta da API:', whatsappResult);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Mensagem de teste enviada com sucesso!',
        phone: formattedPhysioPhone,
        messageId: whatsappResult.key?.id,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro no teste direto:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});