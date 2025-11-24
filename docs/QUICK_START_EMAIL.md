# 🚀 Quick Start - Deploy do Sistema de Emails

## Comandos Rápidos

### 1. Configurar API Key do Resend
```bash
# Obtenha sua API key em: https://resend.com/api-keys
supabase secrets set RESEND_API_KEY=re_sua_api_key_aqui
```

### 2. Deploy da Edge Function
```bash
supabase functions deploy send-invitation-email
```

### 3. Testar localmente (opcional)
```bash
# Terminal 1 - Iniciar Supabase local
supabase start

# Terminal 2 - Servir a função localmente
supabase functions serve send-invitation-email

# Terminal 3 - Testar com curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/send-invitation-email' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"invitationId":"uuid-do-convite-aqui","customMessage":"Bem-vindo!"}'
```

## ✅ Verificar se está funcionando

1. Acesse o sistema
2. Vá em **Configurações** > **Usuários** > **Convidar**
3. Preencha o formulário e envie
4. Verifique o email

## 🔍 Ver logs em tempo real

```bash
supabase functions logs send-invitation-email --tail
```

## 📝 Alterar o email "From"

Edite `supabase/functions/send-invitation-email/index.ts` na linha ~223:

```typescript
from: "PhysioFlow Plus <convites@SEU-DOMINIO.com>",
```

Depois faça deploy novamente:
```bash
supabase functions deploy send-invitation-email
```

---

**📖 Documentação completa:** Ver `EMAIL_INVITATION_SETUP.md`
