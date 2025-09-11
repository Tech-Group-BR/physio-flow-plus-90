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

    // Buscar configurações ativas do WhatsApp
    const { data: settings, error: settingsError } = await supabase
      .from('whatsapp_settings')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (settingsError || !settings) {
      console.log('Configurações do WhatsApp não encontradas ou inativas');
      return new Response(
        JSON.stringify({ message: 'Configurações do WhatsApp não encontradas' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calcular data/hora para envio de confirmações (24h antes)
    const confirmationTime = new Date();
    confirmationTime.setHours(confirmationTime.getHours() + settings.confirmation_hours_before);
    const confirmationDate = confirmationTime.toISOString().split('T')[0];

    // Buscar agendamentos que precisam de confirmação
    const { data: appointmentsToConfirm, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        *,
        patients!inner(*),
        profiles!appointments_physiotherapist_id_fkey(*)
      `)
      .eq('date', confirmationDate)
      .eq('status', 'marcado')
      .is('confirmation_sent_at', null)
      .eq('patients.is_active', true);

    if (appointmentsError) {
      console.error('Erro ao buscar agendamentos:', appointmentsError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar agendamentos' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Encontrados ${appointmentsToConfirm?.length || 0} agendamentos para envio de confirmação`);

    let successCount = 0;
    let errorCount = 0;

    // Enviar confirmações
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
          errorCount++;
          continue;
        }

        // Enviar notificação para fisioterapeuta
        if (appointment.profiles.phone) {
          await supabase.functions.invoke('send-whatsapp-message', {
            body: {
              appointmentId: appointment.id,
              messageType: 'notification',
              recipientType: 'physiotherapist'
            }
          });
        }

        successCount++;
        console.log(`Confirmação enviada para ${appointment.patients.full_name}`);

        // Pequeno delay para evitar spam
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Erro ao processar agendamento ${appointment.id}:`, error);
        errorCount++;
      }
    }

    console.log(`Processamento concluído: ${successCount} sucessos, ${errorCount} erros`);

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: appointmentsToConfirm?.length || 0,
        successful: successCount,
        errors: errorCount
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