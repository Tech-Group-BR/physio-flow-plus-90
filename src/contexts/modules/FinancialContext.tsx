/**
 * Financial Context
 * 
 * Context modularizado para gerenciamento de contas a pagar e contas a receber.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AccountsPayableService, AccountsReceivableService } from '@/services/database/financial.service';
import { globalCache, CACHE_KEYS, CACHE_TTL } from '@/lib/globalCache';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { AccountsPayable, AccountsReceivable } from '@/types';

interface FinancialContextType {
  // Accounts Payable
  accountsPayable: AccountsPayable[];
  payableLoading: boolean;
  payableError: string | null;
  fetchAccountsPayable: () => Promise<void>;
  addAccountPayable: (payable: Omit<AccountsPayable, 'id' | 'createdAt'>) => Promise<AccountsPayable | undefined>;
  updateAccountPayable: (id: string, updates: Partial<AccountsPayable>) => Promise<void>;
  deleteAccountPayable: (id: string) => Promise<void>;
  markPayableAsPaid: (id: string, paidDate: string) => Promise<void>;
  bulkDeletePayables: (ids: string[]) => Promise<void>;
  
  // Accounts Receivable
  accountsReceivable: AccountsReceivable[];
  receivableLoading: boolean;
  receivableError: string | null;
  fetchAccountsReceivable: () => Promise<void>;
  addAccountReceivable: (receivable: Omit<AccountsReceivable, 'id' | 'createdAt'>) => Promise<AccountsReceivable | undefined>;
  updateAccountReceivable: (id: string, updates: Partial<AccountsReceivable>) => Promise<void>;
  deleteAccountReceivable: (id: string) => Promise<void>;
  markReceivableAsReceived: (id: string, receivedDate: string) => Promise<void>;
  bulkDeleteReceivables: (ids: string[]) => Promise<void>;
  getReceivablesByPatient: (patientId: string) => Promise<AccountsReceivable[]>;
  
  // General
  refreshFinancial: () => Promise<void>;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export function FinancialProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const clinicId = user?.profile?.clinic_id;
  
  const isInitialized = useRef(false);
  const lastClinicId = useRef<string | null>(null);
  
  // Accounts Payable State
  const [accountsPayable, setAccountsPayable] = useState<AccountsPayable[]>(() => {
    if (clinicId) {
      const cached = globalCache.get<AccountsPayable[]>(CACHE_KEYS.ACCOUNTS_PAYABLE, clinicId, CACHE_TTL.MEDIUM);
      if (cached) {
        console.log('⚡ [FinancialContext] Loaded payables from cache:', cached.length);
        return cached;
      }
    }
    return [];
  });
  
  const [payableLoading, setPayableLoading] = useState(false);
  const [payableError, setPayableError] = useState<string | null>(null);

  // Accounts Receivable State
  const [accountsReceivable, setAccountsReceivable] = useState<AccountsReceivable[]>(() => {
    if (clinicId) {
      const cached = globalCache.get<AccountsReceivable[]>(CACHE_KEYS.ACCOUNTS_RECEIVABLE, clinicId, CACHE_TTL.MEDIUM);
      if (cached) {
        console.log('⚡ [FinancialContext] Loaded receivables from cache:', cached.length);
        return cached;
      }
    }
    return [];
  });
  
  const [receivableLoading, setReceivableLoading] = useState(false);
  const [receivableError, setReceivableError] = useState<string | null>(null);

  // Clinic change detection
  useEffect(() => {
    if (clinicId && lastClinicId.current && clinicId !== lastClinicId.current) {
      console.log('🔄 [FinancialContext] Clinic changed, resetting state');
      setAccountsPayable([]);
      setAccountsReceivable([]);
      setPayableError(null);
      setReceivableError(null);
      if (lastClinicId.current) globalCache.invalidateClinic(lastClinicId.current);
      isInitialized.current = false;
    }
    lastClinicId.current = clinicId || null;
  }, [clinicId]);

  // Initial load
  useEffect(() => {
    if (isInitialized.current || !clinicId) return;
    
    const cachedPayable = globalCache.get<AccountsPayable[]>(CACHE_KEYS.ACCOUNTS_PAYABLE, clinicId, CACHE_TTL.MEDIUM);
    const cachedReceivable = globalCache.get<AccountsReceivable[]>(CACHE_KEYS.ACCOUNTS_RECEIVABLE, clinicId, CACHE_TTL.MEDIUM);
    
    if (cachedPayable && cachedReceivable) {
      console.log('⚡ [FinancialContext] Using cached data on mount');
      setAccountsPayable(cachedPayable);
      setAccountsReceivable(cachedReceivable);
      isInitialized.current = true;
      return;
    }
    
    console.log('🚀 [FinancialContext] Initial load for clinic:', clinicId);
    isInitialized.current = true;
    fetchAccountsPayable();
    fetchAccountsReceivable();
  }, [clinicId]);

  // ============================================
  // Accounts Payable Operations
  // ============================================

  const fetchAccountsPayable = useCallback(async () => {
    if (!clinicId) {
      console.warn('⚠️ [FinancialContext] Cannot fetch payables: No clinic ID');
      return;
    }

    const cached = globalCache.get<AccountsPayable[]>(CACHE_KEYS.ACCOUNTS_PAYABLE, clinicId, CACHE_TTL.MEDIUM);
    if (cached) {
      console.log('⚡ [FinancialContext] Using cached payables:', cached.length);
      setAccountsPayable(cached);
      return;
    }

    setPayableLoading(true);
    setPayableError(null);
    
    try {
      console.log('🔄 [FinancialContext] Fetching payables from database...');
      const data = await AccountsPayableService.fetchAll(clinicId);
      
      setAccountsPayable(data);
      globalCache.set(CACHE_KEYS.ACCOUNTS_PAYABLE, data, clinicId, CACHE_TTL.MEDIUM);
      
      console.log(`✅ [FinancialContext] Loaded ${data.length} payables`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payables';
      console.error('❌ [FinancialContext] Error fetching payables:', err);
      setPayableError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setPayableLoading(false);
    }
  }, [clinicId]);

  const addAccountPayable = useCallback(async (
    payable: Omit<AccountsPayable, 'id' | 'createdAt'>
  ): Promise<AccountsPayable | undefined> => {
    if (!clinicId) {
      toast.error('Erro: Clínica não identificada');
      return;
    }

    setPayableLoading(true);
    setPayableError(null);
    
    try {
      const newPayable = await AccountsPayableService.create(clinicId, payable);
      
      setAccountsPayable(prev => [...prev, newPayable]);
      globalCache.invalidate(CACHE_KEYS.ACCOUNTS_PAYABLE);
      
      toast.success('Conta a pagar adicionada com sucesso!');
      return newPayable;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add payable';
      setPayableError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setPayableLoading(false);
    }
  }, [clinicId]);

  const updateAccountPayable = useCallback(async (id: string, updates: Partial<AccountsPayable>) => {
    if (!clinicId) {
      toast.error('Erro: Clínica não identificada');
      return;
    }

    setPayableLoading(true);
    setPayableError(null);
    
    try {
      const updatedPayable = await AccountsPayableService.update(id, updates);
      
      setAccountsPayable(prev => prev.map(p => p.id === id ? updatedPayable : p));
      globalCache.invalidate(CACHE_KEYS.ACCOUNTS_PAYABLE);
      
      toast.success('Conta a pagar atualizada!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update payable';
      setPayableError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setPayableLoading(false);
    }
  }, [clinicId]);

  const deleteAccountPayable = useCallback(async (id: string) => {
    if (!clinicId) {
      toast.error('Erro: Clínica não identificada');
      return;
    }

    setPayableLoading(true);
    setPayableError(null);
    
    try {
      await AccountsPayableService.delete(id);
      
      setAccountsPayable(prev => prev.filter(p => p.id !== id));
      globalCache.invalidate(CACHE_KEYS.ACCOUNTS_PAYABLE);
      
      toast.success('Conta a pagar removida!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete payable';
      setPayableError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setPayableLoading(false);
    }
  }, [clinicId]);

  const markPayableAsPaid = useCallback(async (id: string, paidDate: string) => {
    if (!clinicId) return;
    
    try {
      const updatedPayable = await AccountsPayableService.markAsPaid(id, paidDate);
      
      setAccountsPayable(prev => prev.map(p => p.id === id ? updatedPayable : p));
      globalCache.invalidate(CACHE_KEYS.ACCOUNTS_PAYABLE);
      
      toast.success('Conta marcada como paga!');
    } catch (err) {
      toast.error('Erro ao marcar como paga');
      throw err;
    }
  }, [clinicId]);

  const bulkDeletePayables = useCallback(async (ids: string[]) => {
    if (!clinicId) return;
    
    try {
      await AccountsPayableService.bulkDelete(ids);
      
      setAccountsPayable(prev => prev.filter(p => !ids.includes(p.id)));
      globalCache.invalidate(CACHE_KEYS.ACCOUNTS_PAYABLE);
      
      toast.success(`${ids.length} contas removidas!`);
    } catch (err) {
      toast.error('Erro ao remover contas');
      throw err;
    }
  }, [clinicId]);

  // ============================================
  // Accounts Receivable Operations
  // ============================================

  const fetchAccountsReceivable = useCallback(async () => {
    if (!clinicId) {
      console.warn('⚠️ [FinancialContext] Cannot fetch receivables: No clinic ID');
      return;
    }

    const cached = globalCache.get<AccountsReceivable[]>(CACHE_KEYS.ACCOUNTS_RECEIVABLE, clinicId, CACHE_TTL.MEDIUM);
    if (cached) {
      console.log('⚡ [FinancialContext] Using cached receivables:', cached.length);
      setAccountsReceivable(cached);
      return;
    }

    setReceivableLoading(true);
    setReceivableError(null);
    
    try {
      console.log('🔄 [FinancialContext] Fetching receivables from database...');
      const data = await AccountsReceivableService.fetchAll(clinicId);
      
      setAccountsReceivable(data);
      globalCache.set(CACHE_KEYS.ACCOUNTS_RECEIVABLE, data, clinicId, CACHE_TTL.MEDIUM);
      
      console.log(`✅ [FinancialContext] Loaded ${data.length} receivables`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch receivables';
      console.error('❌ [FinancialContext] Error fetching receivables:', err);
      setReceivableError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setReceivableLoading(false);
    }
  }, [clinicId]);

  const addAccountReceivable = useCallback(async (
    receivable: Omit<AccountsReceivable, 'id' | 'createdAt'>
  ): Promise<AccountsReceivable | undefined> => {
    if (!clinicId) {
      toast.error('Erro: Clínica não identificada');
      return;
    }

    setReceivableLoading(true);
    setReceivableError(null);
    
    try {
      const newReceivable = await AccountsReceivableService.create(clinicId, receivable);
      
      setAccountsReceivable(prev => [...prev, newReceivable]);
      globalCache.invalidate(CACHE_KEYS.ACCOUNTS_PAYABLE);
      
      toast.success('Conta a receber adicionada com sucesso!');
      return newReceivable;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add receivable';
      setReceivableError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setReceivableLoading(false);
    }
  }, [clinicId]);

  const updateAccountReceivable = useCallback(async (id: string, updates: Partial<AccountsReceivable>) => {
    if (!clinicId) {
      toast.error('Erro: Clínica não identificada');
      return;
    }

    setReceivableLoading(true);
    setReceivableError(null);
    
    try {
      const updatedReceivable = await AccountsReceivableService.update(id, updates);
      
      setAccountsReceivable(prev => prev.map(r => r.id === id ? updatedReceivable : r));
      globalCache.invalidate(CACHE_KEYS.ACCOUNTS_PAYABLE);
      
      toast.success('Conta a receber atualizada!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update receivable';
      setReceivableError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setReceivableLoading(false);
    }
  }, [clinicId]);

  const deleteAccountReceivable = useCallback(async (id: string) => {
    if (!clinicId) {
      toast.error('Erro: Clínica não identificada');
      return;
    }

    setReceivableLoading(true);
    setReceivableError(null);
    
    try {
      await AccountsReceivableService.delete(id);
      
      setAccountsReceivable(prev => prev.filter(r => r.id !== id));
      globalCache.invalidate(CACHE_KEYS.ACCOUNTS_PAYABLE);
      
      toast.success('Conta a receber removida!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete receivable';
      setReceivableError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setReceivableLoading(false);
    }
  }, [clinicId]);

  const markReceivableAsReceived = useCallback(async (id: string, receivedDate: string) => {
    if (!clinicId) return;
    
    try {
      const updatedReceivable = await AccountsReceivableService.markAsReceived(id, receivedDate);
      
      setAccountsReceivable(prev => prev.map(r => r.id === id ? updatedReceivable : r));
      globalCache.invalidate(CACHE_KEYS.ACCOUNTS_PAYABLE);
      
      toast.success('Conta marcada como recebida!');
    } catch (err) {
      toast.error('Erro ao marcar como recebida');
      throw err;
    }
  }, [clinicId]);

  const bulkDeleteReceivables = useCallback(async (ids: string[]) => {
    if (!clinicId) return;
    
    try {
      await AccountsReceivableService.bulkDelete(ids);
      
      setAccountsReceivable(prev => prev.filter(r => !ids.includes(r.id)));
      globalCache.invalidate(CACHE_KEYS.ACCOUNTS_PAYABLE);
      
      toast.success(`${ids.length} contas removidas!`);
    } catch (err) {
      toast.error('Erro ao remover contas');
      throw err;
    }
  }, [clinicId]);

  const getReceivablesByPatient = useCallback(async (patientId: string): Promise<AccountsReceivable[]> => {
    try {
      return await AccountsReceivableService.fetchByPatient(patientId);
    } catch (err) {
      toast.error('Erro ao buscar contas do paciente');
      return [];
    }
  }, []);

  const refreshFinancial = useCallback(async () => {
    if (!clinicId) return;
    globalCache.invalidate(CACHE_KEYS.ACCOUNTS_PAYABLE);
    globalCache.invalidate(CACHE_KEYS.ACCOUNTS_PAYABLE);
    await Promise.all([fetchAccountsPayable(), fetchAccountsReceivable()]);
  }, [clinicId, fetchAccountsPayable, fetchAccountsReceivable]);

  const value: FinancialContextType = {
    accountsPayable,
    payableLoading,
    payableError,
    fetchAccountsPayable,
    addAccountPayable,
    updateAccountPayable,
    deleteAccountPayable,
    markPayableAsPaid,
    bulkDeletePayables,
    
    accountsReceivable,
    receivableLoading,
    receivableError,
    fetchAccountsReceivable,
    addAccountReceivable,
    updateAccountReceivable,
    deleteAccountReceivable,
    markReceivableAsReceived,
    bulkDeleteReceivables,
    getReceivablesByPatient,
    
    refreshFinancial
  };

  return (
    <FinancialContext.Provider value={value}>
      {children}
    </FinancialContext.Provider>
  );
}

export function useFinancial(): FinancialContextType {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
}
