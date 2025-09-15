import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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
  gender?: 'male' | 'female' ;
  address?: any;
  emergency_contact?: any;
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
  description: string;
  amount: number;
  due_date: string;
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  paid_date?: string;
  received_date?: string;
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
  markReceivableAsPaid: (id: string, method: 'dinheiro' | 'cartao' | 'pix' | 'transferencia') => Promise<void>;
  markPayableAsPaid: (id: string) => Promise<void>;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);



const dbToMainProfessional = (dbPhysio: DbProfessional): MainProfessional => ({
  id: dbPhysio.id,
  name: dbPhysio.full_name,
  email: dbPhysio.email || '',
  phone: dbPhysio.phone || '',
  crefito: dbPhysio.crefito || '',
  specialties: dbPhysio.specialties || [],
  bio: '',
  isActive: dbPhysio.is_active,
  createdAt: dbPhysio.created_at,
  updatedAt: dbPhysio.updated_at
});

const dbToMainRoom = (dbRoom: DbRoom): MainRoom => ({
  id: dbRoom.id,
  name: dbRoom.name,
  capacity: dbRoom.capacity || 1,
  equipment: dbRoom.equipment || [],
  isActive: dbRoom.is_active,
  createdAt: dbRoom.created_at,
  updatedAt: dbRoom.updated_at
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
  anamnesis: typeof dbRecord.anamnesis === 'string' ? JSON.parse(dbRecord.anamnesis) : (dbRecord.anamnesis || ''),
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
  description: dbAr.description,
  amount: dbAr.amount,
  dueDate: dbAr.due_date,
  receivedDate: dbAr.received_date,
  status: dbAr.status === 'pago' ? 'recebido' : (dbAr.status === 'cancelado' ? 'pendente' : dbAr.status),
  method: 'dinheiro',
  notes: '',
  createdAt: dbAr.created_at,
  updatedAt: dbAr.updated_at
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
  media: (dbEvo.media || []).map(item => ({
    id: uuidv4(),
    type: 'photo' as const,
    url: typeof item === 'string' ? item : item,
    uploadedAt: new Date().toISOString()
  })),
  visibleToGuardian: dbEvo.visible_to_guardian || false,
  createdAt: dbEvo.created_at
});

const dbToMainPatient = (dbPatient: DbPatient): MainPatient => ({
  id: dbPatient.id,
  fullName: dbPatient.full_name,
  phone: dbPatient.phone,
  email: dbPatient.email || '',
  cpf: dbPatient.cpf || '',
  birth_date: dbPatient.birth_date,
  gender: dbPatient.gender,
  address: typeof dbPatient.address === 'string' ? JSON.parse(dbPatient.address) : dbPatient.address,
  emergencyContact: typeof dbPatient.emergency_contact === 'string' ? JSON.parse(dbPatient.emergency_contact) : dbPatient.emergency_contact,
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


const dbToMainLead = (dbLead: DbLead): MainLead => {
  // Map database status to main status
  let mainStatus: MainLead['status'];
  switch (dbLead.status) {
    case 'novo':
      mainStatus = 'novo';
      break;
    case 'contatado':
      mainStatus = 'contato_inicial';
      break;
    case 'interessado':
      mainStatus = 'avaliacao';
      break;
    case 'agendado':
      mainStatus = 'agendamento';
      break;
    case 'cliente':
      mainStatus = 'cliente';
      break;
    case 'perdido':
      mainStatus = 'perdido';
      break;
    default:
      mainStatus = 'novo';
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
  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      setLoading(true);
      setCurrentUser(session.user);
      
      Promise.all([
        fetchPatients(),
        fetchProfessionals(),
        fetchRooms(),
        fetchAppointments(),
        fetchMedicalRecords(),
        fetchAccountsPayable(),
        fetchAccountsReceivable(),
        fetchEvolutions(),
        fetchLeads(),
        fetchDashboardStats()
      ]).finally(() => setLoading(false));
    }
  }, [session]);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('full_name', { ascending: true });
      if (error) throw error;
      const mappedPatients = (data || []).map(dbToMainPatient);
      setPatients(mappedPatients);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
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
          guardian_id: patient.guardianId,
        });
      if (error) throw error;
      await fetchPatients();
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
      if (updates.guardianId !== undefined) updateData.guardian_id = updates.guardianId;

      const { error } = await supabase
        .from('patients')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
      await fetchPatients();
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
      await fetchPatients();
    } catch (error) {
      console.error('Erro ao deletar paciente:', error);
      throw error;
    }
  };
