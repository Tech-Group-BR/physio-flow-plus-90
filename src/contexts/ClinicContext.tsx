import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import PersistentCache from '../lib/persistentCache';

// Use the types from the main types file
import { 
  Patient as MainPatient, 
  Professional as MainProfessional, 
  Room as MainRoom, 
  Appointment as MainAppointment, 
  MedicalRecord as MainMedicalRecord, 
  AccountsPayable as MainAccountsPayable, 
  AccountsReceivable as MainAccountsReceivable, 
  Evolution as MainEvolution, 
  Payment as MainPayment, 
  Lead as MainLead, 
  DashboardStats as MainDashboardStats,
  Address,
  EmergencyContact
} from '@/types';

// Database interfaces that match Supabase schema exactly
interface DbPatient {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  phone: string;
  email?: string;
  cpf?: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other'; // ✅ Incluir 'other'
  address?: any; // <-- alterado de 'string | object' para 'any'
  emergency_contact?: any; // <-- alterado de 'string | object' para 'any'
  emergency_phone?: string;
  medical_history?: string;
  treatment_type?: string;
  insurance?: string;
  notes?: string;
  is_active: boolean;
  is_minor?: boolean;
  guardian_id?: string;
  session_value?: number;
}

interface DbProfessional {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  phone?: string;
  email?: string;
  crefito?: string;
  specialties?: string[];
  is_active: boolean;
  role?: string;
  bio?: string;
  profile_picture_url?: string;
  profile_id?: string;
}

interface DbRoom {
  id: string;
  created_at: string;
  updated_at?: string;
  name: string;
  capacity?: number;
  equipment?: string[];
  is_active: boolean;
}

interface DbAppointment {
  id: string;
  created_at: string;
  updated_at: string;
  patient_id: string;
  professional_id: string;
  room_id?: string;
  date: string;
  time: string;
  duration?: number;
  treatment_type?: string;
  status: 'marcado' | 'confirmado' | 'cancelado' | 'realizado' | 'faltante';
  notes?: string;
  whatsapp_confirmed?: boolean;
  whatsapp_sent_at?: string;
}

interface DbMedicalRecord {
  id: string;
  created_at: string;
  updated_at: string;
  patient_id: string;
  anamnesis?: any;
  files?: string[];
}

interface DbAccountsPayable {
  id: string;
  created_at: string;
  updated_at?: string;
  description: string;
  amount: number;
  due_date: string;
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  category?: string;
  notes?: string;
  paid_date?: string;
}

interface DbAccountsReceivable {
  id: string;
  created_at: string;
  updated_at?: string;
  patient_id?: string;
  professional_id?: string;
  description: string;
  amount: number;
  due_date: string;
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  paid_date?: string;
  received_date?: string;
  method?: string;
  appointment_id?: string;
  service_id?: string;
  discount_amount?: number;
  patient_package_id?: string;
}

interface DbEvolution {
  id: string;
  record_id: string;
  date: string;
  professional_id: string;
  observations: string;
  pain_scale?: number;
  mobility_scale?: number;
  treatment_performed?: string;
  next_session?: string;
  files?: string[];
  media?: string[];
  visible_to_guardian?: boolean;
  created_at: string;
}

