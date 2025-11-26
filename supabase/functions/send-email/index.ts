import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.13";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, text } = await req.json();

    // Configurar transporter com Brevo (100% GRATUITO - 300 emails/dia)
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: Deno.env.get('BREVO_SMTP_LOGIN'), // Seu email do Brevo
        pass: Deno.env.get('BREVO_SMTP_KEY'), // SMTP Key do Brevo
      },
    });

    // Enviar email
    const info = await transporter.sendMail({
      from: `"Sua Clínica" <noreply@seudominio.com>`, // Mude para seu email
      to,
      subject,
      text,
      html,
    });

    console.log('Email enviado:', info.messageId);

    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
