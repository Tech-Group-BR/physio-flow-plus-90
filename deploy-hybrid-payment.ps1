# PhysioFlow Plus - Deploy Hybrid Payment System
# Este script aplica a migração do banco e faz deploy da edge function atualizada

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PhysioFlow Plus - Hybrid Payment" -ForegroundColor Cyan
Write-Host "  Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Apply database migration
Write-Host "[1/3] Aplicando migração do banco de dados..." -ForegroundColor Yellow
Write-Host "Adicionando colunas: installment_count, current_installment, is_installment_plan" -ForegroundColor Gray
npx supabase db push

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERRO ao aplicar migração!" -ForegroundColor Red
    Write-Host "Verifique a conexão com o Supabase e tente novamente." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Migração aplicada com sucesso!" -ForegroundColor Green
Write-Host ""

# Step 2: Deploy edge function
Write-Host "[2/3] Fazendo deploy da edge function create-asaas-payment..." -ForegroundColor Yellow
Write-Host "Com lógica híbrida: Annual = Payments API (12x), Quarterly/Semiannual = Subscriptions API" -ForegroundColor Gray
npx supabase functions deploy create-asaas-payment --no-verify-jwt

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERRO ao fazer deploy da função!" -ForegroundColor Red
    Write-Host "Verifique as credenciais do Supabase e tente novamente." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Edge function deployed com sucesso!" -ForegroundColor Green
Write-Host ""

# Step 3: Regenerate types (optional)
Write-Host "[3/3] Deseja regenerar os tipos do TypeScript? (S/N)" -ForegroundColor Yellow
$response = Read-Host

if ($response -eq "S" -or $response -eq "s") {
    Write-Host "Regenerando tipos..." -ForegroundColor Gray
    npx supabase gen types typescript --local > src/integrations/supabase/types.ts
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Aviso: Erro ao regenerar tipos (não crítico)" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Tipos regenerados com sucesso!" -ForegroundColor Green
    }
} else {
    Write-Host "⏭️  Pulando regeneração de tipos" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ DEPLOYMENT COMPLETO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Teste com plano QUARTERLY (deve usar Subscriptions API)" -ForegroundColor White
Write-Host "2. Teste com plano SEMIANNUAL (deve usar Subscriptions API)" -ForegroundColor White
Write-Host "3. Teste com plano ANNUAL (deve usar Payments API com 12 parcelas)" -ForegroundColor White
Write-Host ""
Write-Host "Verifique os logs com:" -ForegroundColor Yellow
Write-Host "npx supabase functions logs create-asaas-payment" -ForegroundColor Cyan
Write-Host ""
Write-Host "Documentação completa em: HYBRID_PAYMENT_COMPLETE.md" -ForegroundColor Gray
