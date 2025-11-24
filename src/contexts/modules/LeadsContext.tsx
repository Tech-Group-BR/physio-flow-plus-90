/**
 * Leads Context
 * 
 * Context modularizado para gerenciamento de leads (CRM).
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { LeadsService } from '@/services/database/leads.service';
import { globalCache, CACHE_KEYS, CACHE_TTL } from '@/lib/globalCache';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Lead } from '@/types';

interface LeadsContextType {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  fetchLeads: () => Promise<void>;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Lead | undefined>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  updateLeadStatus: (id: string, status: Lead['status']) => Promise<void>;
  getLeadById: (id: string) => Lead | undefined;
  getLeadsByStatus: (status: Lead['status']) => Lead[];
  searchLeads: (query: string) => Promise<Lead[]>;
  getCountByStatus: () => Promise<Record<Lead['status'], number>>;
  refreshLeads: () => Promise<void>;
}

const LeadsContext = createContext<LeadsContextType | undefined>(undefined);

export function LeadsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const clinicId = user?.profile?.clinic_id;
  
  const isInitialized = useRef(false);
  const lastClinicId = useRef<string | null>(null);
  
  const [leads, setLeads] = useState<Lead[]>(() => {
    if (clinicId) {
      const cached = globalCache.get<Lead[]>(CACHE_KEYS.LEADS, clinicId, CACHE_TTL.DYNAMIC);
      if (cached) {
        console.log('⚡ [LeadsContext] Loaded from cache:', cached.length);
        return cached;
      }
    }
    return [];
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clinicId && lastClinicId.current && clinicId !== lastClinicId.current) {
      console.log('🔄 [LeadsContext] Clinic changed, resetting state');
      setLeads([]);
      setError(null);
      if (lastClinicId.current) globalCache.invalidateClinic(lastClinicId.current);
      isInitialized.current = false;
    }
    lastClinicId.current = clinicId || null;
  }, [clinicId]);

  useEffect(() => {
    if (isInitialized.current || !clinicId) return;
    
    const cached = globalCache.get<Lead[]>(CACHE_KEYS.LEADS, clinicId, CACHE_TTL.DYNAMIC);
    if (cached) {
      console.log('⚡ [LeadsContext] Using cached data on mount');
      setLeads(cached);
      isInitialized.current = true;
      return;
    }
    
    console.log('🚀 [LeadsContext] Initial load for clinic:', clinicId);
    isInitialized.current = true;
    fetchLeads();
  }, [clinicId]);

  const fetchLeads = useCallback(async () => {
    if (!clinicId) {
      console.warn('⚠️ [LeadsContext] Cannot fetch: No clinic ID');
      return;
    }

    const cached = globalCache.get<Lead[]>(CACHE_KEYS.LEADS, clinicId, CACHE_TTL.DYNAMIC);
    if (cached) {
      console.log('⚡ [LeadsContext] Using cached leads:', cached.length);
      setLeads(cached);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 [LeadsContext] Fetching leads from database...');
      const data = await LeadsService.fetchAll(clinicId);
      
      setLeads(data);
      globalCache.set(CACHE_KEYS.LEADS, data, clinicId, CACHE_TTL.DYNAMIC);
      
      console.log(`✅ [LeadsContext] Loaded ${data.length} leads`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch leads';
      console.error('❌ [LeadsContext] Error fetching leads:', err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  const addLead = useCallback(async (
    lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Lead | undefined> => {
    if (!clinicId) {
      console.warn('⚠️ [LeadsContext] Cannot add: No clinic ID');
      toast.error('Erro: Clínica não identificada');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('➕ [LeadsContext] Adding lead:', lead.name);
      const newLead = await LeadsService.create(clinicId, lead);
      
      setLeads(prev => [newLead, ...prev]);
      globalCache.invalidate(CACHE_KEYS.LEADS);
      
      toast.success('Lead adicionado com sucesso!');
      console.log('✅ [LeadsContext] Lead added:', newLead.id);
      
      return newLead;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add lead';
      console.error('❌ [LeadsContext] Error adding lead:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  const updateLead = useCallback(async (id: string, updates: Partial<Lead>) => {
    if (!clinicId) {
      console.warn('⚠️ [LeadsContext] Cannot update: No clinic ID');
      toast.error('Erro: Clínica não identificada');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('📝 [LeadsContext] Updating lead:', id);
      const updatedLead = await LeadsService.update(id, updates);
      
      setLeads(prev => prev.map(l => l.id === id ? updatedLead : l));
      globalCache.invalidate(CACHE_KEYS.LEADS);
      
      toast.success('Lead atualizado com sucesso!');
      console.log('✅ [LeadsContext] Lead updated:', id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update lead';
      console.error('❌ [LeadsContext] Error updating lead:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  const deleteLead = useCallback(async (id: string) => {
    if (!clinicId) {
      console.warn('⚠️ [LeadsContext] Cannot delete: No clinic ID');
      toast.error('Erro: Clínica não identificada');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🗑️ [LeadsContext] Deleting lead:', id);
      await LeadsService.delete(id);
      
      setLeads(prev => prev.filter(l => l.id !== id));
      globalCache.invalidate(CACHE_KEYS.LEADS);
      
      toast.success('Lead removido com sucesso!');
      console.log('✅ [LeadsContext] Lead deleted:', id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete lead';
      console.error('❌ [LeadsContext] Error deleting lead:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  const updateLeadStatus = useCallback(async (id: string, status: Lead['status']) => {
    if (!clinicId) return;
    
    try {
      console.log('📊 [LeadsContext] Updating lead status:', id, status);
      const updatedLead = await LeadsService.updateStatus(id, status);
      
      setLeads(prev => prev.map(l => l.id === id ? updatedLead : l));
      globalCache.invalidate(CACHE_KEYS.LEADS);
      
      toast.success('Status atualizado!');
    } catch (err) {
      console.error('❌ [LeadsContext] Error updating status:', err);
      toast.error('Erro ao atualizar status');
      throw err;
    }
  }, [clinicId]);

  const getLeadById = useCallback((id: string): Lead | undefined => {
    return leads.find(l => l.id === id);
  }, [leads]);

  const getLeadsByStatus = useCallback((status: Lead['status']): Lead[] => {
    return leads.filter(l => l.status === status);
  }, [leads]);

  const searchLeads = useCallback(async (query: string): Promise<Lead[]> => {
    if (!clinicId) return [];
    
    try {
      return await LeadsService.search(clinicId, query);
    } catch (err) {
      console.error('❌ [LeadsContext] Error searching leads:', err);
      toast.error('Erro ao buscar leads');
      return [];
    }
  }, [clinicId]);

  const getCountByStatus = useCallback(async (): Promise<Record<Lead['status'], number>> => {
    if (!clinicId) {
      return {
        novo: 0,
        contatado: 0,
        interessado: 0,
        agendado: 0,
        cliente: 0,
        perdido: 0
      };
    }
    
    try {
      return await LeadsService.getCountByStatus(clinicId);
    } catch (err) {
      console.error('❌ [LeadsContext] Error getting count by status:', err);
      return {
        novo: 0,
        contatado: 0,
        interessado: 0,
        agendado: 0,
        cliente: 0,
        perdido: 0
      };
    }
  }, [clinicId]);

  const refreshLeads = useCallback(async () => {
    if (!clinicId) return;
    globalCache.invalidate(CACHE_KEYS.LEADS);
    await fetchLeads();
  }, [clinicId, fetchLeads]);

  const value: LeadsContextType = {
    leads,
    loading,
    error,
    fetchLeads,
    addLead,
    updateLead,
    deleteLead,
    updateLeadStatus,
    getLeadById,
    getLeadsByStatus,
    searchLeads,
    getCountByStatus,
    refreshLeads
  };

  return (
    <LeadsContext.Provider value={value}>
      {children}
    </LeadsContext.Provider>
  );
}

export function useLeads(): LeadsContextType {
  const context = useContext(LeadsContext);
  if (!context) {
    throw new Error('useLeads must be used within a LeadsProvider');
  }
  return context;
}
