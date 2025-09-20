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
  const [patients, setPatients] = useState<Patient[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [saving, setSaving] = useState(false);
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [recurrenceCount, setRecurrenceCount] = useState(1);

  const [formData, setFormData] = useState({
    patientId: '',
    professionalId: '',
    roomId: '',
    date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
    time: selectedTime || '',
    duration: 60,
    treatmentType: 'Consulta',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [patientsRes, professionalsRes, roomsRes] = await Promise.all([
        supabase.from('patients').select('id, full_name').eq('is_active', true),
        supabase.from('professionals').select('id, full_name').eq('is_active', true),
        supabase.from('rooms').select('id, name').eq('is_active', true)
      ]);

      if (patientsRes.data) setPatients(patientsRes.data);
      if (professionalsRes.data) setProfessionals(professionalsRes.data);
      if (roomsRes.data) setRooms(roomsRes.data);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados');
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.patientId || !formData.professionalId || !formData.date || !formData.time) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const appointments = [];
      const baseDate = new Date(formData.date);

      // Criar lista de agendamentos (recorrentes ou único)
      for (let i = 0; i < (isRecurrent ? recurrenceCount : 1); i++) {
        const appointmentDate = i === 0 ? baseDate : addWeeks(baseDate, i);
        
        appointments.push({
          patient_id: formData.patientId,
          professional_id: formData.professionalId,
          room_id: formData.roomId || null,
          date: format(appointmentDate, 'yyyy-MM-dd'),
          time: formData.time,
          duration: formData.duration,
          treatment_type: formData.treatmentType,
          notes: isRecurrent && i > 0 ? 
            `${formData.notes} (Sessão ${i + 1} de ${recurrenceCount})` : 
            formData.notes,
          status: 'marcado',
          clinic_id: '00000000-0000-0000-0000-000000000001'
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="patient">Paciente *</Label>
            <Select value={formData.patientId} onValueChange={(value) => handleChange('patientId', value)}>
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
            <Label htmlFor="treatmentType">Tipo de Tratamento</Label>
            <Input
              id="treatmentType"
              value={formData.treatmentType}
              onChange={(e) => handleChange('treatmentType', e.target.value)}
              placeholder="Ex: Consulta, Fisioterapia..."
            />
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
      </CardContent>
    </Card>
  );
}