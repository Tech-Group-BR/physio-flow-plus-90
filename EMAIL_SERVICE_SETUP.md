# 📧 Configuração de Serviços de Email para Convites

## 🎯 **Visão Geral**

Para enviar convites por email no sistema de permissões, você precisa integrar um serviço de email. Aqui estão as melhores opções e como implementá-las.

## 🚀 **Serviços de Email Recomendados**

### **1. Resend (Recomendado - Mais Simples)**

**Vantagens:**
- ✅ Fácil integração
- ✅ API moderna e simples
- ✅ Suporte a templates
- ✅ Plano gratuito: 3.000 emails/mês

**Como configurar:**

```bash
# Instalar SDK
npm install resend
```

```typescript
// Criar Edge Function: supabase/functions/send-invite-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from 'npm:resend'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
  const { email, clinicName, inviterName, token } = await req.json()
  
  const inviteLink = `${Deno.env.get('SITE_URL')}/accept-invite/${token}`
  
  const { data, error } = await resend.emails.send({
    from: 'PhysioFlow <noreply@seudominio.com>',
    to: email,
    subject: `Convite para ${clinicName}`,
    html: `
      <h2>Você foi convidado para ${clinicName}</h2>
      <p>Olá! ${inviterName} convidou você para fazer parte da clínica ${clinicName}.</p>
      <a href="${inviteLink}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Aceitar Convite
      </a>
      <p>Este convite expira em 7 dias.</p>
    `
  })

  return new Response(JSON.stringify({ success: !error, data, error }))
})
```

### **2. SendGrid (Mais Robusto)**

**Vantagens:**
- ✅ Muito confiável
- ✅ Templates avançados
- ✅ Analytics detalhados
- ✅ Plano gratuito: 100 emails/dia

**Como configurar:**

```bash
npm install @sendgrid/mail
```

```typescript
// Edge Function
import sgMail from 'npm:@sendgrid/mail'

sgMail.setApiKey(Deno.env.get('SENDGRID_API_KEY'))

const msg = {
  to: email,
  from: 'noreply@seudominio.com',
  subject: `Convite para ${clinicName}`,
  templateId: 'd-xxxxxxxxxxxxx', // ID do template no SendGrid
  dynamicTemplateData: {
    clinicName,
    inviterName,
    inviteLink: `${Deno.env.get('SITE_URL')}/accept-invite/${token}`
  }
}

await sgMail.send(msg)
```

### **3. Nodemailer + Gmail/SMTP**

**Vantagens:**
- ✅ Gratuito com Gmail
- ✅ Controle total
- ✅ Funciona com qualquer SMTP

**Como configurar:**

```typescript
// Edge Function
import nodemailer from 'npm:nodemailer'

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: Deno.env.get('GMAIL_USER'),
    pass: Deno.env.get('GMAIL_APP_PASSWORD') // Use App Password, não senha normal
  }
})

const mailOptions = {
  from: Deno.env.get('GMAIL_USER'),
  to: email,
  subject: `Convite para ${clinicName}`,
  html: htmlTemplate
}

await transporter.sendMail(mailOptions)
```

## 🔧 **Implementação no Projeto**

### **Passo 1: Escolher Serviço e Configurar Variáveis**

No Supabase Dashboard → Settings → Environment Variables:

```bash
# Para Resend
RESEND_API_KEY=re_xxxxxxxxxx
SITE_URL=https://seuapp.vercel.app

# Para SendGrid  
SENDGRID_API_KEY=SG.xxxxxxxxxx
SITE_URL=https://seuapp.vercel.app

# Para Gmail
GMAIL_USER=seuemail@gmail.com
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx
SITE_URL=https://seuapp.vercel.app
```

### **Passo 2: Criar Edge Function**

```bash
# Criar função
supabase functions new send-invite-email
```

### **Passo 3: Modificar InviteUserForm.tsx**

```typescript
// Em InviteUserForm.tsx, substituir o console.log por:

const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-invite-email', {
  body: {
    email: data.email,
    clinicName: 'Sua Clínica', // Pegar do contexto
    inviterName: user?.full_name,
    token: invitation.token
  }
});

if (emailError) {
  console.warn('Erro ao enviar email:', emailError);
  toast.warning('Convite criado, mas email não foi enviado. Compartilhe o link manualmente.');
} else {
  toast.success(`Convite enviado para ${data.email}`);
}
```

## 📋 **Template de Email Sugerido**

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 PhysioFlow Plus</h1>
        </div>
        <div class="content">
            <h2>Você foi convidado!</h2>
            <p>Olá,</p>
            <p><strong>{{inviterName}}</strong> convidou você para fazer parte da clínica <strong>{{clinicName}}</strong>.</p>
            <p>Clique no botão abaixo para aceitar o convite:</p>
            <a href="{{inviteLink}}" class="button">🎯 Aceitar Convite</a>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p><small>{{inviteLink}}</small></p>
        </div>
        <div class="footer">
            <p>⏰ Este convite expira em 7 dias.</p>
            <p>Se você não solicitou este convite, pode ignorar este email.</p>
        </div>
    </div>
</body>
</html>
```

## 🎯 **Implementação Recomendada (Resend)**

### **1. Criar conta no Resend**
- Acesse [resend.com](https://resend.com)
- Crie conta gratuita
- Gere API Key
- Configure domínio (opcional)

### **2. Implementar Edge Function**

```typescript
// supabase/functions/send-invite-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { email, clinicName, inviterName, token } = await req.json()
    
    const inviteLink = `${Deno.env.get('SITE_URL')}/accept-invite/${token}`
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'PhysioFlow <noreply@resend.dev>', // Use seu domínio se configurado
        to: email,
        subject: `Convite para ${clinicName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #007bff; color: white; padding: 20px; text-align: center;">
              <h1>🏥 PhysioFlow Plus</h1>
            </div>
            <div style="padding: 20px;">
              <h2>Você foi convidado!</h2>
              <p>Olá,</p>
              <p><strong>${inviterName}</strong> convidou você para fazer parte da clínica <strong>${clinicName}</strong>.</p>
              <p>Clique no botão abaixo para aceitar o convite:</p>
              <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                🎯 Aceitar Convite
              </a>
              <p>Ou copie e cole este link no seu navegador:</p>
              <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 5px;">
                ${inviteLink}
              </p>
            </div>
            <div style="padding: 20px; text-align: center; color: #666; font-size: 14px;">
              <p>⏰ Este convite expira em 7 dias.</p>
              <p>Se você não solicitou este convite, pode ignorar este email.</p>
            </div>
          </div>
        `
      })
    })

    const result = await response.json()

    return new Response(
      JSON.stringify({ success: response.ok, data: result }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: response.ok ? 200 : 400
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
```

### **3. Deploy e Teste**

```bash
# Deploy da função
supabase functions deploy send-invite-email

# Configurar variáveis
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxx
supabase secrets set SITE_URL=https://seuapp.vercel.app
```

## ✅ **Resumo dos Próximos Passos**

1. **Escolha um serviço** (Resend recomendado para simplicidade)
2. **Crie conta e obtenha API Key**
3. **Implemente a Edge Function** com o código acima
4. **Configure as variáveis de ambiente**
5. **Modifique o InviteUserForm.tsx** para chamar a função
6. **Teste o sistema** enviando um convite

O sistema de convites já está 100% funcional, só precisa da integração de email para automação completa! 🚀