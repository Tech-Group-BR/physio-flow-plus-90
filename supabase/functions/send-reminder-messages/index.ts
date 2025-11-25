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

    console.log('🔔 Iniciando envio de lembretes...');

    // Buscar clínicas com reminder habilitado
    const { data: clinicsWithSettings, error: clinicsError } = await supabase
      .from('whatsapp_settings')
      .select('*')
      .eq('is_active', true)
      .eq('reminder_enabled', true);

    if (clinicsError || !clinicsWithSettings || clinicsWithSettings.length === 0) {
      console.log('Nenhuma clínica com lembretes habilitados');
      return new Response(
        JSON.stringify({ message: 'Nenhuma clínica com lembretes habilitados' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processando ${clinicsWithSettings.length} clínicas com lembretes ativos`);

    let totalSuccessCount = 0;
    let totalErrorCount = 0;

    for (const settings of clinicsWithSettings) {
      console.log(`Processando clínica ${settings.clinic_id}...`);
      
      // Calcular data/hora para lembretes (baseado em reminder_hours_before)
      const reminderTime = new Date();
      reminderTime.setHours(reminderTime.getHours() + settings.reminder_hours_before);
      const targetDate = reminderTime.toISOString().split('T')[0];
      const targetHour = reminderTime.getHours();

      // Buscar agendamentos desta clínica que precisam de lembrete
      const { data: appointmentsToRemind, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          patients!inner(*),
          professionals!inner(*)
        `)
        .eq('clinic_id', settings.clinic_id)
        .eq('date', targetDate)
        .eq('status', 'confirmado')
        .is('reminder_sent_at', null)
        .is('deleted_at', null)
        .eq('patients.is_active', true);

      if (appointmentsError) {
        console.error(`Erro ao buscar agendamentos da clínica ${settings.clinic_id}:`, appointmentsError);
        totalErrorCount++;
        continue;
      }

      console.log(`Clínica ${settings.clinic_id}: Encontrados ${appointmentsToRemind?.length || 0} agendamentos para lembrete`);

      let clinicSuccessCount = 0;
      let clinicErrorCount = 0;

      for (const appointment of appointmentsToRemind || []) {
        try {
          // Enviar lembrete usando send-whatsapp-message
          const response = await supabase.functions.invoke('send-whatsapp-message', {
            body: {
              appointmentId: appointment.id,
              messageType: 'reminder',
              recipientType: 'patient'
            }
          });

          if (response.error) {
            console.error(`Erro ao enviar lembrete para ${appointment.patients.full_name}:`, response.error);
            clinicErrorCount++;
            continue;
          }

          // Atualizar agendamento com timestamp de lembrete enviado
          await supabase
            .from('appointments')
            .update({ reminder_sent_at: new Date().toISOString() })
            .eq('id', appointment.id);

          clinicSuccessCount++;
          console.log(`Lembrete enviado para ${appointment.patients.full_name}`);

          // Delay para evitar spam
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

    console.log(`Processamento concluído: ${totalSuccessCount} lembretes enviados, ${totalErrorCount} erros`);

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
    console.error('Error in send-reminder-messages:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
