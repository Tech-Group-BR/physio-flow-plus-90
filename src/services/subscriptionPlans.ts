/**
 * Subscription Plans Service
 * 
 * Service for managing subscription plans (products table)
 * CRUD operations for plan management
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  period: number; // months
  billingPeriodMonths: number | null;
  features: any; // JSON array of features
  maxProfessionals: number | null;
  maxPatients: number | null;
  isActive: boolean | null;
  popular: boolean | null;
  createdAt: string;
}

// Transform database row to frontend format
export function dbToSubscriptionPlan(db: Product): SubscriptionPlan {
  return {
    id: db.id,
    name: db.name,
    description: db.description,
    price: db.price,
    period: db.period,
    billingPeriodMonths: db.billing_period_months,
    features: db.features,
    maxProfessionals: db.max_professionals,
    maxPatients: db.max_patients,
    isActive: db.is_active,
    popular: db.popular,
    createdAt: db.created_at
  };
}

// Transform frontend format to database format
export function subscriptionPlanToDb(plan: Partial<SubscriptionPlan>): Partial<ProductInsert> {
  return {
    name: plan.name,
    description: plan.description,
    price: plan.price,
    period: plan.period,
    billing_period_months: plan.billingPeriodMonths,
    features: plan.features,
    max_professionals: plan.maxProfessionals,
    max_patients: plan.maxPatients,
    is_active: plan.isActive,
    popular: plan.popular
  };
}

/**
 * Get all active subscription plans
 */
export async function getAllActivePlans(): Promise<SubscriptionPlan[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });

  if (error) throw error;
  return data.map(dbToSubscriptionPlan);
}

/**
 * Get plan by ID
 */
export async function getPlanById(planId: string): Promise<SubscriptionPlan> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', planId)
    .single();

  if (error) throw error;
  return dbToSubscriptionPlan(data);
}

/**
 * Create new subscription plan
 */
export async function createSubscriptionPlan(planData: {
  name: string;
  description?: string;
  price: number;
  period: number; // 1, 3, 6, or 12 months
  features: string[];
  maxProfessionals?: number;
  maxPatients?: number;
  popular?: boolean;
}): Promise<SubscriptionPlan> {
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: planData.name,
      description: planData.description,
      price: planData.price,
      period: planData.period,
      billing_period_months: planData.period,
      features: planData.features,
      max_professionals: planData.maxProfessionals,
      max_patients: planData.maxPatients,
      is_active: true,
      popular: planData.popular || false
    })
    .select()
    .single();

  if (error) throw error;
  return dbToSubscriptionPlan(data);
}

/**
 * Update subscription plan
 */
export async function updateSubscriptionPlan(
  planId: string,
  updates: Partial<{
    name: string;
    description: string;
    price: number;
    period: number;
    features: string[];
    maxProfessionals: number;
    maxPatients: number;
    isActive: boolean;
    popular: boolean;
  }>
): Promise<SubscriptionPlan> {
  const dbUpdates: ProductUpdate = {
    name: updates.name,
    description: updates.description,
    price: updates.price,
    period: updates.period,
    billing_period_months: updates.period,
    features: updates.features,
    max_professionals: updates.maxProfessionals,
    max_patients: updates.maxPatients,
    is_active: updates.isActive,
    popular: updates.popular
  };

  // Remove undefined values
  Object.keys(dbUpdates).forEach(key => {
    if (dbUpdates[key as keyof ProductUpdate] === undefined) {
      delete dbUpdates[key as keyof ProductUpdate];
    }
  });

  const { data, error } = await supabase
    .from('products')
    .update(dbUpdates)
    .eq('id', planId)
    .select()
    .single();

  if (error) throw error;
  return dbToSubscriptionPlan(data);
}

/**
 * Deactivate subscription plan (soft delete)
 */
export async function deactivatePlan(planId: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', planId);

  if (error) throw error;
}

/**
 * Get plan pricing for a specific billing period
 */
export function calculatePlanPrice(
  basePrice: number,
  period: number
): { totalPrice: number; monthlyPrice: number; discount: number } {
  let discountPercent = 0;
  
  // Apply discounts for longer periods
  if (period === 3) {
    discountPercent = 5; // 5% off for quarterly
  } else if (period === 6) {
    discountPercent = 10; // 10% off for semiannual
  } else if (period === 12) {
    discountPercent = 15; // 15% off for annual
  }

  const monthlyPrice = basePrice;
  const totalWithoutDiscount = basePrice * period;
  const discount = (totalWithoutDiscount * discountPercent) / 100;
  const totalPrice = totalWithoutDiscount - discount;

  return {
    totalPrice: Math.round(totalPrice * 100) / 100,
    monthlyPrice,
    discount: Math.round(discount * 100) / 100
  };
}

/**
 * Get recommended plan based on clinic size
 */
export async function getRecommendedPlan(
  professionalsCount: number,
  patientsCount: number
): Promise<SubscriptionPlan | null> {
  const plans = await getAllActivePlans();
  
  // Find the smallest plan that fits the requirements
  const suitablePlans = plans.filter(plan => {
    const maxProf = plan.maxProfessionals || Infinity;
    const maxPat = plan.maxPatients || Infinity;
    return professionalsCount <= maxProf && patientsCount <= maxPat;
  });

  if (suitablePlans.length === 0) return null;

  // Return the cheapest suitable plan
  return suitablePlans.sort((a, b) => a.price - b.price)[0];
}
