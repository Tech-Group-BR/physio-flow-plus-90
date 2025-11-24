/**
 * Appointments Context
 * 
 * Context modularizado para gerenciamento de agendamentos.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AppointmentsService } from '@/services/database/appointments.service';
import { globalCache, CACHE_KEYS, CACHE_TTL } from '@/lib/globalCache';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Appointment } from '@/types';

interface AppointmentsContextType {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  fetchAppointments: () => Promise<void>;
  fetchAppointmentsByDateRange: (startDate: string, endDate: string) => Promise<Appointment[]>;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Appointment | undefined>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  getAppointmentById: (id: string) => Appointment | undefined;
  getAppointmentsByPatient: (patientId: string) => Promise<Appointment[]>;
  getAppointmentsByProfessional: (professionalId: string) => Promise<Appointment[]>;
  updateWhatsAppStatus: (id: string, confirmed: boolean) => Promise<void>;
  refreshAppointments: () => Promise<void>;
}

const AppointmentsContext = createContext<AppointmentsContextType | undefined>(undefined);

export function AppointmentsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const clinicId = user?.profile?.clinic_id;
  
  const isInitialized = useRef(false);
  const lastClinicId = useRef<string | null>(null);
  
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    if (clinicId) {
      const cached = globalCache.get<Appointment[]>(CACHE_KEYS.APPOINTMENTS, clinicId, CACHE_TTL.DYNAMIC);
      if (cached) {
        console.log('⚡ [AppointmentsContext] Loaded from cache:', cached.length);
        return cached;
      }
    }
    return [];
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clinicId && lastClinicId.current && clinicId !== lastClinicId.current) {
      console.log('🔄 [AppointmentsContext] Clinic changed, resetting state');
      setAppointments([]);
      setError(null);
      if (lastClinicId.current) globalCache.invalidateClinic(lastClinicId.current);
      isInitialized.current = false;
    }
    lastClinicId.current = clinicId || null;
  }, [clinicId]);

  useEffect(() => {
    if (isInitialized.current || !clinicId) return;
    
    const cached = globalCache.get<Appointment[]>(CACHE_KEYS.APPOINTMENTS, clinicId, CACHE_TTL.DYNAMIC);
    if (cached) {
      console.log('⚡ [AppointmentsContext] Using cached data on mount');
      setAppointments(cached);
      isInitialized.current = true;
      return;
    }
    
    console.log('🚀 [AppointmentsContext] Initial load for clinic:', clinicId);
    isInitialized.current = true;
    fetchAppointments();
  }, [clinicId]);

  const fetchAppointments = useCallback(async () => {
    if (!clinicId) {
      console.warn('⚠️ [AppointmentsContext] Cannot fetch: No clinic ID');
      return;
    }

    const cached = globalCache.get<Appointment[]>(CACHE_KEYS.APPOINTMENTS, clinicId, CACHE_TTL.DYNAMIC);
    if (cached) {
      console.log('⚡ [AppointmentsContext] Using cached appointments:', cached.length);
      setAppointments(cached);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 [AppointmentsContext] Fetching appointments from database...');
      const data = await AppointmentsService.fetchAll(clinicId);
      
      setAppointments(data);
      globalCache.set(CACHE_KEYS.APPOINTMENTS, data, clinicId, CACHE_TTL.DYNAMIC);
      
      console.log(`✅ [AppointmentsContext] Loaded ${data.length} appointments`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch appointments';
      console.error('❌ [AppointmentsContext] Error fetching appointments:', err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  const fetchAppointmentsByDateRange = useCallback(async (startDate: string, endDate: string): Promise<Appointment[]> => {
    if (!clinicId) return [];
    
    try {
      return await AppointmentsService.fetchByDateRange(clinicId, startDate, endDate);
    } catch (err) {
      console.error('❌ [AppointmentsContext] Error fetching appointments by date range:', err);
      toast.error('Erro ao buscar agendamentos');
      return [];
    }
  }, [clinicId]);

  const addAppointment = useCallback(async (
    appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Appointment | undefined> => {
    if (!clinicId) {
      console.warn('⚠️ [AppointmentsContext] Cannot add: No clinic ID');
      toast.error('Erro: Clínica não identificada');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('➕ [AppointmentsContext] Adding appointment');
      const newAppointment = await AppointmentsService.create(clinicId, appointment);
      
      setAppointments(prev => [...prev, newAppointment]);
      globalCache.invalidate(CACHE_KEYS.APPOINTMENTS);
      
      toast.success('Agendamento criado com sucesso!');
      console.log('✅ [AppointmentsContext] Appointment added:', newAppointment.id);
      
      return newAppointment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add appointment';
      console.error('❌ [AppointmentsContext] Error adding appointment:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  const updateAppointment = useCallback(async (id: string, updates: Partial<Appointment>) => {
    if (!clinicId) {
      console.warn('⚠️ [AppointmentsContext] Cannot update: No clinic ID');
      toast.error('Erro: Clínica não identificada');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('📝 [AppointmentsContext] Updating appointment:', id);
      const updatedAppointment = await AppointmentsService.update(id, updates);
      
      setAppointments(prev => prev.map(a => a.id === id ? updatedAppointment : a));
      globalCache.invalidate(CACHE_KEYS.APPOINTMENTS);
      
      toast.success('Agendamento atualizado com sucesso!');
      console.log('✅ [AppointmentsContext] Appointment updated:', id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update appointment';
      console.error('❌ [AppointmentsContext] Error updating appointment:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  const deleteAppointment = useCallback(async (id: string) => {
    if (!clinicId) {
      console.warn('⚠️ [AppointmentsContext] Cannot delete: No clinic ID');
      toast.error('Erro: Clínica não identificada');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🗑️ [AppointmentsContext] Deleting appointment:', id);
      await AppointmentsService.delete(id);
      
      setAppointments(prev => prev.filter(a => a.id !== id));
      globalCache.invalidate(CACHE_KEYS.APPOINTMENTS);
      
      toast.success('Agendamento removido com sucesso!');
      console.log('✅ [AppointmentsContext] Appointment deleted:', id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete appointment';
      console.error('❌ [AppointmentsContext] Error deleting appointment:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  const getAppointmentById = useCallback((id: string): Appointment | undefined => {
    return appointments.find(a => a.id === id);
  }, [appointments]);

  const getAppointmentsByPatient = useCallback(async (patientId: string): Promise<Appointment[]> => {
    try {
      return await AppointmentsService.fetchByPatient(patientId);
    } catch (err) {
      console.error('❌ [AppointmentsContext] Error fetching patient appointments:', err);
      toast.error('Erro ao buscar agendamentos do paciente');
      return [];
    }
  }, []);

  const getAppointmentsByProfessional = useCallback(async (professionalId: string): Promise<Appointment[]> => {
    try {
      return await AppointmentsService.fetchByProfessional(professionalId);
    } catch (err) {
      console.error('❌ [AppointmentsContext] Error fetching professional appointments:', err);
      toast.error('Erro ao buscar agendamentos do profissional');
      return [];
    }
  }, []);

  const updateWhatsAppStatus = useCallback(async (id: string, confirmed: boolean) => {
    if (!clinicId) return;
    
    try {
      await AppointmentsService.updateWhatsAppStatus(id, confirmed);
      
      setAppointments(prev => prev.map(a => 
        a.id === id 
          ? { ...a, whatsappConfirmed: confirmed, whatsappSentAt: new Date().toISOString() }
          : a
      ));
      
      globalCache.invalidate(CACHE_KEYS.APPOINTMENTS);
      toast.success('Status do WhatsApp atualizado!');
    } catch (err) {
      console.error('❌ [AppointmentsContext] Error updating WhatsApp status:', err);
      toast.error('Erro ao atualizar status do WhatsApp');
    }
  }, [clinicId]);

  const refreshAppointments = useCallback(async () => {
    if (!clinicId) return;
    globalCache.invalidate(CACHE_KEYS.APPOINTMENTS);
    await fetchAppointments();
  }, [clinicId, fetchAppointments]);

  const value: AppointmentsContextType = {
    appointments,
    loading,
    error,
    fetchAppointments,
    fetchAppointmentsByDateRange,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentById,
    getAppointmentsByPatient,
    getAppointmentsByProfessional,
    updateWhatsAppStatus,
    refreshAppointments
  };

  return (
    <AppointmentsContext.Provider value={value}>
      {children}
    </AppointmentsContext.Provider>
  );
}

export function useAppointments(): AppointmentsContextType {
  const context = useContext(AppointmentsContext);
  if (!context) {
    throw new Error('useAppointments must be used within an AppointmentsProvider');
  }
  return context;
}