interface DbLead {
  id: string;
  name: string;
  email?: string;
  phone: string;
  source?: string;
  status: 'novo' | 'contatado' | 'interessado' | 'agendado' | 'cliente' | 'perdido';
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface ClinicContextType {
  patients: MainPatient[];
  professionals: MainProfessional[];
  rooms: MainRoom[];
  appointments: MainAppointment[];
  medicalRecords: MainMedicalRecord[];
  accountsPayable: MainAccountsPayable[];
  accountsReceivable: MainAccountsReceivable[];
  evolutions: MainEvolution[];
  leads: MainLead[];
  dashboardStats: MainDashboardStats | null;
  currentUser: any;
  loading: boolean;
  fetchPatients: () => Promise<void>;
  addPatient: (patient: Omit<MainPatient, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePatient: (id: string, updates: Partial<MainPatient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  fetchProfessionals: () => Promise<void>;
  addProfessional: (Professional: Omit<MainProfessional, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProfessional: (id: string, updates: Partial<MainProfessional>) => Promise<void>;
  deleteProfessional: (id: string) => Promise<void>;
  fetchRooms: () => Promise<void>;
  addRoom: (room: Omit<MainRoom, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRoom: (room: MainRoom) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  fetchAppointments: () => Promise<void>;
  addAppointment: (appointment: Omit<MainAppointment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAppointment: (id: string, updates: Partial<MainAppointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  fetchMedicalRecords: () => Promise<void>;
  addMedicalRecord: (medicalRecord: Omit<MainMedicalRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMedicalRecord: (medicalRecord: MainMedicalRecord) => Promise<void>;
  deleteMedicalRecord: (id: string) => Promise<void>;
  fetchAccountsPayable: () => Promise<void>;
  addAccountsPayable: (accountsPayable: Omit<MainAccountsPayable, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAccountsPayable: (accountsPayable: MainAccountsPayable) => Promise<void>;
  deleteAccountsPayable: (id: string) => Promise<void>;
  fetchAccountsReceivable: () => Promise<void>;
  addAccountsReceivable: (accountsReceivable: Omit<MainAccountsReceivable, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAccountsReceivable: (accountsReceivable: MainAccountsReceivable) => Promise<void>;
  deleteAccountsReceivable: (id: string) => Promise<void>;
  fetchEvolutions: () => Promise<void>;
  addEvolution: (evolution: Omit<MainEvolution, 'id' | 'createdAt'>) => Promise<void>;
  updateEvolution: (evolution: MainEvolution) => Promise<void>;
  deleteEvolution: (id: string) => Promise<void>;
  fetchLeads: () => Promise<void>;
  addLead: (lead: Omit<MainLead, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateLead: (lead: MainLead) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  fetchDashboardStats: () => Promise<void>;
  markReceivableAsPaid: (id: string, method: Database['public']['Enums']['payment_method_enum']) => Promise<void>;
  markPayableAsPaid: (id: string, paidDate?: string) => Promise<void>;
  addPayment: (payment: { patientId: string; amount: number; method: string; status: string; description: string; dueDate: string; paidDate?: string }) => Promise<void>;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

// --- Mappers ---
const dbToMainPatient = (dbPatient: DbPatient): MainPatient => ({
  id: dbPatient.id,
  fullName: dbPatient.full_name,
  phone: dbPatient.phone,
  email: dbPatient.email || '',
  cpf: dbPatient.cpf || '',
  birth_date: dbPatient.birth_date,
  gender: dbPatient.gender,
  address: (dbPatient.address && typeof dbPatient.address === 'string' && dbPatient.address.trim()) 
    ? JSON.parse(dbPatient.address) : (dbPatient.address || {}),
  emergencyContact: (dbPatient.emergency_contact && typeof dbPatient.emergency_contact === 'string' && dbPatient.emergency_contact.trim())
    ? JSON.parse(dbPatient.emergency_contact) : (dbPatient.emergency_contact || {}),
  emergencyPhone: dbPatient.emergency_phone || '',
  medicalHistory: dbPatient.medical_history || '',
  insurance: dbPatient.insurance || '',
  treatmentType: dbPatient.treatment_type || '',
  notes: dbPatient.notes || '',
  isActive: dbPatient.is_active,
  isMinor: dbPatient.is_minor || false,
  guardianId: dbPatient.guardian_id,
  createdAt: dbPatient.created_at,
  updatedAt: dbPatient.updated_at,
  appointments: [],
  payments: [],
});

const dbToMainProfessional = (dbPhysio: DbProfessional): MainProfessional => ({
  id: dbPhysio.id,
  name: dbPhysio.full_name,
  email: dbPhysio.email || '',
  phone: dbPhysio.phone || '',
  crefito: dbPhysio.crefito || '',
  specialties: dbPhysio.specialties || [],
  bio: dbPhysio.bio || '',
  isActive: dbPhysio.is_active,
  createdAt: dbPhysio.created_at,
  updatedAt: dbPhysio.updated_at
});

const dbToMainRoom = (dbRoom: DbRoom): MainRoom => ({
  id: dbRoom.id,
  name: dbRoom.name,
  capacity: dbRoom.capacity || 1,
  equipment: dbRoom.equipment || [],
  is_active: dbRoom.is_active, // <-- nome correto
});

const dbToMainAppointment = (dbAppt: DbAppointment): MainAppointment => ({
  id: dbAppt.id,
  patientId: dbAppt.patient_id,
  professionalId: dbAppt.professional_id,
  roomId: dbAppt.room_id || '',
  date: dbAppt.date,
  time: dbAppt.time,
  duration: dbAppt.duration || 60,
  treatmentType: dbAppt.treatment_type || '',
  status: dbAppt.status,
  notes: dbAppt.notes,
  whatsappConfirmed: dbAppt.whatsapp_confirmed,
  whatsappSentAt: dbAppt.whatsapp_sent_at,
  createdAt: dbAppt.created_at,
  updatedAt: dbAppt.updated_at  
});

const dbToMainMedicalRecord = (dbRecord: DbMedicalRecord): MainMedicalRecord => ({
  id: dbRecord.id,
  patientId: dbRecord.patient_id,
  anamnesis: (dbRecord.anamnesis && typeof dbRecord.anamnesis === 'string' && dbRecord.anamnesis.trim()) 
    ? JSON.parse(dbRecord.anamnesis) : (dbRecord.anamnesis || {}),
  evolutions: [],
  files: dbRecord.files || [],
  createdAt: dbRecord.created_at,
  updatedAt: dbRecord.updated_at
});

const dbToMainAccountsPayable = (dbAp: DbAccountsPayable): MainAccountsPayable => ({
  id: dbAp.id,
  description: dbAp.description,
  amount: dbAp.amount,
  dueDate: dbAp.due_date,
  paidDate: dbAp.paid_date,
  status: dbAp.status === 'cancelado' ? 'pendente' : dbAp.status,
  category: dbAp.category || '',
  notes: dbAp.notes,
  createdAt: dbAp.created_at,
  updatedAt: dbAp.updated_at
});

const dbToMainAccountsReceivable = (dbAr: DbAccountsReceivable): MainAccountsReceivable => ({
  id: dbAr.id,
  patientId: dbAr.patient_id,
  professional_id: dbAr.professional_id,
  description: dbAr.description,
  amount: dbAr.amount,
  dueDate: dbAr.due_date,
  receivedDate: dbAr.received_date,
  status: dbAr.status === 'pago' ? 'recebido' : (dbAr.status === 'cancelado' ? 'pendente' : dbAr.status),
  method: (dbAr.method as MainAccountsReceivable['method']) || 'cash',
  notes: '',
  createdAt: dbAr.created_at,
  updatedAt: dbAr.updated_at,
  appointment_id: dbAr.appointment_id,
  service_id: dbAr.service_id,
  discount_amount: dbAr.discount_amount,
  patient_package_id: dbAr.patient_package_id
});

const dbToMainEvolution = (dbEvo: DbEvolution): MainEvolution => ({
  id: dbEvo.id,
  recordId: dbEvo.record_id,
  date: dbEvo.date,
  professional_id: dbEvo.professional_id,
  observations: dbEvo.observations,
  painScale: dbEvo.pain_scale,
  mobilityScale: dbEvo.mobility_scale,
  treatmentPerformed: dbEvo.treatment_performed,
  nextSession: dbEvo.next_session,
  files: dbEvo.files || [],
  visibleToGuardian: dbEvo.visible_to_guardian || false,
  createdAt: dbEvo.created_at
});

const dbToMainLead = (dbLead: DbLead): MainLead => {
  let mainStatus: MainLead['status'];
  switch (dbLead.status) {
    case 'novo': mainStatus = 'novo'; break;
    case 'contatado': mainStatus = 'contato_inicial'; break;
    case 'interessado': mainStatus = 'avaliacao'; break;
    case 'agendado': mainStatus = 'agendamento'; break;
    case 'cliente': mainStatus = 'cliente'; break;
    case 'perdido': mainStatus = 'perdido'; break;
    default: mainStatus = 'novo';
  }

  return {
    id: dbLead.id,
    name: dbLead.name,
    email: dbLead.email || '',
    phone: dbLead.phone,
    source: (dbLead.source as MainLead['source']) || 'outros',
    status: mainStatus,
    notes: dbLead.notes,
    createdAt: dbLead.created_at,
    updatedAt: dbLead.updated_at
  };
};
// --- End Mappers ---

export function ClinicProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<MainPatient[]>([]);
  const [professionals, setProfessionals] = useState<MainProfessional[]>([]);
  const [rooms, setRooms] = useState<MainRoom[]>([]);
  const [appointments, setAppointments] = useState<MainAppointment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MainMedicalRecord[]>([]);
  const [accountsPayable, setAccountsPayable] = useState<MainAccountsPayable[]>([]);
  const [accountsReceivable, setAccountsReceivable] = useState<MainAccountsReceivable[]>([]);
  const [evolutions, setEvolutions] = useState<MainEvolution[]>([]);
  const [leads, setLeads] = useState<MainLead[]>([]);
  const [dashboardStats, setDashboardStats] = useState<MainDashboardStats | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
 const { user, loading: authLoading } = useAuth();
const clinicId = user?.profile?.clinic_id;

// ✅ FUNÇÃO ROBUSTA: Obter clinic_id com fallback do cache
const getClinicId = (): string | null => {
  // 1. Primeiro tenta do user atual
  if (user?.profile?.clinic_id) {
    return user.profile.clinic_id;
  }
  
  // 2. Se não tem, tenta do cache
  const cachedClinicId = PersistentCache.getClinicId();
  if (cachedClinicId) {
    console.log('⚡ Usando clinic_id do cache:', cachedClinicId);
    return cachedClinicId;
  }
  
  console.warn('⚠️ Nenhum clinic_id disponível (nem do user nem do cache)');
  return null;
};

// ✅ ESTABILIZAR: Memorizar valores para evitar loops e adicionar timestamp
const hasValidUser = Boolean(user && user.profile && (clinicId || PersistentCache.getClinicId()));
const isAuthReady = !authLoading;
const [lastLoadTime, setLastLoadTime] = useState<number>(0);
const [isLoadingData, setIsLoadingData] = useState(false);
 
 
 useEffect(() => {
    console.log('🔄 ClinicContext useEffect - Estado atual:', {
      hasUser: !!user,
      hasProfile: !!user?.profile,
      clinicId,
      authLoading,
      hasValidUser,
      isAuthReady,
      isLoadingData,
      timeSinceLastLoad: Date.now() - lastLoadTime
    });

    // ✅ PROTEÇÃO: Evitar carregamento duplo
    if (isLoadingData) {
      console.log('⏭️ ClinicContext: Já está carregando dados, ignorando...');
      return;
    }

    // ✅ PROTEÇÃO: Evitar recarregamento muito frequente (mínimo 5 segundos)
    const now = Date.now();
    if (hasValidUser && isAuthReady && (now - lastLoadTime) < 5000) {
      console.log('⏭️ ClinicContext: Carregamento muito recente, aguardando...');
      return;
    }

    // 1. Condição para iniciar o carregamento de dados da clínica
    if (hasValidUser && isAuthReady) { 
      console.log('🏥 ClinicContext: Iniciando carregamento de dados para clínica:', clinicId);
      setLoading(true);
      setIsLoadingData(true);
      setLastLoadTime(now);

      const loadAllClinicData = async () => {
        try {
          console.log('📊 Carregando dados essenciais...');
          await Promise.all([
            fetchPatients(clinicId),
            fetchAppointments(clinicId)
          ]);
          console.log('✅ Dados essenciais carregados');

          console.log('📋 Carregando dados secundários...');
          await Promise.all([
            fetchProfessionals(clinicId),
            fetchRooms(clinicId),
            fetchMedicalRecords(clinicId),
            fetchEvolutions(clinicId),
            fetchAccountsReceivable(clinicId),
            fetchAccountsPayable(clinicId),
            fetchLeads(clinicId)
          ]);
          console.log('✅ Dados secundários carregados');
          
          await fetchDashboardStatsWrapper();
        } catch (error) {
          console.error("❌ Erro ao carregar dados da clínica:", error);
          toast.error("Não foi possível carregar os dados da sua clínica.");
        } finally {
          console.log('✅ ClinicContext: Carregamento de dados finalizado.');
          setLoading(false);
          setIsLoadingData(false);
        }
      };

      loadAllClinicData();

    } else if (!user && isAuthReady) {
      console.warn('⚠️ ClinicContext: Usuário deslogado. Limpando dados.');
      setLoading(false);
      setIsLoadingData(false);
      // Limpar todos os dados quando usuário sair
      setPatients([]);
      setProfessionals([]);
      setRooms([]);
      setAppointments([]);
      setMedicalRecords([]);
      setAccountsPayable([]);
      setAccountsReceivable([]);
      setEvolutions([]);
      setLeads([]);
      setDashboardStats(null);
      setCurrentUser(null);
    } else if (!hasValidUser && user && isAuthReady) {
      console.warn('⚠️ ClinicContext: Usuário sem perfil válido ou clinic_id.');
      setLoading(false);
      setIsLoadingData(false);
    } else if (!isAuthReady) {
      console.log('⏳ ClinicContext: Aguardando autenticação terminar...');
    }
  }, [hasValidUser, isAuthReady, clinicId]); // ✅ Dependências simplificadas

  // useEffect para recarregar dados quando a aba volta ao foco
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && hasValidUser && isAuthReady && !isLoadingData) {
        const now = Date.now();
        const timeSinceLastLoad = now - lastLoadTime;
        
        // Só recarregar se passou pelo menos 30 segundos desde o último carregamento
        if (timeSinceLastLoad > 30000) {
          console.log('👁️ ClinicContext: Aba voltou ao foco, recarregando dados...');
          
          const reloadCriticalData = async () => {
            try {
              setIsLoadingData(true);
              setLastLoadTime(now);
              
              // Recarregar apenas dados críticos
              await Promise.all([
                fetchAppointments(clinicId),
                fetchDashboardStatsWrapper()
              ]);
              
              console.log('✅ ClinicContext: Dados críticos recarregados após mudança de aba');
            } catch (error) {
              console.error('❌ Erro ao recarregar dados após mudança de aba:', error);
            } finally {
              setIsLoadingData(false);
            }
          };
          
          reloadCriticalData();
        } else {
          console.log('⏭️ ClinicContext: Mudança de aba muito recente, aguardando...');
        }
      }
    };

    const handleWindowFocus = () => {
      if (hasValidUser && isAuthReady && !isLoadingData) {
        const now = Date.now();
        const timeSinceLastLoad = now - lastLoadTime;
        
        // Só recarregar se passou pelo menos 15 segundos
        if (timeSinceLastLoad > 15000) {
          console.log('🎯 ClinicContext: Janela voltou ao foco, atualizando dados...');
          
          const refreshData = async () => {
            try {
              setIsLoadingData(true);
              setLastLoadTime(now);
              
              // Atualizar apenas compromissos e stats
              await Promise.all([
                fetchAppointments(clinicId),
                fetchDashboardStatsWrapper()
              ]);
              
              console.log('✅ ClinicContext: Dados atualizados após foco da janela');
            } catch (error) {
              console.error('❌ Erro ao atualizar dados após foco da janela:', error);
            } finally {
              setIsLoadingData(false);
            }
          };
          
          refreshData();
        }
      }
    };

    // Adiciona listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [hasValidUser, isAuthReady, isLoadingData, clinicId, lastLoadTime]);
const fetchPatients = async (clinicId: string) => { // clinicId deve ser passado ou acessível
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*') // Removido o '.' extra aqui
      .eq('clinic_id', clinicId) // <-- CORRIGIDO: Usar .eq()
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar pacientes:', error.message);
      throw error; // Lançar o erro para ser pego pelo catch
    }

    const mappedPatients = (data || []).map(dbToMainPatient);
    setPatients(mappedPatients);
    return mappedPatients; // Pode ser útil retornar os pacientes
  } catch (error) {
    console.error('Erro inesperado ao buscar pacientes:', error);
    // Pode querer limpar os pacientes em caso de erro
    // setPatients([]);
  }
};
  const addPatient = async (patient: Omit<MainPatient, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { error } = await supabase
        .from('patients')
        .insert({
          id: uuidv4(),
          full_name: patient.fullName,
          phone: patient.phone,
          email: patient.email,
          cpf: patient.cpf,
          birth_date: patient.birth_date,
          gender: patient.gender,
          address: JSON.stringify(patient.address),
          emergency_contact: JSON.stringify(patient.emergencyContact),
          emergency_phone: patient.emergencyPhone,
          medical_history: patient.medicalHistory,
          treatment_type: patient.treatmentType,
          insurance: patient.insurance,
          notes: patient.notes,
          is_active: patient.isActive,
          is_minor: patient.isMinor,
          guardian_id: patient.guardianId ? patient.guardianId : null,
          clinic_id: clinicId // <-- sempre envia
        });
      if (error) throw error;
      await fetchPatients(clinicId);
    } catch (error) {
      console.error('Erro ao adicionar paciente:', error);
      throw error;
    }
  };

  const updatePatient = async (id: string, updates: Partial<MainPatient>) => {
    try {
      const updateData: any = {};
      if (updates.fullName) updateData.full_name = updates.fullName;
      if (updates.phone) updateData.phone = updates.phone;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.cpf !== undefined) updateData.cpf = updates.cpf;
      if (updates.birth_date !== undefined) updateData.birth_date = updates.birth_date;
      if (updates.gender) updateData.gender = updates.gender;
      if (updates.address) updateData.address = JSON.stringify(updates.address);
      if (updates.emergencyContact) updateData.emergency_contact = JSON.stringify(updates.emergencyContact);
      if (updates.emergencyPhone !== undefined) updateData.emergency_phone = updates.emergencyPhone;
      if (updates.medicalHistory !== undefined) updateData.medical_history = updates.medicalHistory;
      if (updates.treatmentType !== undefined) updateData.treatment_type = updates.treatmentType;
      if (updates.insurance !== undefined) updateData.insurance = updates.insurance;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.isMinor !== undefined) updateData.is_minor = updates.isMinor;
      updateData.guardian_id =
        updates.guardianId && updates.guardianId.trim() !== "" ? updates.guardianId : null;
      updateData.clinic_id = clinicId; // <-- sempre envia

      const { error } = await supabase
        .from('patients')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
      await fetchPatients(clinicId);
    } catch (error) {
      console.error('Erro ao atualizar paciente:', error);
      throw error;
    }
  };

  const deletePatient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchPatients(clinicId);
    } catch (error) {
      console.error('Erro ao deletar paciente:', error);
      throw error;
    }
  };

 const fetchProfessionals = async (clinicId: string) => { // <<< clinicId deve ser passado
  try {
    const { data, error } = await supabase
      .from('professionals')
      .select('*')
      .eq('clinic_id', clinicId) // <<< ADICIONADO O FILTRO AQUI
      .order('full_name', { ascending: true }); 

    if (error) {
      console.error('Erro ao buscar profissionais:', error.message);
      throw error; // Lançar o erro para ser pego pelo catch
    }

    const mappedPhysios = (data || []).map(item => dbToMainProfessional(item as DbProfessional));
    setProfessionals(mappedPhysios);
    return mappedPhysios; // Pode ser útil retornar os profissionais
  } catch (error) {
    console.error('Erro inesperado ao buscar profissionais:', error);
    // setProfessionals([]); // Opcional: limpar profissionais em caso de erro
  }
};

  const addProfessional = async (Professional: Omit<MainProfessional, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { error } = await supabase
        .from('professionals')
        .insert({
          full_name: Professional.name,
          phone: Professional.phone,
          email: Professional.email,
          crefito: Professional.crefito,
          specialties: Professional.specialties,
          bio: Professional.bio || null,
          is_active: true,
          profile_picture_url: null,
          profile_id: Professional.profile_id || null,
          clinic_id: clinicId // <-- sempre envia
        });
      if (error) throw error;
      await fetchProfessionals(clinicId);
    } catch (error) {
      console.error('Erro ao adicionar fisioterapeuta:', error);
      throw error;
    }
  };

  const updateProfessional = async (id: string, updates: Partial<MainProfessional>) => {
    try {
      const updateData: any = {};
      if (updates.name) updateData.full_name = updates.name;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.crefito !== undefined) updateData.crefito = updates.crefito;
      if (updates.specialties !== undefined) updateData.specialties = updates.specialties;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      updateData.clinic_id = clinicId; // <-- sempre envia

      const { error } = await supabase
        .from('professionals')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
      await fetchProfessionals(clinicId);
    } catch (error) {
      console.error('Erro ao atualizar fisioterapeuta:', error);
      throw error;
    }
  };

