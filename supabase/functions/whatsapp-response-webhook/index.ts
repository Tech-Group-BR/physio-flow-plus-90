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
    const isConfirmation = messageText === '1';
    const isCancellation = messageText === '2';
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
    const today = new Date().toISOString().split('T')[0];
    const searchUntil = new Date();
    searchUntil.setDate(searchUntil.getDate() + 14);
    const dateLimit = searchUntil.toISOString().split('T')[0];
    
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
        
      console.log(`📋 Agendamentos encontrados para ${patient.full_name}:`, {
        total: patientAppointments?.length || 0,
        agendamentos: patientAppointments?.map((apt: any) => ({
          id: apt.id,
          date: apt.date,
          time: apt.time,
          clinic_id: apt.clinic_id
        })) || []
      });
      
      // Se encontrou agendamentos para este paciente, usa ele
      if (patientAppointments && patientAppointments.length > 0) {
        patientData = patient;
        foundAppointments = patientAppointments;
        console.log(`✅ Paciente com agendamentos encontrado: ${patient.full_name} (${patientAppointments.length} agendamentos)`);
        break;
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
      const patientFeedbackMessage = isConfirmation ? `✅ Obrigado! \n Sua consulta para ${appointmentDateFormatted} às ${appointmentToUpdate.time} está *CONFIRMADA*.` : `✅ Entendido. \n Sua consulta para ${appointmentDateFormatted} às ${appointmentToUpdate.time} foi *CANCELADA*.`;
      const patientPhone = '55' + cleanPhone;
      fetch(`${settings.base_url}/message/sendText/${settings.instance_name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': settings.api_key
        },
        body: JSON.stringify({
          number: patientPhone,
          text: patientFeedbackMessage
        })
      }).then((res)=>{
        if (res.ok) console.log('✅ Feedback enviado para o paciente.');
        else console.error('⚠️ Falha ao enviar feedback para o paciente.');
      }).catch((err)=>console.error('❌ Erro de rede ao enviar feedback para o paciente:', err));
      // 2. Envia notificação para o FISIOTERAPEUTA
      if (professional?.phone) {
        const statusMessage = isConfirmation ? '✅ CONFIRMADA' : '❌ CANCELADA';
        const physioMessage = `*ATUALIZAÇÃO DE CONSULTA* ${statusMessage}\n\n👤 *Paciente:* ${patientData.full_name}\n📅 *Data:* ${appointmentDateFormatted}\n🕐 *Horário:* ${appointmentToUpdate.time}\n\nO paciente respondeu via WhatsApp.`;
        const physioPhone = '55' + professional.phone.replace(/\D/g, '');
        fetch(`${settings.base_url}/message/sendText/${settings.instance_name}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': settings.api_key
          },
          body: JSON.stringify({
            number: physioPhone,
            text: physioMessage
          })
        }).then((res)=>{
          if (res.ok) console.log('✅ Fisioterapeuta notificado com sucesso.');
          else console.error('⚠️ Falha ao notificar fisioterapeuta.');
        }).catch((err)=>console.error('❌ Erro de rede ao notificar fisioterapeuta:', err));
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

