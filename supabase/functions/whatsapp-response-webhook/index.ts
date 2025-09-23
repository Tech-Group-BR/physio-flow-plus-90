// Importa as funções necessárias do Deno e do Supabase
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

// Define os headers de CORS para permitir que a API seja chamada de qualquer origem
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define a estrutura esperada do payload (dados) que o webhook da Evolution API envia
interface WhatsAppWebhookPayload {
  event: string;
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
  };
}

// Inicia o servidor da Edge Function, que escutará por requisições
serve(async (req) => {
  // Loga a chegada de qualquer requisição para fins de debug
  console.log('🔌 Webhook recebido:', req.method, req.url);

  // O navegador envia uma requisição OPTIONS antes de um POST para verificar as permissões de CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Inicializa o cliente do Supabase para interagir com o banco de dados
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Lê e interpreta o corpo da requisição como JSON
    const payload: WhatsAppWebhookPayload = await req.json();
    console.log('📨 Payload recebido:', JSON.stringify(payload, null, 2));

    // --- Início das Validações e Filtros Essenciais ---

    // Filtro 1: Ignora qualquer evento que não seja uma nova mensagem (`messages.upsert`)
    // ou qualquer mensagem que tenha sido enviada por você mesmo (`fromMe: true`)
    if (payload.event !== 'messages.upsert' || payload.data.key.fromMe) {
      console.log('⚠️ Evento ignorado - não é uma nova mensagem de usuário.');
      return new Response(JSON.stringify({ success: true, message: 'Evento ignorado.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Filtro 2: Extrai o texto da mensagem de forma segura e ignora se estiver vazia
    const messageText = (payload.data.message?.conversation || payload.data.message?.extendedTextMessage?.text || '').trim();
    if (!messageText) {
      console.log('⚠️ Mensagem recebida sem conteúdo de texto.');
      return new Response(JSON.stringify({ success: true, message: 'Mensagem sem texto.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

 
    
    const isConfirmation = messageText === '1';
    const isCancellation = messageText === '2';
    if (!isConfirmation && !isCancellation) {
      console.log('⚠️ Resposta inválida, não é 1 ou 2:', messageText);
      return new Response(JSON.stringify({ success: true, message: 'Resposta não processável.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Resposta válida recebida: "${messageText}"`);

    // --- Início do Processamento da Lógica Principal ---

    // Limpa o número de telefone do remetente para o formato usado no banco de dados
    const remoteJid = payload.data.key.remoteJid;
    const phoneWithCountryCode = remoteJid.match(/\d+/)?.[0] || '';
    const cleanPhone = phoneWithCountryCode.startsWith('55')
      ? phoneWithCountryCode.substring(2)
      : phoneWithCountryCode;

    // Busca o paciente no banco de dados usando o número de telefone
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('id, full_name')
      .eq('phone', cleanPhone)
      .single();

    if (patientError || !patientData) {
      console.error('⚠️ Paciente não encontrado no banco de dados:', cleanPhone, patientError);
      return new Response(JSON.stringify({ success: false, message: 'Paciente não encontrado.' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('✅ Paciente encontrado:', { id: patientData.id, name: patientData.full_name });

    // Busca o agendamento correto para ser atualizado
    const today = new Date().toISOString().split('T')[0];
    const searchUntil = new Date();
    searchUntil.setDate(searchUntil.getDate() + 14); // Define uma janela de busca de 14 dias
    const dateLimit = searchUntil.toISOString().split('T')[0];

    const { data: appointments, error: appointmentError } = await supabase
      .from('appointments')
      .select('id, date, time, professional_id')
      .eq('patient_id', patientData.id)
      .gte('date', today)       // A partir de hoje
      .lte('date', dateLimit)   // Até 14 dias no futuro
      .eq('status', 'marcado')  // Apenas os que estão aguardando confirmação
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (appointmentError || !appointments || appointments.length === 0) {
      console.log('⚠️ Nenhum agendamento pendente encontrado para este paciente.');
      return new Response(JSON.stringify({ success: false, message: 'Nenhum agendamento pendente encontrado.' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Pega o agendamento mais próximo da lista para evitar ambiguidade
    const appointmentToUpdate = appointments[0];
    const newStatus = isConfirmation ? 'confirmado' : 'cancelado';

    console.log(`🔄 Atualizando agendamento [${appointmentToUpdate.id}] para status: ${newStatus}`);

    // Atualiza o agendamento no banco de dados
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        status: newStatus,
        whatsapp_confirmed: isConfirmation,
        patient_confirmed_at: new Date().toISOString()
      })
      .eq('id', appointmentToUpdate.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar agendamento:', updateError);
      return new Response(JSON.stringify({ success: false, error: 'Erro ao atualizar agendamento.' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Agendamento atualizado com sucesso no banco de dados.');

    // --- Início do Envio de Notificações de Feedback ---

    // Busca dados do profissional e configurações da API em paralelo para maior eficiência
    const [professionalResult, settingsResult] = await Promise.all([
      supabase.from('professionals').select('full_name, phone').eq('id', appointmentToUpdate.professional_id).single(),
      supabase.from('whatsapp_settings').select('base_url, instance_name, api_key').eq('is_active', true).limit(1).single()
    ]);

    const professional = professionalResult.data;
    const settings = settingsResult.data;

    // Apenas tenta enviar mensagens se houver uma configuração de API ativa
    if (settings?.api_key) {
      const appointmentDateFormatted = new Date(appointmentToUpdate.date).toLocaleDateString('pt-BR');

      // 1. Envia feedback para o PACIENTE
      const patientFeedbackMessage = isConfirmation
        ? `✅ Obrigado! Sua consulta para ${appointmentDateFormatted} às ${appointmentToUpdate.time} está *CONFIRMADA*.`
        : `✅ Entendido. Sua consulta para ${appointmentDateFormatted} às ${appointmentToUpdate.time} foi *CANCELADA*.`;
      
      const patientPhone = '55' + cleanPhone;
      
      fetch(`${settings.base_url}/message/sendText/${settings.instance_name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': settings.api_key },
        body: JSON.stringify({ number: patientPhone, text: patientFeedbackMessage })
      }).then(res => {
        if (res.ok) console.log('✅ Feedback enviado para o paciente.');
        else console.error('⚠️ Falha ao enviar feedback para o paciente.');
      }).catch(err => console.error('❌ Erro de rede ao enviar feedback para o paciente:', err));

      // 2. Envia notificação para o FISIOTERAPEUTA
      if (professional?.phone) {
        const statusMessage = isConfirmation ? '✅ CONFIRMADA' : '❌ CANCELADA';
        const physioMessage = `*ATUALIZAÇÃO DE CONSULTA* ${statusMessage}\n\n👤 *Paciente:* ${patientData.full_name}\n📅 *Data:* ${appointmentDateFormatted}\n🕐 *Horário:* ${appointmentToUpdate.time}\n\nO paciente respondeu via WhatsApp.`;
        const physioPhone = '55' + professional.phone.replace(/\D/g, '');

        fetch(`${settings.base_url}/message/sendText/${settings.instance_name}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': settings.api_key },
          body: JSON.stringify({ number: physioPhone, text: physioMessage })
        }).then(res => {
          if (res.ok) console.log('✅ Fisioterapeuta notificado com sucesso.');
          else console.error('⚠️ Falha ao notificar fisioterapeuta.');
        }).catch(err => console.error('❌ Erro de rede ao notificar fisioterapeuta:', err));
      }
    }

    /* // Bloco de log que estava dando erro, desativado conforme solicitado.
    // Para reativar, corrija o valor de 'message_type' para um que seja aceito
    // pela sua tabela 'whatsapp_logs'.
    const logMessageType = isConfirmation ? 'confirmation_response' : 'cancellation_response';
    const actionTaken = isConfirmation ? 'confirmed' : 'cancelled';
    const { error: logError } = await supabase.from('whatsapp_logs').insert({
        appointment_id: appointmentToUpdate.id,
        patient_phone: cleanPhone,
        message_type: logMessageType,
        message_content: messageText,
        status: 'processed',
        evolution_message_id: payload.data.key.id,
        response_content: actionTaken
    });
    if (logError) { console.error('⚠️ Erro ao salvar log (não crítico):', logError); }
    */

    // --- Finalização ---
    
    console.log('🎉 Processamento do webhook concluído com sucesso!');
    // Retorna uma resposta de sucesso para a Evolution API, finalizando a requisição.
    return new Response(
      JSON.stringify({ success: true, message: `Agendamento ${newStatus} com sucesso.` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Se ocorrer qualquer erro inesperado não tratado, ele será capturado aqui.
    console.error('❌ Erro crítico no webhook:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno do servidor.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});