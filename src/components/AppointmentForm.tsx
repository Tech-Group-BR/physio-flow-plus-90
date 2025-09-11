
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useClinic } from "@/contexts/ClinicContext";
import { format } from "date-fns";
import { toast } from "sonner";

interface AppointmentFormProps {
  onSave: () => void;
  onCancel: () => void;
}

export function AppointmentForm({ onSave, onCancel }: AppointmentFormProps) {
  const { addAppointment, patients, physiotherapists, rooms, loading } = useClinic();
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    patientId: '',
    physiotherapistId: '',
    roomId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '',
    duration: 60,
    treatmentType: '',
    notes: ''
  });

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  const treatmentTypes = [
    { value: 'ortopedica', label: 'Fisioterapia Ortopédica' },
    { value: 'neurologica', label: 'Fisioterapia Neurológica' },
    { value: 'respiratoria', label: 'Fisioterapia Respiratória' },
    { value: 'rpg', label: 'RPG' },
    { value: 'pilates', label: 'Pilates Clínico' },
    { value: 'hidroterapia', label: 'Hidroterapia' }
  ];

  // Debug logs
  useEffect(() => {
    console.log('AppointmentForm - Dados carregados:', {
      patients: patients.length,
      physiotherapists: physiotherapists.length,
      rooms: rooms.length,
      loading
    });
  }, [patients, physiotherapists, rooms, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patientId || !formData.physiotherapistId || !formData.time || !formData.treatmentType) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setSubmitting(true);
    
    try {
      const appointmentData = {
        patientId: formData.patientId,
        physiotherapistId: formData.physiotherapistId,
        roomId: formData.roomId || '',
        date: formData.date,
        time: formData.time,
        duration: formData.duration,
        treatmentType: formData.treatmentType,
        status: 'marcado' as const,
        whatsappConfirmed: false,
        notes: formData.notes || ''
      };

      console.log('Enviando dados do agendamento:', appointmentData);
      await addAppointment(appointmentData);
      toast.success('Agendamento criado com sucesso!');
      onSave();
    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);
      toast.error(error.message || 'Erro ao criar agendamento. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Novo Agendamento</h1>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados do Agendamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="patientId">Paciente *</Label>
              <Select value={formData.patientId} onValueChange={(value) => setFormData({ ...formData, patientId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.length > 0 ? (
                    patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.fullName}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-patients" disabled>
                      Nenhum paciente cadastrado
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="physiotherapistId">Fisioterapeuta *</Label>
              <Select value={formData.physiotherapistId} onValueChange={(value) => setFormData({ ...formData, physiotherapistId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o fisioterapeuta" />
                </SelectTrigger>
                <SelectContent>
                  {physiotherapists.length > 0 ? (
                    physiotherapists.filter(physio => physio.isActive).map((physio) => (
                      <SelectItem key={physio.id} value={physio.id}>
                        {physio.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-physios" disabled>
                      Nenhum fisioterapeuta cadastrado
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="time">Horário *</Label>
              <Select value={formData.time} onValueChange={(value) => setFormData({ ...formData, time: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o horário" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="roomId">Sala</Label>
              <Select value={formData.roomId} onValueChange={(value) => setFormData({ ...formData, roomId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a sala" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-room">Não especificada</SelectItem>
                  {rooms.length > 0 ? (
                    rooms.filter(room => room.isActive).map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-rooms" disabled>
                      Nenhuma sala cadastrada
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="treatmentType">Tipo de Tratamento *</Label>
              <Select value={formData.treatmentType} onValueChange={(value) => setFormData({ ...formData, treatmentType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tratamento" />
                </SelectTrigger>
                <SelectContent>
                  {treatmentTypes.map((treatment) => (
                    <SelectItem key={treatment.value} value={treatment.value}>
                      {treatment.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações sobre o agendamento..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Agendando...' : 'Agendar'}
        </Button>
      </div>

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-sm">Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="text-xs">
            <p>Pacientes: {patients.length}</p>
            <p>Fisioterapeutas: {physiotherapists.length}</p>
            <p>Salas: {rooms.length}</p>
            <p>Loading: {loading ? 'true' : 'false'}</p>
          </CardContent>
        </Card>
      )}
    </form>
  );
}
