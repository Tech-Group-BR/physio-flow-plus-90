/**
 * Subscriptions Service
 * 
 * Service for managing clinic subscriptions
 * Handles subscription lifecycle: creation, updates, cancellation, plan changes
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Subscription = Database['public']['Tables']['subscriptions']['Row'];
type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert'];
type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update'];
type SubscriptionStatus = Database['public']['Enums']['subscription_status'];
type BillingPeriod = Database['public']['Enums']['billing_period'];

export interface SubscriptionData {
  id: string;
  clinicId: string;
  planId: string | null;
  customerId: string | null;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  nextBillingDate: string | null;
  canceledAt: string | null;
  currentPrice: number | null;
  originalValue: number | null;
  discountedValue: number | null;
  discountPercent: number | null;
  billingPeriod: BillingPeriod | null;
  billingCycle: string | null;
  asaasSubscriptionId: string | null;
  lastPaymentId: string | null;
  trialEndsAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// Transform DB to Frontend
export function dbToSubscription(db: Subscription): SubscriptionData {
  return {
    id: db.id,
    clinicId: db.clinic_id,
    planId: db.plan_id,
    customerId: db.customer_id,
    status: db.status,
    startDate: db.start_date,
    endDate: db.end_date,
    nextBillingDate: db.next_billing_date,
    canceledAt: db.canceled_at,
    currentPrice: db.current_price,
    originalValue: db.original_value,
    discountedValue: db.discounted_value,
    discountPercent: db.discount_percent,
    billingPeriod: db.billing_period,
    billingCycle: db.billing_cycle,
    asaasSubscriptionId: db.asaas_subscription_id,
    lastPaymentId: db.last_payment_id,
    trialEndsAt: db.trial_ends_at,
    createdAt: db.created_at,
    updatedAt: db.updated_at
  };
}

/**
 * Create new subscription for a clinic
 */
export async function createSubscription(data: {
  clinicId: string;
  planId: string;
  customerId: string;
  startDate: Date;
  billingPeriod: BillingPeriod;
  price: number;
  trialDays?: number;
}): Promise<SubscriptionData> {
  // Calculate dates
  const startDate = data.startDate.toISOString().split('T')[0];
  const trialEndsAt = data.trialDays 
    ? new Date(data.startDate.getTime() + data.trialDays * 24 * 60 * 60 * 1000)
    : null;

  const nextBillingDate = calculateNextBillingDate(data.startDate, data.billingPeriod);
  const endDate = new Date(data.startDate);
  
  // Set end date based on billing period
  if (data.billingPeriod === 'monthly') {
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (data.billingPeriod === 'quarterly') {
    endDate.setMonth(endDate.getMonth() + 3);
  } else if (data.billingPeriod === 'semiannual') {
    endDate.setMonth(endDate.getMonth() + 6);
  } else if (data.billingPeriod === 'annual') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  // Map billing period to Asaas cycle
  const billingCycle = mapBillingPeriodToCycle(data.billingPeriod);

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .insert({
      clinic_id: data.clinicId,
      plan_id: data.planId,
      customer_id: data.customerId,
      status: data.trialDays ? 'trialing' : 'pending_payment',
      start_date: startDate,
      end_date: endDate.toISOString().split('T')[0],
      next_billing_date: nextBillingDate,
      current_price: data.price,
      original_value: data.price,
      billing_period: data.billingPeriod,
      billing_cycle: billingCycle,
      trial_ends_at: trialEndsAt?.toISOString() || null
    })
    .select()
    .single();

  if (error) throw error;
  return dbToSubscription(subscription);
}

/**
 * Get subscription by clinic ID
 */
export async function getSubscriptionByClinicId(clinicId: string): Promise<SubscriptionData | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('clinic_id', clinicId)
    .eq('status', 'active')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows found
    throw error;
  }
  
  return dbToSubscription(data);
}

/**
 * Get subscription with plan and customer details
 */
