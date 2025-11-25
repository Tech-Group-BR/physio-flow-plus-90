import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Send, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface WhatsAppAutomationProps {
  settings: any;
  onSettingsChange: (settings: any) => void;
}

export function WhatsAppAutomation({ settings, onSettingsChange }: WhatsAppAutomationProps) {
  const [isLoading, setIsLoading] = useState(false);

  const saveAutomationSettings = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('whatsapp_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Configurações de automação salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações de automação:', error);
      toast.error('Erro ao salvar configurações de automação');
    } finally {
      setIsLoading(false);
    }
  };

  const runAutoConfirmations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('auto-send-confirmations');
      
      if (error) throw error;
      
      toast.success(`Confirmações: ${data.totalSuccessful} mensagens enviadas com sucesso`);
    } catch (error) {
      console.error('Erro no envio automático:', error);
      toast.error('Erro no envio automático de confirmações');
    } finally {
      setIsLoading(false);
    }
  };

  const runReminders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-reminder-messages');
      
      if (error) throw error;
      
      toast.success(`Lembretes: ${data.successful} mensagens enviadas com sucesso`);
    } catch (error) {
      console.error('Erro no envio de lembretes:', error);
      toast.error('Erro no envio de lembretes');
    } finally {
      setIsLoading(false);
    }
  };

  const runFollowups = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-followup-messages');
      
      if (error) throw error;
      
      toast.success(`Follow-ups: ${data.successful} mensagens enviadas com sucesso`);
    } catch (error) {
      console.error('Erro no envio de follow-ups:', error);
      toast.error('Erro no envio de follow-ups');
    } finally {
      setIsLoading(false);
    }
  };

  const runWelcomeMessages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-welcome-messages');
      
      if (error) throw error;
      
      toast.success(`Boas-vindas: ${data.successful} mensagens enviadas com sucesso`);
    } catch (error) {
      console.error('Erro no envio de boas-vindas:', error);
      toast.error('Erro no envio de boas-vindas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
   <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-xl sm:text-2xl font-bold">Automação de Mensagens</CardTitle>
            <Button
              onClick={saveAutomationSettings}
              disabled={isLoading}
              size="sm"
              className="w-full sm:w-auto flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{isLoading ? 'Salvando...' : 'Salvar Automação'}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {/* Opção de Confirmação */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-lg">Confirmação 24h antes</h3>
                <p className="text-sm text-muted-foreground">
                  Enviar mensagem de confirmação 24 horas antes da consulta
                </p>
              </div>
              <Switch
                checked={settings.welcome_enabled}
                onCheckedChange={(checked) => onSettingsChange({ ...settings, welcome_enabled: checked })}
              />
            </div>

            {/* Opção de Lembrete */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-lg">Lembrete 2h antes</h3>
                <p className="text-sm text-muted-foreground">
                  Enviar lembrete 2 horas antes da consulta
                </p>
              </div>
              <Switch
                checked={settings.reminder_enabled}
                onCheckedChange={(checked) => onSettingsChange({ ...settings, reminder_enabled: checked })}
              />
            </div>

            {/* Opção de Follow-up */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-lg">Follow-up pós consulta</h3>
                <p className="text-sm text-muted-foreground">
                  Enviar mensagem de acompanhamento após a consulta
                </p>
              </div>
              <Switch
                checked={settings.followup_enabled}
                onCheckedChange={(checked) => onSettingsChange({ ...settings, followup_enabled: checked })}
              />
            </div>

            {/* Opção de Boas-Vindas */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-lg">Boas-vindas novos pacientes</h3>
                <p className="text-sm text-muted-foreground">
                  Enviar mensagem de boas-vindas para novos pacientes
                </p>
              </div>
              <Switch
                checked={settings.welcome_enabled}
                onCheckedChange={(checked) => onSettingsChange({ ...settings, welcome_enabled: checked })}
              />
            </div>

            <div className="pt-4 border-t space-y-3">
              <h3 className="font-medium text-lg mb-3">Executar Envios Manualmente</h3>
              
              <Button
                onClick={runAutoConfirmations}
                disabled={isLoading}
                className="w-full"
                variant="default"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Confirmações (24h antes)
              </Button>
              <p className="text-xs text-muted-foreground text-center -mt-2">
                Processa e envia confirmações para agendamentos de amanhã
              </p>

              <Button
                onClick={runReminders}
                disabled={isLoading || !settings.reminder_enabled}
                className="w-full"
                variant="outline"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Lembretes (2h antes)
              </Button>
              <p className="text-xs text-muted-foreground text-center -mt-2">
                Envia lembretes para consultas confirmadas de hoje
              </p>

              <Button
                onClick={runFollowups}
                disabled={isLoading || !settings.followup_enabled}
                className="w-full"
                variant="outline"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Follow-ups Pós-Consulta
              </Button>
              <p className="text-xs text-muted-foreground text-center -mt-2">
                Envia acompanhamento para consultas concluídas ontem
              </p>

              <Button
                onClick={runWelcomeMessages}
                disabled={isLoading || !settings.welcome_enabled}
                className="w-full"
                variant="outline"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Boas-vindas
              </Button>
              <p className="text-xs text-muted-foreground text-center -mt-2">
                Envia mensagens de boas-vindas para pacientes novos (últimas 24h)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}