  const deleteProfessional = async (id: string) => {
    try {
      const { error } = await supabase
        .from('professionals')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchProfessionals(clinicId);
    } catch (error) {
      console.error('Erro ao deletar fisioterapeuta:', error);
      throw error;
    }
  };

const fetchRooms = async (clinicId: string) => { // <<< clinicId deve ser passado
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('clinic_id', clinicId) // <<< ADICIONADO O FILTRO AQUI
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar salas:', error.message);
      throw error;
    }
    
    const mappedRooms = (data || []).map(dbToMainRoom);
    setRooms(mappedRooms);
    return mappedRooms;
  } catch (error) {
    console.error('Erro inesperado ao buscar salas:', error);
    // setRooms([]); // Opcional: limpar salas em caso de erro
  }
};

  const addRoom = async (room: Omit<MainRoom, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const currentClinicId = getClinicId();
      if (!currentClinicId) {
        throw new Error('❌ Não foi possível identificar a clínica. Faça login novamente.');
      }
      
      const roomWithClinicId = {
        ...room,
        id: uuidv4(),
        clinic_id: currentClinicId // ✅ GARANTIR clinic_id
      };
      
      const { error } = await supabase
        .from('rooms')
        .insert(roomWithClinicId);
        
      if (error) throw error;
      
      await fetchRooms(currentClinicId);
      console.log('✅ Sala adicionada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao adicionar sala:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      }
      throw error;
    }
  };

  const updateRoom = async (room: MainRoom) => {
    try {
      const updateData: any = {
        name: room.name,
        capacity: room.capacity,
        equipment: room.equipment,
        is_active: room.is_active // <-- nome correto
        // Remova createdAt/created_at do update!
      };
      const { error } = await supabase
        .from('rooms')
        .update(updateData)
        .eq('id', room.id);
      if (error) throw error;
      await fetchRooms(clinicId);
    } catch (error) {
      console.error('Erro ao atualizar sala:', error);
      throw error;
    }
  };

  const deleteRoom = async (id: string) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchRooms(clinicId);
    } catch (error) {
      console.error('Erro ao deletar sala:', error);
      throw error;
    }
  };
