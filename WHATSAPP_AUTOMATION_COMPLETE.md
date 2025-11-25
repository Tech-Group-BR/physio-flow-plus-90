# Sistema de Automação WhatsApp - Implementação Completa

## ✅ Funções Edge Criadas

### 1. **send-reminder-messages**
- **Rota**: `/functions/v1/send-reminder-messages`
- **Função**: Envia lembretes X horas antes da consulta
- **Configuração**: `reminder_enabled`, `reminder_hours_before`, `reminder_template`
- **Status**: Busca agendamentos **confirmados** para hoje/amanhã
- **Template**: Usa `reminder_template` do whatsapp_settings

### 2. **send-followup-messages**
- **Rota**: `/functions/v1/send-followup-messages`
- **Função**: Envia follow-up pós-consulta
- **Configuração**: `followup_enabled`, `followup_hours_after`, `followup_template`
- **Status**: Busca agendamentos **concluídos** ontem
- **Template**: Usa `followup_template` do whatsapp_settings

### 3. **send-welcome-messages**
- **Rota**: `/functions/v1/send-welcome-messages`
- **Função**: Envia boas-vindas para novos pacientes
- **Configuração**: `welcome_enabled`, `welcome_template`
- **Critério**: Pacientes criados nas últimas 24h que ainda não receberam boas-vindas
- **Template**: Usa `welcome_template` do whatsapp_settings

### 4. **send-whatsapp-message** (Atualizado)
- **Rota**: `/functions/v1/send-whatsapp-message`
- **Função**: Envio geral de mensagens
- **Atualização**: Agora suporta `messageType: 'reminder'` além de 'confirmation'
- **Templates**: Usa templates corretos baseado no tipo

## 🎯 Interface WhatsAppAutomation.tsx

### Switches de Automação
- ✅ **Confirmação 24h antes** - `auto_confirm_enabled` (já existia)
- ✅ **Lembrete 2h antes** - `reminder_enabled`
- ✅ **Follow-up pós consulta** - `followup_enabled`
- ✅ **Boas-vindas novos pacientes** - `welcome_enabled`

### Botões de Execução Manual
- ✅ **Enviar Confirmações** - Chama `auto-send-confirmations`
- ✅ **Enviar Lembretes** - Chama `send-reminder-messages`
- ✅ **Enviar Follow-ups** - Chama `send-followup-messages`
- ✅ **Enviar Boas-vindas** - Chama `send-welcome-messages`

## 📋 Configurações no whatsapp_settings

```sql
-- Campos utilizados pelas automações
reminder_enabled: boolean
reminder_hours_before: number (ex: 2)
reminder_template: text

followup_enabled: boolean
followup_hours_after: number (ex: 24)
followup_template: text

welcome_enabled: boolean
welcome_template: text

confirmation_template: text
confirmation_hours_before: number (ex: 24)
auto_confirm_enabled: boolean
```

## 🔄 Fluxo de Automação

### 1. Confirmações (24h antes)
```
Agendamentos de AMANHÃ
Status: 'marcado'
Campo: confirmation_sent_at IS NULL
→ Envia confirmação
→ Marca confirmation_sent_at
```

### 2. Lembretes (2h antes)
```
Agendamentos de HOJE
Status: 'confirmado'
Campo: reminder_sent_at IS NULL
→ Envia lembrete
→ Marca reminder_sent_at
```

### 3. Follow-up (24h depois)
```
Agendamentos de ONTEM
Status: 'concluido'
Campo: followup_sent_at IS NULL
→ Envia follow-up
→ Marca followup_sent_at
```

### 4. Boas-vindas
```
Pacientes novos (últimas 24h)
Campo: welcome_sent_at IS NULL
→ Envia boas-vindas
→ Marca welcome_sent_at
```

## 🚀 Deploy

Execute o script PowerShell:

```powershell
.\deploy-whatsapp-automation.ps1
```

Ou manualmente:

```bash
npx supabase functions deploy send-reminder-messages --no-verify-jwt
npx supabase functions deploy send-followup-messages --no-verify-jwt
npx supabase functions deploy send-welcome-messages --no-verify-jwt
npx supabase functions deploy send-whatsapp-message --no-verify-jwt
```

## ✨ Variáveis Disponíveis nos Templates

Todos os templates suportam:
- `{nome}` - Nome do paciente
- `{data}` - Data da consulta (DD/MM/YYYY)
- `{horario}` - Horário da consulta (HH:MM)
- `{title}` - "o Dr." ou "a Dra."
- `{fisioterapeuta}` - Nome do fisioterapeuta

## 📊 Logs

Todas as mensagens são registradas em `whatsapp_logs`:
- `message_type`: 'confirmation', 'reminder', 'followup', 'welcome'
- `status`: 'delivered', 'failed'
- `evolution_message_id`: ID da mensagem no WhatsApp
- `clinic_id`: ID da clínica

## 🔐 Multi-Tenant

Todas as funções respeitam o `clinic_id`:
- Busca configurações específicas de cada clínica
- Filtra pacientes/agendamentos por clínica
- Logs separados por clínica

## ⚠️ Importante

- ✅ **NÃO mexer** em `whatsapp-response-webhook` (confirmações funcionando)
- ✅ Usar templates do `whatsapp_settings` de cada clínica
- ✅ Verificar campos `*_sent_at` para evitar duplicatas
- ✅ Delay de 1s entre mensagens para evitar spam
- ✅ Evolution API com formatação de telefone brasileira
