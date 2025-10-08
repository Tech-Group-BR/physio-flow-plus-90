# 📧 Setup do Sistema de Convites por Email

Este guia explica como configurar o envio de emails de convite usando **Resend**.

## 📋 O que foi implementado

✅ **Edge Function** `send-invitation-email` que envia emails profissionais  
✅ **Template HTML** responsivo e bonito com design moderno  
✅ **Integração automática** no formulário de convite  
✅ **Tratamento de erros** com fallback para link manual  

---

## 🚀 Passo a Passo da Configuração

### 1️⃣ Criar conta no Resend

1. Acesse [resend.com](https://resend.com)
2. Crie uma conta gratuita (100 emails/dia grátis)
3. Confirme seu email

### 2️⃣ Obter API Key

1. No dashboard do Resend, vá em **API Keys**
2. Clique em **Create API Key**
3. Dê um nome: `PhysioFlow Production`
4. Copie a chave (começa com `re_...`)
5. **IMPORTANTE**: Guarde a chave em local seguro, ela só aparece uma vez!

### 3️⃣ Configurar Domínio (Opcional mas Recomendado)

Para melhor deliverability e marca profissional:

1. No Resend, vá em **Domains**
2. Clique em **Add Domain**
3. Digite seu domínio (ex: `physioflowplus.com`)
4. Configure os registros DNS conforme instruções do Resend:
   - SPF
   - DKIM
   - DMARC
5. Aguarde a verificação (pode levar até 48h)

**Sem domínio próprio?** Você pode usar o domínio padrão do Resend:
- O email será enviado como: `onboarding@resend.dev`
- Funciona perfeitamente para testes

### 4️⃣ Configurar Variáveis de Ambiente no Supabase

#### Via Dashboard (Recomendado):

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto **PhysioFlow Plus**
3. Vá em **Settings** > **Edge Functions**
4. Em **Secrets**, adicione:
   ```
   Nome: RESEND_API_KEY
   Valor: re_sua_api_key_aqui
   ```

#### Via CLI (Alternativa):

```bash
# No terminal, dentro da pasta do projeto
supabase secrets set RESEND_API_KEY=re_sua_api_key_aqui
```

### 5️⃣ Atualizar o "From" Email na Edge Function

Edite o arquivo `supabase/functions/send-invitation-email/index.ts`:

```typescript
// Linha ~223
from: "PhysioFlow Plus <convites@SEU-DOMINIO.com>", // 👈 Altere aqui
```

**Opções:**

- **Com domínio verificado**: `convites@physioflowplus.com`
- **Sem domínio próprio**: `onboarding@resend.dev` (padrão do Resend)

### 6️⃣ Deploy da Edge Function

```bash
# No terminal, dentro da pasta do projeto
supabase functions deploy send-invitation-email
```

Você verá:
```
✓ Deployed Function send-invitation-email
Function URL: https://[seu-projeto].supabase.co/functions/v1/send-invitation-email
```

### 7️⃣ Testar o Sistema

1. Acesse o sistema PhysioFlow Plus
2. Vá em **Configurações** > **Usuários e Permissões** > **Convidar**
3. Preencha o formulário:
   - Email: `seu-email@teste.com`
   - Cargo: `Profissional`
   - Mensagem personalizada: `Bem-vindo à equipe!`
4. Clique em **Enviar convite**
5. Verifique se o toast apareceu com sucesso
6. Cheque o email na caixa de entrada

---

## 🎨 Personalização do Template

O template de email está em `supabase/functions/send-invitation-email/index.ts`.

### Cores e Estilo

```typescript
// Linha ~87 - Gradiente do header
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

// Linha ~194 - Gradiente do botão
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Conteúdo

```typescript
// Linha ~127 - Título do email
<h1>🎉 Você foi convidado!</h1>

// Linha ~175 - Texto do botão
✨ Aceitar Convite

// Linha ~208 - Rodapé
<strong>PhysioFlow Plus</strong><br>
Sistema de Gestão para Clínicas de Fisioterapia
```

---

## 🔍 Troubleshooting

### ❌ Email não chegou

**Verificar:**
1. ✅ API Key configurada corretamente no Supabase
2. ✅ Edge Function deployada
3. ✅ Email não está na pasta de spam
4. ✅ Console do navegador não tem erros
5. ✅ Logs da Edge Function: `supabase functions logs send-invitation-email`

**Solução temporária:**
- Use o link manual que aparece no console do navegador
- Copie e envie manualmente por outro meio

### ❌ Erro "RESEND_API_KEY não configurada"

```bash
# Reconfigurar secret
supabase secrets set RESEND_API_KEY=re_sua_api_key_aqui

# Fazer deploy novamente
supabase functions deploy send-invitation-email
```

### ❌ Erro "Domain not verified"

Se você configurou um domínio próprio:
1. Verifique os registros DNS no seu provedor
2. Aguarde a propagação (pode levar 48h)
3. Temporariamente, use `onboarding@resend.dev`

### ❌ Email cai no spam

**Melhorias:**
1. ✅ Configure domínio próprio com SPF/DKIM/DMARC
2. ✅ Use email corporativo no "From"
3. ✅ Evite palavras spam no assunto
4. ✅ Peça aos usuários para marcar como "não é spam"

---

## 📊 Monitoramento

### Ver logs da Edge Function

```bash
supabase functions logs send-invitation-email --tail
```

### Dashboard do Resend

Acesse [resend.com/emails](https://resend.com/emails) para ver:
- ✅ Emails enviados
- ✅ Taxa de abertura
- ✅ Taxa de clique
- ✅ Bounces e erros

---

## 💰 Limites e Custos

### Plano Gratuito do Resend
- ✅ **100 emails/dia**
- ✅ **3.000 emails/mês**
- ✅ Perfeito para começar!

### Planos Pagos
- **Pro**: $20/mês → 50.000 emails/mês
- **Enterprise**: Custom → Volumes maiores

### Cálculo Estimado
- **5 convites/dia** = ~150/mês → **Gratuito ✅**
- **20 convites/dia** = ~600/mês → **Gratuito ✅**
- **100 convites/dia** = ~3.000/mês → **Gratuito ✅**
- **200 convites/dia** = ~6.000/mês → **Plano Pro necessário**

---

## 🔐 Segurança

✅ **API Key nunca exposta no frontend**  
✅ **Edge Function valida permissões**  
✅ **Tokens de convite com expiração**  
✅ **Links únicos e não reutilizáveis**  

---

## 🎯 Próximos Passos Sugeridos

### Implementações Futuras

1. **Reenviar convite**
   - Botão para reenviar email se não chegou
   
2. **Email de lembrete**
   - Enviar lembrete 2 dias antes de expirar
   
3. **Email de boas-vindas**
   - Após usuário aceitar convite
   
4. **Notificações por email**
   - Novos agendamentos
   - Confirmações de pacientes
   - Lembretes de consulta

5. **Template customizável**
   - Permitir admin personalizar o template
   - Adicionar logo da clínica
   - Customizar cores

---

## 📚 Recursos

- [Documentação do Resend](https://resend.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Template de Email HTML](https://github.com/leemunroe/responsive-html-email-template)

---

## ✅ Checklist de Verificação

Antes de usar em produção:

- [ ] API Key do Resend configurada
- [ ] Domínio verificado (opcional)
- [ ] Edge Function deployada
- [ ] Email de teste enviado com sucesso
- [ ] Template personalizado com cores da marca
- [ ] "From" email configurado corretamente
- [ ] Monitoramento configurado
- [ ] Documentação compartilhada com a equipe

---

**🎉 Pronto! Seu sistema de convites por email está funcionando!**

Em caso de dúvidas, consulte a documentação oficial ou abra uma issue no repositório.