const fetchAppointments = async (clinicId: string) => { // <<< clinicId deve ser passado
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('clinic_id', clinicId) // <<< ADICIONADO O FILTRO AQUI
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      console.error('Erro ao buscar agendamentos:', error.message);
      throw error; // Lançar o erro para ser pego pelo catch
    }

    const mappedAppointments = (data || []).map(dbToMainAppointment);
    setAppointments(mappedAppointments);
    return mappedAppointments; // Pode ser útil retornar os agendamentos
  } catch (error) {
    console.error('Erro inesperado ao buscar agendamentos:', error);
    // setAppointments([]); // Opcional: limpar agendamentos em caso de erro
  }
};
  const addAppointment = async (appointment: Omit<MainAppointment, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const currentClinicId = getClinicId();
      if (!currentClinicId) {
        throw new Error('❌ Não foi possível identificar a clínica. Faça login novamente.');
      }
      
      console.log('📅 Adicionando agendamento para clínica:', currentClinicId);
      
      const { error } = await supabase
        .from('appointments')
        .insert({ 
          id: uuidv4(),
          patient_id: appointment.patientId,
          professional_id: appointment.professionalId,
          room_id: appointment.roomId,
          date: appointment.date,
          time: appointment.time,
          duration: appointment.duration,
          treatment_type: appointment.treatmentType,
          status: appointment.status,
          notes: appointment.notes,
          whatsapp_confirmed: appointment.whatsappConfirmed,
          whatsapp_sent_at: appointment.whatsappSentAt,
          clinic_id: currentClinicId // ✅ GARANTIR clinic_id
        });
        
      if (error) throw error;
      
      await fetchAppointments(currentClinicId);
      await fetchAccountsReceivable(currentClinicId);
      console.log('✅ Agendamento adicionado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao adicionar agendamento:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      }
      throw error;
    }
  };

  const updateAppointment = async (id: string, updates: Partial<MainAppointment>) => {
    try {
      const updateData: any = {};
      if (updates.patientId) updateData.patient_id = updates.patientId;
      if (updates.professionalId) updateData.professional_id = updates.professionalId;
      if (updates.roomId !== undefined) updateData.room_id = updates.roomId;
      if (updates.date) updateData.date = updates.date;
      if (updates.time) updateData.time = updates.time;
      if (updates.duration !== undefined) updateData.duration = updates.duration;
      if (updates.treatmentType !== undefined) updateData.treatment_type = updates.treatmentType;
      if (updates.status) updateData.status = updates.status;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.whatsappConfirmed !== undefined) updateData.whatsapp_confirmed = updates.whatsappConfirmed;
      if (updates.whatsappSentAt !== undefined) updateData.whatsapp_sent_at = updates.whatsappSentAt;
      updateData.clinic_id = clinicId; // <-- sempre envia

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
      await fetchAppointments(clinicId);
      await fetchAccountsReceivable(clinicId);
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      throw error;
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchAppointments(clinicId);
    } catch (error) {
      console.error('Erro ao deletar agendamento:', error);
      throw error;
    }
  };

