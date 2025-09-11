-- Testar função process_whatsapp_confirmation com dados reais
SELECT public.process_whatsapp_confirmation(
  '66996525791', -- telefone do paciente (Paciente Exemplo)
  'SIM', -- resposta de confirmação
  'TEST_WEBHOOK_001' -- ID de mensagem do webhook
);