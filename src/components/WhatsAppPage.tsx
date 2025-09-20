import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClinic } from "@/contexts/ClinicContext";
import { supabase } from "@/integrations/supabase/client";

import { WhatsAppTemplates } from "@/components/WhatsAppTemplates";
import { WhatsAppAutomation } from "@/components/WhatsAppAutomation";
import { WhatsAppStats } from "@/components/WhatsAppStats";
import { WhatsAppMessages } from "@/components/WhatsAppMessages";
import { WhatsAppAPIConfig } from "@/components/WhatsAppAPIConfig";
import { WhatsAppWebhookLogs } from "@/components/WhatsAppWebhookLogs";
import { MessageSquare } from "lucide-react";
import { format, addDays } from "date-fns";
import { toast } from "sonner";

interface WhatsAppSettings {
  id?: string;
  instance_name: string;
  api_key: string;
  base_url: string;
  webhook_url: string;
  auto_confirm_enabled: boolean;
  confirmation_template: string;
  reminder_template: string;
  followup_template: string;
  welcome_template: string;
  reminder_hours_before: number;
  confirmation_hours_before: number;
  followup_hours_after: number;
  welcome_enabled: boolean;
  reminder_enabled: boolean;
  followup_enabled: boolean;
  is_active: boolean;
}