const fetchProfessionals = async () => {
  try {
    const { data, error } = await supabase
      .from('professionals')
      .select('*')
      .order('full_name', { ascending: true }); 

    if (error) throw error;

    const mappedPhysios = (data || []).map(item => {
      return {
     id: item.id,
    name: item.full_name,
    email: item.email,
    phone: String(item.phone), // <--- AQUI: converte o número para string
    crefito: item.crefito,
    specialties: item.specialties,
    bio: item.bio,
    isActive: item.is_active,
    createdAt: item.created_at,
    updatedAt: item.updated_at
      };
    });
    setProfessionals(mappedPhysios);
  } catch (error) {
    console.error('Erro ao buscar profissionais:', error);
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
        profile_id: Professional.profile_id || null

      });
    if (error) throw error;
    await fetchProfessionals();
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

      const { error } = await supabase
        .from('professionals')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
      await fetchProfessionals();
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
      await fetchProfessionals();
    } catch (error) {
      console.error('Erro ao deletar fisioterapeuta:', error);
      throw error;
    }
  };

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      const mappedRooms = (data || []).map(dbToMainRoom);
      setRooms(mappedRooms);
    } catch (error) {
      console.error('Erro ao buscar salas:', error);
    }
  };

  const addRoom = async (room: Omit<MainRoom, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .insert({ ...room, id: uuidv4() });
      if (error) throw error;
      await fetchRooms();
    } catch (error) {
      console.error('Erro ao adicionar sala:', error);
      throw error;
    }
  };

  const updateRoom = async (room: MainRoom) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update(room)
        .eq('id', room.id);
      if (error) throw error;
      await fetchRooms();
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
      await fetchRooms();
    } catch (error) {
      console.error('Erro ao deletar sala:', error);
      throw error;
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true });
      if (error) throw error;
      const mappedAppointments = (data || []).map(dbToMainAppointment);
      setAppointments(mappedAppointments);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    }
  };

  const addAppointment = async (appointment: Omit<MainAppointment, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
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
          whatsapp_sent_at: appointment.whatsappSentAt
        });
      if (error) throw error;
      await fetchAppointments();
      await fetchAccountsReceivable(); // Refresh accounts receivable in case of auto-creation
    } catch (error) {
      console.error('Erro ao adicionar agendamento:', error);
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

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
      await fetchAppointments();
      await fetchAccountsReceivable(); // Refresh accounts receivable in case of auto-creation
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
      await fetchAppointments();
    } catch (error) {
      console.error('Erro ao deletar agendamento:', error);
      throw error;
    }
  };

  const fetchMedicalRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const mappedRecords = (data || []).map(dbToMainMedicalRecord);
      setMedicalRecords(mappedRecords);
    } catch (error) {
      console.error('Erro ao buscar prontuários:', error);
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
          files: medicalRecord.files
        });
      if (error) throw error;
      await fetchMedicalRecords();
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
      await fetchMedicalRecords();
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
      await fetchMedicalRecords();
    } catch (error) {
      console.error('Erro ao deletar prontuário:', error);
      throw error;
    }
  };

  const fetchAccountsPayable = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts_payable')
        .select('*')
        .order('due_date', { ascending: true });
      if (error) throw error;
      const mappedData = (data || []).map(dbToMainAccountsPayable);
      setAccountsPayable(mappedData);
    } catch (error) {
      console.error('Erro ao buscar contas a pagar:', error);
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
          paid_date: accountsPayable.paidDate
        });
      if (error) throw error;
      await fetchAccountsPayable();
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
          paid_date: accountsPayable.paidDate
        })
        .eq('id', accountsPayable.id);
      if (error) throw error;
      await fetchAccountsPayable();
    } catch (error) {
      console.error('Erro ao atualizar conta a pagar:', error);
      throw error;
    }
  };

