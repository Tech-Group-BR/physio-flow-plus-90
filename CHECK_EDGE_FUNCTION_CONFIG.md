# 🔍 VERIFICAR CONFIGURAÇÃO DAS EDGE FUNCTIONS

## **PROBLEMA IDENTIFICADO**

O erro `400 Bad Request` indica que a edge function `create-asaas-customer` está rejeitando a requisição.

### **Causa mais provável: ASAAS_API_KEY não configurada**

## ✅ **COMO VERIFICAR E CORRIGIR**

### **1. Acessar o Dashboard do Supabase:**
```
https://supabase.com/dashboard/project/vqkooseljxkelclexipo
```

### **2. Ir em Settings > Edge Functions > Secrets**

Ou diretamente:
```
https://supabase.com/dashboard/project/vqkooseljxkelclexipo/settings/functions
```

### **3. Verificar se existem as seguintes variáveis:**

#### **Obrigatórias:**
```bash
ASAAS_API_KEY=<sua_api_key_do_asaas>
SUPABASE_URL=<sua_url_do_supabase>
SUPABASE_SERVICE_ROLE_KEY=<sua_service_role_key>
```

#### **Opcionais (mas recomendadas):**
```bash
ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3
```

### **4. Obter ASAAS_API_KEY:**

1. Acesse: https://sandbox.asaas.com/
2. Faça login ou crie uma conta
3. Vá em: **Integrações > API Key**
4. Copie sua API Key (ou gere uma nova)
5. Cole no Supabase Secrets

### **5. Adicionar as variáveis no Supabase:**

No dashboard do Supabase:
- Clique em **"Add new secret"**
- Nome: `ASAAS_API_KEY`
- Valor: Cole sua API key do Asaas
- Salve

**⚠️ IMPORTANTE:** Depois de adicionar/editar secrets, pode levar alguns minutos para as edge functions recarregarem.

## 🧪 **TESTAR SE FUNCIONOU**

Após configurar, teste novamente o pagamento. Agora você deve ver uma mensagem de erro ESPECÍFICA do Asaas caso algo esteja errado (ao invés de erro genérico).

### **Possíveis mensagens de erro do Asaas:**

1. **"Invalid API Key"** → API Key incorreta ou não configurada
2. **"Customer already exists"** → Cliente já cadastrado (OK, vai usar o existente)
3. **"Invalid CPF"** → CPF inválido
4. **"Missing required field"** → Falta algum campo obrigatório

## 📝 **LOGS MELHORADOS**

Com as correções aplicadas, agora você verá no console:

```javascript
❌ Body do erro: { error: "...", details: {...} }
❌ Detalhes do Asaas: {...}
```

Isso vai mostrar EXATAMENTE o que o Asaas está reclamando.

## 🚀 **PRÓXIMOS PASSOS**

1. ✅ Configure ASAAS_API_KEY no Supabase
2. ✅ Aguarde 2-3 minutos para recarregar
3. ✅ Teste novamente o pagamento
4. ✅ Veja a mensagem de erro específica (se ainda houver)
5. ✅ Me envie os logs para análise

---

## 📋 **CHECKLIST DE CONFIGURAÇÃO**

- [ ] ASAAS_API_KEY configurada no Supabase Secrets
- [ ] ASAAS_BASE_URL configurada (opcional)
- [ ] Aguardei 2-3 minutos após configurar
- [ ] Limpei cache do navegador (F5 ou Ctrl+Shift+R)
- [ ] Testei novamente
- [ ] Verifiquei console do browser para ver erro específico
