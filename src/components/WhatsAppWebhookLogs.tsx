
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Eye, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function WhatsAppWebhookLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_logs')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      toast.error('Erro ao carregar logs do webhook');
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = async () => {
    try {
      const { error } = await supabase
        .from('whatsapp_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      toast.success('Logs limpos com sucesso');
      loadLogs();
    } catch (error) {
      console.error('Erro ao limpar logs:', error);
      toast.error('Erro ao limpar logs');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'received': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMessageTypeLabel = (type: string) => {
    switch (type) {
      case 'confirmation': return 'Confirmação';
      case 'reminder': return 'Lembrete';
      case 'response_received': return 'Resposta Recebida';
      case 'confirmation_notification': return 'Notificação Confirmação';
      case 'cancellation_notification': return 'Notificação Cancelamento';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Logs do Webhook WhatsApp</CardTitle>
            <div className="flex space-x-2">
              <Button
                onClick={loadLogs}
                disabled={isLoading}
                size="sm"
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button
                onClick={clearLogs}
                size="sm"
                variant="destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Logs
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum log encontrado
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(log.status)}>
                        {log.status}
                      </Badge>
                      <span className="text-sm font-medium">
                        {getMessageTypeLabel(log.message_type)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {new Date(log.sent_at).toLocaleString('pt-BR')}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Telefone:</strong> {log.patient_phone}
                  </div>

                  <div className="text-sm">
                    <strong>Mensagem:</strong> {log.message_content}
                  </div>

                  {selectedLog?.id === log.id && (
                    <div className="mt-4 p-3 bg-gray-50 rounded border-t">
                      <div className="text-xs space-y-2">
                        <div><strong>ID:</strong> {log.id}</div>
                        <div><strong>Appointment ID:</strong> {log.appointment_id || 'N/A'}</div>
                        <div><strong>Evolution Message ID:</strong> {log.evolution_message_id || 'N/A'}</div>
                        {log.response_content && (
                          <div>
                            <strong>Response Content:</strong>
                            <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                              {JSON.stringify(JSON.parse(log.response_content), null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
