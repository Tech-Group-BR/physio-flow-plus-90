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

    console.log('Iniciando envio automático de confirmações...');

    // Buscar todas as clínicas ativas com configurações WhatsApp
    const { data: clinicsWithSettings, error: clinicsError } = await supabase
      .from('whatsapp_settings')
      .select('clinic_id, confirmation_hours_before, *')
      .eq('is_active', true);

    if (clinicsError || !clinicsWithSettings || clinicsWithSettings.length === 0) {
      console.log('Nenhuma clínica com configurações WhatsApp ativas encontrada');
      return new Response(
        JSON.stringify({ message: 'Nenhuma clínica com configurações WhatsApp ativas' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processando ${clinicsWithSettings.length} clínicas com WhatsApp ativo`);

    let totalSuccessCount = 0;
    let totalErrorCount = 0;

    // Processar cada clínica separadamente
    for (const settings of clinicsWithSettings) {
      console.log(`Processando clínica ${settings.clinic_id}...`);
      
      // Calcular data/hora para envio de confirmações (baseado nas configurações da clínica)
      const confirmationTime = new Date();
      confirmationTime.setHours(confirmationTime.getHours() + settings.confirmation_hours_before);
      const confirmationDate = confirmationTime.toISOString().split('T')[0];

      // Buscar agendamentos desta clínica que precisam de confirmação
      const { data: appointmentsToConfirm, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          patients!inner(*),
          profiles!appointments_professional_id_fkey(*)
        `)
        .eq('clinic_id', settings.clinic_id)
        .eq('date', confirmationDate)
        .eq('status', 'marcado')
        .is('confirmation_sent_at', null)
        .is('deleted_at', null)
        .eq('patients.is_active', true);

      if (appointmentsError) {
        console.error(`Erro ao buscar agendamentos da clínica ${settings.clinic_id}:`, appointmentsError);
        totalErrorCount++;
        continue;
      }

      console.log(`Clínica ${settings.clinic_id}: Encontrados ${appointmentsToConfirm?.length || 0} agendamentos para envio de confirmação`);

      let clinicSuccessCount = 0;
      let clinicErrorCount = 0;

      // Enviar confirmações para esta clínica
      for (const appointment of appointmentsToConfirm || []) {
        try {
          // Enviar para paciente
          const patientResponse = await supabase.functions.invoke('send-whatsapp-message', {
            body: {
              appointmentId: appointment.id,
              messageType: 'confirmation',
              recipientType: 'patient'
            }
          });

          if (patientResponse.error) {
            console.error(`Erro ao enviar confirmação para paciente ${appointment.patients.full_name}:`, patientResponse.error);
            clinicErrorCount++;
            continue;
          }

          // Enviar notificação para fisioterapeuta
          if (appointment.profiles.phone) {
            await supabase.functions.invoke('send-whatsapp-message', {
              body: {
                appointmentId: appointment.id,
                messageType: 'notification',
                recipientType: 'Professional'
              }
            });
          }

          clinicSuccessCount++;
          console.log(`Confirmação enviada para ${appointment.patients.full_name} (Clínica ${settings.clinic_id})`);

          // Pequeno delay para evitar spam
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`Erro ao processar agendamento ${appointment.id}:`, error);
          clinicErrorCount++;
        }
      }

      totalSuccessCount += clinicSuccessCount;
      totalErrorCount += clinicErrorCount;
      
      console.log(`Clínica ${settings.clinic_id} concluída: ${clinicSuccessCount} sucessos, ${clinicErrorCount} erros`);
    }

    console.log(`Processamento geral concluído: ${totalSuccessCount} sucessos, ${totalErrorCount} erros`);

    return new Response(
      JSON.stringify({ 
        success: true,
        clinicsProcessed: clinicsWithSettings.length,
        totalSuccessful: totalSuccessCount,
        totalErrors: totalErrorCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in auto-send-confirmations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});