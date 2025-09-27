# 🚀 Deploy no Vercel - PhysioFlow Plus

## 📋 Pré-requisitos

1. Conta no Vercel
2. Projeto conectado ao GitHub
3. Supabase configurado

## 🔧 Configuração de Variáveis de Ambiente no Vercel

No painel do Vercel, vá em **Settings > Environment Variables** e adicione:

```bash
# Supabase Configuration
VITE_SUPABASE_PROJECT_ID=vqkooseljxkelclexipo
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxa29vc2VsanhrZWxjbGV4aXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2OTA2MDAsImV4cCI6MjA3MzI2NjYwMH0.MiCNDtxPO4kF3s1nRapU9MCggBzSI3C6kh4eoVaWUMk
VITE_SUPABASE_URL=https://vqkooseljxkelclexipo.supabase.co
```

## 🛠️ Build Settings

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## 🌐 Domain Configuration

### Custom Domain (Opcional)
1. Vá em **Settings > Domains**
2. Adicione seu domínio personalizado
3. Configure DNS conforme instruções do Vercel

### Redirects e Rewrites
O arquivo `vercel.json` já está configurado para:
- ✅ SPA routing (todas as rotas apontam para `/index.html`)
- ✅ Cache otimizado para assets estáticos
- ✅ Headers de segurança
- ✅ Suporte a rotas dinâmicas

## 🔒 Segurança

### Headers Configurados:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- Cache-Control para assets

### Supabase Security:
- Row Level Security (RLS) habilitado
- Autenticação JWT
- Variáveis de ambiente protegidas

## 🚦 Deploy Process

1. **Commit & Push** para o repositório GitHub
2. **Auto Deploy** - Vercel detecta mudanças automaticamente
3. **Preview Deploys** - Para branches que não são main
4. **Production Deploy** - Branch main

## 🔧 Troubleshooting

### Problema: Páginas retornam 404
**Solução**: Verificar se `vercel.json` tem as rewrites corretas para SPA

### Problema: Variáveis de ambiente não funcionam
**Solução**: Garantir que começam com `VITE_` e estão no painel do Vercel

### Problema: Build falha
**Solução**: 
1. Verificar se todas as dependências estão no `package.json`
2. Rodar `npm run build` localmente primeiro
3. Verificar logs de build no Vercel

### Problema: Supabase não conecta
**Solução**:
1. Verificar URLs e keys no Vercel
2. Confirmar que RLS está configurado
3. Testar conexão local primeiro

## 📊 Performance Optimization

### Já Implementado:
- ✅ Vite build optimization
- ✅ Asset caching (1 year)
- ✅ Code splitting automático
- ✅ Tree shaking
- ✅ Compression (Vercel automático)

### Monitoramento:
- Vercel Analytics (opcional)
- Web Vitals tracking
- Error monitoring via Vercel

## 🔄 CI/CD Pipeline

```
GitHub Push → Vercel Build → Deploy
     ↓
Preview/Production URL
     ↓
Automatic HTTPS
     ↓
Global CDN
```

## 📱 Mobile & PWA Ready

O projeto está configurado para ser responsivo e pode ser facilmente convertido em PWA com:

1. Service Worker
2. Web App Manifest
3. Offline capabilities

## 🆘 Support Links

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)