import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EvolutionWebhookMessage {
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
    pushName: string;
  };
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

    const webhookData: EvolutionWebhookMessage = await req.json();
    
    console.log('Webhook received:', JSON.stringify(webhookData, null, 2));

    // Verificar se é uma mensagem de texto recebida (não enviada por nós)
    if (webhookData.event !== 'messages.upsert' || webhookData.data.key.fromMe) {
      return new Response(
        JSON.stringify({ message: 'Evento não processado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair texto da mensagem
    const messageText = webhookData.data.message?.conversation || 
                       webhookData.data.message?.extendedTextMessage?.text || '';

    if (!messageText) {
      return new Response(
        JSON.stringify({ message: 'Mensagem sem texto' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair número do telefone
    const remoteJid = webhookData.data.key.remoteJid;
    const phoneNumber = remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '');
    
    // Limpar número (remover código do país se presente)
    let cleanPhone = phoneNumber.replace(/^\+?55/, '');
    if (cleanPhone.length === 11 && cleanPhone.startsWith('55')) {
      cleanPhone = cleanPhone.substring(2);
    }

    console.log('Processing message from:', cleanPhone, 'Text:', messageText);

    // Processar confirmação usando a função do banco
    const { data: result, error } = await supabase.rpc('process_whatsapp_confirmation', {
      p_phone: cleanPhone,
      p_message_content: messageText,
      p_evolution_message_id: webhookData.data.key.id
    });

    if (error) {
      console.error('Error processing confirmation:', error);
      return new Response(
        JSON.stringify({ error: 'Erro ao processar confirmação' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Confirmation processed:', result);

    // Se o agendamento foi confirmado ou cancelado, notificar o fisioterapeuta
    if (result?.success && (result?.action === 'confirmed' || result?.action === 'cancelled')) {
      console.log('🔔 Processando notificação para fisioterapeuta...', result);
      
      if (result.physio_phone) {
        // Buscar configurações para enviar para fisioterapeuta
        const { data: settings, error: settingsError } = await supabase
          .from('whatsapp_settings')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        console.log('⚙️ Settings encontradas:', settings, 'Error:', settingsError);

        if (settings) {
          // Preparar mensagem adequada
          let physioMessage = '';
          
          if (result.action === 'confirmed') {
            physioMessage = `✅ *CONSULTA CONFIRMADA*\n\n👤 Paciente: ${result.patient_name}\n📅 Data: ${new Date(result.appointment_date).toLocaleDateString('pt-BR')}\n🕐 Horário: ${result.appointment_time}\n\n✅ O paciente CONFIRMOU a presença!`;
          } else if (result.action === 'cancelled') {
            physioMessage = `❌ *CONSULTA CANCELADA*\n\n👤 Paciente: ${result.patient_name}\n📅 Data: ${new Date(result.appointment_date).toLocaleDateString('pt-BR')}\n🕐 Horário: ${result.appointment_time}\n\n❌ O paciente CANCELOU a consulta!`;
          }

          const physioPhone = result.physio_phone.replace(/\D/g, '');
          let formattedPhysioPhone = physioPhone;
          
          // Formatação do número para WhatsApp
          if (physioPhone.length === 11) {
            formattedPhysioPhone = `55${physioPhone}`;
          } else if (physioPhone.length === 9) {
            formattedPhysioPhone = `5566${physioPhone}`;
          } else if (!physioPhone.startsWith('55')) {
            formattedPhysioPhone = `55${physioPhone}`;
          }

          console.log('📱 Enviando para fisioterapeuta:', {
            phone: formattedPhysioPhone,
            message: physioMessage.substring(0, 50) + '...'
          });

          try {
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

            console.log('📡 Response status:', physioResponse.status, physioResponse.statusText);

            if (physioResponse.ok) {
              const physioResult = await physioResponse.json();
              console.log('✅ Mensagem enviada para fisioterapeuta:', physioResult);
              
              // Atualizar que fisioterapeuta foi notificado
              await supabase
                .from('appointments')
                .update({
                  physio_message_id: physioResult.key?.id || null,
                  physio_notified_at: new Date().toISOString()
                })
                .eq('id', result.appointment_id);

              // Log da notificação
              await supabase
                .from('whatsapp_logs')
                .insert({
                  appointment_id: result.appointment_id,
                  patient_phone: formattedPhysioPhone,
                  message_type: result.action === 'confirmed' ? 'confirmation_notification' : 'cancellation_notification',
                  message_content: physioMessage,
                  status: 'sent',
                  evolution_message_id: physioResult.key?.id || null
                });

              console.log(`🎉 Fisioterapeuta notificado sobre ${result.action} com sucesso`);
            } else {
              const errorText = await physioResponse.text();
              console.error('❌ Erro na resposta da API:', errorText);
            }
          } catch (error) {
            console.error('❌ Erro ao notificar fisioterapeuta:', error);
          }
        } else {
          console.error('❌ Configurações do WhatsApp não encontradas');
        }
      } else {
        console.error('❌ Telefone do fisioterapeuta não encontrado no resultado');
      }
    } else {
      console.log('ℹ️ Não é uma confirmação/cancelamento válida para notificar fisioterapeuta');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: result?.success || false,
        action: result?.action || 'none'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in whatsapp-webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});