/**
 * Sistema de Cache Persistente para Dados Críticos
 * Garante que dados básicos como clinic_id, user info não sejam perdidos
 */

interface CachedUserData {
  userId: string;
  email: string;
  clinic_id: string;
  clinic_code: string;
  role: string;
  name?: string;
  cachedAt: number; // timestamp
}

interface CachedClinicData {
  clinic_id: string;
  name: string;
  code: string;
  settings?: any;
  cachedAt: number;
}

const CACHE_KEYS = {
  USER_DATA: 'physio_flow_user_data',
  CLINIC_DATA: 'physio_flow_clinic_data',
  SESSION_TOKEN: 'physio_flow_session'
};

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas

class PersistentCache {
  
  // ===== CACHE DE USUÁRIO =====
  static cacheUserData(userData: CachedUserData): void {
    try {
      const dataWithTimestamp = {
        ...userData,
        cachedAt: Date.now()
      };
      localStorage.setItem(CACHE_KEYS.USER_DATA, JSON.stringify(dataWithTimestamp));
      console.log('✅ Dados do usuário salvos no cache:', userData.email);
    } catch (error) {
      console.error('❌ Erro ao salvar dados do usuário no cache:', error);
    }
  }

  static getCachedUserData(): CachedUserData | null {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.USER_DATA);
      if (!cached) return null;

      const data: CachedUserData = JSON.parse(cached);
      
      // Verificar se ainda está válido
      if (Date.now() - data.cachedAt > CACHE_EXPIRY) {
        console.log('⏰ Cache do usuário expirado, removendo...');
        this.clearUserCache();
        return null;
      }

      console.log('✅ Dados do usuário recuperados do cache:', data.email);
      return data;
    } catch (error) {
      console.error('❌ Erro ao recuperar dados do usuário do cache:', error);
      return null;
    }
  }

  static clearUserCache(): void {
    localStorage.removeItem(CACHE_KEYS.USER_DATA);
    console.log('🗑️ Cache do usuário limpo');
  }

  // ===== CACHE DA CLÍNICA =====
  static cacheClinicData(clinicData: CachedClinicData): void {
    try {
      const dataWithTimestamp = {
        ...clinicData,
        cachedAt: Date.now()
      };
      localStorage.setItem(CACHE_KEYS.CLINIC_DATA, JSON.stringify(dataWithTimestamp));
      console.log('✅ Dados da clínica salvos no cache:', clinicData.name);
    } catch (error) {
      console.error('❌ Erro ao salvar dados da clínica no cache:', error);
    }
  }

  static getCachedClinicData(): CachedClinicData | null {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.CLINIC_DATA);
      if (!cached) return null;

      const data: CachedClinicData = JSON.parse(cached);
      
      // Verificar se ainda está válido
      if (Date.now() - data.cachedAt > CACHE_EXPIRY) {
        console.log('⏰ Cache da clínica expirado, removendo...');
        this.clearClinicCache();
        return null;
      }

      console.log('✅ Dados da clínica recuperados do cache:', data.name);
      return data;
    } catch (error) {
      console.error('❌ Erro ao recuperar dados da clínica do cache:', error);
      return null;
    }
  }

  static clearClinicCache(): void {
    localStorage.removeItem(CACHE_KEYS.CLINIC_DATA);
    console.log('🗑️ Cache da clínica limpo');
  }

  // ===== CACHE DE SESSION =====
  static cacheSessionToken(token: string): void {
    try {
      sessionStorage.setItem(CACHE_KEYS.SESSION_TOKEN, token);
      console.log('✅ Token de sessão salvo');
    } catch (error) {
      console.error('❌ Erro ao salvar token de sessão:', error);
    }
  }

  static getCachedSessionToken(): string | null {
    try {
      return sessionStorage.getItem(CACHE_KEYS.SESSION_TOKEN);
    } catch (error) {
      console.error('❌ Erro ao recuperar token de sessão:', error);
      return null;
    }
  }

  static clearSessionCache(): void {
    sessionStorage.removeItem(CACHE_KEYS.SESSION_TOKEN);
    console.log('🗑️ Cache de sessão limpo');
  }

  // ===== LIMPEZA GERAL =====
  static clearAllCache(): void {
    this.clearUserCache();
    this.clearClinicCache();
    this.clearSessionCache();
    console.log('🗑️ Todos os caches limpos');
  }

  // ===== VALIDAÇÃO RÁPIDA =====
  static hasValidUserCache(): boolean {
    const userData = this.getCachedUserData();
    return userData !== null && !!userData.clinic_id && !!userData.userId;
  }

  static hasValidClinicCache(): boolean {
    const clinicData = this.getCachedClinicData();
    return clinicData !== null && !!clinicData.clinic_id;
  }

  // ===== RECUPERAÇÃO RÁPIDA DE DADOS CRÍTICOS =====
  static getClinicId(): string | null {
    const userData = this.getCachedUserData();
    const clinicData = this.getCachedClinicData();
    
    return userData?.clinic_id || clinicData?.clinic_id || null;
  }

  static getUserId(): string | null {
    const userData = this.getCachedUserData();
    return userData?.userId || null;
  }

  static getClinicCode(): string | null {
    const userData = this.getCachedUserData();
    const clinicData = this.getCachedClinicData();
    
    return userData?.clinic_code || clinicData?.code || null;
  }
}

export default PersistentCache;
export type { CachedUserData, CachedClinicData };