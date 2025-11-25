/**
 * Patients Context
 * 
 * Context modularizado para gerenciamento de pacientes.
 * Separado do ClinicContext para melhor organização e performance.
 * 
 * Responsabilidades:
 * - Gerenciamento de estado de pacientes
 * - CRUD operations (fetch, add, update, delete)
 * - Cache inteligente
 * - Loading states
 * - Multi-tenancy (clinic_id)
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { PatientsService } from '@/services/database/patients.service';
import { globalCache, CACHE_KEYS, CACHE_TTL } from '@/lib/globalCache';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Patient } from '@/types';

// ============================================================
// TYPES
// ============================================================

interface PatientsContextType {
  // Estado
  patients: Patient[];
  loading: boolean;
  error: string | null;
  
  // Ações principais
  fetchPatients: () => Promise<void>;
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'appointments' | 'payments'>) => Promise<Patient | undefined>;
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  
  // Helpers
  getPatientById: (id: string) => Patient | undefined;
  searchPatients: (searchTerm: string) => Promise<Patient[]>;
  getPatientsByGuardian: (guardianId: string) => Promise<Patient[]>;
  refreshPatients: () => Promise<void>;
}

// ============================================================
// CONTEXT
// ============================================================

const PatientsContext = createContext<PatientsContextType | undefined>(undefined);

// ============================================================
// PROVIDER
// ============================================================

export function PatientsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const clinicId = user?.profile?.clinic_id;
  
  // Refs para evitar loops infinitos
  const isInitialized = useRef(false);
  const lastClinicId = useRef<string | null>(null);
  
  // Estado
  const [patients, setPatients] = useState<Patient[]>(() => {
    // Inicializar do cache se disponível
    if (clinicId) {
      const cached = globalCache.get<Patient[]>(CACHE_KEYS.PATIENTS, clinicId, CACHE_TTL.MEDIUM);
      if (cached) {
        console.log('⚡ [PatientsContext] Loaded from cache:', cached.length);
        return cached;
      }
    }
    return [];
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================
  // LIFECYCLE: Detectar mudança de clínica
  // ============================================================
  
  useEffect(() => {
    // Detectar mudança de clínica (troca de conta)
    if (clinicId && lastClinicId.current && clinicId !== lastClinicId.current) {
      console.log('🔄 [PatientsContext] Clinic changed, resetting state');
      setPatients([]);
      setError(null);
      if (lastClinicId.current) globalCache.invalidateClinic(lastClinicId.current);
      isInitialized.current = false;
    }
    
    lastClinicId.current = clinicId || null;
  }, [clinicId]);

  // ============================================================
  // LIFECYCLE: Carregar dados iniciais
  // ============================================================
  
  useEffect(() => {
    // Não carregar se já inicializou ou não tem clinicId
    if (isInitialized.current || !clinicId) return;
    
    // Verificar se tem cache válido
    const cached = globalCache.get<Patient[]>(CACHE_KEYS.PATIENTS, clinicId, CACHE_TTL.MEDIUM);
    if (cached) {
      console.log('⚡ [PatientsContext] Using cached data on mount');
      setPatients(cached);
      isInitialized.current = true;
      return;
    }
    
    // Se não tem cache, carregar do banco
    console.log('🚀 [PatientsContext] Initial load for clinic:', clinicId);
    isInitialized.current = true;
    fetchPatients();
  }, [clinicId]);

  // ============================================================
  // ACTIONS: Fetch Patients
  // ============================================================
  
  const fetchPatients = useCallback(async () => {
    if (!clinicId) {
      console.warn('⚠️ [PatientsContext] Cannot fetch: No clinic ID');
      return;
    }

    // Verificar cache primeiro
    const cached = globalCache.get<Patient[]>(CACHE_KEYS.PATIENTS, clinicId, CACHE_TTL.MEDIUM);
    if (cached) {
      console.log('⚡ [PatientsContext] Using cached patients:', cached.length);
      setPatients(cached);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 [PatientsContext] Fetching patients from database...');
      const data = await PatientsService.fetchAll(clinicId);
      
      setPatients(data);
      globalCache.set(CACHE_KEYS.PATIENTS, data, clinicId, CACHE_TTL.MEDIUM);
      
      console.log(`✅ [PatientsContext] Loaded ${data.length} patients`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch patients';
      console.error('❌ [PatientsContext] Error fetching patients:', err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  // ============================================================
  // ACTIONS: Add Patient
  // ============================================================
  
  const addPatient = useCallback(async (
    patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'appointments' | 'payments'>
  ): Promise<Patient | undefined> => {
    if (!clinicId) {
      console.warn('⚠️ [PatientsContext] Cannot add: No clinic ID');
      toast.error('Erro: Clínica não identificada');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('➕ [PatientsContext] Adding patient:', patient.fullName);
      const newPatient = await PatientsService.create(clinicId, patient);
      
      // Atualizar estado local
      setPatients(prev => [...prev, newPatient]);
      
      // Invalidar cache para forçar reload na próxima vez
      globalCache.invalidate(CACHE_KEYS.PATIENTS);
      
      toast.success(`Paciente ${newPatient.fullName} adicionado com sucesso!`);
      console.log('✅ [PatientsContext] Patient added:', newPatient.id);
      
      // Enviar mensagem de boas-vindas se estiver habilitado
      try {
        const { data: settings } = await supabase
          .from('whatsapp_settings')
          .select('welcome_enabled, is_active')
          .eq('clinic_id', clinicId)
          .single();

        if (settings?.welcome_enabled && settings?.is_active) {
          console.log('👋 Enviando mensagem de boas-vindas para:', newPatient.fullName);
          await supabase.functions.invoke('send-welcome-message', {
            body: { patientId: newPatient.id }
          });
        }
      } catch (welcomeError) {
        console.error('⚠️ Erro ao enviar boas-vindas:', welcomeError);
        // Não bloqueia o cadastro se falhar o envio de boas-vindas
      }
      
      return newPatient;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add patient';
      console.error('❌ [PatientsContext] Error adding patient:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      throw err; // Re-throw para UI lidar se necessário
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  // ============================================================
  // ACTIONS: Update Patient
  // ============================================================
  
  const updatePatient = useCallback(async (id: string, updates: Partial<Patient>) => {
    if (!clinicId) {
      console.warn('⚠️ [PatientsContext] Cannot update: No clinic ID');
      toast.error('Erro: Clínica não identificada');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('📝 [PatientsContext] Updating patient:', id);
      const updatedPatient = await PatientsService.update(id, updates);
      
      // Atualizar estado local
      setPatients(prev => prev.map(p => p.id === id ? updatedPatient : p));
      
      // Invalidar cache
      globalCache.invalidate(CACHE_KEYS.PATIENTS);
      
      toast.success('Paciente atualizado com sucesso!');
      console.log('✅ [PatientsContext] Patient updated:', id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update patient';
      console.error('❌ [PatientsContext] Error updating patient:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  // ============================================================
  // ACTIONS: Delete Patient
  // ============================================================
  
  const deletePatient = useCallback(async (id: string) => {
    if (!clinicId) {
      console.warn('⚠️ [PatientsContext] Cannot delete: No clinic ID');
      toast.error('Erro: Clínica não identificada');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🗑️ [PatientsContext] Deleting patient:', id);
      
      // Soft delete por padrão (mais seguro)
      await PatientsService.softDelete(id);
      
      // Remover do estado local
      setPatients(prev => prev.filter(p => p.id !== id));
      
      // Invalidar cache
      globalCache.invalidate(CACHE_KEYS.PATIENTS);
      
      toast.success('Paciente removido com sucesso!');
      console.log('✅ [PatientsContext] Patient deleted:', id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete patient';
      console.error('❌ [PatientsContext] Error deleting patient:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  // ============================================================
  // HELPERS
  // ============================================================
  
  const getPatientById = useCallback((id: string): Patient | undefined => {
    return patients.find(p => p.id === id);
  }, [patients]);

  const searchPatients = useCallback(async (searchTerm: string): Promise<Patient[]> => {
    if (!clinicId) return [];
    
    try {
      return await PatientsService.search(clinicId, searchTerm);
    } catch (err) {
      console.error('❌ [PatientsContext] Error searching patients:', err);
      toast.error('Erro ao buscar pacientes');
      return [];
    }
  }, [clinicId]);

  const getPatientsByGuardian = useCallback(async (guardianId: string): Promise<Patient[]> => {
    try {
      return await PatientsService.fetchByGuardianId(guardianId);
    } catch (err) {
      console.error('❌ [PatientsContext] Error fetching patients by guardian:', err);
      toast.error('Erro ao buscar pacientes do responsável');
      return [];
    }
  }, []);

  const refreshPatients = useCallback(async () => {
    if (!clinicId) return;
    
    // Forçar invalidação do cache
    globalCache.invalidate(CACHE_KEYS.PATIENTS);
    
    // Recarregar
    await fetchPatients();
  }, [clinicId, fetchPatients]);

  // ============================================================
  // PROVIDER VALUE
  // ============================================================
  
  const value: PatientsContextType = {
    patients,
    loading,
    error,
    fetchPatients,
    addPatient,
    updatePatient,
    deletePatient,
    getPatientById,
    searchPatients,
    getPatientsByGuardian,
    refreshPatients
  };

  return (
    <PatientsContext.Provider value={value}>
      {children}
    </PatientsContext.Provider>
  );
}

// ============================================================
// HOOK
// ============================================================

/**
 * Hook to access Patients Context
 * Must be used within PatientsProvider
 */
export function usePatients(): PatientsContextType {
  const context = useContext(PatientsContext);
  
  if (!context) {
    throw new Error('usePatients must be used within a PatientsProvider');
  }
  
  return context;
}
