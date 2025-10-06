/**
 * Sistema de Cache Global para toda a aplicação
 * Evita fetches desnecessários ao navegar entre páginas
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  clinicId: string | null;
}

class GlobalCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutos por padrão

  /**
   * Salva dados no cache com TTL customizável
   */
  set<T>(key: string, data: T, clinicId: string | null = null, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      clinicId
    });
    console.log(`💾 Cache: Salvou "${key}" (TTL: ${(ttl || this.defaultTTL) / 1000}s)`);
  }

  /**
   * Recupera dados do cache se ainda válido
   */
  get<T>(key: string, clinicId: string | null = null, ttl?: number): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      console.log(`📭 Cache: "${key}" não encontrado`);
      return null;
    }

    // Verificar se o clinicId mudou
    if (clinicId && entry.clinicId !== clinicId) {
      console.log(`🏥 Cache: "${key}" é de outra clínica, invalidando...`);
      this.cache.delete(key);
      return null;
    }

    const age = Date.now() - entry.timestamp;
    const maxAge = ttl || this.defaultTTL;

    if (age > maxAge) {
      console.log(`⏰ Cache: "${key}" expirou (${(age / 1000).toFixed(1)}s > ${maxAge / 1000}s)`);
      this.cache.delete(key);
      return null;
    }

    console.log(`✅ Cache: "${key}" válido (idade: ${(age / 1000).toFixed(1)}s)`);
    return entry.data;
  }

  /**
   * Verifica se existe cache válido
   */
  has(key: string, clinicId: string | null = null, ttl?: number): boolean {
    return this.get(key, clinicId, ttl) !== null;
  }

  /**
   * Invalida um item específico do cache
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    console.log(`🗑️ Cache: Invalidou "${key}"`);
  }

  /**
   * Invalida todos os itens de uma clínica específica
   */
  invalidateClinic(clinicId: string): void {
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.clinicId === clinicId) {
        this.cache.delete(key);
        count++;
      }
    }
    console.log(`🗑️ Cache: Invalidou ${count} itens da clínica ${clinicId}`);
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🗑️ Cache: Limpou todos os ${size} itens`);
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Instância única global
export const globalCache = new GlobalCache();

// Exportar constantes de cache keys para consistência
export const CACHE_KEYS = {
  PRODUCTS: 'products',
  PATIENTS: 'patients',
  PROFESSIONALS: 'professionals',
  APPOINTMENTS: 'appointments',
  ROOMS: 'rooms',
  MEDICAL_RECORDS: 'medical_records',
  EVOLUTIONS: 'evolutions',
  ACCOUNTS_PAYABLE: 'accounts_payable',
  ACCOUNTS_RECEIVABLE: 'accounts_receivable',
  LEADS: 'leads',
  DASHBOARD_STATS: 'dashboard_stats',
  CLINIC_SETTINGS: 'clinic_settings',
  AUTH_USER: 'auth_user',
  SUBSCRIPTION_PERIODS: 'subscription_periods'
} as const;

// TTLs recomendados por tipo de dado
export const CACHE_TTL = {
  STATIC: 10 * 60 * 1000, // 10 minutos - dados que raramente mudam (produtos, configurações)
  MEDIUM: 5 * 60 * 1000,  // 5 minutos - dados que mudam ocasionalmente (pacientes, profissionais)
  DYNAMIC: 2 * 60 * 1000, // 2 minutos - dados que mudam frequentemente (appointments, stats)
  REALTIME: 30 * 1000     // 30 segundos - dados em tempo real
} as const;
