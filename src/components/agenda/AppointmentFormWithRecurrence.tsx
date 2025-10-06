import { useAuth } from "@/contexts/AuthContext";
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
import { format, addWeeks, getDay, addDays, startOfWeek } from "date-fns";

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
    duration: 45,
    type: "consulta",
    customPrice: "",
    price: 0,
    isRecurring: false,
    recurrenceWeeks: 1,
    weekDays: [] as number[],
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Opções de duração em minutos
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

  // Dias da semana para seleção
  const weekDaysOptions = [
    { value: 1, label: "Segunda-feira" },
    { value: 2, label: "Terça-feira" },
    { value: 3, label: "Quarta-feira" },
    { value: 4, label: "Quinta-feira" },
    { value: 5, label: "Sexta-feira" },
    { value: 6, label: "Sábado" },
    { value: 0, label: "Domingo" }
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
    // Definir preço padrão quando as configurações carregam
    if (settings?.consultation_price && formData.type === 'consulta') {
      setFormData(prev => ({
        ...prev,
        price: parseFloat(settings.consultation_price.toString())
      }));
    }
    setIsLoading(false);
  };

  // Função para obter o preço baseado no tipo de agendamento
  const getAppointmentPrice = () => {
    if (formData.type === 'consulta' && clinicSettings?.consultation_price) {
      return parseFloat(clinicSettings.consultation_price.toString()).toFixed(2);
    }
    if (formData.type === 'outro' && formData.customPrice) {
      return parseFloat(formData.customPrice).toFixed(2);
    }
    return '0.00';
  };

  // Função para gerar datas de agendamentos recorrentes
  const generateRecurringDates = (startDate: Date, weekDays: number[], weeks: number) => {
    const dates: Date[] = [];
    
    for (let week = 0; week < weeks; week++) {
      const weekStartDate = addWeeks(startDate, week);
      const weekStart = startOfWeek(weekStartDate, { weekStartsOn: 0 });
      
      for (const dayOfWeek of weekDays) {
        const appointmentDate = addDays(weekStart, dayOfWeek);
        dates.push(appointmentDate);
      }
    }
    
    return dates.sort((a, b) => a.getTime() - b.getTime());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      console.log('Dados do formulário antes de salvar:', formData);
      
      // Validação básica
      if (!formData.patientId || !formData.professionalId || !formData.date || !formData.time) {
        toast.error("Preencha todos os campos obrigatórios");
        setSubmitting(false);
        return;
      }

      // Validação específica para recorrência
      if (formData.isRecurring) {
        if (formData.weekDays.length === 0) {
          toast.error("Selecione pelo menos um dia da semana para recorrência");
          setSubmitting(false);
          return;
        }
        if (formData.recurrenceWeeks < 1) {
          toast.error("Número de semanas deve ser pelo menos 1");
          setSubmitting(false);
          return;
        }
      }

      // Calcular o preço do agendamento
      const appointmentPrice = parseFloat(getAppointmentPrice());
      
      // Validação do preço
      if (appointmentPrice <= 0) {
        toast.error('Por favor, defina um valor válido para o agendamento');
        setSubmitting(false);
        return;
      }

      if (onSave) {
        if (formData.isRecurring && formData.weekDays.length > 0) {
          // Gerar múltiplos agendamentos para recorrência
          const startDate = new Date(formData.date + 'T00:00:00');
          const recurringDates = generateRecurringDates(startDate, formData.weekDays, formData.recurrenceWeeks);
          
          for (const date of recurringDates) {
            const appointmentData = {
              ...formData,
              date: format(date, 'yyyy-MM-dd'),
              price: appointmentPrice,
            };
            await onSave(appointmentData);
          }
          
          toast.success(`${recurringDates.length} agendamentos criados com sucesso! (Valor: R$ ${appointmentPrice.toFixed(2).replace('.', ',')} cada)`);
        } else {
          // Agendamento único
          const appointmentData = {
            ...formData,
            price: appointmentPrice,
          };
          await onSave(appointmentData);
          toast.success(`Agendamento salvo com sucesso! (Valor: R$ ${appointmentPrice.toFixed(2).replace('.', ',')})`);
        }
        
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
          price: clinicSettings?.consultation_price ? parseFloat(clinicSettings.consultation_price.toString()) : 0,
          isRecurring: false,
          recurrenceWeeks: 1,
          weekDays: [],
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

  // Função para toggle de dias da semana
  const toggleWeekDay = (dayValue: number) => {
    setFormData(prev => ({
      ...prev,
      weekDays: prev.weekDays.includes(dayValue) 
        ? prev.weekDays.filter(day => day !== dayValue)
        : [...prev.weekDays, dayValue].sort()
    }));
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
              setFormData(prev => ({ ...prev, patientId: value }));
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
                onChange={() => {
                  const consultationPrice = clinicSettings?.consultation_price 
                    ? parseFloat(clinicSettings.consultation_price.toString()) 
                    : 0;
                  setFormData(prev => ({ 
                    ...prev, 
                    type: "consulta",
                    price: consultationPrice,
                    customPrice: ""
                  }));
                }}
              />
              Nova Consulta
              {clinicSettings?.consultation_price && (
                <span className="text-green-600 font-semibold">
                  (R$ {parseFloat(clinicSettings.consultation_price.toString()).toFixed(2).replace('.', ',')})
                </span>
              )}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="type"
                value="outro"
                checked={formData.type === "outro"}
                onChange={() => {
                  setFormData(prev => ({ 
                    ...prev, 
                    type: "outro",
                    price: 0
                  }));
                }}
              />
              Outro (Valor Personalizado)
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Fisioterapeuta *</Label>
            <Select
              value={formData.professionalId}
              onValueChange={(value) => {
                console.log('Profissional selecionado:', value);
                setFormData(prev => ({ ...prev, professionalId: value }));
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
                setFormData(prev => ({ ...prev, roomId: value }));
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Data *</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => {
                console.log('Data selecionada:', e.target.value);
                setFormData(prev => ({ ...prev, date: e.target.value }));
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
                setFormData(prev => ({ ...prev, time: e.target.value }));
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
              setFormData(prev => ({ ...prev, duration: Number(value) }));
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
            <Label>Valor Personalizado (R$) *</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.customPrice}
              onChange={(e) => {
                const customPrice = e.target.value;
                const priceValue = customPrice && parseFloat(customPrice) > 0 ? parseFloat(customPrice) : 0;
                setFormData(prev => ({ 
                  ...prev, 
                  customPrice: customPrice,
                  price: priceValue
                }));
              }}
              placeholder="0,00"
            />
          </div>
        )}

        <div>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={formData.isRecurring}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRecurring: !!checked }))}
            />
            Agendamento recorrente
          </label>
        </div>

        {formData.isRecurring && (
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <Label>Número de semanas *</Label>
              <Input
                type="number"
                min="1"
                max="52"
                value={formData.recurrenceWeeks}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  recurrenceWeeks: Math.max(1, parseInt(e.target.value) || 1) 
                }))}
                placeholder="Quantas semanas repetir"
              />
              <p className="text-sm text-gray-600 mt-1">
                Quantas semanas o agendamento deve se repetir
              </p>
            </div>

            <div>
              <Label>Dias da semana *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1 mt-2">
                {weekDaysOptions.map((day) => (
                  <label
                    key={day.value}
                    className="flex flex-col items-center justify-center px-2 py-1 rounded border text-xs font-medium cursor-pointer transition-all select-none
                      bg-white hover:bg-green-50 border-gray-200
                      data-[checked=true]:bg-green-100 data-[checked=true]:border-green-500 data-[checked=true]:text-green-700 w-full min-w-0"
                    data-checked={formData.weekDays.includes(day.value)}
                  >
                    <Checkbox
                      checked={formData.weekDays.includes(day.value)}
                      onCheckedChange={() => toggleWeekDay(day.value)}
                      className="mb-1 scale-90"
                    />
                    <span className="truncate w-full text-center whitespace-nowrap" style={{fontSize:'0.95em'}}>{day.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Selecione os dias da semana em que o agendamento deve se repetir
              </p>
              {formData.weekDays.length > 0 && (
                <p className="text-sm text-blue-600 mt-2">
                  Serão criados {formData.weekDays.length * formData.recurrenceWeeks} agendamentos
                </p>
              )}
            </div>
          </div>
        )}

        <div>
          <Label>Observações</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Observações adicionais..."
            rows={3}
          />
        </div>

        {/* Resumo do Valor */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Valor do Agendamento:</span>
            <span className="text-lg font-bold text-green-600">
              R$ {getAppointmentPrice().replace('.', ',')}
            </span>
          </div>
          {formData.isRecurring && formData.weekDays.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-300">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">
                  {formData.weekDays.length * formData.recurrenceWeeks} agendamentos × R$ {getAppointmentPrice().replace('.', ',')}
                </span>
                <span className="font-semibold text-blue-600">
                  Total: R$ {(parseFloat(getAppointmentPrice()) * formData.weekDays.length * formData.recurrenceWeeks).toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          )}
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
    </div>
  );
}