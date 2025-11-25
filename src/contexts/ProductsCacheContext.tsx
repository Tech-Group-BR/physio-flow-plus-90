import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { globalCache, CACHE_KEYS, CACHE_TTL } from '@/lib/globalCache';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number; // Preço base mensal
  billing_period?: string; // QUARTERLY, SEMIANNUAL, ANNUAL
  is_active: boolean;
  created_at: string;
  period?: string;
  features?: string[];
  popular?: boolean;
  totalPrice?: number; // Preço total do período
  monthlyPrice?: number; // Preço mensal calculado com desconto
}

interface ProductsCacheContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  getProductByName: (name: string) => Product | undefined;
}

const ProductsCacheContext = createContext<ProductsCacheContextType | undefined>(undefined);

export function ProductsCacheProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => {
    // Tentar carregar do cache global
    const cached = globalCache.get<Product[]>(CACHE_KEYS.PRODUCTS, null, CACHE_TTL.STATIC);
    if (cached) {
      console.log('⚡ Produtos carregados do cache global');
      return cached;
    }
    return [];
  });
  
  const [loading, setLoading] = useState(() => {
    // Se tem cache, não precisa loading
    return !globalCache.has(CACHE_KEYS.PRODUCTS, null, CACHE_TTL.STATIC);
  });
  
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    // Se tem cache válido, usar ele
    const cached = globalCache.get<Product[]>(CACHE_KEYS.PRODUCTS, null, CACHE_TTL.STATIC);
    if (cached) {
      console.log('⚡ Produtos carregados do cache global:', cached.length);
      setProducts(cached);
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Buscando produtos do banco...');
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) {
        console.error('❌ Erro na query de produtos:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ Nenhum produto ativo encontrado no banco');
        setProducts([]);
        setLoading(false);
        return;
      }

      console.log('📦 Produtos recebidos do banco:', data.length);

      // Transformar os dados - price já é o valor base mensal
      const transformedProducts: Product[] = data.map((product) => {
        return {
          ...product,
          period: '/período',
          features: Array.isArray(product.features) ? product.features : getFeaturesForProduct(product.name),
          popular: product.popular || false,
          totalPrice: product.price, // Para exibição na landing, será calculado dinamicamente
          monthlyPrice: product.price
        };
      });

      // Salvar no cache global
      globalCache.set(CACHE_KEYS.PRODUCTS, transformedProducts, null, CACHE_TTL.STATIC);
      
      setProducts(transformedProducts);
      console.log('✅ Produtos carregados e salvos no cache:', transformedProducts.length);
    } catch (err) {
      console.error('❌ Erro ao buscar produtos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos');
    } finally {
      console.log('🏁 fetchProducts finalizado, setando loading=false');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🎬 ProductsCacheContext montado, verificando cache...');
    // Só fazer fetch se não tem cache
    if (!globalCache.has(CACHE_KEYS.PRODUCTS, null, CACHE_TTL.STATIC)) {
      console.log('📭 Cache não encontrado, iniciando fetch...');
      fetchProducts();
    } else {
      console.log('✅ Cache de produtos já existe, pulando fetch');
      const cached = globalCache.get<Product[]>(CACHE_KEYS.PRODUCTS, null, CACHE_TTL.STATIC);
      if (cached) {
        setProducts(cached);
        setLoading(false);
      }
    }
  }, []);

  const getProductById = (id: string) => {
    return products.find(p => p.id === id);
  };

  const getProductByName = (name: string) => {
    return products.find(p => p.name.toLowerCase() === name.toLowerCase());
  };

  return (
    <ProductsCacheContext.Provider
      value={{
        products,
        loading,
        error,
        refetch: fetchProducts,
        getProductById,
        getProductByName
      }}
    >
      {children}
    </ProductsCacheContext.Provider>
  );
}

export function useProductsCache() {
  const context = useContext(ProductsCacheContext);
  if (context === undefined) {
    throw new Error('useProductsCache must be used within a ProductsCacheProvider');
  }
  return context;
}

// Função auxiliar para definir features baseado no nome do produto
function getFeaturesForProduct(productName: string): string[] {
  const name = productName.toLowerCase();

  if (name.includes('starter')) {
    return [
      "Até 200 pacientes",
      "Agenda básica",
      "WhatsApp integrado",
      "Relatórios simples",
      "Suporte por email"
    ];
  }

  if (name.includes('professional')) {
    return [
      "Pacientes ilimitados",
      "Agenda completa",
      "WhatsApp automação",
      "Relatórios avançados",
      "CRM integrado",
      "Financeiro completo",
      "Suporte prioritário"
    ];
  }

  if (name.includes('enterprise')) {
    return [
      "Tudo do Professional",
      "Múltiplas clínicas",
      "API personalizada",
      "Suporte 24/7",
      "Treinamento incluído",
      "Customizações",
      "Gerente dedicado"
    ];
  }

  return [
    "Gestão de pacientes",
    "Agendamento online",
    "Relatórios básicos"
  ];
}
