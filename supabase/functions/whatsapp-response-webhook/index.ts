// Importa as funções necessárias do Deno e do Supabase
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
// Define os headers de CORS para permitir que a API seja chamada de qualquer origem
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
// Inicia o servidor da Edge Function, que escutará por requisições
serve(async (req)=>{
  // Loga a chegada de qualquer requisição para fins de debug
  console.log('🔌 Webhook recebido:', req.method, req.url);
  // O navegador envia uma requisição OPTIONS antes de um POST para verificar as permissões de CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    // Inicializa o cliente do Supabase para interagir com o banco de dados
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    // Lê e interpreta o corpo da requisição como JSON
    const payload = await req.json();
    console.log('📨 Payload recebido:', JSON.stringify(payload, null, 2));
    // --- Início das Validações e Filtros Essenciais ---
    // Filtro 1: Ignora qualquer evento que não seja uma nova mensagem (`messages.upsert`)
    // ou qualquer mensagem que tenha sido enviada por você mesmo (`fromMe: true`)
    if (payload.event !== 'messages.upsert' || payload.data.key.fromMe) {
      console.log('⚠️ Evento ignorado - não é uma nova mensagem de usuário.');
      return new Response(JSON.stringify({
        success: true,
        message: 'Evento ignorado.'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Filtro 2: Extrai o texto da mensagem de forma segura e ignora se estiver vazia
    const messageText = (payload.data.message?.conversation || payload.data.message?.extendedTextMessage?.text || '').trim();
    if (!messageText) {
      console.log('⚠️ Mensagem recebida sem conteúdo de texto.');
      return new Response(JSON.stringify({
        success: true,
        message: 'Mensagem sem texto.'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
 const normalizarTexto = (messageText: any) => {
  return messageText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
};

const confirmacoes = new Set([
  '1', 'sim', 's', 'ok', 'confirmo', 'confirmado', 'confirma', 'certo',
  'combinado', 'fechado', 'positivo', 'afirmativo', 'isso', 'correto',
  'exato', 'exatamente',

  // Formais / Educados
  'confirmo sim', 'sim confirmo', 'sim confirmado', 'confirmado, obrigado',
  'está confirmado', 'eu confirmo', 'quero confirmar sim', 'pode confirmar',
  'presença confirmada', 'confirmo a presença', 'de acordo',

  // Informais / Gírias
  'blz', 'blza', 'beleza', 'fmz', 'firmeza', 'pdc', 'pode crer', 'demorou',
  'ja e', 'já é', 'fechou', 'show', 'top', 'joia', 'joinha', 'claro', 'com certeza',
  'certeza', 'sem duvida', 'pode pa', 'ta certo', 'ta ok', 'tá ok', 'tá certo',
  'pode contar', 'tamo junto',

  // Respostas a perguntas de confirmação
  'vou', 'quero', 'irei', 'comparecerei', 'estarei presente', 'estarei aí', 'estarei ai',

  // Variações com erros de digitação comuns
  'sin', 'si', 'simm', 'confimado', 'comfirmado', 'okey', 'ok,', 'concerteza',
  'confermo', 'confirnado', 'beleca', 'belza', 'fechadooo',
  'vlw', '👍', '👍🏻', '👍🏼', '👍🏽', '👍🏾', '👍🏿', '👌', '👌🏻', '👌🏼', '👌🏽', '👌🏾', '👌🏿',
  '✅', '✔️', '🆗', '✔', '☑', '🤙', '😉', '😊', '🙂', '😃', '😄'
]);

const cancelamentos = new Set([
'2', 'não', 'nao', 'n', 'cancelo', 'cancelar', 'cancelado', 'errado',
  'incorreto', 'negativo', 'jamais',

  // Formais / Educados
  'quero cancelar', 'pode cancelar', 'não poderei ir', 'nao poderei ir',
  'infelizmente não poderei', 'infelizmente nao poderei', 'solicito o cancelamento',
  'peço para cancelar', 'gostaria de cancelar',

  // Informais
  'não vou', 'nao vou', 'não quero', 'nao quero', 'não vai dar', 'nao vai dar',
  'deixa pra proxima', 'deixa para a próxima', 'foi mal', 'nem rola', 'sem chance',
  'dispenso', 'não, obrigado', 'nao, obrigado',

  // Relacionados a imprevistos
  'imprevisto', 'tive um imprevisto', 'não consigo', 'nao consigo', 'não posso',
  'nao posso', 'não poderei comparecer', 'nao poderei comparecer',

  // Variações com erros de digitação
  'naum', 'ñ', 'nao posso ir', 'canselar', 'cancelá', 'cançelar', 'cancelado',
  'nao vai da', 'imprevisto',

  // Emojis
  '👎', '👎🏻', '👎🏼', '👎🏽', '👎🏾', '👎🏿', // Joinha para baixo
  '❌', '✖', '❎', '✖️',                   // Xis / Errado
  '🚫',                                  // Proibido
]);

const mensagemPaciente = messageText; // Sua variável com a mensagem
const mensagemNormalizada = normalizarTexto(mensagemPaciente);

let isConfirmation = confirmacoes.has(mensagemNormalizada);
let isCancellation = cancelamentos.has(mensagemNormalizada);

if (!isConfirmation && !isCancellation) {
  // Verifica se a frase contém palavras-chave
  const contemConfirmacao = [
  'confirmo',
  'confirmado',
  'confirma',  // A raiz 'confirm' é ótima
  'estarei presente',
  'estarei ai',
  'com certeza',
  'pode contar',
  'tudo certo',
  'presença confirmada',
  'manter o agendamento', // Captura frases como "gostaria de manter o agendamento"
  'ta combinado',
  'ta fechado'
].some(palavra => mensagemNormalizada.includes(palavra));
  const contemCancelamento = [
  'cancelar',   // A raiz 'cancel' é a mais importante
  'cancela',
  'desmarcar',
  'remarcar',  // "Remarcar" implica o cancelamento do horário atual
  'nao posso ir',
  'nao poderei',
  'nao consigo',
  'nao vai dar',
  'nao tenho como ir',
  'outro dia',
  'outra data',
  'tive um imprevisto',
  'nao comparecerei'
].some(palavra => mensagemNormalizada.includes(palavra));

  if (contemConfirmacao && !contemCancelamento) {
      isConfirmation = true;
  } else if (contemCancelamento && !contemConfirmacao) {
      isCancellation = true;
  }
}
    if (!isConfirmation && !isCancellation) {
      console.log('⚠️ Resposta inválida, não é 1 ou 2:', messageText);
      return new Response(JSON.stringify({
        success: true,
        message: 'Resposta não processável.'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log(`✅ Resposta válida recebida: "${messageText}"`);
    // --- Início do Processamento da Lógica Principal ---
    // Limpa o número de telefone do remetente para o formato usado no banco de dados
    const remoteJid = payload.data.key.remoteJid;
    const phoneWithCountryCode = remoteJid.match(/\d+/)?.[0] || '';
    let cleanPhone = phoneWithCountryCode.startsWith('55') ? phoneWithCountryCode.substring(2) : phoneWithCountryCode;
    // Gera variações do número para busca
    const variations = new Set();
    variations.add(cleanPhone);
    // Adiciona/remover 9 após DDD (para celulares)
    if (cleanPhone.length === 10) {
      // Ex: 6696525791 → 66996525791
      variations.add(cleanPhone.slice(0, 2) + '9' + cleanPhone.slice(2));
    }
    if (cleanPhone.length === 11 && cleanPhone[2] === '9') {
      // Ex: 66996525791 → 6696525791
      variations.add(cleanPhone.slice(0, 2) + cleanPhone.slice(3));
    }
    // Adiciona variações com 55
    for (const v of Array.from(variations)){
      if (!v.startsWith('55')) variations.add('55' + v);
    }
    // --- SOLUÇÃO 3: Busca TODOS os pacientes com aquele telefone ---
    console.log('🔍 SOLUÇÃO 3: Buscando TODOS os pacientes com as variações de telefone...');
    
    let allPatientsFound = [];
    let patientError = null;
    
    // Busca todos os pacientes com qualquer variação do telefone
    for (const phone of variations) {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, clinic_id')
        .eq('phone', phone);
        
      if (data && data.length > 0) {
        allPatientsFound.push(...data);
      }
      if (error) patientError = error;
    }
    
    console.log('👥 Pacientes encontrados com este telefone:', {
      total: allPatientsFound.length,
      pacientes: allPatientsFound.map((p: any) => ({
        id: p.id,
        nome: p.full_name,
        clinic_id: p.clinic_id
      }))
    });
    
    if (allPatientsFound.length === 0) {
      console.error('⚠️ Nenhum paciente encontrado no banco de dados (testadas variações):', Array.from(variations).join(', '), patientError);
      return new Response(JSON.stringify({
        success: false,
        message: 'Paciente não encontrado.'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Agora tenta encontrar qual paciente tem agendamentos pendentes
    console.log('🔄 Testando cada paciente para encontrar agendamentos pendentes...');
    
    let patientData = null;
    let foundAppointments = null;
    
    // Definir datas de busca
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
    
    const searchUntil = new Date();
    searchUntil.setDate(searchUntil.getDate() + 14);
    const dateLimit = searchUntil.toISOString().split('T')[0];
    
    console.log(`⏰ Filtro temporal: Hoje: ${today} ${currentTime}, Até: ${dateLimit}`);
    
    for (const patient of allPatientsFound) {
      console.log(`🔍 Testando paciente: ${patient.full_name} (ID: ${patient.id}, Clínica: ${patient.clinic_id})`);
      
      // Busca agendamentos para este paciente
      const { data: patientAppointments, error: appointmentError } = await supabase
        .from('appointments')
        .select('id, date, time, professional_id, clinic_id, status')
        .eq('patient_id', patient.id)
        .gte('date', today)
        .lte('date', dateLimit)
        .eq('status', 'marcado')
        .order('date', { ascending: true })
        .order('time', { ascending: true });
      
      // Filtrar apenas agendamentos futuros (considerando data E hora)
      const futureAppointments = patientAppointments?.filter((apt: any) => {
        const aptDateTime = `${apt.date} ${apt.time}`;
        const nowDateTime = `${today} ${currentTime}`;
        return aptDateTime > nowDateTime;
      }) || [];
        
      console.log(`📋 Agendamentos encontrados para ${patient.full_name}:`, {
        total: futureAppointments.length,
        todosAgendamentos: patientAppointments?.length || 0,
        agendamentosFuturos: futureAppointments.map((apt: any) => ({
          id: apt.id,
          date: apt.date,
          time: apt.time,
          clinic_id: apt.clinic_id
        }))
      });
      
      // Se encontrou agendamentos FUTUROS para este paciente, usa ele
      if (futureAppointments.length > 0) {
        patientData = patient;
        foundAppointments = futureAppointments;
        console.log(`✅ Paciente com agendamentos futuros encontrado: ${patient.full_name} (${futureAppointments.length} agendamentos)`);
        break;
      } else if (patientAppointments && patientAppointments.length > 0) {
        console.log(`⚠️ Paciente ${patient.full_name} tem agendamentos, mas todos já passaram`);
      }
    }
    
    if (!patientData || !foundAppointments) {
      console.log('⚠️ Nenhum dos pacientes encontrados possui agendamentos pendentes no período.');
      return new Response(JSON.stringify({
        success: false,
        message: 'Nenhum agendamento pendente encontrado para este telefone.',
        debug: {
          patientsFound: allPatientsFound.length,
          searchPeriod: `${today} a ${dateLimit}`
        }
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    console.log('✅ Paciente selecionado para processamento:', {
      id: patientData.id,
      name: patientData.full_name,
      clinic_id: patientData.clinic_id,
      appointmentsFound: foundAppointments.length
    });

    // Usa os agendamentos já encontrados
    const appointments = foundAppointments;
    // Pega o agendamento mais próximo da lista para evitar ambiguidade
    const appointmentToUpdate = appointments[0];
    const newStatus = isConfirmation ? 'confirmado' : 'cancelado';
    console.log(`🔄 Atualizando agendamento [${appointmentToUpdate.id}] para status: ${newStatus}`);
    // Atualiza o agendamento no banco de dados
    const { error: updateError } = await supabase.from('appointments').update({
      status: newStatus,
      whatsapp_confirmed: isConfirmation,
      patient_confirmed_at: new Date().toISOString()
    }).eq('id', appointmentToUpdate.id);
    if (updateError) {
      console.error('❌ Erro ao atualizar agendamento:', updateError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro ao atualizar agendamento.'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('✅ Agendamento atualizado com sucesso no banco de dados.');
    
    // Registrar mensagem recebida do paciente no whatsapp_logs
    console.log('📝 Registrando mensagem recebida do paciente no log...');
    const { error: logReceivedError } = await supabase.from('whatsapp_logs').insert({
      appointment_id: appointmentToUpdate.id,
      patient_phone: cleanPhone,
      message_type: 'response_received',
      message_content: `Resposta do paciente: ${messageText}`,
      status: 'delivered',
      response_content: isConfirmation ? 'Confirmado' : 'Cancelado',
      sent_at: new Date().toISOString(),
      clinic_id: patientData.clinic_id
    });
    
    if (logReceivedError) {
      console.warn('⚠️ Erro ao registrar mensagem recebida no log:', logReceivedError);
    } else {
      console.log('✅ Mensagem recebida registrada no log');
    }
    
    // --- Início do Envio de Notificações de Feedback ---
    // Busca dados do profissional e configurações da API em paralelo para maior eficiência
    console.log(`🔍 Buscando configurações WhatsApp para a clínica: ${patientData.clinic_id}`);
    const [professionalResult, settingsResult] = await Promise.all([
      supabase.from('professionals').select('full_name, phone').eq('id', appointmentToUpdate.professional_id).single(),
      supabase.from('whatsapp_settings').select('base_url, instance_name, api_key').eq('clinic_id', patientData.clinic_id).eq('is_active', true).single()
    ]);
    const professional = professionalResult.data;
    const settings = settingsResult.data;
    
    console.log('📄 Resultados da busca:', {
      professional: professional ? { name: professional.full_name, hasPhone: !!professional.phone } : 'Não encontrado',
      settings: settings ? { hasApiKey: !!settings.api_key, instance: settings.instance_name } : 'Não encontrado',
      professionalError: professionalResult.error,
      settingsError: settingsResult.error
    });
    
    // Apenas tenta enviar mensagens se houver uma configuração de API ativa
    if (settings?.api_key) {
      const appointmentDateFormatted = new Date(appointmentToUpdate.date).toLocaleDateString('pt-BR');
      
      // 1. Envia feedback para o PACIENTE
      const patientFeedbackMessage = isConfirmation 
        ? `✅ Obrigado! \n Sua consulta para ${appointmentDateFormatted} às ${appointmentToUpdate.time} está *CONFIRMADA*.` 
        : `✅ Entendido. \n Sua consulta para ${appointmentDateFormatted} às ${appointmentToUpdate.time} foi *CANCELADA*.`;
      
      const patientPhone = '55' + cleanPhone;
      
      console.log('📤 Enviando feedback para paciente:', {
        phone: patientPhone,
        message: patientFeedbackMessage.substring(0, 50) + '...',
        apiUrl: `${settings.base_url}/message/sendText/${settings.instance_name}`
      });
      
      try {
        const patientResponse = await fetch(`${settings.base_url}/message/sendText/${settings.instance_name}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': settings.api_key
          },
          body: JSON.stringify({
            number: patientPhone,
            text: patientFeedbackMessage
          })
        });
        
        const patientResponseData = await patientResponse.json();
        
        if (patientResponse.ok) {
          console.log('✅ Feedback enviado para o paciente com sucesso:', patientResponseData);
          
          // Registrar feedback enviado ao paciente no whatsapp_logs
          const messageId = patientResponseData?.key?.id || patientResponseData?.message?.key?.id;
          await supabase.from('whatsapp_logs').insert({
            appointment_id: appointmentToUpdate.id,
            patient_phone: cleanPhone,
            message_type: isConfirmation ? 'confirmation_feedback' : 'cancellation_feedback',
            message_content: patientFeedbackMessage,
            status: 'delivered',
            evolution_message_id: messageId,
            sent_at: new Date().toISOString(),
            clinic_id: patientData.clinic_id
          });
          console.log('✅ Feedback ao paciente registrado no log');
        } else {
          console.error('⚠️ Falha ao enviar feedback para o paciente. Status:', patientResponse.status, 'Resposta:', patientResponseData);
        }
      } catch (err) {
        console.error('❌ Erro de rede ao enviar feedback para o paciente:', err);
      }
      
      // 2. Envia notificação para o FISIOTERAPEUTA
      if (professional?.phone) {
        const statusMessage = isConfirmation ? '✅ CONFIRMADA' : '❌ CANCELADA';
        const physioMessage = `*ATUALIZAÇÃO DE CONSULTA* ${statusMessage}\n\n👤 *Paciente:* ${patientData.full_name}\n📅 *Data:* ${appointmentDateFormatted}\n🕐 *Horário:* ${appointmentToUpdate.time}\n\nO paciente respondeu via WhatsApp.`;
        const physioPhone = '55' + professional.phone.replace(/\D/g, '');
        
        console.log('📤 Enviando notificação para fisioterapeuta:', {
          phone: physioPhone,
          professional: professional.full_name
        });
        
        try {
          const physioResponse = await fetch(`${settings.base_url}/message/sendText/${settings.instance_name}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': settings.api_key
            },
            body: JSON.stringify({
              number: physioPhone,
              text: physioMessage
            })
          });
          
          const physioResponseData = await physioResponse.json();
          
          if (physioResponse.ok) {
            console.log('✅ Fisioterapeuta notificado com sucesso:', physioResponseData);
            
            // Registrar notificação ao fisioterapeuta no whatsapp_logs
            const messageId = physioResponseData?.key?.id || physioResponseData?.message?.key?.id;
            await supabase.from('whatsapp_logs').insert({
              appointment_id: appointmentToUpdate.id,
              patient_phone: professional.phone.replace(/\D/g, ''), // Telefone do profissional
              message_type: 'professional_notification',
              message_content: physioMessage,
              status: 'delivered',
              evolution_message_id: messageId,
              sent_at: new Date().toISOString(),
              clinic_id: patientData.clinic_id
            });
            console.log('✅ Notificação ao fisioterapeuta registrada no log');
          } else {
            console.error('⚠️ Falha ao notificar fisioterapeuta. Status:', physioResponse.status, 'Resposta:', physioResponseData);
          }
        } catch (err) {
          console.error('❌ Erro de rede ao notificar fisioterapeuta:', err);
        }
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
    */ // --- Finalização ---
    console.log('🎉 Processamento do webhook concluído com sucesso!');
    // Retorna uma resposta de sucesso para a Evolution API, finalizando a requisição.
    return new Response(JSON.stringify({
      success: true,
      message: `Agendamento ${newStatus} com sucesso.`
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    // Se ocorrer qualquer erro inesperado não tratado, ele será capturado aqui.
    console.error('❌ Erro crítico no webhook:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno do servidor.'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});

