# Deploy das Edge Functions de Automação WhatsApp
Write-Host "🚀 Iniciando deploy das Edge Functions de Automação WhatsApp..." -ForegroundColor Cyan

# Deploy send-reminder-messages
Write-Host "`n📤 Deployando send-reminder-messages..." -ForegroundColor Yellow
npx supabase functions deploy send-reminder-messages --no-verify-jwt
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ send-reminder-messages deployed com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro no deploy de send-reminder-messages" -ForegroundColor Red
    exit 1
}

# Deploy send-followup-messages
Write-Host "`n📤 Deployando send-followup-messages..." -ForegroundColor Yellow
npx supabase functions deploy send-followup-messages --no-verify-jwt
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ send-followup-messages deployed com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro no deploy de send-followup-messages" -ForegroundColor Red
    exit 1
}

# Deploy send-welcome-messages
Write-Host "`n📤 Deployando send-welcome-messages..." -ForegroundColor Yellow
npx supabase functions deploy send-welcome-messages --no-verify-jwt
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ send-welcome-messages deployed com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro no deploy de send-welcome-messages" -ForegroundColor Red
    exit 1
}

# Redeploy send-whatsapp-message atualizado
Write-Host "`n📤 Redeployando send-whatsapp-message..." -ForegroundColor Yellow
npx supabase functions deploy send-whatsapp-message --no-verify-jwt
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ send-whatsapp-message redeployed com sucesso!" -ForegroundColor Green
} else {
    Write-Host "❌ Erro no redeploy de send-whatsapp-message" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎉 Todas as funções foram deployed com sucesso!" -ForegroundColor Green
Write-Host "`nFunções disponíveis:" -ForegroundColor Cyan
Write-Host "  • send-reminder-messages - Envio de lembretes 2h antes" -ForegroundColor White
Write-Host "  • send-followup-messages - Follow-up pós-consulta" -ForegroundColor White
Write-Host "  • send-welcome-messages - Boas-vindas para novos pacientes" -ForegroundColor White
Write-Host "  • send-whatsapp-message - Envio geral (atualizado)" -ForegroundColor White