const fetchMedicalRecords = async (clinicId: string) => { // <<< clinicId deve ser passado
  try {
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('clinic_id', clinicId) // <<< ADICIONADO O FILTRO AQUI
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar prontuários:', error.message);
      throw error; // Lançar o erro para ser pego pelo catch
    }

    const mappedRecords = (data || []).map(dbToMainMedicalRecord);
    setMedicalRecords(mappedRecords);
    return mappedRecords; // Pode ser útil retornar os prontuários
  } catch (error) {
    console.error('Erro inesperado ao buscar prontuários:', error);
    // setMedicalRecords([]); // Opcional: limpar prontuários em caso de erro
  }
};
  const addMedicalRecord = async (medicalRecord: Omit<MainMedicalRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { error } = await supabase
        .from('medical_records')
        .insert({ 
          id: uuidv4(),
          patient_id: medicalRecord.patientId,
          anamnesis: typeof medicalRecord.anamnesis === 'object' ? JSON.stringify(medicalRecord.anamnesis) : medicalRecord.anamnesis,
          files: medicalRecord.files,
          clinic_id: clinicId // <-- sempre envia
        });
      if (error) throw error;
      await fetchMedicalRecords(clinicId);
    } catch (error) {
      console.error('Erro ao adicionar prontuário:', error);
      throw error;
    }
  };

  const updateMedicalRecord = async (medicalRecord: MainMedicalRecord) => {
    try {
      const { error } = await supabase
        .from('medical_records')
        .update({
          anamnesis: typeof medicalRecord.anamnesis === 'object' ? JSON.stringify(medicalRecord.anamnesis) : medicalRecord.anamnesis,
          files: medicalRecord.files
        })
        .eq('id', medicalRecord.id);
      if (error) throw error;
      await fetchMedicalRecords(clinicId);
    } catch (error) {
      console.error('Erro ao atualizar prontuário:', error);
      throw error;
    }
  };

  const deleteMedicalRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('medical_records')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchMedicalRecords(clinicId);
    } catch (error) {
      console.error('Erro ao deletar prontuário:', error);
      throw error;
    }
  };

