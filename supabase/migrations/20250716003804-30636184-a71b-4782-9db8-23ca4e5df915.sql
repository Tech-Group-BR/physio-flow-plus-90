-- Atualizar template de confirmação para incluir opção de cancelamento
UPDATE whatsapp_settings 
SET confirmation_template = 'Olá {nome}! Você tem consulta marcada para {data} às {horario} com {fisioterapeuta}. 

📝 Para confirmar sua presença:
✅ Responda SIM para CONFIRMAR
❌ Responda NÃO para CANCELAR

Aguardamos sua resposta!'
WHERE is_active = true;