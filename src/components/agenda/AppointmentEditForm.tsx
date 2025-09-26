import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClinic } from "@/contexts/ClinicContext";
import { useAuth } from "@/hooks/useAuth";
import { Appointment } from "@/types";
import { useState } from "react";
import { toast } from "sonner";

interface AppointmentEditFormProps {
    appointment: Appointment;
    onSave: (updatedAppointment: Partial<Appointment>) => void;
    onCancel: () => void;
}

export function AppointmentEditForm({ appointment, onSave, onCancel }: AppointmentEditFormProps) {
    const { patients, professionals, rooms } = useClinic();
    const { clinicId } = useAuth();
    
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        patientId: appointment.patientId || '',
        professionalId: appointment.professionalId || '',
        roomId: appointment.roomId || '',
        date: appointment.date || '',
        time: appointment.time || '',
        duration: appointment.duration || 60,
        treatmentType: appointment.treatmentType || '',
        notes: appointment.notes || '',
        status: appointment.status || 'marcado'
    });

    // Debug para verificar os dados
    console.log('AppointmentEditForm - Dados do agendamento:', appointment);
    console.log('AppointmentEditForm - FormData inicializado:', formData);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // Validação básica
            if (!formData.patientId || !formData.professionalId || !formData.date || !formData.time) {
                toast.error("Preencha todos os campos obrigatórios");
                return;
            }

            await onSave({
                ...formData,
                clinicId
            });
            
        } catch (error: any) {
            console.error('Erro ao salvar:', error);
            // Mostrar mensagem específica do erro se disponível
            if (error?.message) {
                toast.error(error.message);
            } else {
                toast.error('Erro ao salvar agendamento');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold mb-6">Editar Agendamento</h2>

            {/* Só renderizar o formulário se temos dados válidos */}
            {!patients.length || !professionals.length ? (
                <div className="text-center py-8">
                    <p>Carregando dados...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="patientId">Paciente *</Label>
                        <Select
                            value={formData.patientId || undefined}
                            onValueChange={(value) => setFormData({ ...formData, patientId: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o paciente" />
                            </SelectTrigger>
                            <SelectContent>
                                {patients.map((patient) => (
                                    <SelectItem key={patient.id} value={patient.id}>
                                        {patient.fullName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="professionalId">Fisioterapeuta *</Label>
                        <Select
                            value={formData.professionalId || undefined}
                            onValueChange={(value) => setFormData({ ...formData, professionalId: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o fisioterapeuta" />
                            </SelectTrigger>
                            <SelectContent>
                                {professionals.map((professional) => (
                                    <SelectItem key={professional.id} value={professional.id}>
                                        {professional.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="roomId">Sala</Label>
                        <Select
                            value={formData.roomId || "none"}
                            onValueChange={(value) => setFormData({ ...formData, roomId: value === "none" ? "" : value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a sala (opcional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Nenhuma sala</SelectItem>
                                {rooms.map((room) => (
                                    <SelectItem key={room.id} value={room.id}>
                                        {room.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="date">Data *</Label>
                            <Input
                                id="date"
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label htmlFor="time">Horário *</Label>
                            <Input
                                id="time"
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="treatmentType">Tipo de Tratamento</Label>
                        <Input
                            id="treatmentType"
                            value={formData.treatmentType}
                            onChange={(e) => setFormData({ ...formData, treatmentType: e.target.value })}
                            placeholder="Ex: Fisioterapia, Avaliação..."
                        />
                    </div>

                    <div>
                        <Label htmlFor="notes">Observações</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Observações..."
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-end space-x-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}