const fetchAccountsPayable = async (clinicId: string) => { // <<< clinicId deve ser passado
  try {
    const { data, error } = await supabase
      .from('accounts_payable')
      .select('*')
      .eq('clinic_id', clinicId) // <<< ADICIONADO O FILTRO AQUI
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Erro ao buscar contas a pagar:', error.message);
      throw error;
    }

    const mappedData = (data || []).map(dbToMainAccountsPayable);
    setAccountsPayable(mappedData);
    return mappedData; // Opcional: retornar os dados
  } catch (error) {
    console.error('Erro inesperado ao buscar contas a pagar:', error);
  }
};

  const addAccountsPayable = async (accountsPayable: Omit<MainAccountsPayable, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { error } = await supabase
        .from('accounts_payable')
        .insert({ 
          id: uuidv4(),
          description: accountsPayable.description,
          amount: accountsPayable.amount,
          due_date: accountsPayable.dueDate,
          status: accountsPayable.status,
          category: accountsPayable.category,
          notes: accountsPayable.notes,
          paid_date: accountsPayable.paidDate,
          clinic_id: clinicId // <-- sempre envia
        });
      if (error) throw error;
      await fetchAccountsPayable(clinicId);
    } catch (error) {
      console.error('Erro ao adicionar conta a pagar:', error);
      throw error;
    }
  };

  const updateAccountsPayable = async (accountsPayable: MainAccountsPayable) => {
    try {
      const { error } = await supabase
        .from('accounts_payable')
        .update({
          description: accountsPayable.description,
          amount: accountsPayable.amount,
          due_date: accountsPayable.dueDate,
          status: accountsPayable.status,
          category: accountsPayable.category,
          notes: accountsPayable.notes,
          paid_date: accountsPayable.paidDate,
          clinic_id: clinicId // <-- sempre envia
        })
        .eq('id', accountsPayable.id);
      if (error) throw error;
      await fetchAccountsPayable(clinicId);
    } catch (error) {
      console.error('Erro ao atualizar conta a pagar:', error);
      throw error;
    }
  };

  const deleteAccountsPayable = async (id: string) => {
    const originalState = [...accountsPayable];
    setAccountsPayable(current => current.filter(p => p.id !== id));
    toast.success("Conta a pagar excluída com sucesso!");

    try {
      const { error } = await supabase
        .from('accounts_payable')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchDashboardStats();
    } catch (error) {
      toast.error("Erro ao excluir conta a pagar. A alteração foi desfeita.");
      console.error('Erro ao deletar conta a pagar:', error);
      setAccountsPayable(originalState);
      throw error;
    }
  };

const fetchAccountsReceivable = async (clinicId: string) => { // <<< clinicId deve ser passado
  try {
    const { data, error } = await supabase
      .from('accounts_receivable')
      .select('*')
      .eq('clinic_id', clinicId) // <<< ADICIONADO O FILTRO AQUI
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Erro ao buscar contas a receber:', error.message);
      throw error;
    }

    const mappedData = (data || []).map(dbToMainAccountsReceivable);
    setAccountsReceivable(mappedData);
    return mappedData; // Opcional: retornar os dados
  } catch (error) {
    console.error('Erro inesperado ao buscar contas a receber:', error);
  }
};

  const addAccountsReceivable = async (accountsReceivable: Omit<MainAccountsReceivable, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { error } = await supabase
        .from('accounts_receivable')
        .insert({ 
          id: uuidv4(),
          patient_id: accountsReceivable.patientId,
          description: accountsReceivable.description,
          amount: accountsReceivable.amount,
          due_date: accountsReceivable.dueDate,
          status: accountsReceivable.status === 'recebido' ? 'pago' : accountsReceivable.status,
          clinic_id: clinicId // <-- sempre envia
        });
      if (error) throw error;
      await fetchAccountsReceivable(clinicId);
    } catch (error) {
      console.error('Erro ao adicionar conta a receber:', error);
      throw error;
    }
  };

  const updateAccountsReceivable = async (accountsReceivable: MainAccountsReceivable) => {
    try {
      const { error } = await supabase
        .from('accounts_receivable')
        .update({
          patient_id: accountsReceivable.patientId,
          description: accountsReceivable.description,
          amount: accountsReceivable.amount,
          due_date: accountsReceivable.dueDate,
          status: accountsReceivable.status === 'recebido' ? 'pago' : accountsReceivable.status,
          paid_date: accountsReceivable.receivedDate
        })
        .eq('id', accountsReceivable.id);
      if (error) throw error;
      await fetchAccountsReceivable(clinicId);
    } catch (error) {
      console.error('Erro ao atualizar conta a receber:', error);
      throw error;
    }
  };

  const deleteAccountsReceivable = async (id: string) => {
    const originalState = [...accountsReceivable];
    setAccountsReceivable(current => current.filter(r => r.id !== id));
    toast.success("Conta a receber excluída com sucesso!");

    try {
      const { error } = await supabase
        .from('accounts_receivable')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchDashboardStats();
    } catch (error) {
      toast.error("Erro ao excluir conta a receber. A alteração foi desfeita.");
      console.error('Erro ao deletar conta a receber:', error);
      setAccountsReceivable(originalState);
      throw error;
    }
  };

