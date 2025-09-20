
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, TestTube, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface WhatsAppAPIConfigProps {
  settings: any;
  onSettingsChange: (settings: any) => void;
}

export function WhatsAppAPIConfig({ settings, onSettingsChange }: WhatsAppAPIConfigProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const webhookUrl = `https://chgvegvnyflldpjoummj.supabase.co/functions/v1/whatsapp-response-webhook`;

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      // Usar clinic_id padrão se necessário
      const settingsToSave = {
        ...settings,
        clinic_id: settings.clinic_id || '00000000-0000-0000-0000-000000000001',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('whatsapp_settings')
        .upsert(settingsToSave);

      if (error) throw error;

      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch(`${settings.base_ur}`, {
        method: 'GET',
        headers: {
          'apikey': settings.api_key
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        setTestResult({ success: true, data: result });
        toast.success('Conexão testada com sucesso!');
      } else {
        setTestResult({ success: false, error: result });
        toast.error('Erro na conexão com a API');
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      setTestResult({ success: false, error: error.message });
      toast.error('Erro ao testar conexão');
    } finally {
      setIsTesting(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success('URL do webhook copiada!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Configuração da API WhatsApp</CardTitle>
            <Badge variant={settings.is_active ? "default" : "secondary"}>
              {settings.is_active ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="base_url">URL Base da API</Label>
              <Input
                id="base_url"
                value={settings.base_url}
                onChange={(e) => onSettingsChange({ ...settings, base_url: e.target.value })}
                placeholder="https://api.evolution.com.br/v1"
              />
            </div>
            
            <div>
              <Label htmlFor="instance_name">Nome da Instância</Label>
              <Input
                id="instance_name"
                value={settings.instance_name}
                onChange={(e) => onSettingsChange({ ...settings, instance_name: e.target.value })}
                placeholder="Nome da instância"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="api_key">Token de Acesso</Label>
            <Input
              id="api_key"
              type="password"
              value={settings.api_key}
              onChange={(e) => onSettingsChange({ ...settings, api_key: e.target.value })}
              placeholder="7b5aaa32577d86a7778957722b932265"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={saveSettings} 
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{isLoading ? 'Salvando...' : 'Salvar Configurações'}</span>
            </Button>
            
            <Button 
              onClick={testConnection}
              disabled={isTesting}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <TestTube className="h-4 w-4" />
              <span>{isTesting ? 'Testando...' : 'Testar Conexão'}</span>
            </Button>
          </div>

          {testResult && (
            <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant={testResult.success ? "default" : "destructive"}>
                  {testResult.success ? "Sucesso" : "Erro"}
                </Badge>
              </div>
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(testResult.success ? testResult.data : testResult.error, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook do WhatsApp</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>URL do Webhook</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  value={webhookUrl}
                  readOnly
                  className="bg-gray-50"
                />
                <Button
                  onClick={copyWebhookUrl}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </Button>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Instruções:</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Copie a URL do webhook acima</li>
                <li>2. Acesse as configurações da sua instância no Evolution</li>
                <li>3. Cole a URL no campo de webhook</li>
                <li>4. Ative o webhook para receber mensagens</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
