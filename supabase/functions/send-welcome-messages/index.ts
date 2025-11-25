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

    console.log('👋 Iniciando envio de boas-vindas...');

    // Buscar clínicas com welcome habilitado
    const { data: clinicsWithSettings, error: clinicsError } = await supabase
      .from('whatsapp_settings')
      .select('*')
      .eq('is_active', true)
      .eq('welcome_enabled', true);

    if (clinicsError || !clinicsWithSettings || clinicsWithSettings.length === 0) {
      console.log('Nenhuma clínica com boas-vindas habilitadas');
      return new Response(
        JSON.stringify({ message: 'Nenhuma clínica com boas-vindas habilitadas' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processando ${clinicsWithSettings.length} clínicas com boas-vindas ativas`);

    let totalSuccessCount = 0;
    let totalErrorCount = 0;

    for (const settings of clinicsWithSettings) {
      console.log(`Processando clínica ${settings.clinic_id}...`);
      
      // Buscar pacientes novos (criados nas últimas 24h) que ainda não receberam boas-vindas
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);

      const { data: newPatients, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .eq('clinic_id', settings.clinic_id)
        .eq('is_active', true)
        .gte('created_at', oneDayAgo.toISOString())
        .eq('welcome_message', false);

      if (patientsError) {
        console.error(`Erro ao buscar pacientes da clínica ${settings.clinic_id}:`, patientsError);
        totalErrorCount++;
        continue;
      }

      console.log(`Clínica ${settings.clinic_id}: Encontrados ${newPatients?.length || 0} pacientes novos`);

      let clinicSuccessCount = 0;
      let clinicErrorCount = 0;

      for (const patient of newPatients || []) {
        try {
          // Verificar se paciente tem telefone
          if (!patient.phone) {
            console.log(`Paciente ${patient.id} sem telefone, pulando...`);
            clinicErrorCount++;
            continue;
          }

          // Buscar nome da clínica na tabela clinic_settings
          const { data: clinicSettings } = await supabase
            .from('clinic_settings')
            .select('name')
            .eq('id', settings.clinic_id)
            .single();

          const clinicName = clinicSettings?.name || 'nossa clínica';

          // Formatar mensagem de boas-vindas
          const message = settings.welcome_template
            .replace(/{nome}/g, patient.full_name)
            .replace(/{clinica}/g, clinicName);

          // Limpar e formatar telefone
          let cleanPhone = patient.phone.replace(/\D/g, '');
          if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
            cleanPhone = cleanPhone.substring(2);
          }
          
          let formattedPhone = cleanPhone;
          if (cleanPhone.length === 10) {
            formattedPhone = '55' + cleanPhone;
          } else if (cleanPhone.length === 11) {
            formattedPhone = '55' + cleanPhone;
          }

          // Enviar via Evolution API
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
            patient_phone: patient.phone,
            message_type: 'welcome',
            message_content: message,
            status: 'delivered',
            evolution_message_id: messageId,
            clinic_id: settings.clinic_id
          });

          // Atualizar paciente - marcar welcome_message como true
          await supabase
            .from('patients')
            .update({ welcome_message: true })
            .eq('id', patient.id);

          clinicSuccessCount++;
          console.log(`Boas-vindas enviadas para ${patient.full_name}`);

          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`Erro ao processar paciente ${patient.id}:`, error);
          clinicErrorCount++;
        }
      }

      totalSuccessCount += clinicSuccessCount;
      totalErrorCount += clinicErrorCount;
      
      console.log(`Clínica ${settings.clinic_id}: ${clinicSuccessCount} sucessos, ${clinicErrorCount} erros`);
    }

    console.log(`Processamento concluído: ${totalSuccessCount} boas-vindas enviadas, ${totalErrorCount} erros`);

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
    console.error('Error in send-welcome-messages:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
