# 🚀 Script de verificação de build para Vercel (Windows PowerShell)
# Execute: .\check-vercel-setup.ps1

Write-Host "🔍 Verificando configuração de build..." -ForegroundColor Cyan

# 1. Verificar se as variáveis de ambiente estão configuradas
Write-Host "📋 Verificando variáveis de ambiente..." -ForegroundColor Yellow

if (Test-Path ".env") {
    Write-Host "✅ Arquivo .env encontrado" -ForegroundColor Green
    
    $envContent = Get-Content ".env" -Raw
    
    if ($envContent -match "VITE_SUPABASE_URL") {
        Write-Host "✅ VITE_SUPABASE_URL configurado" -ForegroundColor Green
    } else {
        Write-Host "❌ VITE_SUPABASE_URL não encontrado" -ForegroundColor Red
    }
    
    if ($envContent -match "VITE_SUPABASE_PUBLISHABLE_KEY") {
        Write-Host "✅ VITE_SUPABASE_PUBLISHABLE_KEY configurado" -ForegroundColor Green
    } else {
        Write-Host "❌ VITE_SUPABASE_PUBLISHABLE_KEY não encontrado" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Arquivo .env não encontrado" -ForegroundColor Red
}

# 2. Verificar Node.js e NPM
Write-Host "📦 Verificando Node.js e NPM..." -ForegroundColor Yellow

try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
    
    $npmVersion = npm --version
    Write-Host "✅ NPM version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js ou NPM não encontrado" -ForegroundColor Red
}

# 3. Executar build de teste
Write-Host "🏗️ Executando build de teste..." -ForegroundColor Yellow

try {
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build executado com sucesso" -ForegroundColor Green
        
        # Verificar se os arquivos foram gerados
        if (Test-Path "dist") {
            Write-Host "✅ Diretório dist criado" -ForegroundColor Green
            
            if (Test-Path "dist/index.html") {
                Write-Host "✅ index.html gerado" -ForegroundColor Green
            } else {
                Write-Host "❌ index.html não encontrado em dist/" -ForegroundColor Red
            }
            
            # Mostrar arquivos gerados
            Write-Host "📊 Arquivos gerados:" -ForegroundColor Cyan
            Get-ChildItem "dist" -Recurse | Select-Object Name, Length | Format-Table
            
        } else {
            Write-Host "❌ Diretório dist não criado" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Build falhou" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro ao executar build: $_" -ForegroundColor Red
}

# 4. Verificar configuração do Vercel
Write-Host "🔧 Verificando vercel.json..." -ForegroundColor Yellow

if (Test-Path "vercel.json") {
    Write-Host "✅ vercel.json encontrado" -ForegroundColor Green
    
    $vercelConfig = Get-Content "vercel.json" -Raw
    
    if ($vercelConfig -match "index\.html") {
        Write-Host "✅ Rewrites para SPA configurados" -ForegroundColor Green
    } else {
        Write-Host "❌ Rewrites para SPA não encontrados" -ForegroundColor Red
    }
    
    if ($vercelConfig -match "buildCommand") {
        Write-Host "✅ Build command configurado" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Build command não especificado (usando padrão)" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ vercel.json não encontrado" -ForegroundColor Red
}

# 5. Verificar package.json
Write-Host "📋 Verificando package.json..." -ForegroundColor Yellow

if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    
    Write-Host "✅ Nome do projeto: $($packageJson.name)" -ForegroundColor Green
    Write-Host "✅ Versão: $($packageJson.version)" -ForegroundColor Green
    
    if ($packageJson.scripts.build) {
        Write-Host "✅ Script de build configurado: $($packageJson.scripts.build)" -ForegroundColor Green
    } else {
        Write-Host "❌ Script de build não encontrado" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 Verificação concluída!" -ForegroundColor Green
Write-Host "📝 Para deploy no Vercel:" -ForegroundColor Cyan
Write-Host "   1. Configure as variáveis de ambiente no painel do Vercel" -ForegroundColor White
Write-Host "   2. Conecte o repositório GitHub" -ForegroundColor White
Write-Host "   3. O deploy será automático em cada push" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Links úteis:" -ForegroundColor Cyan
Write-Host "   • Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "   • Documentação: https://vercel.com/docs" -ForegroundColor White