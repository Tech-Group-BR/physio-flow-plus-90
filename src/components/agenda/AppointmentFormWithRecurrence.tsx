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
import { format } from "date-fns";

interface AppointmentFormProps {
  initialDate?: Date;
  initialTime?: string;
  onCancel?: () => void;
  onSave?: (appointmentData: any) => void;
}

export function AppointmentFormWithRecurrence({ 
  initialDate, 
  initialTime, 
  onCancel, 
  onSave 
}: AppointmentFormProps) {
  const { clinicId, loading } = useAuth();
  const { patients, professionals, rooms } = useClinic();
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(null);
  const [formData, setFormData] = useState({
    patientId: "",
    professionalId: "",
    roomId: "",
    date: initialDate ? format(initialDate, 'yyyy-MM-dd') : "",
    time: initialTime || "",
    duration: 45, // Mudança: padrão de 45 minutos
    type: "consulta",
    customPrice: "",
    isRecurring: false,
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Opções de duração em minutos (de 30 em 30, subindo de 15 em 15)
  const durationOptions = [
    { value: 30, label: "30 minutos" },
    { value: 45, label: "45 minutos" },
    { value: 60, label: "1 hora" },
    { value: 75, label: "1 hora e 15 minutos" },
    { value: 90, label: "1 hora e 30 minutos" },
    { value: 105, label: "1 hora e 45 minutos" },
    { value: 120, label: "2 horas" },
    { value: 135, label: "2 horas e 15 minutos" },
    { value: 150, label: "2 horas e 30 minutos" }
  ];

  // Atualizar formData quando initialDate ou initialTime mudarem
  useEffect(() => {
    if (initialDate) {
      setFormData(prev => ({ 
        ...prev, 
        date: format(initialDate, 'yyyy-MM-dd') 
      }));
    }
    if (initialTime) {
      setFormData(prev => ({ 
        ...prev, 
        time: initialTime 
      }));
    }
  }, [initialDate, initialTime]);

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
      // Log para debug
      console.log('Dados do formulário antes de salvar:', formData);
      
      // Validação básica
      if (!formData.patientId || !formData.professionalId || !formData.date || !formData.time) {
        toast.error("Preencha todos os campos obrigatórios");
        setSubmitting(false);
        return;
      }

      if (onSave) {
        await onSave(formData);
        toast.success("Agendamento salvo com sucesso!");
        
        // Reset do formulário após salvar
        setFormData({
          patientId: "",
          professionalId: "",
          roomId: "",
          date: "",
          time: "",
          duration: 45,
          type: "consulta",
          customPrice: "",
          isRecurring: false,
          notes: ""
        });
      }
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      toast.error("Erro ao salvar agendamento");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  if (loading || !clinicId) {
    return <div className="flex items-center justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
      <h1 className="text-2xl font-bold mb-6">Novo Agendamento</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label>Paciente *</Label>
          <Select
            value={formData.patientId}
            onValueChange={(value) => {
              console.log('Paciente selecionado:', value);
              setFormData({ ...formData, patientId: value });
            }}
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
              onValueChange={(value) => {
                console.log('Profissional selecionado:', value);
                setFormData({ ...formData, professionalId: value });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o profissional" />
              </SelectTrigger>
              <SelectContent>
                {professionals?.map((professional) => (
                  <SelectItem key={professional.id} value={professional.id}>
                    {professional.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Sala</Label>
            <Select
              value={formData.roomId}
              onValueChange={(value) => {
                console.log('Sala selecionada:', value);
                setFormData({ ...formData, roomId: value });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a sala (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {rooms?.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                  </SelectItem>
                ))}
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
              onChange={(e) => {
                console.log('Data selecionada:', e.target.value);
                setFormData({ ...formData, date: e.target.value });
              }}
              className={initialDate ? "bg-blue-50 border-blue-200" : ""}
            />
          </div>
          <div>
            <Label>Horário *</Label>
            <Input
              type="time"
              value={formData.time}
              onChange={(e) => {
                console.log('Horário selecionado:', e.target.value);
                setFormData({ ...formData, time: e.target.value });
              }}
              className={initialTime ? "bg-blue-50 border-blue-200" : ""}
            />
          </div>
        </div>

        <div>
          <Label>Duração *</Label>
          <Select 
            value={formData.duration.toString()} 
            onValueChange={(value) => {
              console.log('Duração selecionada:', value);
              setFormData({ ...formData, duration: Number(value) });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a duração" />
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

        {formData.type === "outro" && (
          <div>
            <Label>Valor Personalizado (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.customPrice}
              onChange={(e) => setFormData({ ...formData, customPrice: e.target.value })}
              placeholder="0,00"
            />
          </div>
        )}

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
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>

      {/* Debug info */}
      <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
        <strong>Debug:</strong> {JSON.stringify(formData, null, 2)}
      </div>
    </div>
  );
}