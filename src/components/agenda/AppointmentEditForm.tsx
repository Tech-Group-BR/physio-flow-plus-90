import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    console.log('AppointmentEditForm iniciando renderização...');

    try {
        const { patients, professionals, rooms } = useClinic();
        const { clinicId } = useAuth();
        console.log('useClinic executado com sucesso:', {
            patients: patients?.length,
            professionals: professionals?.length,
            rooms: rooms?.length
        });

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

        console.log('Estado inicializado:', formData);

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();

            // Certifique-se que formData.date está no formato 'YYYY-MM-DD'
            // Se estiver usando Date objects, converta para string local:
            // const localDate = new Date(formData.date).toISOString().slice(0, 10);

            try {
                await onSave({
                    ...formData,
                    date: formData.date,
                    clinicId // envie o clinicId se necessário no backend
                });
            } catch (error: any) {
                console.error('Erro ao salvar:', error);
                toast.error('Erro ao salvar agendamento');
            }
        };

        // Renderização simples para debug
        return (
            <div className="p-6">
                <h2 className="text-xl font-semibold mb-6">Editar Agendamento</h2>



                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="patientId">Paciente ID</Label>
                        <Input
                            id="patientId"
                            value={formData.patientId}
                            onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                            placeholder="ID do paciente"
                        />
                    </div>

                    <div>
                        <Label htmlFor="professionalId">Fisioterapeuta ID</Label>
                        <Input
                            id="professionalId"
                            value={formData.professionalId}
                            onChange={(e) => setFormData({ ...formData, professionalId: e.target.value })}
                            placeholder="ID do fisioterapeuta"
                        />
                    </div>

                    <div>
                        <Label htmlFor="date">Data</Label>
                        <Input
                            id="date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label htmlFor="time">Horário</Label>
                        <Input
                            id="time"
                            value={formData.time}
                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            placeholder="HH:MM"
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
            </div>
        );
    } catch (error) {
        console.error('Erro no AppointmentEditForm:', error);
        return (
            <div className="p-8 text-center">
                <h3 className="text-lg font-semibold mb-4 text-red-600">Erro ao renderizar formulário</h3>
                <p className="text-gray-600 mb-4">Ocorreu um erro inesperado.</p>
                <pre className="text-xs bg-gray-100 p-2 rounded mb-4 text-left overflow-auto">
                    {error instanceof Error ? error.message : String(error)}
                </pre>
                <Button onClick={onCancel} variant="outline">
                    Voltar
                </Button>
            </div>
        );
    }
}