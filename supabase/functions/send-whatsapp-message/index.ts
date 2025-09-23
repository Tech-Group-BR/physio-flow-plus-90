
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendMessageRequest {
  appointmentId: string;
  messageType: 'confirmation' | 'reminder' | 'notification';
  recipientType: 'patient' | 'Professional';
}

serve(async (req: any) => {
  console.log('🚀 Function started, method:', req.method);

  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS request handled');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📝 Creating Supabase client...');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('📖 Reading request body...');
    const body = await req.json();
    console.log('🔍 Request body received:', JSON.stringify(body));

    const { appointmentId, messageType, recipientType }: SendMessageRequest = body;

    if (!appointmentId) {
      console.error('❌ Missing appointmentId');
      return new Response(
        JSON.stringify({ error: 'appointmentId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Input validation passed:', { appointmentId, messageType, recipientType });

    // Buscar configurações do WhatsApp
    console.log('🔍 Fetching WhatsApp settings...');
    const { data: settings, error: settingsError } = await supabase
      .from('whatsapp_settings')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (settingsError || !settings) {
      console.error('❌ WhatsApp settings error:', settingsError);
      return new Response(
        JSON.stringify({ error: 'Configurações do WhatsApp não encontradas' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ WhatsApp settings found:', {
      instance: settings.instance_name,
      url: settings.base_url,
      hasApiKey: !!settings.api_key
    });

    // Buscar dados do agendamento
    console.log('🔍 Fetching appointment...');
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      console.error('❌ Appointment not found:', appointmentError);
      return new Response(
        JSON.stringify({ error: 'Agendamento não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar dados do paciente
    console.log('🔍 Fetching patient...');
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', appointment.patient_id)
      .single();

    if (patientError || !patient) {
      console.error('❌ Patient not found:', patientError);
      return new Response(
        JSON.stringify({ error: 'Paciente não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Patient found:', {
      name: patient.full_name,
      phone: patient.phone ? `${patient.phone.substring(0, 4)}...` : 'missing'
    });

    // Buscar dados do fisioterapeuta
   console.log('🔍 Fetching Professional...');
const { data: professional, error: physioError } = await supabase
  .from('professionals')
  .select('*')
  .eq('id', appointment.professional_id)
  .single();

// CORREÇÃO APLICADA AQUI
if (physioError || !professional) {
  console.error('❌ Professional not found:', physioError);
  return new Response(
    JSON.stringify({ error: 'Fisioterapeuta do agendamento não encontrado' }),
    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

     

console.log('✅ Professional found:', {
  name: professional.full_name,
  phone: professional.phone ? `${professional.phone.substring(0, 4)}...` : 'missing'
});
    let phoneNumber: string;
    let message: string;
    let templateToUse: string;

     // Detectar se é homem ou mulher pelo nome ou campo gender se existir
      const firstName = professional?.full_name?.split(' ')[0]?.toLowerCase() || '';
      const isDra = firstName.endsWith('a') || firstName.includes('maria') || firstName.includes('ana');
      const title = isDra ? 'a Dra.' : 'o Dr.';

    if (recipientType === 'patient') {
      phoneNumber = patient.phone;

      // Usar template de confirmação com nova formatação
      if (messageType === 'confirmation') {
        templateToUse = 'Olá {nome}! \n\n Você tem consulta marcada para {data} às {horario} com {title} {fisioterapeuta}. \n\n 📝 Para confirmar sua presença: \n\n  Responda: \n  1️⃣ - para CONFIRMAR ✅ \n  2️⃣ - para CANCELAR ❌\n\n Aguardamos sua resposta!';
      } else {
        templateToUse = settings.reminder_template;
      }
    } else {
      // Fisioterapeuta - detectar gênero para usar Dr/Dra
      phoneNumber = professional?.phone || '';



      templateToUse = `🏥 *NOTIFICAÇÃO DE AGENDAMENTO*\n\nOlá {title} {fisioterapeuta}!\n\nVocê tem um novo agendamento:\n👤 Paciente: {paciente}\n📅 Data: {data}\n🕐 Horário: {horario}\n📝 Tipo: {tipo}\n\nO paciente será notificado para confirmação.`;
    }

    if (!phoneNumber) {
      console.error('❌ Phone number not found');
      return new Response(
        JSON.stringify({ error: 'Número de telefone não encontrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Formatar mensagem
    console.log('📝 Formatting message...');
    const appointmentDate = new Date(appointment.date).toLocaleDateString('pt-BR');

    if (recipientType === 'patient') {
      message = templateToUse
        .replace(/{nome}/g, patient.full_name)
        .replace(/{data}/g, appointmentDate)
        .replace(/{horario}/g, appointment.time.slice(0, 5))
        .replace(/{title}/g, title)
        .replace(/{fisioterapeuta}/g, professional.full_name);
    } else {
      // Para fisioterapeuta - detectar título Dr/Dra
      const firstName = professional?.full_name?.split(' ')[0]?.toLowerCase() || '';
      const isDra = firstName.endsWith('a') || firstName.includes('maria') || firstName.includes('ana');
      const title = isDra ? 'a Dra.' : 'o Dr.';

      message = templateToUse
        .replace(/{title}/g, title)
        .replace(/{fisioterapeuta}/g, professional.full_name)
        .replace(/{paciente}/g, patient.full_name)
        .replace(/{data}/g, appointmentDate)
        .replace(/{horario}/g, appointment.time.slice(0, 5))
        .replace(/{tipo}/g, appointment.treatment_type || 'Fisioterapia');
    }

    // Limpar e formatar número de telefone
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    console.log('📱 Phone cleaning process:', {
      original: phoneNumber,
      cleaned: cleanPhone,
      length: cleanPhone.length
    });

    // Formatar número para WhatsApp (sempre 55 + DDD + número)
    let formattedPhone = cleanPhone;

    // Se o número não tem código do país, adicionar 55
    if (cleanPhone.length === 11 && !cleanPhone.startsWith('55')) {
      formattedPhone = '55' + cleanPhone;
    } else if (cleanPhone.length === 10 && !cleanPhone.startsWith('55')) {
      formattedPhone = '55' + cleanPhone;
    } else if (cleanPhone.length === 9 && !cleanPhone.startsWith('55')) {
      // Assumir DDD 66 se só tiver 9 dígitos (número de celular)
      formattedPhone = '5566' + cleanPhone;
    }



    let messageId = '';
    let deliveryStatus = 'sent';

    try {
      console.log('🚀 Sending to WhatsApp API:', {
        url: `${settings.base_url}/message/sendText/${settings.instance_name}`,
        number: formattedPhone,
        messageLength: message.length
      });

      const apiResponse = await fetch(`${settings.base_url}/message/sendText/${settings.instance_name}`, {
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

      console.log('📡 API Response:', {
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        ok: apiResponse.ok
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`API WhatsApp erro: ${apiResponse.status} - ${errorText}`);
      }

      const apiResult = await apiResponse.json();
      console.log('✅ API Success Response:', apiResult);

      messageId = apiResult.key?.id || `msg-${Date.now()}`;
      deliveryStatus = 'delivered';

    } catch (apiError: any) {
      console.error('❌ Erro detalhado na API WhatsApp:', {
        error: apiError.message,
        stack: apiError.stack,
        formattedPhone,
        fullUrl: `${settings.base_url}/message/sendText/${settings.instance_name}`,
        requestBody: JSON.stringify({
          number: formattedPhone,
          text: message
        }),
        settings: {
          baseUrl: settings.base_url,
          instance: settings.instance_name,
          hasApiKey: !!settings.api_key,
          apiKeyLength: settings.api_key?.length || 0
        }
      });
      messageId = `error-${Date.now()}`;
      deliveryStatus = 'failed';

      // Retornar erro específico para debugar
      return new Response(
        JSON.stringify({
          success: false,
          messageId,
          message: `Erro no envio da mensagem: ${apiError.message}`,
          status: 'failed',
          debug: {
            url: `${settings.base_url}/message/sendText/${settings.instance_name}`,
            phone: formattedPhone,
            apiKeyExists: !!settings.api_key,
            error: apiError.message
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Salvar log da mensagem
    const { error: logError } = await supabase
      .from('whatsapp_logs')
      .insert({
        appointment_id: appointmentId,
        patient_phone: phoneNumber,
        message_type: messageType,
        message_content: message,
        status: deliveryStatus,
        evolution_message_id: messageId,
        error_message: deliveryStatus === 'failed' ? 'Erro na API WhatsApp' : null
      });

    if (logError) {
      console.error('❌ Error saving message log:', logError);
    } else {
      console.log('✅ Message log saved');
    }

    // Atualizar agendamento
    const updateField = recipientType === 'patient' ? 'confirmation_message_id' : 'physio_message_id';
    const timestampField = recipientType === 'patient' ? 'confirmation_sent_at' : 'physio_notified_at';

    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        [updateField]: messageId,
        [timestampField]: new Date().toISOString()
      })
      .eq('id', appointmentId);

    if (updateError) {
      console.error('❌ Error updating appointment:', updateError);
    } else {
      console.log('✅ Appointment updated');
    }

    console.log('🎉 Mensagem processada com sucesso');
    return new Response(
      JSON.stringify({
        success: deliveryStatus !== 'failed',
        messageId: messageId,
        message: deliveryStatus === 'failed' ? 'Erro no envio da mensagem' : 'Mensagem enviada com sucesso',
        status: deliveryStatus
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Critical error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    return new Response(
      JSON.stringify({
        error: `Erro interno: ${error.message}`,
        type: 'internal_error',
        details: {
          name: error.name,
          message: error.message
        }
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
