import { useState, useEffect, useCallback } from 'react';

interface PersistedPaymentData {
  // Dados do cartão
  cardNumber?: string;
  cardHolderName?: string;
  cardExpiryMonth?: string;
  cardExpiryYear?: string;
  cardCcv?: string;
  
  // Dados do titular
  holderName?: string;
  holderEmail?: string;
  holderCpfCnpj?: string;
  holderPhone?: string;
  holderPostalCode?: string;
  holderAddressNumber?: string;
  
  // QR Code PIX
  pixQrCode?: string;
  pixCopyPaste?: string;
  pixExpirationDate?: string;
  
  // Tab ativa
  activeTab?: string;
  
  // Timestamp para expiração
  timestamp?: number;
}

const STORAGE_KEY = 'physioflow_payment_data';
const EXPIRATION_TIME = 60 * 60 * 1000; // 60 minutos

// Função para salvar no storage (funciona tanto em sessionStorage quanto localStorage)
const saveToStorage = (key: string, data: any) => {
  try {
    const serialized = JSON.stringify(data);
    // Salvar em AMBOS para máxima persistência
    sessionStorage.setItem(key, serialized);
    localStorage.setItem(key, serialized);
    console.log('💾 Dados salvos:', Object.keys(data).filter(k => k !== 'timestamp'));
  } catch (error) {
    console.error('❌ Erro ao salvar dados:', error);
  }
};

// Função para carregar do storage (tenta localStorage primeiro, depois sessionStorage)
const loadFromStorage = (key: string): PersistedPaymentData | null => {
  try {
    // Tentar localStorage primeiro (persiste entre sessões)
    let stored = localStorage.getItem(key);
    if (!stored) {
      // Fallback para sessionStorage
      stored = sessionStorage.getItem(key);
    }
    
    if (stored) {
      const data: PersistedPaymentData = JSON.parse(stored);
      
      // Verificar se os dados não expiraram
      if (data.timestamp) {
        const now = Date.now();
        if (now - data.timestamp < EXPIRATION_TIME) {
          console.log('📂 Dados carregados:', Object.keys(data).filter(k => k !== 'timestamp'));
          return data;
        } else {
          console.log('⏰ Dados expiraram, limpando...');
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro ao carregar dados:', error);
  }
  return null;
};

// Estado global para evitar remontagem
let globalPersistedData: PersistedPaymentData | null = null;

export function usePaymentPersistence() {
  const [persistedData, setPersistedData] = useState<PersistedPaymentData>(() => {
    // 1. Tentar usar cache global primeiro (evita recarregar do storage)
    if (globalPersistedData && Object.keys(globalPersistedData).length > 0) {
      console.log('⚡ Dados carregados do cache em memória (sem recarregar)');
      return globalPersistedData;
    }
    
    // 2. Se não tem cache, carregar do storage
    const loaded = loadFromStorage(STORAGE_KEY);
    if (loaded && Object.keys(loaded).length > 0) {
      console.log('📂 Dados carregados do storage');
      globalPersistedData = loaded; // Atualizar cache global
      return loaded;
    }
    
    return {};
  });

  // Sincronizar com cache global sempre que mudar
  useEffect(() => {
    if (Object.keys(persistedData).length > 0) {
      globalPersistedData = persistedData;
    }
  }, [persistedData]);

  // Salvar automaticamente quando a janela for fechada ou navegar
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (Object.keys(persistedData).length > 1) { // Mais que só timestamp
        saveToStorage(STORAGE_KEY, persistedData);
        console.log('💾 Dados salvos antes de sair da página');
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && Object.keys(persistedData).length > 1) {
        saveToStorage(STORAGE_KEY, persistedData);
        console.log('💾 Dados salvos ao trocar de aba do navegador');
      }
    };

    // Salvar quando usuário sair da página
    window.addEventListener('beforeunload', handleBeforeUnload);
    // Salvar quando usuário trocar de aba do navegador
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Salvar quando componente desmontar
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (Object.keys(persistedData).length > 1) {
        saveToStorage(STORAGE_KEY, persistedData);
        console.log('💾 Dados salvos ao desmontar componente');
      }
    };
  }, [persistedData]);

  // Salvar dados no storage
  const persistData = useCallback((data: Partial<PersistedPaymentData>) => {
    setPersistedData(current => {
      const updated = {
        ...current,
        ...data,
        timestamp: Date.now(),
      };
      
      // Salvar imediatamente
      saveToStorage(STORAGE_KEY, updated);
      
      return updated;
    });
  }, []);

  // Limpar dados persistidos
  const clearPersistedData = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      globalPersistedData = null; // Limpar cache global
      setPersistedData({});
      console.log('🗑️ Todos os dados limpos (incluindo cache)');
    } catch (error) {
      console.error('❌ Erro ao limpar dados:', error);
    }
  }, []);

  // Limpar apenas dados do cartão (manter PIX)
  const clearCardData = useCallback(() => {
    setPersistedData(current => {
      const { pixQrCode, pixCopyPaste, pixExpirationDate, activeTab } = current;
      const pixData = { pixQrCode, pixCopyPaste, pixExpirationDate, activeTab, timestamp: Date.now() };
      
      saveToStorage(STORAGE_KEY, pixData);
      console.log('🗑️ Dados do cartão limpos, PIX mantido');
      
      return pixData;
    });
  }, []);

  // Limpar apenas dados do PIX (manter cartão)
  const clearPixData = useCallback(() => {
    setPersistedData(current => {
      const { pixQrCode, pixCopyPaste, pixExpirationDate, ...cardData } = current;
      
      saveToStorage(STORAGE_KEY, { ...cardData, timestamp: Date.now() });
      console.log('🗑️ Dados do PIX limpos, cartão mantido');
      
      return { ...cardData, timestamp: Date.now() };
    });
  }, []);

  return {
    persistedData,
    persistData,
    clearPersistedData,
    clearCardData,
    clearPixData,
  };
}
