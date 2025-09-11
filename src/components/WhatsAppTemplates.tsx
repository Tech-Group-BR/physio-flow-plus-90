
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface WhatsAppTemplatesProps {
  settings: any;
  onSettingsChange: (settings: any) => void;
}

export function WhatsAppTemplates({ settings, onSettingsChange }: WhatsAppTemplatesProps) {
  const [isLoading, setIsLoading] = useState(false);

  const templates = [
    {
      id: 'confirmation',
      name: 'Confirmação de Consulta',
      message: settings.confirmation_template
    },
    {
      id: 'reminder',
      name: 'Lembrete de Consulta',
      message: settings.reminder_template
    },
    {
      id: 'followup',
      name: 'Follow-up Pós-Consulta',
      message: settings.followup_template
    },
    {
      id: 'welcome',
      name: 'Boas-vindas',
      message: settings.welcome_template
    }
  ];

  const saveTemplates = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('whatsapp_settings')
        .upsert({
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Templates salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar templates:', error);
      toast.error('Erro ao salvar templates');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Templates de Mensagem</CardTitle>
          <Button 
            onClick={saveTemplates} 
            disabled={isLoading}
            size="sm"
            className="flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{isLoading ? 'Salvando...' : 'Salvar Templates'}</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {templates.map((template) => (
          <div key={template.id} className="border rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
              <h3 className="font-medium">{template.name}</h3>
              <Badge variant="outline" className="w-fit">{template.id}</Badge>
            </div>
            <Textarea
              value={template.message}
              onChange={(e) => {
                const newValue = e.target.value;
                if (template.id === 'confirmation') {
                  onSettingsChange({ ...settings, confirmation_template: newValue });
                } else if (template.id === 'reminder') {
                  onSettingsChange({ ...settings, reminder_template: newValue });
                } else if (template.id === 'followup') {
                  onSettingsChange({ ...settings, followup_template: newValue });
                } else if (template.id === 'welcome') {
                  onSettingsChange({ ...settings, welcome_template: newValue });
                }
              }}
              rows={3}
              className="mb-2"
            />
            <p className="text-xs text-muted-foreground">
              Variáveis disponíveis: {'{nome}'}, {'{data}'}, {'{horario}'}, {'{fisioterapeuta}'}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
