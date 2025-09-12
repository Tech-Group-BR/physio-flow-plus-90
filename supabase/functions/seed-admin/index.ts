import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase env vars" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { email = "admin@sistema.com", password = "123456789" } = await req.json().catch(() => ({
      email: "admin@sistema.com",
      password: "123456789",
    }));

    const metadata = {
      full_name: "Administrador do Sistema",
      role: "admin",
      phone: "(11) 99999-9999",
    } as const;

    // Verificar se já existe perfil com este email
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id, email, role")
      .eq("email", email)
      .maybeSingle();

    let action: "created" | "updated" = "created";
    let userId: string | undefined = existingProfile?.id;

    if (existingProfile?.id) {
      // Atualizar senha e metadata do usuário existente
      const { error: updateErr } = await admin.auth.admin.updateUserById(existingProfile.id, {
        password,
        email_confirm: true,
        user_metadata: metadata,
      });
      if (updateErr) throw updateErr;
      action = "updated";

      // Garantir papel admin no perfil
      await admin.from("profiles").update({ role: "admin", full_name: metadata.full_name }).eq("id", existingProfile.id);
      userId = existingProfile.id;
    } else {
      // Criar novo usuário confirmado
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: metadata,
      });
      if (createErr) throw createErr;
      userId = created.user?.id;

      // Criar perfil admin de forma idempotente
      if (userId) {
        await admin
          .from("profiles")
          .upsert({
            id: userId,
            email,
            full_name: metadata.full_name,
            role: "admin",
            phone: metadata.phone,
          }, { onConflict: "id" });
      }
    }

    return new Response(
      JSON.stringify({ success: true, action, userId, email }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("seed-admin error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