const deleteAccountsPayable = async (id: string) => {
  const originalState = [...accountsPayable];

  // 1. Atualiza a UI otimistamente (remove o item localmente)
  setAccountsPayable(current => current.filter(p => p.id !== id));
  toast.success("Conta a pagar excluída com sucesso!");

  try {
    // 2. Tenta deletar no banco de dados
    const { error } = await supabase
      .from('accounts_payable')
      .delete()
      .eq('id', id);

    if (error) throw error; // Joga o erro para o bloco catch

    await fetchDashboardStats(); // Atualiza os totais do dashboard

  } catch (error) {
    // 3. Se der erro, notifica e reverte a mudança na UI
    toast.error("Erro ao excluir conta a pagar. A alteração foi desfeita.");
    console.error('Erro ao deletar conta a pagar:', error);
    setAccountsPayable(originalState); // Rollback
    throw error;
  }
};

  const fetchAccountsReceivable = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts_receivable')
        .select('*')
        .order('due_date', { ascending: true });
      if (error) throw error;
      const mappedData = (data || []).map(dbToMainAccountsReceivable);
      setAccountsReceivable(mappedData);
    } catch (error) {
      console.error('Erro ao buscar contas a receber:', error);
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
          status: accountsReceivable.status === 'recebido' ? 'pago' : accountsReceivable.status
        });
      if (error) throw error;
      await fetchAccountsReceivable();
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
      await fetchAccountsReceivable();
    } catch (error) {
      console.error('Erro ao atualizar conta a receber:', error);
      throw error;
    }
  };