export async function getSubscriptionDetails(subscriptionId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      products!subscriptions_plan_id_fkey(*),
      clients!subscriptions_customer_id_fkey(*)
    `)
    .eq('id', subscriptionId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update subscription status
 */
export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: SubscriptionStatus
): Promise<SubscriptionData> {
  const updates: SubscriptionUpdate = {
    status,
    updated_at: new Date().toISOString()
  };

  if (status === 'canceled') {
    updates.canceled_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .update(updates)
    .eq('id', subscriptionId)
    .select()
    .single();

  if (error) throw error;
  return dbToSubscription(data);
}

/**
 * Update subscription with Asaas subscription ID
 */
export async function linkAsaasSubscription(
  subscriptionId: string,
  asaasSubscriptionId: string
): Promise<void> {
  const { error } = await supabase
    .from('subscriptions')
    .update({ 
      asaas_subscription_id: asaasSubscriptionId,
      status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('id', subscriptionId);

  if (error) throw error;
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  reason?: string
): Promise<SubscriptionData> {
  // First, cancel any pending payments in Asaas
  const subscription = await getSubscriptionDetails(subscriptionId);
  
  if (subscription.asaas_subscription_id) {
    // TODO: Call Asaas API to cancel subscription
    console.log('Canceling Asaas subscription:', subscription.asaas_subscription_id);
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', subscriptionId)
    .select()
    .single();

  if (error) throw error;
  return dbToSubscription(data);
}

/**
 * Change subscription plan (upgrade/downgrade)
 */
export async function changeSubscriptionPlan(
  subscriptionId: string,
  newPlanId: string,
  newPrice: number,
  changeReason?: string,
  changedBy?: string
): Promise<SubscriptionData> {
  // Get current subscription
  const { data: currentSub, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .single();

  if (subError) throw subError;

  // Record plan change history
  if (currentSub.plan_id) {
    await supabase.from('plan_history').insert({
      subscription_id: subscriptionId,
      old_plan_id: currentSub.plan_id,
      new_plan_id: newPlanId,
      old_price: currentSub.current_price,
      new_price: newPrice,
      change_reason: changeReason,
      changed_by: changedBy
    });
  }

  // Update subscription
  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      plan_id: newPlanId,
      current_price: newPrice,
      updated_at: new Date().toISOString()
    })
    .eq('id', subscriptionId)
    .select()
    .single();

  if (error) throw error;
  return dbToSubscription(data);
}

/**
 * Update next billing date
 */
export async function updateNextBillingDate(
  subscriptionId: string,
  nextBillingDate: string
): Promise<void> {
  const { error } = await supabase
    .from('subscriptions')
    .update({ 
      next_billing_date: nextBillingDate,
      updated_at: new Date().toISOString()
    })
    .eq('id', subscriptionId);

  if (error) throw error;
}

/**
 * Get subscriptions that need renewal today
 */
export async function getSubscriptionsDueForRenewal(): Promise<SubscriptionData[]> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('status', 'active')
    .eq('next_billing_date', today);

  if (error) throw error;
  return data.map(dbToSubscription);
}

/**
 * Get subscription payment history
 */
export async function getSubscriptionPayments(subscriptionId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .or(`subscription_id.eq.${subscriptionId},asaas_subscription_id.eq.(SELECT asaas_subscription_id FROM subscriptions WHERE id = '${subscriptionId}')`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// ============================================
// Helper Functions
// ============================================

function calculateNextBillingDate(startDate: Date, billingPeriod: BillingPeriod): string {
  const nextDate = new Date(startDate);
  
  if (billingPeriod === 'monthly') {
    nextDate.setMonth(nextDate.getMonth() + 1);
  } else if (billingPeriod === 'quarterly') {
    nextDate.setMonth(nextDate.getMonth() + 3);
  } else if (billingPeriod === 'semiannual') {
    nextDate.setMonth(nextDate.getMonth() + 6);
  } else if (billingPeriod === 'annual') {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  }

  return nextDate.toISOString().split('T')[0];
}

function mapBillingPeriodToCycle(billingPeriod: BillingPeriod): string {
  const map: Record<BillingPeriod, string> = {
    monthly: 'MONTHLY',
    quarterly: 'QUARTERLY',
    semiannual: 'SEMIANNUALLY',
    annual: 'YEARLY'
  };
  return map[billingPeriod];
}

/**
 * Check if subscription is expired
 */
export function isSubscriptionExpired(subscription: SubscriptionData): boolean {
  const now = new Date();
  const endDate = new Date(subscription.endDate);
  return now > endDate && subscription.status !== 'canceled';
}

/**
 * Check if subscription is in trial period
 */
export function isInTrialPeriod(subscription: SubscriptionData): boolean {
  if (!subscription.trialEndsAt) return false;
  const now = new Date();
  const trialEnd = new Date(subscription.trialEndsAt);
  return now < trialEnd && subscription.status === 'trialing';
}

/**
 * Get days remaining in subscription
 */
export function getDaysRemaining(subscription: SubscriptionData): number {
  const now = new Date();
  const endDate = new Date(subscription.endDate);
  const diff = endDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
