#!/bin/bash

# 🚀 Script de verificação de build para Vercel
# Execute este script antes do deploy para verificar se tudo está funcionando

echo "🔍 Verificando configuração de build..."

# 1. Verificar se as variáveis de ambiente estão configuradas
echo "📋 Verificando variáveis de ambiente..."
if [ -f ".env" ]; then
    echo "✅ Arquivo .env encontrado"
    if grep -q "VITE_SUPABASE_URL" .env; then
        echo "✅ VITE_SUPABASE_URL configurado"
    else
        echo "❌ VITE_SUPABASE_URL não encontrado"
    fi
    
    if grep -q "VITE_SUPABASE_PUBLISHABLE_KEY" .env; then
        echo "✅ VITE_SUPABASE_PUBLISHABLE_KEY configurado"
    else
        echo "❌ VITE_SUPABASE_PUBLISHABLE_KEY não encontrado"
    fi
else
    echo "❌ Arquivo .env não encontrado"
fi

# 2. Verificar dependências
echo "📦 Verificando dependências..."
if command -v npm >/dev/null 2>&1; then
    npm audit --audit-level high
    echo "✅ Dependências verificadas"
else
    echo "❌ NPM não encontrado"
fi

# 3. Executar build de teste
echo "🏗️ Executando build de teste..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build executado com sucesso"
    
    # Verificar se os arquivos foram gerados
    if [ -d "dist" ]; then
        echo "✅ Diretório dist criado"
        
        if [ -f "dist/index.html" ]; then
            echo "✅ index.html gerado"
        else
            echo "❌ index.html não encontrado em dist/"
        fi
        
        # Verificar tamanho dos arquivos
        echo "📊 Tamanhos dos arquivos:"
        du -sh dist/*
    else
        echo "❌ Diretório dist não criado"
    fi
else
    echo "❌ Build falhou"
fi

# 4. Verificar configuração do Vercel
echo "🔧 Verificando vercel.json..."
if [ -f "vercel.json" ]; then
    echo "✅ vercel.json encontrado"
    
    # Verificar se tem rewrites para SPA
    if grep -q "destination.*index.html" vercel.json; then
        echo "✅ Rewrites para SPA configurados"
    else
        echo "❌ Rewrites para SPA não encontrados"
    fi
else
    echo "❌ vercel.json não encontrado"
fi

echo ""
echo "🎉 Verificação concluída!"
echo "📝 Para deploy no Vercel:"
echo "   1. Configure as variáveis de ambiente no painel do Vercel"
echo "   2. Conecte o repositório GitHub"
echo "   3. O deploy será automático em cada push"