// Edge Function para enviar emails de convite usando Resend
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface InvitationRequest {
  invitationId: string;
  customMessage?: string;
}

interface InvitationData {
  id: string;
  email: string;
  role: string;
  token: string;
  expires_at: string;
  clinic_id: string;
  invited_by: {
    full_name: string;
  };
  clinic: {
    name: string;
  };
}

// Template HTML do email
const getEmailTemplate = (
  invitedByName: string,
  clinicName: string,
  role: string,
  inviteLink: string,
  customMessage?: string,
  expiresAt?: string
): string => {
  const roleNames: Record<string, string> = {
    admin: "Administrador",
    professional: "Profissional",
    receptionist: "Secretária",
    secretary: "Secretária",
    guardian: "Responsável",
  };

  const roleName = roleNames[role] || role;
  const expirationDate = expiresAt
    ? new Date(expiresAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "7 dias";

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Convite - PhysioFlow Plus</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                🎉 Você foi convidado!
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                                Olá! 👋
                            </p>
                            
                            <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                                <strong>${invitedByName}</strong> convidou você para fazer parte da equipe da clínica 
                                <strong>${clinicName}</strong> no <strong>PhysioFlow Plus</strong>.
                            </p>
                            
                            <!-- Role Badge -->
                            <div style="background-color: #f0f0f0; border-left: 4px solid #667eea; padding: 15px 20px; margin: 25px 0; border-radius: 4px;">
                                <p style="margin: 0; color: #666666; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                    Seu cargo
                                </p>
                                <p style="margin: 5px 0 0; color: #333333; font-size: 18px; font-weight: 700;">
                                    ${roleName}
                                </p>
                            </div>
                            
                            ${
                              customMessage
                                ? `
                            <div style="background-color: #f9f9f9; padding: 20px; margin: 25px 0; border-radius: 8px; border: 1px solid #e0e0e0;">
                                <p style="margin: 0 0 10px; color: #666666; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                    Mensagem de ${invitedByName}
                                </p>
                                <p style="margin: 0; color: #333333; font-size: 15px; line-height: 1.6; font-style: italic;">
                                    "${customMessage}"
                                </p>
                            </div>
                            `
                                : ""
                            }
                            
                            <p style="margin: 25px 0 30px; color: #333333; font-size: 16px; line-height: 1.6;">
                                Para aceitar o convite e configurar sua conta, clique no botão abaixo:
                            </p>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center" style="padding: 0;">
                                        <a href="${inviteLink}" 
                                           style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                                            ✨ Aceitar Convite
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Alternative Link -->
                            <p style="margin: 30px 0 0; color: #999999; font-size: 13px; line-height: 1.6; text-align: center;">
                                Ou copie e cole este link no seu navegador:<br>
                                <a href="${inviteLink}" style="color: #667eea; text-decoration: none; word-break: break-all;">
                                    ${inviteLink}
                                </a>
                            </p>
                            
                            <!-- Expiration Warning -->
                            <div style="background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 15px 20px; margin: 30px 0 0; border-radius: 4px;">
                                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                                    ⏰ <strong>Atenção:</strong> Este convite expira em <strong>${expirationDate}</strong>
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9f9f9; padding: 30px; border-top: 1px solid #e0e0e0;">
                            <p style="margin: 0 0 15px; color: #666666; font-size: 14px; line-height: 1.6; text-align: center;">
                                <strong>PhysioFlow Plus</strong><br>
                                Sistema de Gestão para Clínicas de Fisioterapia
                            </p>
                            
                            <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.6; text-align: center;">
                                Este é um email automático, por favor não responda.<br>
                                Se você não esperava este convite, pode ignorar este email com segurança.
                            </p>
                            
                            <p style="margin: 20px 0 0; color: #cccccc; font-size: 11px; text-align: center;">
                                © ${new Date().getFullYear()} PhysioFlow Plus. Todos os direitos reservados.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
};

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verificar API key do Resend
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY não configurada");
    }

    const { invitationId, customMessage } = (await req.json()) as InvitationRequest;

    if (!invitationId) {
      return new Response(
        JSON.stringify({ error: "invitationId é obrigatório" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Criar cliente Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Buscar dados do convite
    const { data: invitation, error: inviteError } = await supabase
      .from("user_invitations")
      .select("*")
      .eq("id", invitationId)
      .single();

    if (inviteError || !invitation) {
      console.error("Erro ao buscar convite:", inviteError);
      throw new Error("Convite não encontrado");
    }

    // Buscar dados do usuário que convidou
    const { data: invitedByProfile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", invitation.invited_by)
      .single();

    if (profileError) {
      console.error("Erro ao buscar perfil:", profileError);
      throw new Error("Perfil do convite não encontrado");
    }

    // Buscar dados da clínica
    const { data: clinic, error: clinicError } = await supabase
      .from("clinic_settings")
      .select("name")
      .eq("id", invitation.clinic_id)
      .single();

    if (clinicError) {
      console.error("Erro ao buscar clínica:", clinicError);
      throw new Error("Clínica não encontrada");
    }

    // Gerar link do convite
    const inviteLink = `${req.headers.get("origin") || "https://seu-dominio.com"}/accept-invite/${invitation.token}`;

    // Preparar dados para o Resend
    const emailHtml = getEmailTemplate(
      invitedByProfile.full_name,
      clinic.name,
      invitation.role,
      inviteLink,
      customMessage,
      invitation.expires_at
    );

    // Enviar email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "PhysioFlow Plus <gustavoguimaraescamps@gmail.com>",
        to: [invitation.email],
        subject: `🎉 Convite para ${clinic.name} - PhysioFlow Plus`,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Erro ao enviar email:", resendData);
      throw new Error(resendData.message || "Erro ao enviar email");
    }

    console.log("✅ Email enviado com sucesso:", {
      to: invitation.email,
      emailId: resendData.id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        emailId: resendData.id,
        message: "Email enviado com sucesso",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro na Edge Function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
