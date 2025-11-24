# 🧪 Guia de Teste: Solução de Cache

## ✅ O que foi implementado?

Sistema completo de limpeza de cache para evitar bugs ao trocar de conta.

## 🚀 Como testar agora

### Teste 1: Verificar Limpeza no Logout (2 minutos)

1. **Faça login** em uma conta qualquer
2. **Navegue pelo sistema** (veja alguns pacientes, agendamentos, etc)
3. **Abra o Console do DevTools** (F12 → Console)
4. **Digite**: 
   ```javascript
   window.debugPhysioFlow.checkCache()
   ```
   Você deve ver dados da clínica atual ✅

5. **Faça LOGOUT** (clique no botão "Sair")
6. **Digite novamente no console**:
   ```javascript
   window.debugPhysioFlow.checkCache()
   ```
   Agora deve estar VAZIO ✅

**Resultado esperado**: Cache totalmente limpo após logout

---

### Teste 2: Trocar de Conta (5 minutos)

1. **Login na Clínica A** (ex: `codigo123`)
2. **Navegue um pouco** pelo sistema
3. **No console, digite**:
   ```javascript
   window.debugPhysioFlow.persistentCache()
   ```
   **Anote o `clinicId`** (ex: `abc-123-def`)

4. **Faça LOGOUT**
5. **Login na Clínica B** (ex: `outrocod456`) 
6. **Digite novamente**:
   ```javascript
   window.debugPhysioFlow.persistentCache()
   ```
   O `clinicId` deve ser **DIFERENTE** agora ✅

7. **Verifique a interface**: 
   - Sidebar deve mostrar dados da Clínica B (não da A)
   - Pacientes devem ser da Clínica B
   - Dashboard com stats da Clínica B

**Resultado esperado**: Zero dados da Clínica A na sessão da Clínica B

---

### Teste 3: Forçar Limpeza Manual (1 minuto)

Se ainda ver algum bug estranho:

```javascript
// No console do navegador:
window.debugPhysioFlow.clearAll()
location.reload()
```

Isso força limpeza total e recarrega a página.

---

## 🐛 Se ainda tiver problemas

### Debug Avançado

```javascript
// Ver tudo que está em cache:
window.debugPhysioFlow.checkCache()

// Ver só o cache em memória:
window.debugPhysioFlow.globalCache()

// Ver só o localStorage:
window.debugPhysioFlow.persistentCache()

// Ajuda com todos os comandos:
window.debugPhysioFlow.help()
```

### Cenário de Bug

Se após trocar de conta você ver:
- ❌ Dados da clínica anterior
- ❌ Interface bugada
- ❌ Informações misturadas

**Faça isso:**
1. Tire screenshot do bug
2. Abra console
3. Digite: `window.debugPhysioFlow.checkCache()`
4. Tire screenshot do resultado
5. Envie os dois screenshots

---

## 📊 Checklist de Teste

- [ ] Logout limpa o cache completamente
- [ ] Trocar de conta não mostra dados da conta anterior
- [ ] Comandos de debug funcionam no console
- [ ] Interface fica limpa após logout
- [ ] Não precisa limpar cache do navegador manualmente

---

## 💡 Comandos Úteis

```javascript
// Verificar estado atual
window.debugPhysioFlow.checkCache()

// Limpar tudo manualmente
window.debugPhysioFlow.clearAll()

// Ver ajuda
window.debugPhysioFlow.help()
```

---

## 🎯 Fluxo Normal Esperado

```
1. Login Clínica A
   → Cache preenchido com dados da A
   
2. Logout
   → Cache TOTALMENTE LIMPO ✅
   
3. Login Clínica B
   → Cache preenchido APENAS com dados da B ✅
   → Zero rastros da Clínica A
```

---

## ⚙️ Arquivos Importantes Criados

1. `src/utils/cacheCleanup.ts` - Sistema de limpeza
2. `src/utils/debugCommands.ts` - Comandos de debug
3. `CACHE_CLEANUP_SOLUTION.md` - Documentação completa

---

## 📞 Precisa de Ajuda?

Se encontrar qualquer bug, use os comandos de debug primeiro:
```javascript
window.debugPhysioFlow.checkCache()
```

Isso vai mostrar exatamente o que está em cache e ajudar a identificar o problema!
