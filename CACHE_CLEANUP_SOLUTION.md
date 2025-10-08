# Solução: Problemas de Cache ao Trocar de Conta

## 🐛 Problema Identificado

Ao alternar entre contas diferentes (fazer logout e login em outra clínica), o aplicativo apresentava comportamento inconsistente devido a dados "fantasmas" em cache:

### Sintomas
- Dados da clínica anterior aparecendo na nova sessão
- Interface bugada após trocar de conta
- Necessidade de limpar cache do navegador manualmente
- Estados inconsistentes entre componentes

### Causa Raiz
O sistema tinha **múltiplos caches** que não eram totalmente limpos no logout:

1. **GlobalCache** (memória RAM) - `src/lib/globalCache.ts`
   - Cache em memória de pacientes, profissionais, agendamentos
   - Associado a `clinicId` mas não invalidado na troca de conta

2. **PersistentCache** (localStorage) - `src/lib/persistentCache.ts`
   - Dados críticos: `clinic_id`, `user_id`, informações da clínica
   - Expiração de 24 horas mas não limpo no logout

3. **LocalStorage direto**
   - Tokens do Supabase (`supabase.auth.token`)
   - Dados do signup (`signup_success`, `signup_success_data`)
   - Convites pendentes (`pendingInvitation`)
   - Auth data (`auth_user_data`)

4. **SessionStorage**
   - Tokens de sessão temporários

## ✅ Solução Implementada

### 1. Sistema Centralizado de Limpeza (`src/utils/cacheCleanup.ts`)

Criamos uma função única que limpa **TUDO**:

```typescript
clearAllCaches() {
  // Limpa:
  - GlobalCache (memória)
  - PersistentCache (localStorage)
  - Dados do app no localStorage
  - Todos os tokens do Supabase
  - SessionStorage completo
}
```

### 2. Atualização do AuthContext

**Antes:**
```typescript
signOut() {
  cleanupAuthState();    // Apenas tokens
  globalCache.clear();   // Apenas memória
  // PersistentCache não era limpo ❌
}
```

**Depois:**
```typescript
signOut() {
  clearAllCaches();  // Limpa TUDO de uma vez ✅
}
```

### 3. Detecção de Mudança de Clínica no ClinicContext

Adicionamos detecção automática de troca de clínica:

```typescript
useEffect(() => {
  // Detecta se clinicId mudou
  if (clinicId && lastClinicId.current && clinicId !== lastClinicId.current) {
    console.log('🔄 MUDANÇA DE CLÍNICA DETECTADA');
    
    // Reset TODOS os estados
    setPatients([]);
    setProfessionals([]);
    // ... todos os outros estados
    
    // Limpa cache da clínica anterior
    globalCache.invalidateClinic(lastClinicId.current);
    
    // Força recarga dos dados
    isInitialized.current = false;
  }
}, [clinicId]);
```

### 4. Comandos de Debug (`src/utils/debugCommands.ts`)

Para facilitar investigação de problemas, expusemos funções no console:

```javascript
// No console do navegador:

// Ver estado atual de todos os caches
window.debugPhysioFlow.checkCache()

// Limpar tudo manualmente (sem fazer logout)
window.debugPhysioFlow.clearAll()

// Limpar cache de uma clínica específica
window.debugPhysioFlow.clearClinic('clinic-id-here')

// Ver dados em memória
window.debugPhysioFlow.globalCache()

// Ver dados no localStorage
window.debugPhysioFlow.persistentCache()

// Ajuda
window.debugPhysioFlow.help()
```

## 🔧 Como Testar

### Cenário 1: Logout Normal
1. Faça login na Clínica A
2. Navegue pelo sistema
3. Faça logout
4. Abra DevTools → Console
5. Digite: `window.debugPhysioFlow.checkCache()`
6. Deve retornar cache vazio ✅

### Cenário 2: Troca de Conta
1. Faça login na Clínica A
2. Abra DevTools → Console
3. Digite: `window.debugPhysioFlow.checkCache()`
4. Anote o `clinicId` atual
5. Faça logout
6. Faça login na Clínica B (diferente)
7. Digite: `window.debugPhysioFlow.checkCache()` novamente
8. O `clinicId` deve ser diferente e não deve ter dados da Clínica A ✅

### Cenário 3: Forçar Limpeza Manual
Se ainda ver bugs mesmo após logout:
```javascript
// No console:
window.debugPhysioFlow.clearAll()
// Recarregar página
location.reload()
```

## 📋 Arquivos Modificados

### Novos Arquivos
1. **src/utils/cacheCleanup.ts** - Sistema centralizado de limpeza
2. **src/utils/debugCommands.ts** - Comandos de debug no console

### Arquivos Atualizados
1. **src/contexts/AuthContext.tsx**
   - Importa `clearAllCaches()`
   - Usa em `signOut()` e `forceReauth()`

2. **src/contexts/ClinicContext.tsx**
   - Adiciona `lastClinicId` ref
   - Detecta mudança de clínica
   - Reseta estados automaticamente

3. **src/App.tsx**
   - Importa comandos de debug

## 🎯 Benefícios

1. **Sem Bugs de Cache**: Logout sempre limpa tudo completamente
2. **Troca de Conta Segura**: Sistema detecta e limpa dados da conta anterior
3. **Debug Facilitado**: Comandos no console para investigar problemas
4. **Código Centralizado**: Uma única função `clearAllCaches()` ao invés de múltiplas chamadas
5. **Manutenibilidade**: Fácil adicionar novos tipos de cache no futuro

## 🚨 Importante

### Para Usuários
- **Não é mais necessário** limpar cache do navegador manualmente
- Logout agora limpa tudo automaticamente
- Troca de conta é totalmente segura

### Para Desenvolvedores
- **Sempre use** `clearAllCaches()` ao adicionar novos caches
- **Teste** com os comandos de debug antes de fazer deploy
- **Nunca** armazene dados sensíveis no cache sem criptografia

## 📖 Referências Técnicas

### Fluxo de Limpeza no Logout
```
1. Usuario clica "Sair"
2. AuthContext.signOut() é chamado
3. clearAllCaches() executa:
   3.1. globalCache.clear() → limpa memória RAM
   3.2. PersistentCache.clearAllCache() → limpa localStorage
   3.3. Remove todos os items do app no localStorage
   3.4. Remove todos os tokens Supabase
   3.5. Limpa sessionStorage
4. setUser(null), setSession(null), setProfile(null)
5. supabase.auth.signOut({ scope: 'global' })
6. onAuthStateChange dispara → redireciona para /landing
```

### Fluxo de Detecção de Mudança de Clínica
```
1. Usuario faz logout da Clínica A
2. Usuario faz login na Clínica B
3. AuthContext atualiza user.profile.clinic_id
4. ClinicContext.useEffect detecta mudança:
   - clinicId atual: "clinic-b-id"
   - lastClinicId.current: "clinic-a-id"
   - São diferentes! 🚨
5. Reset todos os estados do ClinicContext
6. Invalida cache da "clinic-a-id"
7. isInitialized = false
8. Sistema recarrega dados da Clínica B
```

## 🔮 Melhorias Futuras

- [ ] Adicionar métricas de uso de cache
- [ ] Implementar cache com TTL dinâmico por tipo de dado
- [ ] Adicionar compressão de dados no localStorage
- [ ] Criar página de admin para gerenciar cache
- [ ] Adicionar testes automatizados para fluxo de cache
