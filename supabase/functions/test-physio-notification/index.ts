import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json().catch(() => ({}));
    const appointmentId = body.appointmentId;

    console.log('🧪 Iniciando notificação para fisioterapeuta...', { appointmentId });

    let appointmentData;
    
    if (appointmentId) {
      // Buscar agendamento específico
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id, date, time, status, whatsapp_confirmed,
          patient:patients(full_name, phone),
          Professional:profiles(full_name, phone)
        `)
        .eq('id', appointmentId)
        .single();
        
      if (error || !data) {
        throw new Error(`Agendamento não encontrado: ${appointmentId}`);
      }
      appointmentData = data;
    } else {
      // Buscar agendamento confirmado não notificado
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id, date, time, status, whatsapp_confirmed,
          patient:patients(full_name, phone),
          Professional:profiles(full_name, phone)
        `)
        .eq('whatsapp_confirmed', true)
        .is('physio_notified_at', null)
        .order('patient_confirmed_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (!data) {
        return new Response(
          JSON.stringify({ 
            success: false,
            message: 'Nenhum agendamento confirmado encontrado para notificar'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      appointmentData = data;
    }

    console.log('📋 Dados do agendamento:', appointmentData);

    // Buscar configurações do WhatsApp da clínica específica
    const { data: settings, error: settingsError } = await supabase
      .from('whatsapp_settings')
      .select('*')
      .eq('clinic_id', appointmentData.clinic_id)
      .eq('is_active', true)
      .maybeSingle();

    console.log('⚙️ Configurações:', settings ? 'encontradas' : 'não encontradas');

    if (!settings) {
      throw new Error('Configurações do WhatsApp não encontradas');
    }

    if (!appointmentData.Professional?.phone) {
      throw new Error('Telefone da fisioterapeuta não encontrado');
    }

    // Preparar mensagem baseada no status
    let physioMessage;
    let action = appointmentData.whatsapp_confirmed ? 'confirmed' : 'cancelled';
    
    if (appointmentData.status === 'confirmado' && appointmentData.whatsapp_confirmed) {
      physioMessage = `✅ *CONSULTA CONFIRMADA*

👤 Paciente: ${appointmentData.patient?.full_name}
📅 Data: ${new Date(appointmentData.date).toLocaleDateString('pt-BR')}
🕐 Horário: ${appointmentData.time}

✅ O paciente CONFIRMOU a presença!`;
    } else if (appointmentData.status === 'cancelado') {
      physioMessage = `❌ *CONSULTA CANCELADA*

👤 Paciente: ${appointmentData.patient?.full_name}
📅 Data: ${new Date(appointmentData.date).toLocaleDateString('pt-BR')}
🕐 Horário: ${appointmentData.time}

❌ O paciente CANCELOU a consulta!`;
      action = 'cancelled';
    } else {
      throw new Error(`Status não reconhecido: ${appointmentData.status}`);
    }

    // Formatação do número
    const physioPhone = appointmentData.Professional.phone.replace(/\D/g, '');
    let formattedPhysioPhone = physioPhone;
    
    if (physioPhone.length === 11) {
      formattedPhysioPhone = `55${physioPhone}`;
    } else if (physioPhone.length === 9) {
      formattedPhysioPhone = `5566${physioPhone}`;
    } else if (!physioPhone.startsWith('55')) {
      formattedPhysioPhone = `55${physioPhone}`;
    }

    console.log('📱 Enviando para:', formattedPhysioPhone);
    console.log('📝 Mensagem:', physioMessage);

    // Enviar mensagem via API
    const whatsappResponse = await fetch(`${settings.base_url}/message/sendText/${settings.instance_name}`, {
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

    console.log('📡 Status da API:', whatsappResponse.status, whatsappResponse.statusText);

    if (!whatsappResponse.ok) {
      const errorText = await whatsappResponse.text();
      console.error('❌ Erro da API:', errorText);
      throw new Error(`API retornou erro: ${whatsappResponse.status} - ${errorText}`);
    }

    const whatsappResult = await whatsappResponse.json();
    console.log('✅ Resposta da API:', whatsappResult);

    // Atualizar agendamento como notificado
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        physio_message_id: whatsappResult.key?.id || null,
        physio_notified_at: new Date().toISOString()
      })
      .eq('id', appointmentData.id);

    if (updateError) {
      console.error('⚠️ Erro ao atualizar agendamento:', updateError);
    }

    // Salvar log
    const { error: logError } = await supabase
      .from('whatsapp_logs')
      .insert({
        appointment_id: appointmentData.id,
        patient_phone: formattedPhysioPhone,
        message_type: 'confirmation',
        message_content: physioMessage,
        status: 'sent',
        evolution_message_id: whatsappResult.key?.id || 'test_' + Date.now(),
        clinic_id: appointmentData.clinic_id
      });

    if (logError) {
      console.error('⚠️ Erro ao salvar log:', logError);
    }

    console.log('🎉 Notificação enviada com sucesso!');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Mensagem enviada com sucesso para fisioterapeuta',
        appointment_id: appointmentData.id,
        phone: formattedPhysioPhone,
        messageId: whatsappResult.key?.id,
        action: action
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});