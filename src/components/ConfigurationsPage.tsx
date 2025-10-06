import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { RoomsManager } from "./RoomsManager";
import { useAuth } from "@/contexts/AuthContext";

export function ConfigurationsPage() {
  const { clinicId } = useAuth();
  const [activeTab, setActiveTab] = useState("general");
  const [isLoading, setIsLoading] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  const [generalSettings, setGeneralSettings] = useState({
    clinicName: 'FisioTech Sistema',
    clinicAddress: 'Rua das Flores, 123, São Paulo - SP',
    clinicPhone: '(11) 99999-9999',
    clinicEmail: 'contato@fisiotech.com.br',
    timezone: 'America/Sao_Paulo',
    language: 'pt-BR',
    dateFormat: 'DD/MM/YYYY',
    consultationPrice: 180.00,
    workingHours: {
      start: '08:00',
      end: '18:00',
      lunchStart: '12:00',
      lunchEnd: '14:00'
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!clinicId) return;
    try {
      const { data, error } = await supabase
        .from('clinic_settings')
        .select('*')
        .eq('id', clinicId) // <-- usa o clinicId como id
        .single();

      if (data) {
        setSettingsId(data.id); // <-- Salva o id real do settings
        const workingHours = data.working_hours as any;
        setGeneralSettings(prev => ({
          ...prev,
          clinicName: data.name || prev.clinicName,
          clinicEmail: data.email || prev.clinicEmail,
          clinicPhone: data.phone || prev.clinicPhone,
          clinicAddress: data.address || prev.clinicAddress,
          consultationPrice: data.consultation_price || prev.consultationPrice,
          timezone: data.timezone || prev.timezone,
          workingHours: (workingHours && workingHours.start) ? workingHours : prev.workingHours
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      if (!settingsId) {
        toast.error('ID das configurações não encontrado!');
        setIsLoading(false);
        return;
      }
      const { error } = await supabase
        .from('clinic_settings')
        .update({
          name: generalSettings.clinicName,
          email: generalSettings.clinicEmail,
          phone: generalSettings.clinicPhone,
          address: generalSettings.clinicAddress,
          consultation_price: generalSettings.consultationPrice,
          timezone: generalSettings.timezone,
          working_hours: generalSettings.workingHours,
          updated_at: new Date().toISOString()
        })
        .eq('id', settingsId); // <-- atualiza pelo id (que é o clinicId)

      if (error) throw error;
      
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER: Título e Botão de Salvar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Configurações do Sistema</h1>
        <Button onClick={saveSettings} disabled={isLoading} className="w-full sm:w-auto">
          <Settings className="h-4 w-4 mr-2" />
          {isLoading ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {/* Tab List responsiva com quebra de linha */}
        <TabsList className="flex flex-wrap h-auto w-full grid-cols-1 sm:grid-cols-2">
          <TabsTrigger value="general" className="w-full sm:w-auto">Configurações Gerais</TabsTrigger>
          <TabsTrigger value="rooms" className="w-full sm:w-auto">Gerenciar Salas</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Informações da Clínica */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Settings className="h-5 w-5" />
                  <span>Informações da Clínica</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="clinicName">Nome da Clínica</Label>
                  <Input
                    id="clinicName"
                    value={generalSettings.clinicName}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, clinicName: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="clinicEmail">Email Principal</Label>
                  <Input
                    id="clinicEmail"
                    type="email"
                    value={generalSettings.clinicEmail}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, clinicEmail: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="clinicPhone">Telefone</Label>
                  <Input
                    id="clinicPhone"
                    value={generalSettings.clinicPhone}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, clinicPhone: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="clinicAddress">Endereço</Label>
                  <Input
                    id="clinicAddress"
                    value={generalSettings.clinicAddress}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, clinicAddress: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Horário de Funcionamento */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Horário de Funcionamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="workStart">Início</Label>
                    <Input
                      id="workStart"
                      type="time"
                      value={generalSettings.workingHours.start}
                      onChange={(e) => setGeneralSettings(prev => ({
                        ...prev,
                        workingHours: { ...prev.workingHours, start: e.target.value }
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="workEnd">Fim</Label>
                    <Input
                      id="workEnd"
                      type="time"
                      value={generalSettings.workingHours.end}
                      onChange={(e) => setGeneralSettings(prev => ({
                        ...prev,
                        workingHours: { ...prev.workingHours, end: e.target.value }
                      }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lunchStart">Início Almoço</Label>
                    <Input
                      id="lunchStart"
                      type="time"
                      value={generalSettings.workingHours.lunchStart}
                      onChange={(e) => setGeneralSettings(prev => ({
                        ...prev,
                        workingHours: { ...prev.workingHours, lunchStart: e.target.value }
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="lunchEnd">Fim Almoço</Label>
                    <Input
                      id="lunchEnd"
                      type="time"
                      value={generalSettings.workingHours.lunchEnd}
                      onChange={(e) => setGeneralSettings(prev => ({
                        ...prev,
                        workingHours: { ...prev.workingHours, lunchEnd: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Valores e Configurações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <DollarSign className="h-5 w-5" />
                  <span>Valores e Configurações</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="consultationPrice">Valor da Consulta Avulsa (R$)</Label>
                  <Input
                    id="consultationPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={generalSettings.consultationPrice || 180}
                    onChange={(e) => setGeneralSettings(prev => ({ 
                      ...prev, 
                      consultationPrice: parseFloat(e.target.value) || 180
                    }))}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Valor padrão usado nos agendamentos avulsos
                  </p>
                </div>

                <div>
                  <Label htmlFor="timezone">Fuso Horário</Label>
                  <Select value={generalSettings.timezone} onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, timezone: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">São Paulo (UTC-3)</SelectItem>
                      <SelectItem value="America/Manaus">Manaus (UTC-4)</SelectItem>
                      <SelectItem value="America/Rio_Branco">Rio Branco (UTC-5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dateFormat">Formato de Data</Label>
                  <Select value={generalSettings.dateFormat} onValueChange={(value) => setGeneralSettings(prev => ({ ...prev, dateFormat: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rooms" className="space-y-4">
          <RoomsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}