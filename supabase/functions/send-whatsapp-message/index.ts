
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendMessageRequest {
  appointmentId: string;
  messageType: 'confirmation' | 'reminder' | 'followup' | 'notification' | 'payment';
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

    // Buscar dados do agendamento primeiro para obter clinic_id
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

    console.log('✅ Appointment found:', { 
      id: appointment.id, 
      clinic_id: appointment.clinic_id,
      patient_id: appointment.patient_id 
    });

    // Buscar configurações do WhatsApp da clínica específica
    console.log('🔍 Fetching WhatsApp settings for clinic:', appointment.clinic_id);
    const { data: settings, error: settingsError } = await supabase
      .from('whatsapp_settings')
      .select('*')
      .eq('clinic_id', appointment.clinic_id)
      .eq('is_active', true)
      .single();

    if (settingsError || !settings) {
      console.error('❌ WhatsApp settings error:', settingsError);
      return new Response(
        JSON.stringify({ error: 'Configurações do WhatsApp não encontradas para esta clínica' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ WhatsApp settings found:', {
      clinic_id: settings.clinic_id,
      instance: settings.instance_name,
      url: settings.base_url,
      hasApiKey: !!settings.api_key
    });

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

      // Usar template baseado no tipo de mensagem - SEMPRE do whatsapp_settings
      if (messageType === 'confirmation') {
        templateToUse = settings.confirmation_template;
      } else if (messageType === 'reminder') {
        templateToUse = settings.reminder_template;
      } else if (messageType === 'followup') {
        templateToUse = settings.followup_template;
      } else if (messageType === 'payment') {
        templateToUse = settings.charge_template || 'Olá {nome}! Identificamos que o pagamento da sua consulta do dia {data} às {horario} no valor de R$ {valor} ainda está pendente. Por favor, regularize sua situação.';
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
        .replace(/{fisioterapeuta}/g, professional.full_name)
        .replace(/{valor}/g, appointment.price ? appointment.price.toFixed(2) : '0,00');
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
    let cleanPhone = phoneNumber.replace(/\D/g, '');
    console.log('📱 Phone cleaning process:', {
      original: phoneNumber,
      cleaned: cleanPhone,
      length: cleanPhone.length
    });

let formattedPhone = cleanPhone; // Começa com o número limpo

// 1. Remover prefixo '55' se já existir e o número for válido para isso
//    Isso simplifica a lógica de adicionar '55' mais tarde.
if (cleanPhone.startsWith('55') && (cleanPhone.length >= 10 && cleanPhone.length <= 13)) {
    cleanPhone = cleanPhone.substring(2); // Remove o '55' para padronizar do DDD pra frente
}

// Agora, 'cleanPhone' deve ser algo como '66992646592', '992646592', '662646592' ou '2646592' (DDD e/ou 9 extra removidos)

// 2. Adicionar o '9' extra para números de celular se estiver faltando e for um número de celular (9 ou 10 dígitos)
//    DDD com 2 dígitos + número de 8 dígitos (fixo) = 10 dígitos
//    DDD com 2 dígitos + número de 9 dígitos (celular) = 11 dígitos
//    Número de celular direto sem DDD = 9 dígitos

if (cleanPhone.length === 8) { // Ex: 2646592 (8 dígitos, sem DDD, sem 9 extra) -> Deve ser 9xxxx-xxxx
    // Se for um número de celular de 8 dígitos sem DDD, adicionar '9' e assumir um DDD.
    // Esta é a parte mais ambígua. É crucial ter certeza de que é um celular e qual DDD usar.
    // Pela sua lógica anterior, você estava assumindo '66'. Vou manter essa premissa.
    // Mas ATENÇÃO: Se não tiver DDD, é melhor pedir para o usuário ou deixar ele digitar o DDD.
    formattedPhone = '55669' + cleanPhone; // Ex: 556692646592
}
else if (cleanPhone.length === 9) { // Ex: 992646592 (9 dígitos, sem DDD)
    // Se começar com 9 (celular), presumir que falta DDD
    // Se começar com 2-8 (fixo), presumir que falta DDD e '9' extra
    // A lógica de adicionar DDD é sempre um chute se não for fornecido.
    // Por isso, se for 9 dígitos e *não* for um '9' de celular, pode ser um fixo sem DDD.
    // Para simplificar, se for 9 dígitos, vamos considerar um celular sem DDD, e adicionar '55' e um DDD padrão (se houver).
    // SE for um celular começando com 9, e você quer adicionar um DDD padrão, faça:
    if (cleanPhone.startsWith('9')) { // Ex: 992646592
        formattedPhone = '5566' + cleanPhone; // Ex: 5566992646592
    } else { // Ex: 26465921 (9 dígitos, provável fixo sem DDD)
        // Se for 9 dígitos e não começar com 9, é um fixo sem DDD. Não adicionar '9'.
        // Adicione apenas DDI e DDD.
        formattedPhone = '5566' + cleanPhone; // Ex: 556626465921 (DDD 66 + Fixo 9 digitos)
    }
}
else if (cleanPhone.length === 10) { // Ex: 662646592 (10 dígitos, DDD + fixo)
    // Se já tem 10 dígitos, provavelmente é DDD + número fixo de 8 dígitos.
    // Não adicionar '9' extra. Adicionar apenas o DDI '55'.
    formattedPhone = '55' + cleanPhone; // Ex: 55662646592
}
else if (cleanPhone.length === 11) { // Ex: 66992646592 (11 dígitos, DDD + celular)
    // Se já tem 11 dígitos, provavelmente é DDD + celular de 9 dígitos.
    // Adicionar apenas o DDI '55'.
    formattedPhone = '55' + cleanPhone; // Ex: 5566992646592
}
// 3. Casos onde o DDI já está presente e o número está completo
else if (cleanPhone.length === 12 && !cleanPhone.startsWith('55')) { // Ex: 55662646592 (já tem 55, mas removemos no começo)
    // Se chegamos aqui com 12 dígitos, significa que era 55XXXXXXXXXX e removemos o 55.
    // Agora precisamos colocar o 55 de volta. Isso é um número fixo.
    formattedPhone = '55' + cleanPhone;
}
else if (cleanPhone.length === 13 && !cleanPhone.startsWith('55')) { // Ex: 5566992646592 (já tem 55, mas removemos no começo)
    // Se chegamos aqui com 13 dígitos, significa que era 55XXXXXXXXXXX e removemos o 55.
    // Agora precisamos colocar o 55 de volta. Isso é um número de celular.
    formattedPhone = '55' + cleanPhone;
}
// Caso para números já formatados (com DDD e 9 extra) ou não reconhecidos
else {
    // Se o número já tem o DDI e DDD corretos, ou se é um formato que não se encaixa nas regras acima,
    // apenas use o cleanPhone original (com o 55 se tiver sido removido e já tinha).
    // Esta parte é crucial para evitar adicionar '55' duas vezes.
    // A melhor forma é garantir que 'cleanPhone' não tenha '55' no início ANTES desta lógica.
    formattedPhone = '55' + cleanPhone; // Assumindo que queremos sempre o '55' no final.
}

// Após toda a lógica, garantir que o DDI '55' está presente uma única vez.
if (!formattedPhone.startsWith('55') && formattedPhone.length >= 10) { // mínimo DDD+8 dígitos
    formattedPhone = '55' + formattedPhone;
}


    let messageId = '';
    let deliveryStatus = 'sent';

    try {
      console.log('🚀 Sending to WhatsApp API:', {
        url: `${settings.base_url}message/sendText/${settings.instance_name}`,
        number: formattedPhone,
        messageLength: message.length
      });

      const apiResponse = await fetch(`${settings.base_url}message/sendText/${settings.instance_name}`, {
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
        fullUrl: `${settings.base_url}message/sendText/${settings.instance_name}`,
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

      // Retornar erro com status 500 para o frontend capturar
      return new Response(
        JSON.stringify({
          error: `Erro no envio: ${apiError.message}`,
          details: {
            url: `${settings.base_url}message/sendText/${settings.instance_name}`,
            phone: formattedPhone,
            apiKeyExists: !!settings.api_key
          }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        error_message: deliveryStatus === 'failed' ? 'Erro na API WhatsApp' : null,
        clinic_id: appointment.clinic_id
      });

    if (logError) {
      console.error('❌ Error saving message log:', logError);
    } else {
      console.log('✅ Message log saved');
    }

    // Atualizar agendamento baseado no tipo de mensagem e destinatário
    let updateData: any = {};

    if (recipientType === 'patient') {
      if (messageType === 'confirmation') {
        updateData = {
          confirmation_message_id: messageId,
          confirmation_sent_at: new Date().toISOString(),
          whatsapp_sent_at: new Date().toISOString(),
          whatsapp_status: 'pending'
        };
      } else if (messageType === 'reminder') {
        updateData = {
          reminder_sent_at: new Date().toISOString()
        };
      } else if (messageType === 'followup') {
        updateData = {
          followup_sent_at: new Date().toISOString()
        };
      }
    } else {
      // Para fisioterapeuta (notificação)
      updateData = {
        physio_message_id: messageId,
        physio_notified_at: new Date().toISOString()
      };
    }

    const { error: updateError } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId);

    if (updateError) {
      console.error('❌ Error updating appointment:', updateError);
    } else {
      console.log('✅ Appointment updated with fields:', Object.keys(updateData));
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
