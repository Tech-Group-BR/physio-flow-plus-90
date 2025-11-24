/**
 * Professionals Context
 * 
 * Context modularizado para gerenciamento de profissionais/fisioterapeutas.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { ProfessionalsService } from '@/services/database/professionals.service';
import { globalCache, CACHE_KEYS, CACHE_TTL } from '@/lib/globalCache';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Professional } from '@/types';

interface ProfessionalsContextType {
  professionals: Professional[];
  loading: boolean;
  error: string | null;
  fetchProfessionals: () => Promise<void>;
  addProfessional: (professional: Omit<Professional, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Professional | undefined>;
  updateProfessional: (id: string, updates: Partial<Professional>) => Promise<void>;
  deleteProfessional: (id: string) => Promise<void>;
  getProfessionalById: (id: string) => Professional | undefined;
  getActiveProfessionals: () => Professional[];
  refreshProfessionals: () => Promise<void>;
}

const ProfessionalsContext = createContext<ProfessionalsContextType | undefined>(undefined);

export function ProfessionalsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const clinicId = user?.profile?.clinic_id;
  
  const isInitialized = useRef(false);
  const lastClinicId = useRef<string | null>(null);
  
  const [professionals, setProfessionals] = useState<Professional[]>(() => {
    if (clinicId) {
      const cached = globalCache.get<Professional[]>(CACHE_KEYS.PROFESSIONALS, clinicId, CACHE_TTL.MEDIUM);
      if (cached) {
        console.log('⚡ [ProfessionalsContext] Loaded from cache:', cached.length);
        return cached;
      }
    }
    return [];
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clinicId && lastClinicId.current && clinicId !== lastClinicId.current) {
      console.log('🔄 [ProfessionalsContext] Clinic changed, resetting state');
      setProfessionals([]);
      setError(null);
      if (lastClinicId.current) globalCache.invalidateClinic(lastClinicId.current);
      isInitialized.current = false;
    }
    lastClinicId.current = clinicId || null;
  }, [clinicId]);

  useEffect(() => {
    if (isInitialized.current || !clinicId) return;
    
    const cached = globalCache.get<Professional[]>(CACHE_KEYS.PROFESSIONALS, clinicId, CACHE_TTL.MEDIUM);
    if (cached) {
      console.log('⚡ [ProfessionalsContext] Using cached data on mount');
      setProfessionals(cached);
      isInitialized.current = true;
      return;
    }
    
    console.log('🚀 [ProfessionalsContext] Initial load for clinic:', clinicId);
    isInitialized.current = true;
    fetchProfessionals();
  }, [clinicId]);

  const fetchProfessionals = useCallback(async () => {
    if (!clinicId) {
      console.warn('⚠️ [ProfessionalsContext] Cannot fetch: No clinic ID');
      return;
    }

    const cached = globalCache.get<Professional[]>(CACHE_KEYS.PROFESSIONALS, clinicId, CACHE_TTL.MEDIUM);
    if (cached) {
      console.log('⚡ [ProfessionalsContext] Using cached professionals:', cached.length);
      setProfessionals(cached);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 [ProfessionalsContext] Fetching professionals from database...');
      const data = await ProfessionalsService.fetchAll(clinicId);
      
      setProfessionals(data);
      globalCache.set(CACHE_KEYS.PROFESSIONALS, data, clinicId, CACHE_TTL.MEDIUM);
      
      console.log(`✅ [ProfessionalsContext] Loaded ${data.length} professionals`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch professionals';
      console.error('❌ [ProfessionalsContext] Error fetching professionals:', err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  const addProfessional = useCallback(async (
    professional: Omit<Professional, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Professional | undefined> => {
    if (!clinicId) {
      console.warn('⚠️ [ProfessionalsContext] Cannot add: No clinic ID');
      toast.error('Erro: Clínica não identificada');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('➕ [ProfessionalsContext] Adding professional:', professional.name);
      const newProfessional = await ProfessionalsService.create(clinicId, professional);
      
      setProfessionals(prev => [...prev, newProfessional]);
      globalCache.invalidate(CACHE_KEYS.PROFESSIONALS);
      
      toast.success(`Profissional ${newProfessional.name} adicionado com sucesso!`);
      console.log('✅ [ProfessionalsContext] Professional added:', newProfessional.id);
      
      return newProfessional;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add professional';
      console.error('❌ [ProfessionalsContext] Error adding professional:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  const updateProfessional = useCallback(async (id: string, updates: Partial<Professional>) => {
    if (!clinicId) {
      console.warn('⚠️ [ProfessionalsContext] Cannot update: No clinic ID');
      toast.error('Erro: Clínica não identificada');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('📝 [ProfessionalsContext] Updating professional:', id);
      const updatedProfessional = await ProfessionalsService.update(id, updates);
      
      setProfessionals(prev => prev.map(p => p.id === id ? updatedProfessional : p));
      globalCache.invalidate(CACHE_KEYS.PROFESSIONALS);
      
      toast.success('Profissional atualizado com sucesso!');
      console.log('✅ [ProfessionalsContext] Professional updated:', id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update professional';
      console.error('❌ [ProfessionalsContext] Error updating professional:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  const deleteProfessional = useCallback(async (id: string) => {
    if (!clinicId) {
      console.warn('⚠️ [ProfessionalsContext] Cannot delete: No clinic ID');
      toast.error('Erro: Clínica não identificada');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🗑️ [ProfessionalsContext] Deleting professional:', id);
      await ProfessionalsService.softDelete(id);
      
      setProfessionals(prev => prev.filter(p => p.id !== id));
      globalCache.invalidate(CACHE_KEYS.PROFESSIONALS);
      
      toast.success('Profissional removido com sucesso!');
      console.log('✅ [ProfessionalsContext] Professional deleted:', id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete professional';
      console.error('❌ [ProfessionalsContext] Error deleting professional:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  const getProfessionalById = useCallback((id: string): Professional | undefined => {
    return professionals.find(p => p.id === id);
  }, [professionals]);

  const getActiveProfessionals = useCallback((): Professional[] => {
    return professionals.filter(p => p.isActive);
  }, [professionals]);

  const refreshProfessionals = useCallback(async () => {
    if (!clinicId) return;
    globalCache.invalidate(CACHE_KEYS.PROFESSIONALS);
    await fetchProfessionals();
  }, [clinicId, fetchProfessionals]);

  const value: ProfessionalsContextType = {
    professionals,
    loading,
    error,
    fetchProfessionals,
    addProfessional,
    updateProfessional,
    deleteProfessional,
    getProfessionalById,
    getActiveProfessionals,
    refreshProfessionals
  };

  return (
    <ProfessionalsContext.Provider value={value}>
      {children}
    </ProfessionalsContext.Provider>
  );
}

export function useProfessionals(): ProfessionalsContextType {
  const context = useContext(ProfessionalsContext);
  if (!context) {
    throw new Error('useProfessionals must be used within a ProfessionalsProvider');
  }
  return context;
}
