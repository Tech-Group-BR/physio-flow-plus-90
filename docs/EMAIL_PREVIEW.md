# 📧 Preview do Email de Convite

Este é o email que os usuários receberão quando forem convidados:

---

## 📱 Visualização do Email

### Header (Gradiente Roxo)
```
🎉 Você foi convidado!
```

### Corpo do Email

> Olá! 👋
>
> **Dr. João Silva** convidou você para fazer parte da equipe da clínica **Clínica FisioLife** no **PhysioFlow Plus**.

---

### Box de Cargo (Destaque)
```
┌─────────────────────────┐
│ SEU CARGO               │
│ Profissional           │
└─────────────────────────┘
```

---

### Mensagem Personalizada (Se houver)
```
┌────────────────────────────────────┐
│ Mensagem de Dr. João Silva        │
│                                    │
│ "Bem-vindo à equipe! Estamos      │
│  muito felizes em ter você         │
│  conosco. Vamos fazer um           │
│  trabalho incrível juntos!"        │
└────────────────────────────────────┘
```

---

### Texto Principal

> Para aceitar o convite e configurar sua conta, clique no botão abaixo:

### Botão CTA (Call to Action)
```
┌─────────────────────────┐
│  ✨ Aceitar Convite     │
└─────────────────────────┘
```

### Link Alternativo

> Ou copie e cole este link no seu navegador:
> `https://physioflowplus.com/accept-invite/abc123token`

---

### ⚠️ Aviso de Expiração
```
⏰ Atenção: Este convite expira em 6 de outubro de 2025
```

---

## 🎨 Características do Design

✅ **Responsivo** - Funciona em desktop, tablet e mobile  
✅ **Dark Mode Compatible** - Cores otimizadas  
✅ **Email-Safe HTML** - Compatível com todos os clientes de email  
✅ **Acessível** - Usa tags semânticas e alt texts  
✅ **Gradientes modernos** - Visual profissional  
✅ **Ícones Unicode** - Sem dependências de imagens  

## 🎯 Elementos Personalizáveis

### No Código (Edge Function)

1. **Cores do Gradiente** (linhas 87 e 194)
   ```typescript
   background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
   ```

2. **Texto do Botão** (linha 175)
   ```html
   ✨ Aceitar Convite
   ```

3. **Nome do Sistema** (linha 208)
   ```html
   PhysioFlow Plus
   ```

4. **Rodapé** (linha 209)
   ```html
   Sistema de Gestão para Clínicas de Fisioterapia
   ```

### No Formulário (Frontend)

1. **Mensagem Personalizada**
   - Admin pode escrever mensagem customizada
   - Aparece no email como citação estilizada

2. **Cargo/Função**
   - Traduzido automaticamente:
     - `admin` → Administrador
     - `professional` → Profissional
     - `receptionist` → Secretária

## 📊 Métricas de Email

O Resend fornece automaticamente:

- ✅ **Taxa de entrega** (Delivered)
- ✅ **Taxa de abertura** (Opens)
- ✅ **Taxa de clique** (Clicks)
- ✅ **Bounces** (Emails rejeitados)
- ✅ **Spam reports** (Marcações de spam)

Acesse em: [resend.com/emails](https://resend.com/emails)

## 🧪 Como Testar Localmente

### Opção 1: Email real (recomendado)

1. Configure Resend conforme `EMAIL_INVITATION_SETUP.md`
2. Crie um convite no sistema
3. Verifique o email na caixa de entrada

### Opção 2: Preview HTML

1. Copie o HTML da função `getEmailTemplate()` 
2. Salve em um arquivo `preview.html`
3. Abra no navegador

### Opção 3: Ferramenta Online

Use [HTML Email Check](https://www.htmlemailcheck.com/check/) para:
- Preview em diferentes clientes de email
- Validação de código HTML
- Testes de renderização

## 🔗 Links Úteis

- [Resend Email Testing](https://resend.com/docs/send-with-nodejs#testing)
- [Email Design Best Practices](https://www.campaignmonitor.com/resources/guides/email-marketing-best-practices/)
- [Can I Email](https://www.caniemail.com/) - Compatibilidade de CSS em emails

---

**💡 Dica:** Sempre envie um email de teste para você mesmo antes de convidar usuários reais!
