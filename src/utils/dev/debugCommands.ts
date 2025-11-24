/**
 * Comandos de debug para o console do navegador
 * Use estes comandos para investigar problemas de cache
 */

import { debugCacheState, clearAllCaches, clearClinicCache } from './cacheCleanup';
import { globalCache } from '@/lib/globalCache';
import PersistentCache from '@/lib/persistentCache';

// Expor funções úteis no window para debug no console
if (typeof window !== 'undefined') {
  (window as any).debugPhysioFlow = {
    // Verificar estado do cache
    checkCache: () => {
      console.log('🔍 Estado atual do sistema de cache:');
      return debugCacheState();
    },
    
    // Limpar todo o cache manualmente
    clearAll: () => {
      console.log('🧹 Limpando todos os caches...');
      clearAllCaches();
      console.log('✅ Tudo limpo! Recarregue a página.');
    },
    
    // Limpar cache de uma clínica específica
    clearClinic: (clinicId: string) => {
      console.log('🏥 Limpando cache da clínica:', clinicId);
      clearClinicCache(clinicId);
    },
    
    // Ver estatísticas do globalCache
    globalCache: () => {
      return globalCache.getStats();
    },
    
    // Ver dados do PersistentCache
    persistentCache: () => {
      return {
        user: PersistentCache.getCachedUserData(),
        clinic: PersistentCache.getCachedClinicData(),
        clinicId: PersistentCache.getClinicId()
      };
    },
    
    // Ajuda
    help: () => {
      console.log(`
🔧 PhysioFlow Debug Commands
============================

window.debugPhysioFlow.checkCache()      - Verifica estado de todos os caches
window.debugPhysioFlow.clearAll()        - Limpa TODOS os caches (forçar logout limpo)
window.debugPhysioFlow.clearClinic(id)   - Limpa cache de uma clínica específica
window.debugPhysioFlow.globalCache()     - Mostra estatísticas do cache em memória
window.debugPhysioFlow.persistentCache() - Mostra dados do localStorage
window.debugPhysioFlow.help()            - Mostra esta mensagem

💡 Dica: Use checkCache() primeiro para ver se há dados fantasmas de outra conta
      `);
    }
  };
  
  console.log('✅ Debug commands disponíveis! Digite: window.debugPhysioFlow.help()');
}
