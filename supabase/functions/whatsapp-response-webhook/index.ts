
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppWebhookPayload {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    message: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
    };
    messageTimestamp: number;
    pushName?: string;
    participant?: string;
  };
}

serve(async (req) => {
  console.log('🔌 Webhook recebido:', req.method, req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: WhatsAppWebhookPayload = await req.json();
    console.log('📨 Payload recebido:', JSON.stringify(payload, null, 2));

    // Verificar se é uma mensagem recebida (não enviada por nós)
    if (payload.event !== 'messages.upsert' || payload.data.key.fromMe) {
      console.log('⚠️ Evento ignorado - não é mensagem recebida');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Evento ignorado - não é mensagem recebida',
          processed: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair informações da mensagem
    const messageText = payload.data.message?.conversation ||
      payload.data.message?.extendedTextMessage?.text || '';

    if (!messageText.trim()) {
      console.log('⚠️ Mensagem sem texto');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Mensagem sem texto',
          processed: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair número do telefone
    const remoteJid = payload.data.key.remoteJid;
    const phoneNumber = remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '');

    // Limpar número (remover código do país se presente)
    let cleanPhone = phoneNumber.replace(/^\+?55/, '');
    if (cleanPhone.length === 11 && cleanPhone.startsWith('55')) {
      cleanPhone = cleanPhone.substring(2);
    }

    console.log('📞 Processando mensagem:', {
      phone: cleanPhone,
      text: messageText,
      messageId: payload.data.key.id,
      remoteJid: remoteJid
    });

    // Buscar paciente pelo telefone
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('id, full_name, phone')
      .eq('phone', cleanPhone)
      .single();

    if (patientError || !patientData) {
      console.log('⚠️ Paciente não encontrado:', cleanPhone, patientError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Paciente não encontrado no banco de dados',
          phone: cleanPhone,
          processed: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Paciente encontrado:', {
      id: patientData.id,
      name: patientData.full_name,
      phone: patientData.phone
    });

    // Verificar se a resposta é "#SIM" ou "#NÃO"
    const isConfirmation = messageText.trim().toUpperCase() === '#SIM';
    const isCancellation = messageText.trim().toUpperCase() === '#NÃO';

    if (!isConfirmation && !isCancellation) {
      console.log('⚠️ Resposta não é confirmação válida:', messageText);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Resposta não é válida. Use #SIM para confirmar ou #NÃO para cancelar',
          received: messageText,
          expected: '#SIM ou #NÃO',
          processed: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Resposta válida recebida:', messageText);

    // Buscar agendamento do paciente (próximos agendamentos marcados)
    const today = new Date();
    const dateFilter = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log('🔍 Buscando agendamentos com filtros:', {
      patient_id: patientData.id,
      date_from: dateFilter
    });

    const { data: appointments, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        id,
        date,
        time,
        status,
        patient_id,
        physiotherapist_id,
        treatment_type
      `)
      .eq('patient_id', patientData.id)
      .gte('date', dateFilter)
      .in('status', ['marcado'])
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    console.log('📊 Resultado da busca:', {
      appointmentsFound: appointments?.length || 0,
      appointments: appointments,
      error: appointmentError
    });

    if (appointmentError || !appointments || appointments.length === 0) {
      console.log('⚠️ Nenhum agendamento encontrado para confirmação');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Nenhum agendamento encontrado para confirmação',
          phone: cleanPhone,
          patient_id: patientData.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Pegar o primeiro agendamento da lista
    const appointment = appointments[0];

    console.log('✅ Agendamento encontrado:', {
      id: appointment.id,
      date: appointment.date,
      time: appointment.time,
      status: appointment.status
    });

    let newStatus: string;
    let action: string;

    if (isConfirmation) {
      newStatus = 'confirmado';
      action = 'confirmed';
      console.log('✅ Confirmando agendamento');
    } else {
      newStatus = 'cancelado';
      action = 'cancelled';
      console.log('❌ Cancelando agendamento');
    }

    // Atualizar status do agendamento
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        status: newStatus,
        whatsapp_confirmed: isConfirmation,
        patient_confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', appointment.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar agendamento:', updateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Erro ao processar confirmação',
          details: updateError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar dados do fisioterapeuta para notificação
    const { data: physiotherapist } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', appointment.physiotherapist_id)
      .single();

    // Buscar configurações do WhatsApp para notificar fisioterapeuta
    const { data: settings } = await supabase
      .from('whatsapp_settings')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let physioNotified = false;

    // Notificar fisioterapeuta se tiver telefone e configurações
    if (physiotherapist?.phone && settings?.api_key) {
      try {
        // Formatar mensagem para fisioterapeuta
        let physioMessage = '';
        
        if (isConfirmation) {
          physioMessage = `✅ *CONSULTA CONFIRMADA*

👤 Paciente: ${patientData.full_name}
📅 Data: ${new Date(appointment.date).toLocaleDateString('pt-BR')}
🕐 Horário: ${appointment.time}

✅ O paciente CONFIRMOU a presença via WhatsApp!`;
        } else {
          physioMessage = `❌ *CONSULTA CANCELADA*

👤 Paciente: ${patientData.full_name}
📅 Data: ${new Date(appointment.date).toLocaleDateString('pt-BR')}
🕐 Horário: ${appointment.time}

❌ O paciente CANCELOU a consulta via WhatsApp!`;
        }

        // Formatar telefone da fisioterapeuta
        const physioPhone = physiotherapist.phone.replace(/\D/g, '');
        let formattedPhysioPhone = physioPhone;
        
        if (physioPhone.length === 11 && !physioPhone.startsWith('55')) {
          formattedPhysioPhone = '55' + physioPhone;
        } else if (physioPhone.length === 9) {
          formattedPhysioPhone = '5566' + physioPhone;
        }

        // Enviar mensagem para fisioterapeuta
        const physioResponse = await fetch(`${settings.base_url}/message/sendText/${settings.instance_name}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': settings.api_key
          },
          body: JSON.stringify({
            number: formattedPhysioPhone,
            text: physioMessage
          })
        });

        if (physioResponse.ok) {
          console.log('✅ Fisioterapeuta notificada com sucesso');
          physioNotified = true;
          
          // Atualizar agendamento com dados da notificação
          await supabase
            .from('appointments')
            .update({
              physio_notified_at: new Date().toISOString()
            })
            .eq('id', appointment.id);
        } else {
          console.log('⚠️ Falha ao notificar fisioterapeuta');
        }
      } catch (error) {
        console.error('❌ Erro ao notificar fisioterapeuta:', error);
      }
    }

    // Salvar log da confirmação
    const { error: logError } = await supabase
      .from('whatsapp_logs')
      .insert({
        appointment_id: appointment.id,
        patient_phone: cleanPhone,
        message_type: 'patient_response',
        message_content: messageText,
        status: 'processed',
        evolution_message_id: payload.data.key.id,
        response_content: action
      });

    if (logError) {
      console.error('⚠️ Erro ao salvar log (não crítico):', logError);
    }

    console.log('🎉 Processamento concluído com sucesso!');

    return new Response(
      JSON.stringify({
        success: true,
        message: isConfirmation ? 'Agendamento confirmado com sucesso' : 'Agendamento cancelado com sucesso',
        processed: true,
        action: action,
        appointment_id: appointment.id,
        patient: {
          id: patientData.id,
          name: patientData.full_name,
          phone: patientData.phone
        },
        appointment: {
          date: appointment.date,
          time: appointment.time,
          status: newStatus
        },
        physio_notified: physioNotified
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erro interno do servidor',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
