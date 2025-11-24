import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Process Renewals Edge Function
 * 
 * Cron job function that runs daily to process subscription renewals
 * Checks for subscriptions due for renewal and creates new payments
 * 
 * Schedule: Run daily at 6 AM
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
    const asaasBaseUrl = Deno.env.get('ASAAS_BASE_URL') || 'https://sandbox.asaas.com/api/v3';

    if (!asaasApiKey) {
      throw new Error('ASAAS_API_KEY not configured');
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`[RENEWALS] Processing renewals for ${today}`);

    // Get subscriptions that need renewal today
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        products!subscriptions_plan_id_fkey(*),
        clients!subscriptions_customer_id_fkey(*)
      `)
      .eq('status', 'active')
      .eq('next_billing_date', today);

    if (subError) {
      console.error('[RENEWALS ERROR] Error fetching subscriptions:', subError);
      throw subError;
    }

    console.log(`[RENEWALS] Found ${subscriptions?.length || 0} subscriptions to renew`);

    const results = {
      success: [],
      failed: [],
      total: subscriptions?.length || 0
    };

    // Process each subscription
    for (const subscription of subscriptions || []) {
      try {
        console.log(`[RENEWALS] Processing subscription ${subscription.id}`);

        // Skip if no customer or plan data
        if (!subscription.clients || !subscription.products) {
          console.error(`[RENEWALS ERROR] Missing customer or plan data for subscription ${subscription.id}`);
          results.failed.push({
            subscriptionId: subscription.id,
            error: 'Missing customer or plan data'
          });
          continue;
        }

        const customer = subscription.clients;
        const plan = subscription.products;

        // Determine billing type (prefer PIX for recurring payments)
        const billingType = 'BOLETO'; // Can be made configurable per customer

        // Create payment in Asaas
        const paymentPayload = {
          customer: customer.asaas_customer_id,
          billingType: billingType,
          value: subscription.current_price || plan.price,
          dueDate: today,
          description: `Renovação ${plan.name} - ${subscription.billing_period}`,
          externalReference: subscription.id
        };

        console.log('[RENEWALS] Creating payment in Asaas:', paymentPayload);

        const asaasResponse = await fetch(`${asaasBaseUrl}/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': asaasApiKey
          },
          body: JSON.stringify(paymentPayload)
        });

        if (!asaasResponse.ok) {
          const errorText = await asaasResponse.text();
          console.error('[RENEWALS ERROR] Asaas payment creation failed:', errorText);
          throw new Error(`Asaas API error: ${errorText}`);
        }

        const asaasPayment = await asaasResponse.json();
        console.log('[RENEWALS] Payment created in Asaas:', asaasPayment.id);

        // Save payment in local database
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            subscription_id: subscription.id,
            clinic_id: subscription.clinic_id,
            customer_id: subscription.customer_id,
            asaas_payment_id: asaasPayment.id,
            asaas_subscription_id: subscription.asaas_subscription_id,
            amount: asaasPayment.value,
            payment_method: billingType,
            status: 'PENDING',
            due_date: today,
            invoice_url: asaasPayment.invoiceUrl,
            bank_slip_url: asaasPayment.bankSlipUrl,
            description: paymentPayload.description,
            external_reference: subscription.id
          });

        if (paymentError) {
          console.error('[RENEWALS ERROR] Error saving payment to database:', paymentError);
          throw paymentError;
        }

        // Calculate next billing date
        const nextBillingDate = calculateNextBillingDate(
          new Date(subscription.next_billing_date),
          subscription.billing_period
        );

        console.log('[RENEWALS] Next billing date:', nextBillingDate);

        // Update subscription with next billing date
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            next_billing_date: nextBillingDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id);

        if (updateError) {
          console.error('[RENEWALS ERROR] Error updating subscription:', updateError);
          throw updateError;
        }

        console.log(`[RENEWALS SUCCESS] Subscription ${subscription.id} renewed successfully`);

        results.success.push({
          subscriptionId: subscription.id,
          paymentId: asaasPayment.id,
          nextBillingDate: nextBillingDate
        });

        // TODO: Send renewal notification email/SMS to customer
        // await sendRenewalNotification(subscription, asaasPayment);

      } catch (error: any) {
        console.error(`[RENEWALS ERROR] Failed to process subscription ${subscription.id}:`, error);
        
        results.failed.push({
          subscriptionId: subscription.id,
          error: error.message
        });

        // Log error in database (optional: create renewal_errors table)
        try {
          await supabase.from('payment_webhooks').insert({
            event_type: 'RENEWAL_ERROR',
            asaas_payment_id: null,
            raw_payload: {
              subscription_id: subscription.id,
              error: error.message,
              occurred_at: new Date().toISOString()
            },
            processed: true,
            error_message: error.message
          });
        } catch (logError) {
          console.error('[RENEWALS ERROR] Failed to log error:', logError);
        }
      }
    }

    console.log('[RENEWALS COMPLETE]', results);

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.total,
        successful: results.success.length,
        failed: results.failed.length,
        results: results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('[RENEWALS FATAL ERROR]', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// ============================================
// Helper Functions
// ============================================

function calculateNextBillingDate(currentDate: Date, billingPeriod: string): string {
  const nextDate = new Date(currentDate);
  
  switch (billingPeriod) {
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'semiannual':
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    case 'annual':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      nextDate.setMonth(nextDate.getMonth() + 1); // Default to monthly
  }

  return nextDate.toISOString().split('T')[0];
}
