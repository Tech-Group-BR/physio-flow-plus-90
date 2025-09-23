import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { durationOptions } from "@/utils/agendaUtils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { fetchClinicSettings } from "@/services/settingsService";
import { useAuth } from "@/hooks/useAuth";

interface Patient {
  id: string;
  full_name: string;
}

interface Professional {
  id: string;
  full_name: string;
}

interface Room {
  id: string;
  name: string;
}

interface PatientPackageInfo {
  id: string;
  name: string;
  sessions_remaining: number;
}

interface AppointmentFormWithRecurrenceProps {
  onSave: () => void;
  onCancel: () => void;
  selectedDate?: Date;
  selectedTime?: string;
}

export function AppointmentFormWithRecurrence({ 
  onSave, 
  onCancel, 
  selectedDate, 
  selectedTime 
}: AppointmentFormWithRecurrenceProps) {
  const { clinicId } = useAuth();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [patientPackages, setPatientPackages] = useState<PatientPackageInfo[]>([]);
  const [clinicSettings, setClinicSettings] = useState<{ price: number | null; id: string | null }>({ price: null, id: null });
  const [saving, setSaving] = useState(false);
  
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [appointmentType, setAppointmentType] = useState('standard');
  const [formData, setFormData] = useState({
    professionalId: '',
    roomId: '',
    date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
    time: selectedTime || '',
    duration: 60,
    selectedPackageId: '',
    customDescription: '',
    customPrice: '',
    notes: ''
  });

  const [isRecurrent, setIsRecurrent] = useState(false);
  const [recurrenceCount, setRecurrenceCount] = useState(1);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientPackages();
    } else {
      setPatientPackages([]);
      setAppointmentType('standard');
    }
  }, [selectedPatientId]);

  const fetchInitialData = async () => {
    setIsLoadingInitialData(true);
    try {
      const [patientsRes, professionalsRes, roomsRes] = await Promise.all([
        supabase.from('patients').select('id, full_name').eq('is_active', true).order('full_name'),
        supabase.from('professionals').select('id, full_name').eq('is_active', true).order('full_name'),
        supabase.from('rooms').select('id, name').eq('is_active', true).order('name')
      ]);

      const settings = await fetchClinicSettings(clinicId);

      if (patientsRes.data) setPatients(patientsRes.data);
      if (professionalsRes.data) setProfessionals(professionalsRes.data);
      if (roomsRes.data) setRooms(roomsRes.data);
      if (settings) {
        setClinicSettings({
          price: settings.consultation_price,
          id: settings.id
        });
      }

    } catch (error) {
      console.error('Erro ao buscar dados iniciais:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoadingInitialData(false);
    }
  };

  const fetchPatientPackages = async () => {
    const { data, error } = await supabase
      .from('patient_packages')
      .select(`id, sessions_used, session_packages(name, sessions)`)
      .eq('patient_id', selectedPatientId)
      .eq('status', 'active');
      
    if (error) {
      console.error("Erro ao buscar pacotes do paciente:", error);
      return;
    }

    if (data) {
      const formattedPackages = data
        .filter(p => p.session_packages)
        .map(p => ({
          id: p.id,
          name: (p.session_packages as any).name,
          sessions_remaining: (p.session_packages as any).sessions - p.sessions_used
        }))
        .filter(p => p.sessions_remaining > 0);
      
      setPatientPackages(formattedPackages);
      if (formattedPackages.length > 0) {
        setAppointmentType('package');
      } else {
        setAppointmentType('standard');
      }
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!selectedPatientId || !formData.professionalId || !formData.date || !formData.time) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (appointmentType === 'package' && !formData.selectedPackageId) {
      toast.error('Selecione um pacote para continuar.');
      return;
    }
    
    if (appointmentType === 'custom' && (!formData.customDescription || !formData.customPrice)) {
      toast.error('Preencha a descrição e o valor personalizados.');
      return;
    }
    
    // Final check for clinicId before saving
    if (!clinicSettings.id) {
        toast.error('Não foi possível carregar o ID da clínica. Tente recarregar a página.');
        return;
    }

    setSaving(true);
    try {
      const appointments = [];
      const baseDate = selectedDate ? selectedDate : new Date(formData.date);

      let treatmentType = '';
      let price = null;
      let patientPackageId = null;

      if (appointmentType === 'package') {
        const selectedPackage = patientPackages.find(p => p.id === formData.selectedPackageId);
        treatmentType = selectedPackage?.name || 'Sessão de Pacote';
        patientPackageId = formData.selectedPackageId;
      } else if (appointmentType === 'custom') {
        treatmentType = formData.customDescription;
        price = parseFloat(formData.customPrice);
      } else {
        treatmentType = 'Consulta';
        price = clinicSettings.price;
      }

      for (let i = 0; i < (isRecurrent ? recurrenceCount : 1); i++) {
        let appointmentDate;
        if (i === 0) {
          appointmentDate = formData.date; // já está no formato correto
        } else {
          // Para recorrência, adicione semanas ao objeto Date
          const nextDate = selectedDate ? addWeeks(selectedDate, i) : addWeeks(new Date(formData.date), i);
          appointmentDate = format(nextDate, 'yyyy-MM-dd');
        }

        appointments.push({
          patient_id: selectedPatientId,
          professional_id: formData.professionalId,
          room_id: formData.roomId || null,
          date: appointmentDate,
          time: formData.time,
          duration: formData.duration,
          treatment_type: treatmentType,
          price: price,
          patient_package_id: patientPackageId,
          notes: isRecurrent && i > 0 ? 
            `${formData.notes} (Sessão ${i + 1} de ${recurrenceCount})` : 
            formData.notes,
          status: 'marcado',
          clinic_id: clinicSettings.id
        });
      }

      const { error } = await supabase
        .from('appointments')
        .insert(appointments);

      if (error) throw error;

      toast.success(
        isRecurrent 
          ? `${recurrenceCount} agendamentos criados com sucesso!`
          : 'Agendamento criado com sucesso!'
      );
      
      onSave();
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      toast.error('Erro ao salvar agendamento');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Novo Agendamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoadingInitialData ? (
          <div className="text-center text-gray-500">Carregando dados...</div>
        ) : (
          <>
            <div>
              <Label htmlFor="patient">Paciente *</Label>
              <Select onValueChange={setSelectedPatientId} value={selectedPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPatientId && (
              <>
                <hr />
                <div className="space-y-2">
                  <Label>Tipo de Agendamento *</Label>
                  <RadioGroup value={appointmentType} onValueChange={setAppointmentType} className="flex flex-col sm:flex-row gap-4 pt-2">
                    {patientPackages.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="package" id="r1" />
                        <Label htmlFor="r1">Usar Sessão de Pacote</Label>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="standard" id="r2" />
                      <Label htmlFor="r2">
                        Nova Consulta
                        {clinicSettings.price !== null && ` (R$ ${clinicSettings.price.toFixed(2).replace('.', ',')})`}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="r3" />
                      <Label htmlFor="r3">Outro (Valor Personalizado)</Label>
                    </div>
                  </RadioGroup>
                </div>

                {appointmentType === 'package' && (
                  <div className="space-y-2 animate-in fade-in-50">
                    <Label htmlFor="package">Pacote Disponível *</Label>
                    <Select value={formData.selectedPackageId} onValueChange={(value) => handleChange('selectedPackageId', value)}>
                      <SelectTrigger><SelectValue placeholder="Selecione o pacote" /></SelectTrigger>
                      <SelectContent>
                        {patientPackages.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name} ({p.sessions_remaining} restantes)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {appointmentType === 'custom' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-md bg-white animate-in fade-in-50">
                    <div className="space-y-2">
                      <Label htmlFor="custom-desc">Descrição do Serviço *</Label>
                      <Input id="custom-desc" placeholder="Ex: Avaliação, Retorno" value={formData.customDescription} onChange={(e) => handleChange('customDescription', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="custom-price">Valor (R$) *</Label>
                      <Input id="custom-price" type="number" placeholder="150.00" value={formData.customPrice} onChange={(e) => handleChange('customPrice', e.target.value)} />
                    </div>
                  </div>
                )}
                
                <hr/>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="professional">Fisioterapeuta *</Label>
                    <Select value={formData.professionalId} onValueChange={(value) => handleChange('professionalId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o profissional" />
                      </SelectTrigger>
                      <SelectContent>
                        {professionals.map((professional) => (
                          <SelectItem key={professional.id} value={professional.id}>
                            {professional.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="room">Sala</Label>
                    <Select value={formData.roomId} onValueChange={(value) => handleChange('roomId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a sala" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="date">Data *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleChange('date', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="time">Horário *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleChange('time', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="duration">Duração</Label>
                    <Select value={formData.duration.toString()} onValueChange={(value) => handleChange('duration', parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {durationOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="recurrent"
                      checked={isRecurrent}
                      onCheckedChange={(checked) => setIsRecurrent(checked === true)}
                    />
                    <Label htmlFor="recurrent">Agendamento recorrente</Label>
                  </div>

                  {isRecurrent && (
                    <div>
                      <Label htmlFor="recurrenceCount">Quantidade de sessões</Label>
                      <Input
                        id="recurrenceCount"
                        type="number"
                        min="1"
                        max="52"
                        value={recurrenceCount}
                        onChange={(e) => setRecurrenceCount(parseInt(e.target.value) || 1)}
                        placeholder="Ex: 5 para 5 sessões semanais"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Serão criados {recurrenceCount} agendamentos semanais a partir da data selecionada
                      </p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      placeholder="Observações adicionais..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={onCancel}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}