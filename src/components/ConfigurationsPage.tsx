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

export function ConfigurationsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [isLoading, setIsLoading] = useState(false);
  const [rooms, setRooms] = useState<{id: string; name: string; is_active: boolean}[]>([]);
  const [newRoomName, setNewRoomName] = useState('');

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
    loadRooms();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('clinic_settings')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single();

      if (data) {
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

  const loadRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, name, is_active')
        .order('name');

      if (data) {
        setRooms(data);
      }
    } catch (error) {
      console.error('Erro ao carregar salas:', error);
    }
  };

  const addRoom = async () => {
    if (!newRoomName.trim()) return;
    
    try {
      const { error } = await supabase
        .from('rooms')
        .insert({ name: newRoomName.trim() });

      if (error) throw error;
      
      setNewRoomName('');
      loadRooms();
      toast.success('Sala adicionada com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar sala:', error);
      toast.error('Erro ao adicionar sala');
    }
  };

  const toggleRoomStatus = async (roomId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ is_active: !currentStatus })
        .eq('id', roomId);

      if (error) throw error;
      
      loadRooms();
      toast.success('Status da sala atualizado!');
    } catch (error) {
      console.error('Erro ao atualizar sala:', error);
      toast.error('Erro ao atualizar sala');
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('clinic_settings')
        .upsert({
          id: '00000000-0000-0000-0000-000000000001',
          name: generalSettings.clinicName,
          email: generalSettings.clinicEmail,
          phone: generalSettings.clinicPhone,
          address: generalSettings.clinicAddress,
          consultation_price: generalSettings.consultationPrice,
          timezone: generalSettings.timezone,
          working_hours: generalSettings.workingHours,
          updated_at: new Date().toISOString()
        });

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
        <Button onClick={saveSettings} disabled={isLoading}>
          <Settings className="h-4 w-4 mr-2" />
          {isLoading ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2">
          <TabsTrigger value="general">Configurações Gerais</TabsTrigger>
          <TabsTrigger value="rooms">Salas</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
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

            <Card>
              <CardHeader>
                <CardTitle>Horário de Funcionamento</CardTitle>
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
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
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Salas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="Nome da nova sala"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addRoom()}
                />
                <Button onClick={addRoom} disabled={!newRoomName.trim()}>
                  Adicionar
                </Button>
              </div>
              
              <div className="space-y-2">
                {rooms.map(room => (
                  <div key={room.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className={room.is_active ? 'text-black' : 'text-gray-400 line-through'}>
                      {room.name}
                    </span>
                    <Button 
                      variant={room.is_active ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleRoomStatus(room.id, room.is_active)}
                    >
                      {room.is_active ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                ))}
                {rooms.length === 0 && (
                  <p className="text-gray-500 text-center py-4">Nenhuma sala cadastrada</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}