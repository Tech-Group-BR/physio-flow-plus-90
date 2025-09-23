import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { fetchClinicSettings, ClinicSettings } from "@/services/settingsService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useClinic } from "@/contexts/ClinicContext";

export function AppointmentFormWithRecurrence() {
  const { clinicId, loading } = useAuth();
  const { patients } = useClinic();
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(null);
  const [formData, setFormData] = useState({
    patientId: "",
    professionalId: "",
    roomId: "",
    date: "",
    time: "",
    duration: 60,
    type: "consulta",
    customPrice: "",
    isRecurring: false,
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && clinicId) {
      fetchInitialData();
    }
  }, [clinicId, loading]);

  const fetchInitialData = async () => {
    const settings = await fetchClinicSettings(clinicId);
    setClinicSettings(settings);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Salve o agendamento aqui
      toast.success("Agendamento salvo com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar agendamento");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !clinicId) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
      <h1 className="text-2xl font-bold mb-2">Novo Agendamento</h1>
      <p className="text-gray-500 mb-6">Criar novo agendamento com opção de recorrência</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label>Paciente *</Label>
          <Select
            value={formData.patientId}
            onValueChange={(value) => setFormData({ ...formData, patientId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o paciente" />
            </SelectTrigger>
            <SelectContent>
              {patients
                ?.filter((p) => p.isActive)
                .map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.fullName}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tipo de Agendamento *</Label>
          <div className="flex gap-6 mt-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="type"
                value="consulta"
                checked={formData.type === "consulta"}
                onChange={() => setFormData({ ...formData, type: "consulta" })}
              />
              Nova Consulta
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="type"
                value="outro"
                checked={formData.type === "outro"}
                onChange={() => setFormData({ ...formData, type: "outro" })}
              />
              Outro (Valor Personalizado)
            </label>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Fisioterapeuta *</Label>
            <Select
              value={formData.professionalId}
              onValueChange={(value) => setFormData({ ...formData, professionalId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o profissional" />
              </SelectTrigger>
              <SelectContent>
                {/* <SelectItem value="...">Nome do profissional</SelectItem> */}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Sala</Label>
            <Select
              value={formData.roomId}
              onValueChange={(value) => setFormData({ ...formData, roomId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a sala" />
              </SelectTrigger>
              <SelectContent>
                {/* <SelectItem value="...">Nome da sala</SelectItem> */}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Data *</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div>
            <Label>Horário *</Label>
            <Input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label>Duração</Label>
          <Select value={formData.duration.toString()} onValueChange={(value) => setFormData({ ...formData, duration: Number(value) })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a duração" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="60">1 hora</SelectItem>
              <SelectItem value="30">30 minutos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={formData.isRecurring}
              onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: !!checked })}
            />
            Agendamento recorrente
          </label>
        </div>
        <div>
          <Label>Observações</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Observações adicionais..."
            rows={3}
          />
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline">
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </div>
  );
}