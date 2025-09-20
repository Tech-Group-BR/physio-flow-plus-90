import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { Database } from '@/integrations/supabase/types';


// Tipos para os dados que vamos buscar
interface Patient { id: string; full_name: string; }
interface Professional { id: string; full_name: string; }
interface PatientPackageInfo { id: string; name: string; sessions_remaining: number; }
interface Room { id: string; name: string; }

// As props que o formulário recebe da AgendaPage
interface AppointmentFormProps {
  onSave: () => void;
  onCancel: () => void;
}

export function AppointmentForm({ onSave, onCancel }: AppointmentFormProps) {
  // Estados para os dados do formulário e de suporte
  const [patients, setPatients] = useState<Patient[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [patientPackages, setPatientPackages] = useState<PatientPackageInfo[]>([]);

  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [appointmentType, setAppointmentType] = useState('standard'); // 'package', 'standard', 'custom'
  
  // Estado para os dados do formulário
  const [formData, setFormData] = useState({
    professionalId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '',
    roomId: '',
    selectedPackageId: '',
    customDescription: '',
    customPrice: '',
    standardPrice: '', // Campo para o preço da consulta padrão
    notes: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [defaultPrice, setDefaultPrice] = useState(180); // Um fallback enquanto carrega
  
  // Busca pacientes, profissionais, salas e configurações uma vez, ao montar o componente
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const [patientsRes, professionalsRes, roomsRes] = await Promise.all([
          supabase.from('patients').select('id, full_name').order('full_name'),
          supabase.from('professionals').select('id, full_name').order('full_name'),
          supabase.from('rooms').select('id, name').eq('is_active', true)
        ]);

        setPatients(patientsRes.data || []);
        setProfessionals(professionalsRes.data || []);
        setRooms(roomsRes.data || []);
        
        // Buscar preço padrão das configurações
        const { data: settingsData } = await supabase
          .from('clinic_settings')
          .select('consultation_price')
          .limit(1)
          .single();
        
        if (settingsData?.consultation_price) {
          setDefaultPrice(settingsData.consultation_price);
        }
      } catch (error) {
        toast.error("Falha ao carregar dados iniciais.");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Efeito para atualizar o preço no formulário quando o valor padrão é carregado
  useEffect(() => {
    // Converte para string para ser compatível com o input
    setFormData(prev => ({ ...prev, standardPrice: defaultPrice.toString() }));
  }, [defaultPrice]);

  
  // Efeito para buscar pacotes do paciente quando um paciente é selecionado
  useEffect(() => {
    if (!selectedPatientId) {
      setPatientPackages([]);
      setAppointmentType('standard');
      return;
    }
    const fetchPatientPackages = async () => {
      const { data, error } = await supabase
       .from('patient_packages')
       .select(`id, sessions_used, session_packages ( name, sessions )`)
       .eq('patient_id', selectedPatientId)
       .eq('status', 'active');

      if (error) { 
        console.error("Erro ao buscar pacotes:", error); 
        return; 
      }
      if (data) {
        const formattedPackages = data
          .filter(p => Array.isArray(p.session_packages) && p.session_packages.length > 0)
          .map(p => {
              const pkgDetails = p.session_packages[0];
              return { 
                id: p.id, 
                name: pkgDetails.name, 
                sessions_remaining: pkgDetails.sessions - p.sessions_used 
              };
          })
          .filter(p => p.sessions_remaining > 0);
        
        setPatientPackages(formattedPackages);

        if (formattedPackages.length > 0) { 
          setAppointmentType('package'); 
        } else { 
          setAppointmentType('standard'); 
        }
      }
    };
    fetchPatientPackages();
  }, [selectedPatientId]); 

  // Handler genérico para mudanças nos campos do formulário
  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handler para salvar o agendamento
  const handleSaveAppointment = async () => {
    setIsLoading(true);
    
    // Validação
    if (!selectedPatientId || !formData.professionalId || !formData.date || !formData.time) {
        toast.error("Paciente, profissional, data e hora são obrigatórios.");
        setIsLoading(false);
        return;
    }

    // Monta os parâmetros para a função do Supabase
    let rpcParams: any = {
      p_patient_id: selectedPatientId,
      p_professional_id: formData.professionalId,
      p_appointment_date: formData.date,
      p_appointment_time: formData.time,
      p_room_id: formData.roomId || null,
      p_notes: formData.notes
    };

    if (appointmentType === 'package') {
      if (!formData.selectedPackageId) {
        toast.error("Por favor, selecione um pacote.");
        setIsLoading(false); return;
      }
      rpcParams.p_patient_package_id = formData.selectedPackageId;
      rpcParams.p_appointment_type = 'Sessão de Pacote';
      rpcParams.p_price = null;

    } else if (appointmentType === 'standard') {
      // Validação e uso do novo campo de preço
      if (!formData.standardPrice || parseFloat(formData.standardPrice) < 0) {
        toast.error("O valor da consulta padrão é obrigatório.");
        setIsLoading(false); return;
      }
      rpcParams.p_appointment_type = 'Consulta';
      rpcParams.p_price = parseFloat(formData.standardPrice);

    } else if (appointmentType === 'custom') {
      if (!formData.customDescription || !formData.customPrice) {
        toast.error("Descrição e valor personalizados são obrigatórios.");
        setIsLoading(false); return;
      }
      rpcParams.p_appointment_type = formData.customDescription;
      rpcParams.p_price = parseFloat(formData.customPrice);
    }
    
    try {
      const { error: rpcError } = await supabase.rpc('create_appointment', rpcParams);
      if (rpcError) throw rpcError;
      toast.success("Agendamento criado com sucesso!");
      onSave();
    } catch (err: any) {
      toast.error(err.message || "Ocorreu um erro ao salvar.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-slate-50">
      <div className="space-y-2">
        <Label htmlFor="patient">Paciente *</Label>
        <Select onValueChange={setSelectedPatientId} value={selectedPatientId}>
          <SelectTrigger id="patient"><SelectValue placeholder="Selecione o paciente para começar" /></SelectTrigger>
          <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {selectedPatientId && (
        <>
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
                <Label htmlFor="r2">Nova Consulta</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="r3" />
                <Label htmlFor="r3">Outro (Personalizado)</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Campo de preço que aparece para 'Nova Consulta' */}
          {appointmentType === 'standard' && (
             <div className="space-y-2 animate-in fade-in-50">
               <Label htmlFor="standard-price">Valor da Consulta (R$) *</Label>
               <Input 
                 id="standard-price" 
                 type="number" 
                 placeholder="Ex: 180.00" 
                 value={formData.standardPrice} 
                 onChange={(e) => handleChange('standardPrice', e.target.value)} 
               />
             </div>
          )}

          {/* Campo para selecionar o pacote */}
          {appointmentType === 'package' && (
             <div className="space-y-2 animate-in fade-in-50">
               <Label htmlFor="package">Pacote Disponível *</Label>
               <Select onValueChange={(value) => handleChange('selectedPackageId', value)} value={formData.selectedPackageId}>
                 <SelectTrigger id="package"><SelectValue placeholder="Selecione o pacote" /></SelectTrigger>
                 <SelectContent>{patientPackages.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.sessions_remaining} restantes)</SelectItem>)}</SelectContent>
               </Select>
             </div>
          )}

          {/* Campos para o tipo 'Personalizado' */}
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
          
          <div className="space-y-2">
            <Label htmlFor="professional">Profissional *</Label>
            <Select onValueChange={(value) => handleChange('professionalId', value)} value={formData.professionalId}>
              <SelectTrigger id="professional"><SelectValue placeholder="Selecione o profissional" /></SelectTrigger>
              <SelectContent>{professionals.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="room">Sala</Label>
            <Select onValueChange={(value) => handleChange('roomId', value)} value={formData.roomId}>
              <SelectTrigger id="room"><SelectValue placeholder="Opcional: selecione a sala" /></SelectTrigger>
              <SelectContent>{rooms.map(room => (<SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input id="date" type="date" value={formData.date} onChange={(e) => handleChange('date', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Hora *</Label>
              <Input id="time" type="time" value={formData.time} onChange={(e) => handleChange('time', e.target.value)} />
            </div>
          </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" placeholder="Observações sobre a consulta..." value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} />
            </div>
          
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button type="button" onClick={handleSaveAppointment} disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar Agendamento'}</Button>
          </div>
        </>
      )}
    </div>
  );
}