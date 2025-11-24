/**
 * Utilitário centralizado para limpeza completa de cache
 * Usa este para garantir que todos os caches sejam limpos corretamente
 * ao fazer logout ou trocar de conta
 */

import { globalCache } from '@/lib/globalCache';
import PersistentCache from '@/lib/persistentCache';

/**
 * Limpa TODOS os caches da aplicação
 * Use ao fazer logout ou quando detectar mudança de clínica
 */
export const clearAllCaches = () => {
  console.log('🧹 Iniciando limpeza completa de todos os caches...');
  
  try {
    // 1. Limpar globalCache (cache em memória)
    globalCache.clear();
    console.log('✅ GlobalCache limpo');
    
    // 2. Limpar PersistentCache (localStorage)
    PersistentCache.clearAllCache();
    console.log('✅ PersistentCache limpo');
    
    // 3. Limpar dados específicos do app no localStorage
    const appKeys = [
      'signup_success',
      'signup_success_data',
      'pendingInvitation',
      'auth_user_data',
      'auth_redirect_to',
      'physio_flow_user_data',
      'physio_flow_clinic_data',
      'physio_flow_session'
    ];
    
    appKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (err) {
        console.warn(`⚠️ Erro ao remover ${key}:`, err);
      }
    });
    console.log('✅ Dados do app no localStorage limpos');
    
    // 4. Limpar tokens do Supabase
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        try {
          localStorage.removeItem(key);
        } catch (err) {
          console.warn(`⚠️ Erro ao remover chave Supabase ${key}:`, err);
        }
      }
    });
    console.log('✅ Tokens do Supabase limpos');
    
    // 5. Limpar sessionStorage
    try {
      sessionStorage.clear();
      console.log('✅ SessionStorage limpo');
    } catch (err) {
      console.warn('⚠️ Erro ao limpar sessionStorage:', err);
    }
    
    console.log('✅ Limpeza completa de cache finalizada com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante limpeza de cache:', error);
    throw error;
  }
};

/**
 * Limpa apenas o cache de uma clínica específica
 * Útil quando há mudança de clínica mas não logout completo
 */
export const clearClinicCache = (clinicId: string) => {
  console.log('🏥 Limpando cache da clínica:', clinicId);
  
  try {
    // Limpar do globalCache
    globalCache.invalidateClinic(clinicId);
    console.log('✅ Cache da clínica invalidado no GlobalCache');
    
    // Limpar dados da clínica do PersistentCache
    PersistentCache.clearClinicCache();
    console.log('✅ Cache da clínica limpo no PersistentCache');
    
  } catch (error) {
    console.error('❌ Erro ao limpar cache da clínica:', error);
  }
};

/**
 * Verifica se há resíduos de cache que podem causar bugs
 * Útil para debug
 */
export const debugCacheState = () => {
  console.log('🔍 Estado atual dos caches:');
  
  // GlobalCache
  const globalStats = globalCache.getStats();
  console.log('GlobalCache:', globalStats);
  
  // PersistentCache
  const userCache = PersistentCache.getCachedUserData();
  const clinicCache = PersistentCache.getCachedClinicData();
  console.log('PersistentCache User:', userCache);
  console.log('PersistentCache Clinic:', clinicCache);
  
  // LocalStorage
  const localStorageKeys = Object.keys(localStorage);
  console.log('LocalStorage keys:', localStorageKeys.length);
  const relevantKeys = localStorageKeys.filter(key => 
    key.includes('physio') || 
    key.includes('supabase') || 
    key.includes('auth') ||
    key.includes('signup') ||
    key.includes('invitation')
  );
  console.log('Relevant localStorage keys:', relevantKeys);
  
  return {
    globalCache: globalStats,
    persistentCache: { user: userCache, clinic: clinicCache },
    localStorage: relevantKeys
  };
};
