import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.13";

serve(async (req) => {
  try {
    console.log('🧪 Testando configuração SMTP...');

    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: 'gustavoguimaraescamps@gmail.com', // SEU EMAIL
        pass: Deno.env.get('BREVO_SMTP_KEY'), // SUA SMTP KEY
      },
      debug: true, // Ativa logs detalhados
      logger: true, // Mostra logs no console
    });

    // Verificar conexão
    await transporter.verify();
    console.log('✅ Conexão SMTP OK!');

    // Enviar email de teste
    const info = await transporter.sendMail({
      from: '"Fisio Tech" <gustavoguimaraescamps@gmail.com>',
      to: 'gustavoguimaraescamps@gmail.com', // Para você mesmo
      subject: '🧪 Teste SMTP Brevo',
      text: 'Se você recebeu este email, o SMTP está funcionando!',
      html: '<h1>✅ SMTP Funcionando!</h1><p>Configuração correta.</p>',
    });

    console.log('✅ Email enviado:', info.messageId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: info.messageId,
        message: 'Email enviado com sucesso! Verifique sua caixa de entrada.'
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
