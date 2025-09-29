import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  is_active: boolean
  created_at: string
  // Campos adicionais para compatibilidade com a UI
  period?: string
  features?: string[]
  popular?: boolean
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true })

      if (error) {
        throw error
      }

      // Transformar os dados para incluir campos adicionais da UI
      const transformedProducts: Product[] = data.map((product) => ({
        ...product,
        period: '/mês',
        features: getFeaturesForProduct(product.name),
        popular: product.name.toLowerCase() === 'professional' // Professional é o mais popular
      }))

      setProducts(transformedProducts)
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  return {
    products,
    loading,
    error,
    refetch: fetchProducts
  }
}

// Função auxiliar para definir features baseado no nome do produto
function getFeaturesForProduct(productName: string): string[] {
  const name = productName.toLowerCase()

  if (name.includes('starter')) {
    return [
      "Até 200 pacientes",
      "Agenda básica",
      "WhatsApp integrado",
      "Relatórios simples",
      "Suporte por email"
    ]
  }

  if (name.includes('professional')) {
    return [
      "Pacientes ilimitados",
      "Agenda avançada com recorrência",
      "WhatsApp + automações",
      "Relatórios completos",
      "Portal do responsável",
      "Suporte prioritário",
      "Backup automático"
    ]
  }

  if (name.includes('enterprise')) {
    return [
      "Multi-clínicas",
      "Usuários ilimitados",
      "API personalizada",
      "Integrações avançadas",
      "Relatórios personalizados",
      "Suporte 24/7",
      "Treinamento incluso"
    ]
  }

  // Fallback para produtos não reconhecidos
  return [
    "Funcionalidades básicas",
    "Suporte por email"
  ]
}