const fetchEvolutions = async (clinicId: string) => { // <<< clinicId deve ser passado
  try {
    const { data, error } = await supabase
      .from('evolutions')
      .select('*')
      .eq('clinic_id', clinicId) // <<< ADICIONADO O FILTRO AQUI
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar evoluções:', error.message);
      throw error;
    }

    const mappedEvolutions = (data || []).map(dbToMainEvolution);
    setEvolutions(mappedEvolutions);
    return mappedEvolutions; // Opcional: retornar os dados
  } catch (error) {
    console.error('Erro inesperado ao buscar evoluções:', error);
  }
};

  const addEvolution = async (evolution: Omit<MainEvolution, 'id' | 'createdAt'>) => {
    try {
      const { error } = await supabase
        .from('evolutions')
        .insert({
          record_id: evolution.recordId,
          date: evolution.date,
          professional_id: evolution.professional_id,
          observations: evolution.observations,
          pain_scale: evolution.painScale,
          mobility_scale: evolution.mobilityScale,
          treatment_performed: evolution.treatmentPerformed,
          next_session: evolution.nextSession,
          files: evolution.files,
          visible_to_guardian: evolution.visibleToGuardian,
          clinic_id: clinicId
        });
      if (error) throw error;
      await fetchEvolutions(clinicId);
    } catch (error) {
      console.error('Erro ao adicionar evolução:', error);
      throw error;
    }
  };

  const updateEvolution = async (evolution: MainEvolution) => {
    try {
      const { error } = await supabase
        .from('evolutions')
        .update({
          observations: evolution.observations,
          pain_scale: evolution.painScale,
          mobility_scale: evolution.mobilityScale,
          treatment_performed: evolution.treatmentPerformed,
          next_session: evolution.nextSession,
          files: evolution.files,
          visible_to_guardian: evolution.visibleToGuardian
        })
        .eq('id', evolution.id);
      if (error) throw error;
      await fetchEvolutions(clinicId);
    } catch (error) {
      console.error('Erro ao atualizar evolução:', error);
      throw error;
    }
  };

  const deleteEvolution = async (id: string) => {
    try {
      const { error } = await supabase
        .from('evolutions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchEvolutions(clinicId);
    } catch (error) {
      console.error('Erro ao deletar evolução:', error);
      throw error;
    }
  };

  const fetchLeads = async (clinicId: string) => { // ✅ CORRIGIDO: Adicionar parâmetro
    try {
      console.log('🎯 Buscando leads para clínica:', clinicId);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('clinic_id', clinicId) // ✅ CORRIGIDO: Filtrar por clinic_id
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Erro ao buscar leads:', error.message);
        throw error;
      }
      
      const mappedLeads = (data || []).map(item => dbToMainLead(item as DbLead));
      setLeads(mappedLeads);
      console.log(`✅ ${mappedLeads.length} leads carregados`);
    } catch (error) {
      console.error('💥 Erro inesperado ao buscar leads:', error);
      toast.error('Erro ao carregar leads');
    }
  };
  const addLead = async (lead: Omit<MainLead, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      let dbStatus: DbLead['status'];
      switch (lead.status) {
        case 'novo': dbStatus = 'novo'; break;
        case 'contato_inicial': dbStatus = 'contatado'; break;
        case 'avaliacao': dbStatus = 'interessado'; break;
        case 'agendamento': dbStatus = 'agendado'; break;
        case 'cliente': dbStatus = 'cliente'; break;
        case 'perdido': dbStatus = 'perdido'; break;
        default: dbStatus = 'novo';
      }

      const { error } = await supabase
        .from('leads')
        .insert({ 
          id: uuidv4(),
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          source: lead.source,
          status: dbStatus,
          notes: lead.notes
        });
      if (error) throw error;
      await fetchLeads(clinicId);
    } catch (error) {
      console.error('Erro ao adicionar lead:', error);
      throw error;
    }
  };

  const updateLead = async (lead: MainLead) => {
    try {
      let dbStatus: DbLead['status'];
      switch (lead.status) {
        case 'novo': dbStatus = 'novo'; break;
        case 'contato_inicial': dbStatus = 'contatado'; break;
        case 'avaliacao': dbStatus = 'interessado'; break;
        case 'agendamento': dbStatus = 'agendado'; break;
        case 'cliente': dbStatus = 'cliente'; break;
        case 'perdido': dbStatus = 'perdido'; break;
        default: dbStatus = 'novo';
      }

      const { error } = await supabase
        .from('leads')
        .update({
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          source: lead.source,
          status: dbStatus,
          notes: lead.notes
        })
        .eq('id', lead.id);
      if (error) throw error;
      await fetchLeads(clinicId);
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      throw error;
    }
  };

  const deleteLead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchLeadsWrapper();
    } catch (error) {
      console.error('Erro ao deletar lead:', error);
      throw error;
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - 1);

      const todayAppointments = appointments.filter(a => a.date === today).length;
      const weekAppointments = appointments.filter(a => new Date(a.date) >= weekStart).length;
      const monthAppointments = appointments.filter(a => new Date(a.date) >= monthStart).length;

      const totalRevenue = accountsReceivable.filter(p => p.status === 'recebido').reduce((sum, p) => sum + p.amount, 0);
      const pendingRevenue = accountsReceivable.filter(p => p.status === 'pendente').reduce((sum, p) => sum + p.amount, 0);
      
      const activePatients = patients.filter(p => p.isActive).length;
      const inactivePatients = patients.filter(p => !p.isActive).length;
      
      const missedAppointments = appointments.filter(a => a.status === 'faltante').length;
      
      const newLeads = leads.filter(l => l.status === 'novo').length;
      const convertedLeads = leads.filter(l => l.status === 'cliente').length;
      
      const accountsPayableTotal = accountsPayable.filter(ap => ap.status === 'pendente').reduce((sum, ap) => sum + ap.amount, 0);
      const accountsReceivableTotal = accountsReceivable.filter(ar => ar.status === 'pendente').reduce((sum, ar) => sum + ar.amount, 0);

      const stats: MainDashboardStats = {
        todayAppointments,
        weekAppointments,
        monthAppointments,
        totalRevenue,
        pendingRevenue,
        activePatients,
        inactivePatients,
        missedAppointments,
        newLeads,
        convertedLeads,
        accountsPayableTotal,
        accountsReceivableTotal
      };
      
      setDashboardStats(stats);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    }
  };

  const markReceivableAsPaid = async (id: string, method: Database['public']['Enums']['payment_method_enum']) => {
    const originalState = [...accountsReceivable];
    const receivedDate = new Date().toISOString();
    
    setAccountsReceivable(current =>
      current.map(acc => 
        acc.id === id 
          ? { 
              ...acc, 
              status: 'recebido', 
              receivedDate: receivedDate, 
              method: method 
            } as MainAccountsReceivable 
          : acc
      )
    );
    toast.success("Conta marcada como recebida!");

    try {
      const { error } = await supabase
        .from('accounts_receivable')
        .update({
          status: 'pago',
          paid_date: receivedDate,
          received_date: receivedDate,
          method: method
        })
        .eq('id', id);

      if (error) throw error;
      
      await fetchDashboardStats();
    } catch (error) {
      toast.error("Erro ao marcar como recebida. A alteração foi desfeita.");
      console.error('Erro ao marcar conta como recebida:', error);
      setAccountsReceivable(originalState);
      throw error;
    }
  };

  const markPayableAsPaid = async (id: string) => {
    const originalState = [...accountsPayable];
    const paidDate = new Date().toISOString();

    setAccountsPayable(current => 
      current.map(acc => 
        acc.id === id 
          ? { ...acc, status: 'pago', paidDate: paidDate } 
          : acc
      )
    );
    toast.success("Conta marcada como paga!");

    try {
      const { error } = await supabase
        .from('accounts_payable')
        .update({
          status: 'pago',
          paid_date: paidDate
        })
        .eq('id', id);

      if (error) throw error;
      
      await fetchDashboardStats();
    } catch (error) {
      toast.error("Erro ao marcar como paga. A alteração foi desfeita.");
      console.error('Erro ao marcar conta como paga:', error);
      setAccountsPayable(originalState);
      throw error;
    }
  };

  const addPayment = async (payment: { patientId: string; amount: number; method: string; status: string; description: string; dueDate: string; paidDate?: string }) => {
    try {
      console.log('Adicionando pagamento:', payment);
      
      const newPayment = {
        patient_id: payment.patientId,
        amount: payment.amount,
        method: payment.method as Database['public']['Enums']['payment_method_enum'],
        description: payment.description,
        due_date: payment.dueDate,
        status: payment.status as 'pendente' | 'pago' | 'vencido',
        paid_date: payment.paidDate ? payment.paidDate : null,
        clinic_id: currentUser?.clinicId || null
      };

      const { data, error } = await supabase
        .from('accounts_receivable')
        .insert(newPayment)
        .select('*');

      if (error) {
        console.error('Erro ao adicionar pagamento:', error);
        toast.error('Erro ao adicionar pagamento');
        throw error;
      }

      console.log('Pagamento adicionado com sucesso:', data);
      toast.success('Pagamento adicionado com sucesso!');
      
      await fetchAccountsReceivableWrapper();
    } catch (error) {
      console.error('Erro ao adicionar pagamento:', error);
      toast.error('Erro ao adicionar pagamento');
      throw error;
    }
  };

  // ✅ Wrappers para as funções que usam clinicId automaticamente
  const fetchPatientsWrapper = async () => {
    if (clinicId) await fetchPatients(clinicId);
  };
  
  const fetchProfessionalsWrapper = async () => {
    if (clinicId) await fetchProfessionals(clinicId);
  };
  
  const fetchRoomsWrapper = async () => {
    if (clinicId) await fetchRooms(clinicId);
  };
  
  const fetchAppointmentsWrapper = async () => {
    if (clinicId) await fetchAppointments(clinicId);
  };
  
  const fetchMedicalRecordsWrapper = async () => {
    if (clinicId) await fetchMedicalRecords(clinicId);
  };
  
  const fetchAccountsPayableWrapper = async () => {
    if (clinicId) await fetchAccountsPayable(clinicId);
  };
  
  const fetchAccountsReceivableWrapper = async () => {
    if (clinicId) await fetchAccountsReceivable(clinicId);
  };
  
  const fetchEvolutionsWrapper = async () => {
    if (clinicId) await fetchEvolutions(clinicId);
  };
  
  const fetchLeadsWrapper = async () => {
    if (clinicId) await fetchLeads(clinicId);
  };
  
  const fetchDashboardStatsWrapper = async () => {
    if (clinicId) {
      // Lógica para buscar stats do dashboard seria implementada aqui
      console.log('📊 Calculando stats do dashboard para clinic:', clinicId);
    }
  };

  const value: ClinicContextType = {
    patients,
    professionals,
    rooms,
    appointments,
    medicalRecords,
    accountsPayable,
    accountsReceivable,
    evolutions,
    leads,
    dashboardStats,
    currentUser,
    loading,
    fetchPatients: fetchPatientsWrapper,
    addPatient,
    updatePatient,
    deletePatient,
    fetchProfessionals: fetchProfessionalsWrapper,
    addProfessional,
    updateProfessional,
    deleteProfessional,
    fetchRooms: fetchRoomsWrapper,
    addRoom,
    updateRoom,
    deleteRoom,
    fetchAppointments: fetchAppointmentsWrapper,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    fetchMedicalRecords: fetchMedicalRecordsWrapper,
    addMedicalRecord,
    updateMedicalRecord,
    deleteMedicalRecord,
    fetchAccountsPayable: fetchAccountsPayableWrapper,
    addAccountsPayable,
    updateAccountsPayable,
    deleteAccountsPayable,
    fetchAccountsReceivable: fetchAccountsReceivableWrapper,
    addAccountsReceivable,
    updateAccountsReceivable,
    deleteAccountsReceivable,
    fetchEvolutions: fetchEvolutionsWrapper,
    addEvolution,
    updateEvolution,
    deleteEvolution,
    fetchLeads: fetchLeadsWrapper,
    addLead,
    updateLead,
    deleteLead,
    fetchDashboardStats: fetchDashboardStatsWrapper,
    markReceivableAsPaid,
    markPayableAsPaid,
    addPayment,
  };

  return (
    <ClinicContext.Provider value={value}>
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
}