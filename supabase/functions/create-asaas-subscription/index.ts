import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Função para criar uma assinatura (subscription) no Asaas
serve(async (req) => {
  try {
    const { customerId, value, billingType, nextDueDate, description, externalReference, callback, planId, clinicId, profileId, productId, asaasApiKey } = await req.json();

    if (!customerId || !value || !billingType || !nextDueDate || !asaasApiKey) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    // Criação da assinatura no Asaas
    const asaasRes = await fetch("https://www.sandbox.asaas.com/api/v3/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": asaasApiKey,
      },
      body: JSON.stringify({
        customer: customerId,
        value,
        billingType,
        nextDueDate,
        description,
        externalReference,
        callback,
        plan: planId,
      }),
    });

    const asaasData = await asaasRes.json();
    if (!asaasRes.ok) {
      return new Response(JSON.stringify({ error: asaasData }), { status: 400 });
    }

    // Salva a assinatura no banco de dados Supabase
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data, error } = await supabase.from("subscriptions").insert([
      {
        asaas_subscription_id: asaasData.id,
        customer_id: customerId,
        value,
        billing_type: billingType,
        next_due_date: nextDueDate,
        description,
        external_reference: externalReference,
        callback_url: callback,
        plan_id: planId,
        clinic_id: clinicId,
        profile_id: profileId,
        product_id: productId,
        status: asaasData.status,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      return new Response(JSON.stringify({ error }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, asaas: asaasData, db: data }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
