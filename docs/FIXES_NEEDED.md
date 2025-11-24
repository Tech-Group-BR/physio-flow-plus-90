# 🔧 Correções Necessárias - Componentização

## ⚠️ Erros Identificados

### 1. GlobalCache API Signature
**Problema**: Todos os contextos usam API incorreta do globalCache  
**Signature correta**:
```typescript
// CORRETO
globalCache.set(key, data, clinicId, ttl)  // 4 parâmetros
globalCache.get(key, clinicId, ttl)         // 3 parâmetros  
globalCache.invalidate(key)                 // 1 parâmetro (sem clinicId)
globalCache.invalidateClinic(clinicId)      // Use este para invalidar por clínica

// ERRADO (usado atualmente)
globalCache.set(CACHE_KEYS.PATIENTS, clinicId, data, CACHE_TTL.MEDIUM)  // ❌
globalCache.invalidate(CACHE_KEYS.PATIENTS, clinicId)                   // ❌
```

**Arquivos afetados** (TODOS os contextos):
- `PatientsContext.tsx` - 7 erros
- `ProfessionalsContext.tsx` - 6 erros  
- `AppointmentsContext.tsx` - 7 erros
- `RoomsContext.tsx` - 6 erros
- `FinancialContext.tsx` - 16 erros (duplo)
- `LeadsContext.tsx` - 7 erros

**Total**: 49 ocorrências para corrigir

---

### 2. Enum Mismatches no Database Schema

#### A) Leads Status
**Problema**: Frontend tem 7 status, DB tem apenas 6  
**Frontend** (`src/types/index.ts`):
```typescript
'novo' | 'contato_inicial' | 'agendamento' | 'avaliacao' | 'proposta' | 'cliente' | 'perdido'
```

**Database schema**:
```typescript
'novo' | 'contatado' | 'interessado' | 'agendado' | 'cliente' | 'perdido'
```

**Solução**: Atualizar DB enum ou ajustar frontend types

#### B) Accounts Receivable Status
**Problema**: Frontend usa 'recebido', DB usa 'pago'  
**Frontend**:
```typescript
'pendente' | 'recebido' | 'vencido' | 'cancelado'
```

**Database**:
```typescript
'pendente' | 'pago' | 'vencido' | 'cancelado'
```

**Solução**: Alinhar nomenclatura

---

### 3. Required Fields em Insert Operations

#### A) Patients Service
**Problema**: `full_name` é required no DB mas optional no mapper  
**Arquivo**: `patients.service.ts` linha 103

#### B) Appointments Service  
**Problema**: `date` é required no DB mas optional no mapper  
**Arquivo**: `appointments.service.ts` linha 106

#### C) Rooms Service
**Problema**: `name` é required no DB mas optional no mapper  
**Arquivo**: `rooms.service.ts` linha 81

---

## 🛠️ Plano de Correção

### Prioridade 1: GlobalCache API (CRÍTICO)
Correção em massa com busca/substituição:

**Pattern 1 - set():**
```typescript
// BUSCAR:
globalCache.set(CACHE_KEYS.{ENTITY}, clinicId, data, CACHE_TTL.{TTL})

// SUBSTITUIR POR:
globalCache.set(CACHE_KEYS.{ENTITY}, data, clinicId, CACHE_TTL.{TTL})
```

**Pattern 2 - invalidate():**
```typescript
// BUSCAR:
globalCache.invalidate(CACHE_KEYS.{ENTITY}, clinicId)

// SUBSTITUIR POR:
globalCache.invalidateClinic(clinicId)  // Ou apenas invalidate(key) se não precisa filtrar por clínica
```

**Pattern 3 - invalidate específico:**
```typescript
// BUSCAR:
globalCache.invalidate(CACHE_KEYS.{ENTITY}, lastClinicId.current)

// SUBSTITUIR POR:
globalCache.invalidate(CACHE_KEYS.{ENTITY})
```

---

### Prioridade 2: Enum Alignment (IMPORTANTE)

#### Opção A: Atualizar Migration (RECOMENDADO)
Criar migration para ajustar enums do DB:
```sql
-- Leads status
ALTER TYPE lead_status RENAME VALUE 'contatado' TO 'contato_inicial';
ALTER TYPE lead_status RENAME VALUE 'interessado' TO 'avaliacao';
ALTER TYPE lead_status RENAME VALUE 'agendado' TO 'agendamento';
-- Adicionar novo valor
ALTER TYPE lead_status ADD VALUE 'proposta';

-- Accounts receivable status
ALTER TYPE payment_status RENAME VALUE 'pago' TO 'recebido';
```

#### Opção B: Atualizar Frontend Types (ALTERNATIVA)
Ajustar `src/types/index.ts` para match com DB:
```typescript
// Leads
status: 'novo' | 'contatado' | 'interessado' | 'agendado' | 'cliente' | 'perdido';

// Accounts Receivable
status: 'pendente' | 'pago' | 'vencido' | 'cancelado';
```

---

### Prioridade 3: Required Fields (MÉDIO)

Manter type assertion com `any` nos services (já aplicado em professionals):
```typescript
const insertData: any = {
  ...dbData,
  clinic_id: clinicId
};
```

**Justificativa**: Supabase schema auto-gera IDs e timestamps, então campos "required" no tipo não refletem a realidade do insert.

---

## 📋 Checklist de Correções

### GlobalCache Fixes
- [ ] PatientsContext.tsx (7 linhas)
- [ ] ProfessionalsContext.tsx (6 linhas)  
- [ ] AppointmentsContext.tsx (7 linhas)
- [ ] RoomsContext.tsx (6 linhas)
- [ ] FinancialContext.tsx (16 linhas)
- [ ] LeadsContext.tsx (2 linhas) 

### Enum Fixes
- [ ] Decidir estratégia (DB migration vs Frontend types)
- [ ] Leads status alignment
- [ ] Accounts Receivable status alignment
- [ ] Atualizar mappers correspondentes

### Insert Type Fixes
- [ ] Patients service - add `any` type
- [ ] Appointments service - add `any` type  
- [ ] Rooms service - add `any` type

---

## 🚀 Script de Correção Automática

### Para GlobalCache set():
```powershell
# PatientsContext.tsx
(Get-Content "src/contexts/modules/PatientsContext.tsx") -replace 'globalCache\.set\(CACHE_KEYS\.PATIENTS, clinicId, data, CACHE_TTL\.MEDIUM\)', 'globalCache.set(CACHE_KEYS.PATIENTS, data, clinicId, CACHE_TTL.MEDIUM)' | Set-Content "src/contexts/modules/PatientsContext.tsx"
```

### Para globalCache invalidate():
```powershell
# Pattern: invalidate com 2 parâmetros → invalidateClinic
Get-ChildItem -Path "src/contexts/modules" -Filter "*.tsx" -Recurse | ForEach-Object {
  (Get-Content $_.FullName) -replace 'globalCache\.invalidate\(CACHE_KEYS\.\w+, clinicId\)', 'if (clinicId) globalCache.invalidateClinic(clinicId)' | Set-Content $_.FullName
}
```

---

**Prioridade de execução**: GlobalCache > Enum Alignment > Insert Types  
**Tempo estimado**: 30-45 minutos para correções completas  
**Breaking changes**: Nenhum (correções internas)
