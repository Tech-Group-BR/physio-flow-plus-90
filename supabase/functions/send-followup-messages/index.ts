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

    console.log('💬 Iniciando envio de follow-ups...');

    // Buscar clínicas com followup habilitado
    const { data: clinicsWithSettings, error: clinicsError } = await supabase
      .from('whatsapp_settings')
      .select('*')
      .eq('is_active', true)
      .eq('followup_enabled', true);

    if (clinicsError || !clinicsWithSettings || clinicsWithSettings.length === 0) {
      console.log('Nenhuma clínica com follow-up habilitado');
      return new Response(
        JSON.stringify({ message: 'Nenhuma clínica com follow-up habilitado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processando ${clinicsWithSettings.length} clínicas com follow-up ativo`);

    let totalSuccessCount = 0;
    let totalErrorCount = 0;

    for (const settings of clinicsWithSettings) {
      console.log(`Processando clínica ${settings.clinic_id}...`);
      
      // Calcular data/hora para follow-ups (baseado em followup_hours_after)
      const followupTime = new Date();
      followupTime.setHours(followupTime.getHours() - settings.followup_hours_after);
      const targetDate = followupTime.toISOString().split('T')[0];

      // Buscar agendamentos concluídos que precisam de follow-up
      const { data: appointmentsForFollowup, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          patients!inner(*),
          professionals!inner(*)
        `)
        .eq('clinic_id', settings.clinic_id)
        .eq('date', targetDate)
        .eq('status', 'concluido')
        .is('followup_sent_at', null)
        .is('deleted_at', null)
        .eq('patients.is_active', true);

      if (appointmentsError) {
        console.error(`Erro ao buscar agendamentos da clínica ${settings.clinic_id}:`, appointmentsError);
        totalErrorCount++;
        continue;
      }

      console.log(`Clínica ${settings.clinic_id}: Encontrados ${appointmentsForFollowup?.length || 0} agendamentos para follow-up`);

      let clinicSuccessCount = 0;
      let clinicErrorCount = 0;

      for (const appointment of appointmentsForFollowup || []) {
        try {
          // Formatar mensagem de follow-up
          const appointmentDate = new Date(appointment.date).toLocaleDateString('pt-BR');
          const firstName = appointment.professionals.full_name?.split(' ')[0]?.toLowerCase() || '';
          const isDra = firstName.endsWith('a') || firstName.includes('maria') || firstName.includes('ana');
          const title = isDra ? 'a Dra.' : 'o Dr.';

          const message = settings.followup_template
            .replace(/{nome}/g, appointment.patients.full_name)
            .replace(/{data}/g, appointmentDate)
            .replace(/{horario}/g, appointment.time.slice(0, 5))
            .replace(/{title}/g, title)
            .replace(/{fisioterapeuta}/g, appointment.professionals.full_name);

          // Enviar via Evolution API
          let cleanPhone = appointment.patients.phone.replace(/\D/g, '');
          if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
            cleanPhone = cleanPhone.substring(2);
          }
          
          let formattedPhone = cleanPhone;
          if (cleanPhone.length === 10) {
            formattedPhone = '55' + cleanPhone;
          } else if (cleanPhone.length === 11) {
            formattedPhone = '55' + cleanPhone;
          }

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

          if (!apiResponse.ok) {
            throw new Error(`API WhatsApp erro: ${apiResponse.status}`);
          }

          const apiResult = await apiResponse.json();
          const messageId = apiResult.key?.id || `msg-${Date.now()}`;

          // Salvar log
          await supabase.from('whatsapp_logs').insert({
            appointment_id: appointment.id,
            patient_phone: appointment.patients.phone,
            message_type: 'followup',
            message_content: message,
            status: 'delivered',
            evolution_message_id: messageId,
            clinic_id: appointment.clinic_id
          });

          // Atualizar agendamento
          await supabase
            .from('appointments')
            .update({ followup_sent_at: new Date().toISOString() })
            .eq('id', appointment.id);

          clinicSuccessCount++;
          console.log(`Follow-up enviado para ${appointment.patients.full_name}`);

          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`Erro ao processar agendamento ${appointment.id}:`, error);
          clinicErrorCount++;
        }
      }

      totalSuccessCount += clinicSuccessCount;
      totalErrorCount += clinicErrorCount;
      
      console.log(`Clínica ${settings.clinic_id}: ${clinicSuccessCount} sucessos, ${clinicErrorCount} erros`);
    }

    console.log(`Processamento concluído: ${totalSuccessCount} follow-ups enviados, ${totalErrorCount} erros`);

    return new Response(
      JSON.stringify({ 
        success: true,
        clinicsProcessed: clinicsWithSettings.length,
        successful: totalSuccessCount,
        errors: totalErrorCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-followup-messages:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