const deleteAccountsReceivable = async (id: string) => {
  const originalState = [...accountsReceivable];

  // 1. Atualiza a UI otimistamente
  setAccountsReceivable(current => current.filter(r => r.id !== id));
  toast.success("Conta a receber excluída com sucesso!");

  try {
    // 2. Tenta deletar no banco
    const { error } = await supabase
      .from('accounts_receivable')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await fetchDashboardStats();

  } catch (error) {
    // 3. Se der erro, notifica e reverte
    toast.error("Erro ao excluir conta a receber. A alteração foi desfeita.");
    console.error('Erro ao deletar conta a receber:', error);
    setAccountsReceivable(originalState); // Rollback
    throw error;
  }
};

  const fetchEvolutions = async () => {
    try {
      const { data, error } = await supabase
        .from('evolutions')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      const mappedEvolutions = (data || []).map(dbToMainEvolution);
      setEvolutions(mappedEvolutions);
    } catch (error) {
      console.error('Erro ao buscar evoluções:', error);
    }
  };

  const addEvolution = async (evolution: Omit<MainEvolution, 'id' | 'createdAt'>) => {
    try {
      const mediaStrings = evolution.media?.map(item => typeof item === 'string' ? item : item.url) || [];
      
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
          media: mediaStrings,
          visible_to_guardian: evolution.visibleToGuardian
        });

      if (error) throw error;
      await fetchEvolutions();
    } catch (error) {
      console.error('Erro ao adicionar evolução:', error);
      throw error;
    }
  };

  const updateEvolution = async (evolution: MainEvolution) => {
    try {
      const mediaStrings = evolution.media?.map(item => typeof item === 'string' ? item : item.url) || [];
      
      const { error } = await supabase
        .from('evolutions')
        .update({
          observations: evolution.observations,
          pain_scale: evolution.painScale,
          mobility_scale: evolution.mobilityScale,
          treatment_performed: evolution.treatmentPerformed,
          next_session: evolution.nextSession,
          files: evolution.files,
          media: mediaStrings,
          visible_to_guardian: evolution.visibleToGuardian
        })
        .eq('id', evolution.id);
      if (error) throw error;
      await fetchEvolutions();
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
      await fetchEvolutions();
    } catch (error) {
      console.error('Erro ao deletar evolução:', error);
      throw error;
    }
  };

 
  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const mappedLeads = (data || []).map(item => dbToMainLead(item as DbLead));
      setLeads(mappedLeads);
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
    }
  };

  const addLead = async (lead: Omit<MainLead, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Map main status to database status
      let dbStatus: DbLead['status'];
      switch (lead.status) {
        case 'novo':
          dbStatus = 'novo';
          break;
        case 'contato_inicial':
          dbStatus = 'contatado';
          break;
        case 'avaliacao':
          dbStatus = 'interessado';
          break;
        case 'agendamento':
          dbStatus = 'agendado';
          break;
        case 'cliente':
          dbStatus = 'cliente';
          break;
        case 'perdido':
          dbStatus = 'perdido';
          break;
        default:
          dbStatus = 'novo';
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
      await fetchLeads();
    } catch (error) {
      console.error('Erro ao adicionar lead:', error);
      throw error;
    }
  };

  const updateLead = async (lead: MainLead) => {
    try {
      // Map main status to database status
      let dbStatus: DbLead['status'];
      switch (lead.status) {
        case 'novo':
          dbStatus = 'novo';
          break;
        case 'contato_inicial':
          dbStatus = 'contatado';
          break;
        case 'avaliacao':
          dbStatus = 'interessado';
          break;
        case 'agendamento':
          dbStatus = 'agendado';
          break;
        case 'cliente':
          dbStatus = 'cliente';
          break;
        case 'perdido':
          dbStatus = 'perdido';
          break;
        default:
          dbStatus = 'novo';
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
      await fetchLeads();
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
      await fetchLeads();
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


const markReceivableAsPaid = async (id: string, method: 'dinheiro' | 'cartao' | 'pix' | 'transferencia') => {
  const originalState = [...accountsReceivable];
  const receivedDate = new Date().toISOString();
  
  // 1. Atualiza a UI otimistamente
  setAccountsReceivable(current =>
    current.map(acc => 
      acc.id === id 
        ? { ...acc, status: 'recebido', receivedDate: receivedDate, method: method } 
        : acc
    )
  );
  toast.success("Conta marcada como recebida!");

  try {
    // 2. Sincroniza com o banco
    const { error } = await supabase
      .from('accounts_receivable')
      .update({
        status: 'pago', // No banco o status é 'pago'
        paid_date: receivedDate, // O campo no DB é 'paid_date'
        received_date: receivedDate, // Atualiza também o received_date se houver
        method: method
      })
      .eq('id', id);

    if (error) throw error;
    
    await fetchDashboardStats();

  } catch (error) {
    // 3. Se der erro, notifica e reverte
    toast.error("Erro ao marcar como recebida. A alteração foi desfeita.");
    console.error('Erro ao marcar conta como recebida:', error);
    setAccountsReceivable(originalState); // Rollback
    throw error;
  }
};

  const markPayableAsPaid = async (id: string) => {
  const originalState = [...accountsPayable];
  const paidDate = new Date().toISOString();

  // 1. Atualiza a UI otimistamente (altera o status localmente)
  setAccountsPayable(current => 
    current.map(acc => 
      acc.id === id 
        ? { ...acc, status: 'pago', paidDate: paidDate } 
        : acc
    )
  );
  toast.success("Conta marcada como paga!");

  try {
    // 2. Sincroniza a mudança com o banco
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
    // 3. Em caso de erro, notifica e reverte
    toast.error("Erro ao marcar como paga. A alteração foi desfeita.");
    console.error('Erro ao marcar conta como paga:', error);
    setAccountsPayable(originalState); // Rollback
    throw error;
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
    fetchPatients,
    addPatient,
    updatePatient,
    deletePatient,
    fetchProfessionals,
    addProfessional,
    updateProfessional,
    deleteProfessional,
    fetchRooms,
    addRoom,
    updateRoom,
    deleteRoom,
    fetchAppointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    fetchMedicalRecords,
    addMedicalRecord,
    updateMedicalRecord,
    deleteMedicalRecord,
    fetchAccountsPayable,
    addAccountsPayable,
    updateAccountsPayable,
    deleteAccountsPayable,
    fetchAccountsReceivable,
    addAccountsReceivable,
    updateAccountsReceivable,
    deleteAccountsReceivable,
    fetchEvolutions,
    addEvolution,
    updateEvolution,
    deleteEvolution,
    fetchLeads,
    addLead,
    updateLead,
    deleteLead,
    fetchDashboardStats,
    markReceivableAsPaid,
    markPayableAsPaid,
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
