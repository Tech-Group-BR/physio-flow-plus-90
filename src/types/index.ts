import { Database } from '@/integrations/supabase/types';


export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface Guardian {
  id: string;
  name: string;
  email: string;
  phone: string;
  relationship: string;
  patientIds: string[];
  hasAppAccess: boolean;
  createdAt: string;
}

export interface Patient {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  cpf: string;
  birth_date: string;
  gender: 'male' | 'female' | 'other';
  address: Address;
  emergencyContact: EmergencyContact;
  emergencyPhone: string;
  medicalHistory: string;
  treatmentType: string;
  insurance?: string;
  notes?: string;
  appointments: string[];
  payments: string[];
  isActive: boolean;
  isMinor: boolean;
  guardianId?: string;
  createdAt: string;
  updatedAt: string;
  clinicId?: string;
}

export interface Professional {
  id: string;
  name: string;
  email: string;
  phone: string; 
  crefito: string;
  specialties: string[];
  bio?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
  profile_id?: string | null;
  profile_picture_url?: string | null;
  clinicId?: string;
}
export interface Appointment {
  id: string;
  patientId: string;
  professionalId: string;
  roomId: string;
  date: string;
  time: string;
  duration: number;
  treatmentType: string;
  status: 'marcado' | 'confirmado' | 'realizado' | 'faltante' | 'cancelado';
  notes?: string;
  whatsappConfirmed?: boolean;
  whatsappSentAt?: string;
  createdAt: string;
  updatedAt: string;
  clinicId?: string;
}

export interface Payment {
  id: string;
  patientId: string;
  amount: number;
  method: 'dinheiro' | 'cartao' | 'pix' | 'transferencia';
  status: 'pendente' | 'pago' | 'cancelado' | 'vencido';
  type: 'recebimento' | 'pagamento';
  dueDate: string;
  paidDate?: string;
  description: string;
  category?: string;
  supplier?: string;
  createdAt: string;
}

export interface AccountsPayable {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  category: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  patient_id?: string;
  professional_id?: string;
  payment_method?: Database['public']['Enums']['payment_method_enum'];
  receipt_url?: string;
}

export interface AccountsReceivable {
  id: string;
  patientId?: string;
  professional_id?: string;
  description: string;
  amount: number;
  dueDate: string;
  receivedDate?: string;
  status: 'pendente' | 'recebido' | 'vencido' | 'cancelado';
  method?: Database['public']['Enums']['payment_method_enum'];
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  appointment_id?: string;
  service_id?: string;
  discount_amount?: number;
  patient_package_id?: string;
}



export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: 'google_ads' | 'facebook_ads' | 'instagram_ads' | 'indicacao' | 'site' | 'outros';
  status: 'novo' | 'contato_inicial' | 'agendamento' | 'avaliacao' | 'proposta' | 'cliente' | 'perdido';
  treatmentInterest?: string;
  notes?: string;
  lastContact?: string;
  nextFollowUp?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  equipment: string[];
  is_active: boolean; // <-- troque aqui
}

export interface Package {
  id: string;
  name: string;
  sessions: number;
  price: number;
  validityDays: number;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export interface PatientPackage {
  id: string;
  patientId: string;
  packageId: string;
  purchaseDate: string;
  expiryDate: string;
  sessionsUsed: number;
  status: 'ativo' | 'expirado' | 'usado';
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  type: 'confirmacao' | 'lembrete' | 'reagendamento' | 'cobranca';
  message: string;
  isActive: boolean;
}

export interface WhatsAppLog {
  id: string;
  patientId: string;
  templateId: string;
  message: string;
  status: 'enviado' | 'entregue' | 'lido' | 'erro';
  sentAt: string;
}

export interface Anamnesis {
  chiefComplaint: string;
  historyOfPresentIllness: string;
  pastMedicalHistory: string;
  medications: string;
  allergies: string;
  socialHistory: string;
}

export interface EvolutionMedia {
  id: string;
  type: 'photo' | 'video' | 'image';
  url: string;
  description?: string;
  uploadedAt: string;
}

export interface Evolution {
  id: string;
  recordId: string;
  date: string;
  professional_id: string;
  observations: string;
  painScale: number;
  mobilityScale: number;
  treatmentPerformed: string;
  nextSession: string;
  files?: string[];
  visibleToGuardian: boolean;
  createdAt: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  anamnesis: Anamnesis;
  evolutions: Evolution[];
  files: string[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'Professional' | 'receptionist' | 'guardian';
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  clinicId?: string;
}

export interface DashboardStats {
  todayAppointments: number;
  weekAppointments: number;
  monthAppointments: number;
  totalRevenue: number;
  pendingRevenue: number;
  activePatients: number;
  inactivePatients: number;
  missedAppointments: number;
  newLeads: number;
  convertedLeads: number;
  accountsPayableTotal: number;
  accountsReceivableTotal: number;
}

export interface SessionPackage {
  id: string;
  name: string;
  description?: string;
  sessions: number;
  price: number;
  validity_days: number;
  treatment_type?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}


export interface FinancialReport {
  period: string;
  totalReceived: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  netIncome: number;
  categorizedExpenses: { [category: string]: number };
  categorizedRevenue: { [category: string]: number };
}

export interface SalesSettings {
  id: string;
  companyName: string;
  logo?: string;
  heroTitle: string;
  heroSubtitle: string;
  features: string[];
  testimonials: Array<{
    name: string;
    role: string;
    content: string;
    rating: number;
  }>;
  plans: Array<{
    id: string;
    name: string;
    price: number;
    period: 'mensal' | 'anual';
    features: string[];
    isPopular?: boolean;
  }>;
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  isActive: boolean;
  updatedAt: string;
}

export interface SystemConfig {
  id: string;
  maxClinics: number;
  maxUsers: number;
  maxPatients: number;
  features: string[];
  billingConfig: {
    pricePerClinic: number;
    pricePerUser: number;
    freeTrialDays: number;
  };
  integrations: {
    whatsapp: boolean;
    email: boolean;
    sms: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordPolicy: string;
  };
  updatedAt: string;
}

export interface MainClinicSettings {
  id: string;
  name: string;
  clinicCode: string;
  email?: string;
  phone?: string;
  address?: string;
  workingHours?: {
    start: string;
    end: string;
    lunchStart: string;
    lunchEnd: string;
  };
  consultationPrice?: number;
  timezone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
