# ============================================
# DEPLOY DAS EDGE FUNCTIONS COM --no-verify-jwt
# PhysioFlow Plus - Sistema de Pagamento
# ============================================

Write-Host "🚀 Iniciando deploy das Edge Functions..." -ForegroundColor Cyan
Write-Host ""

# Verificar se Supabase CLI está instalado
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseInstalled) {
    Write-Host "❌ Supabase CLI não encontrado!" -ForegroundColor Red
    Write-Host "Instale com: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Supabase CLI encontrado" -ForegroundColor Green
Write-Host ""

# Fazer login (se necessário)
Write-Host "🔐 Verificando autenticação..." -ForegroundColor Cyan
supabase login

Write-Host ""
Write-Host "📦 Fazendo deploy das funções..." -ForegroundColor Cyan
Write-Host ""

# Deploy create-asaas-customer
Write-Host "1️⃣ Deploying create-asaas-customer..." -ForegroundColor Yellow
supabase functions deploy create-asaas-customer --no-verify-jwt

# Deploy create-asaas-payment
Write-Host ""
Write-Host "2️⃣ Deploying create-asaas-payment..." -ForegroundColor Yellow
supabase functions deploy create-asaas-payment --no-verify-jwt

# Deploy asaas-webhook
Write-Host ""
Write-Host "3️⃣ Deploying asaas-webhook..." -ForegroundColor Yellow
supabase functions deploy asaas-webhook --no-verify-jwt

# Deploy get-payment-status
Write-Host ""
Write-Host "4️⃣ Deploying get-payment-status..." -ForegroundColor Yellow
supabase functions deploy get-payment-status --no-verify-jwt

# Deploy process-monthly-installments
Write-Host ""
Write-Host "5️⃣ Deploying process-monthly-installments..." -ForegroundColor Yellow
supabase functions deploy process-monthly-installments --no-verify-jwt

Write-Host ""
Write-Host "✅ Deploy concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "⚙️  IMPORTANTE: Configurar variáveis de ambiente" -ForegroundColor Yellow
Write-Host "Acesse: https://supabase.com/dashboard/project/[PROJECT_ID]/settings/functions" -ForegroundColor Cyan
Write-Host ""
Write-Host "Adicione os seguintes secrets:" -ForegroundColor White
Write-Host "  - ASAAS_API_KEY=<sua_api_key>" -ForegroundColor Gray
Write-Host "  - ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Aguarde 2-3 minutos para as funções recarregarem" -ForegroundColor Green
Write-Host ""