export function WhatsAppPage() {
  const { appointments, patients, professionals, updateAppointment } = useClinic();
  
  console.log('WhatsAppPage - patients:', patients.length, 'appointments:', appointments.length);
  console.log('WhatsAppPage - first patient:', patients[0]);
  const [settings, setSettings] = useState<WhatsAppSettings>({
    instance_name: 'livia',
    api_key: 'B3E45D21CD1E-4570-95EB-7F14E5F7FDA4',
    base_url: 'https://api.grupotech.cloud/',
    webhook_url: '',
    auto_confirm_enabled: true,
    confirmation_template: 'Olá {nome}! Você tem consulta marcada para {data} às {horario} com {fisioterapeuta}. Confirme sua presença respondendo SIM.',
    reminder_template: 'Lembrete: Sua consulta é amanhã ({data}) às {horario}. Compareça pontualmente!',
    followup_template: 'Olá {nome}! Como você está se sentindo após a consulta? Lembre-se de seguir as orientações.',
    welcome_template: 'Olá {nome}! Bem-vindo(a) à nossa clínica. Estamos aqui para cuidar da sua saúde!',
    reminder_hours_before: 2,
    confirmation_hours_before: 24,
    followup_hours_after: 24,
    welcome_enabled: true,
    reminder_enabled: true,
    followup_enabled: false,
    is_active: true
  });

  // Dados filtrados
  const todayAppointments = appointments.filter(apt => 
    apt.date === new Date().toISOString().split('T')[0]
  );

  const tomorrowAppointments = appointments.filter(apt => 
    apt.date === format(addDays(new Date(), 1), 'yyyy-MM-dd')
  );

  const pendingConfirmations = appointments.filter(apt => 
    !apt.whatsappConfirmed && apt.status === 'marcado'
  );

  // Estatísticas calculadas
  const todayMessages = todayAppointments.filter(a => a.whatsappSentAt).length;
  const confirmations = appointments.filter(a => a.whatsappConfirmed).length;
  const responseRate = confirmations && pendingConfirmations.length + confirmations > 0
    ? Math.round((confirmations / (pendingConfirmations.length + confirmations)) * 100)
    : 0;

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar configurações:', error);
        return;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const sendWhatsAppMessage = async (appointmentId: string, type: 'confirmation' | 'reminder') => {
    console.log('🔄 Sending WhatsApp message:', { appointmentId, type });
    const appointment = appointments.find(a => a.id === appointmentId);
    const patient = patients.find(p => p.id === appointment?.patientId);
    const professional = professionals.find(p => p.id === appointment?.professionalId);
    
    console.log('📋 Found data:', { 
      appointment: appointment ? { id: appointment.id, patientId: appointment.patientId } : null,
      patient: patient ? { id: patient.id, name: patient.fullName, phone: patient.phone } : null
    });
    
    if (!appointment) {
      console.error('❌ Agendamento não encontrado:', appointmentId);
      toast.error('Agendamento não encontrado');
      return;
    }
    
    if (!patient) {
      console.error('❌ Paciente não encontrado:', appointment.patientId);
      toast.error('Paciente não encontrado');
      return;
    }
    
    try {
      console.log('📤 Calling edge function with:', {
        appointmentId,
        messageType: type,
        recipientType: 'patient'
      });
      
      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          appointmentId,
          messageType: type,
          recipientType: 'patient'
        }
      });

      console.log('📨 Edge function response:', { data, error });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw error;
      }

      await updateAppointment(appointmentId, {
        whatsappSentAt: new Date().toISOString()
      });

      toast.success(`Mensagem enviada para ${patient.fullName}`);
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      toast.error(`Erro ao enviar mensagem via WhatsApp: ${error.message || error}`);
    }
  };

  const testPhysioNotification = async () => {
    try {
      console.log('🧪 Testando notificação para fisioterapeuta...');
      
      const { data, error } = await supabase.functions.invoke('test-direct-physio', {
        body: {}
      });

      if (error) {
        console.error('❌ Erro ao testar notificação:', error);
        toast.error('Erro ao testar notificação: ' + (error.message || 'Erro desconhecido'));
        return;
      }

      console.log('✅ Resultado do teste:', data);
      
      if (data.success) {
        toast.success('🎉 Mensagem de teste enviada para fisioterapeuta! Verifique o WhatsApp dela.');
      } else {
        toast.error(data.error || 'Erro ao enviar notificação');
      }
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      toast.error('Erro ao testar notificação');
    }
  };

  const sendBulkMessages = async (appointmentIds: string[], type: 'confirmation' | 'reminder') => {
    for (const id of appointmentIds) {
      await sendWhatsAppMessage(id, type);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">WhatsApp</h1>
          <p className="text-gray-600 mt-1">Automação de mensagens e configurações</p>
        </div>
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-green-600" />
          <Badge variant={settings.is_active ? "default" : "secondary"}>
            {settings.is_active ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <WhatsAppStats 
        todayMessages={todayMessages}
        confirmations={confirmations}
        pendingConfirmations={pendingConfirmations.length}
        responseRate={responseRate}
      />

      <Tabs defaultValue="messages" className="space-y-6">
        {/* TAB LIST: AQUI ESTÁ A MODIFICAÇÃO CHAVE */}
        <TabsList className="flex flex-wrap h-auto w-full justify-start sm:grid sm:grid-cols-5">
          <TabsTrigger value="messages" className="text-xs sm:text-sm py-2 px-3">
            Mensagens
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-xs sm:text-sm py-2 px-3">
            Templates
          </TabsTrigger>
          <TabsTrigger value="automation" className="text-xs sm:text-sm py-2 px-3">
            Automação
          </TabsTrigger>
          <TabsTrigger value="config" className="text-xs sm:text-sm py-2 px-3">
            Configuração
          </TabsTrigger>
          <TabsTrigger value="logs" className="text-xs sm:text-sm py-2 px-3">
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-6">
          <WhatsAppMessages 
            pendingConfirmations={pendingConfirmations}
            tomorrowAppointments={tomorrowAppointments}
            patients={patients}
            onSendMessage={sendWhatsAppMessage}
            onSendBulkMessages={sendBulkMessages}
          />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <WhatsAppTemplates 
            settings={settings} 
            onSettingsChange={setSettings} 
          />
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <WhatsAppAutomation 
            settings={settings} 
            onSettingsChange={setSettings} 
          />
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <WhatsAppAPIConfig 
            settings={settings} 
            onSettingsChange={setSettings} 
          />
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <WhatsAppWebhookLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
}