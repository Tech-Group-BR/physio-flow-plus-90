import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { BillingPeriod } from '@/components/SubscriptionPeriodSelector'

interface SubscriptionPricing {
  product_id: string
  product_name: string
  base_price: number
  period: 'monthly' | 'quarterly' | 'semiannual' | 'annual'
  display_name: string
  description: string
  months: number
  discount_percent: number
  monthly_price: number
  total_price: number
  savings: number
}

export function useSubscriptionPeriods(productId?: string) {
  const [periods, setPeriods] = useState<BillingPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPeriods()
  }, [productId])

  const fetchPeriods = async () => {
    try {
      setLoading(true)
      setError(null)

      // Períodos disponíveis com valores totais fixos
      // Baseado nos planos em subscription_plans
      const defaultPeriods: BillingPeriod[] = [
        {
          period: 'quarterly',
          displayName: 'Trimestral',
          description: 'Economize 10% pagando 3 meses',
          months: 3,
          discountPercent: 10,
          monthlyPrice: 0,
          totalPrice: 262, // Valor total fixo
          savings: 0
        },
        {
          period: 'semiannual',
          displayName: 'Semestral',
          description: 'Economize 20% pagando 6 meses',
          months: 6,
          discountPercent: 20,
          monthlyPrice: 0,
          totalPrice: 495, // Valor total fixo
          savings: 0,
          popular: true
        },
        {
          period: 'annual',
          displayName: 'Anual',
          description: 'Economize 30% pagando 12 meses',
          months: 12,
          discountPercent: 30,
          monthlyPrice: 0,
          totalPrice: 930, // Valor total fixo
          savings: 0,
          bestDeal: true
        }
      ]

      setPeriods(defaultPeriods)
    } catch (err: any) {
      console.error('Error fetching subscription periods:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Função para calcular preço de um período específico com valores fixos
  const calculatePeriodPrice = (basePrice: number, period: 'monthly' | 'quarterly' | 'semiannual' | 'annual') => {
    const periodData = periods.find(p => p.period === period)
    if (!periodData) return null

    // Usar valores totais fixos
    const totalPrice = periodData.totalPrice
    const months = periodData.months
    const monthlyPrice = totalPrice / months
    // Calcular economia baseado no preço base R$ 97/mês
    const originalTotal = 97 * months
    const savings = originalTotal - totalPrice

    return {
      monthlyPrice: Number(monthlyPrice.toFixed(2)),
      totalPrice: Number(totalPrice.toFixed(2)),
      savings: Number(savings.toFixed(2)),
      discountPercent: periodData.discountPercent,
      months
    }
  }

  // Função para obter período com preços calculados
  const getPeriodWithPrices = (basePrice: number, period: 'monthly' | 'quarterly' | 'semiannual' | 'annual'): BillingPeriod | null => {
    const periodData = periods.find(p => p.period === period)
    if (!periodData) return null

    const calculated = calculatePeriodPrice(basePrice, period)
    if (!calculated) return null

    return {
      ...periodData,
      monthlyPrice: calculated.monthlyPrice,
      totalPrice: calculated.totalPrice,
      savings: calculated.savings
    }
  }

  // Função para obter todos os períodos com preços calculados
  const getAllPeriodsWithPrices = (basePrice: number): BillingPeriod[] => {
    return periods.map(period => {
      const calculated = calculatePeriodPrice(basePrice, period.period)
      if (!calculated) return period

      return {
        ...period,
        monthlyPrice: calculated.monthlyPrice,
        totalPrice: calculated.totalPrice,
        savings: calculated.savings
      }
    })
  }

  return {
    periods,
    loading,
    error,
    calculatePeriodPrice,
    getPeriodWithPrices,
    getAllPeriodsWithPrices,
    refetch: fetchPeriods
  }
}
