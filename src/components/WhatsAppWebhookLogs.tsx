import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Eye, RefreshCw, Trash2, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useClinic } from "@/contexts/ClinicContext";

export function WhatsAppWebhookLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [messageTypeFilter, setMessageTypeFilter] = useState<string>('all');
  const { user } = useAuth();
  const { currentUser } = useClinic();

  useEffect(() => {
    loadLogs();
  }, [messageTypeFilter]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const clinicId = currentUser?.clinicId || user?.user_metadata?.clinic_id;
      
      if (!clinicId) {
        setLogs([]);
        return;
      }

      let query = supabase
        .from('whatsapp_logs')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('sent_at', { ascending: false })
        .limit(50);

      // Aplicar filtro por tipo de mensagem se não for "all"
      if (messageTypeFilter !== 'all') {
        query = query.eq('message_type', messageTypeFilter);
      }

      const { data, error } = await query;

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
      const clinicId = currentUser?.clinicId || user?.user_metadata?.clinic_id;
      
      if (!clinicId) {
        toast.error('Erro: Clínica não identificada');
        return;
      }

      const { error } = await supabase
        .from('whatsapp_logs')
        .delete()
        .eq('clinic_id', clinicId);

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
      case 'delivered': return 'bg-blue-100 text-blue-800';
      case 'received': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMessageTypeLabel = (type: string) => {
    switch (type) {
      case 'confirmation': return 'Confirmação';
      case 'reminder': return 'Lembrete';
      case 'response_received': return 'Resposta Recebida';
      case 'professional_notification': return 'Notificação Profissional';
      case 'confirmation_notification': return 'Notificação Confirmação';
      case 'cancellation_notification': return 'Notificação Cancelamento';
      case 'confirmation_feedback': return 'Feedback Confirmação';
      case 'cancellation_feedback': return 'Feedback Cancelamento';
      case 'notification': return 'Notificação';
      default: return type;
    }
  };

  return (
   <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-xl sm:text-2xl font-bold">Logs de Confirmações WhatsApp</CardTitle>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <Select value={messageTypeFilter} onValueChange={setMessageTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="confirmation">Confirmação</SelectItem>
                  <SelectItem value="reminder">Lembrete</SelectItem>
                  <SelectItem value="response_received">Resposta Recebida</SelectItem>
                  <SelectItem value="professional_notification">Notificação Profissional</SelectItem>
                  <SelectItem value="confirmation_notification">Notificação Confirmação</SelectItem>
                  <SelectItem value="cancellation_notification">Notificação Cancelamento</SelectItem>
                  <SelectItem value="confirmation_feedback">Feedback Confirmação</SelectItem>
                  <SelectItem value="cancellation_feedback">Feedback Cancelamento</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={loadLogs}
                disabled={isLoading}
                size="sm"
                variant="outline"
                className="w-full sm:w-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button
                onClick={clearLogs}
                size="sm"
                variant="destructive"
                className="w-full sm:w-auto"
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
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(log.status)}>
                        {log.status}
                      </Badge>
                      <span className="text-sm font-medium">
                        {getMessageTypeLabel(log.message_type)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs sm:text-sm">
                      <span className="text-gray-500">
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
                        <div><strong>Clínica ID:</strong> {log.clinic_id || 'N/A'}</div>
                        {log.error_message && (
                          <div><strong>Erro:</strong> <span className="text-red-600">{log.error_message}</span></div>
                        )}
                        {log.response_content && (
                          <div>
                            <strong>Response Content:</strong>
                            <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                              {(() => {
                                try {
                                  // Tenta fazer parse do JSON se for uma string JSON válida
                                  return JSON.stringify(JSON.parse(log.response_content), null, 2);
                                } catch (error) {
                                  // Se não for JSON válido, mostra como texto simples
                                  return log.response_content;
                                }
                              })()}
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