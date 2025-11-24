# 🏗️ Arquitetura de Contextos - PhysioFlow Plus

## 📊 Visão Geral

Este documento descreve a arquitetura de contextos do PhysioFlow Plus após a componentização do `ClinicContext`. A refatoração visa melhorar manutenibilidade, testabilidade e escalabilidade da aplicação.

---

## 🎯 Objetivos da Refatoração

### Problemas Identificados
- ❌ **ClinicContext gigante**: 1820 linhas com múltiplas responsabilidades
- ❌ **Acoplamento alto**: Todas as entidades em um único contexto
- ❌ **Difícil manutenção**: Mudanças afetam arquivo enorme
- ❌ **Baixa testabilidade**: Impossível testar módulos isoladamente
- ❌ **Performance**: Re-renders desnecessários afetam toda aplicação

### Soluções Implementadas
- ✅ **Separação de responsabilidades**: Um contexto por domínio
- ✅ **Services isolados**: Lógica de negócio em camada separada
- ✅ **Mappers centralizados**: Transformações DB ↔ Frontend isoladas
- ✅ **Hooks específicos**: API simplificada por domínio
- ✅ **Cache inteligente**: Estratégias por entidade

---

## 📁 Estrutura de Pastas

```
src/
├── contexts/
│   ├── AuthContext.tsx              (829 linhas) - Autenticação e usuário
│   ├── PermissionsContext.tsx       (367 linhas) - Sistema de permissões
│   ├── ProductsCacheContext.tsx     (195 linhas) - Cache de produtos
│   ├── ClinicContext.tsx            (~100 linhas) - Orquestrador simplificado
│   │
│   └── modules/                     🆕 NOVA ESTRUTURA
│       ├── PatientsContext.tsx
│       ├── ProfessionalsContext.tsx
│       ├── RoomsContext.tsx
│       ├── AppointmentsContext.tsx
│       ├── MedicalRecordsContext.tsx
│       ├── FinancialContext.tsx
│       ├── LeadsContext.tsx
│       └── DashboardContext.tsx
│
├── services/
│   ├── database/                    🆕 Queries Supabase
│   │   ├── patients.service.ts
│   │   ├── professionals.service.ts
│   │   ├── rooms.service.ts
│   │   ├── appointments.service.ts
│   │   ├── medicalRecords.service.ts
│   │   ├── financial.service.ts
│   │   ├── leads.service.ts
│   │   └── dashboard.service.ts
│   │
│   └── mappers/                     🆕 Transformações de dados
│       ├── patient.mapper.ts
│       ├── professional.mapper.ts
│       ├── appointment.mapper.ts
│       ├── medicalRecord.mapper.ts
│       ├── financial.mapper.ts
│       └── lead.mapper.ts
│
└── hooks/
    ├── usePatients.ts               🆕 Re-exportação conveniente
    ├── useProfessionals.ts
    ├── useAppointments.ts
    ├── useFinancial.ts
    └── ...
```

---

## 🔄 Fluxo de Dados

### Camada 1: Service Layer (Database)
```typescript
// src/services/database/patients.service.ts
import { supabase } from '@/integrations/supabase/client';
import { patientDbToFrontend } from '@/services/mappers/patient.mapper';

export class PatientsService {
  static async fetchAll(clinicId: string) {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('clinic_id', clinicId);
    
    if (error) throw error;
    return data.map(patientDbToFrontend);
  }
}
```

**Responsabilidades**:
- ✅ Queries Supabase isoladas
- ✅ Tratamento de erros
- ✅ Transformação DB → Frontend via mappers
- ✅ Validação de dados

---

### Camada 2: Mappers (Transformações)
```typescript
// src/services/mappers/patient.mapper.ts
import type { DbPatient, Patient } from '@/types';

export const patientDbToFrontend = (db: DbPatient): Patient => ({
  id: db.id,
  fullName: db.full_name,              // snake_case → camelCase
  phone: db.phone,
  email: db.email || '',
  // ... outras transformações
});

export const patientFrontendToDb = (patient: Partial<Patient>) => ({
  full_name: patient.fullName,         // camelCase → snake_case
  phone: patient.phone,
  email: patient.email,
  // ... outras transformações
});
```

**Responsabilidades**:
- ✅ Conversão `snake_case` ↔ `camelCase`
- ✅ Parsing de JSONB (address, emergencyContact)
- ✅ Valores default
- ✅ Type safety

---

### Camada 3: Context Layer (Estado)
```typescript
// src/contexts/modules/PatientsContext.tsx
import { createContext, useContext, useState, useCallback } from 'react';
import { PatientsService } from '@/services/database/patients.service';
import { globalCache, CACHE_KEYS } from '@/lib/globalCache';
import { useAuth } from '@/contexts/AuthContext';

export function PatientsProvider({ children }) {
  const { user } = useAuth();
  const clinicId = user?.profile?.clinic_id;

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPatients = useCallback(async () => {
    if (!clinicId) return;
    
    setLoading(true);
    try {
      const data = await PatientsService.fetchAll(clinicId);
      setPatients(data);
      globalCache.set(CACHE_KEYS.PATIENTS, clinicId, data);
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  return (
    <PatientsContext.Provider value={{ patients, loading, fetchPatients }}>
      {children}
    </PatientsContext.Provider>
  );
}
```

**Responsabilidades**:
- ✅ Gerenciamento de estado React
- ✅ Cache inteligente
- ✅ Loading states
- ✅ API pública do contexto

---

### Camada 4: Hooks (API Conveniente)
```typescript
// src/hooks/usePatients.ts
export { usePatients } from '@/contexts/modules/PatientsContext';

// Ou com composição:
import { usePatients as usePatientsContext } from '@/contexts/modules/PatientsContext';
import { usePermissions } from '@/hooks/usePermissions';

export function usePatients() {
  const patients = usePatientsContext();
  const { canCreate, canUpdate, canDelete } = usePermissions('patients');
  
  return {
    ...patients,
    permissions: { canCreate, canUpdate, canDelete }
  };
}
```

**Responsabilidades**:
- ✅ Re-exportação simples
- ✅ Composição de múltiplos contextos
- ✅ Lógica adicional (permissões, filtros)

---

## 🏗️ Provider Tree

### Hierarquia de Providers no App.tsx

```tsx
import { AuthProvider } from '@/contexts/AuthContext';
import { PermissionsProvider } from '@/contexts/PermissionsContext';
import { ProductsCacheProvider } from '@/contexts/ProductsCacheContext';
import { ClinicProvider } from '@/contexts/ClinicContext';

// Módulos do Clinic
import { PatientsProvider } from '@/contexts/modules/PatientsContext';
import { ProfessionalsProvider } from '@/contexts/modules/ProfessionalsContext';
import { AppointmentsProvider } from '@/contexts/modules/AppointmentsContext';
// ... outros módulos

function App() {
  return (
    <AuthProvider>
      <PermissionsProvider>
        <ProductsCacheProvider>
          <ClinicProvider>
            
            {/* Módulos isolados da clínica */}
            <PatientsProvider>
              <ProfessionalsProvider>
                <AppointmentsProvider>
                  <FinancialProvider>
                    <MedicalRecordsProvider>
                      <LeadsProvider>
                        <DashboardProvider>
                          
                          <RouterProvider />
                          
                        </DashboardProvider>
                      </LeadsProvider>
                    </MedicalRecordsProvider>
                  </FinancialProvider>
                </AppointmentsProvider>
              </ProfessionalsProvider>
            </PatientsProvider>
            
          </ClinicProvider>
        </ProductsCacheProvider>
      </PermissionsProvider>
    </AuthProvider>
  );
}
```

---

## 📦 Módulos Implementados

### 1. PatientsContext
**Arquivo**: `src/contexts/modules/PatientsContext.tsx`

**Responsabilidades**:
- Gerenciamento de pacientes
- CRUD completo (fetch, add, update, delete)
- Cache com TTL médio
- Integração com guardian (menores)

**API Pública**:
```typescript
interface PatientsContextType {
  patients: Patient[];
  loading: boolean;
  fetchPatients: () => Promise<void>;
  addPatient: (patient: Omit<Patient, 'id'>) => Promise<void>;
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
}
```

---

### 2. ProfessionalsContext
**Arquivo**: `src/contexts/modules/ProfessionalsContext.tsx`

**Responsabilidades**:
- Gerenciamento de profissionais/fisioterapeutas
- CRUD completo
- Vinculação com profiles (auth)
- Especialidades

---

### 3. AppointmentsContext
**Arquivo**: `src/contexts/modules/AppointmentsContext.tsx`

**Responsabilidades**:
- Agendamentos
- Recorrência
- WhatsApp confirmations
- Status tracking

---

### 4. FinancialContext
**Arquivo**: `src/contexts/modules/FinancialContext.tsx`

**Responsabilidades**:
- Accounts Receivable (contas a receber)
- Accounts Payable (contas a pagar)
- Bulk operations (mark as paid, delete)
- Payment tracking

---

### 5. MedicalRecordsContext
**Arquivo**: `src/contexts/modules/MedicalRecordsContext.tsx`

**Responsabilidades**:
- Prontuários médicos
- Anamnese (JSONB)
- Evoluções
- Arquivos anexos

---

### 6. LeadsContext
**Arquivo**: `src/contexts/modules/LeadsContext.tsx`

**Responsabilidades**:
- Gestão de leads (CRM)
- Pipeline de vendas
- Status tracking
- Source tracking

---

### 7. DashboardContext
**Arquivo**: `src/contexts/modules/DashboardContext.tsx`

**Responsabilidades**:
- Dashboard statistics
- Clinic settings
- Analytics data
- Reports

---

## 🔐 Convenções de Código

### Nomenclatura
```typescript
// Interfaces DB (snake_case - match Supabase)
interface DbPatient {
  full_name: string;    // snake_case
  phone: string;
}

// Interfaces Frontend (camelCase - match JS conventions)
interface Patient {
  fullName: string;     // camelCase
  phone: string;
}

// Services (PascalCase class, static methods)
export class PatientsService {
  static async fetchAll() { }
}

// Mappers (camelCase functions)
export const patientDbToFrontend = (db: DbPatient) => { };
export const patientFrontendToDb = (patient: Patient) => { };

// Contexts (PascalCase)
export function PatientsProvider() { }
export const usePatients = () => { };
```

---

### Tratamento de Erros
```typescript
// Service Layer - Throw errors
static async create(data) {
  const { error } = await supabase.from('patients').insert(data);
  if (error) throw error;  // ✅ Deixa context lidar
}

// Context Layer - Catch e log
const addPatient = async (patient) => {
  try {
    await PatientsService.create(patient);
    toast.success('Paciente adicionado');
  } catch (error) {
    console.error('Error adding patient:', error);
    toast.error('Erro ao adicionar paciente');
    throw error;  // ✅ Re-throw para UI lidar se necessário
  }
};
```

---

### Cache Strategy
```typescript
// Cache keys centralizados
export const CACHE_KEYS = {
  PATIENTS: 'patients',
  APPOINTMENTS: 'appointments',
  // ...
};

// TTL por tipo de dado
export const CACHE_TTL = {
  STATIC: 60 * 60 * 1000,      // 1 hora (products, settings)
  MEDIUM: 15 * 60 * 1000,      // 15 min (patients, professionals)
  DYNAMIC: 5 * 60 * 1000,      // 5 min (appointments, financial)
};

// Uso no Context
const fetchPatients = async () => {
  // Tentar cache primeiro
  const cached = globalCache.get(CACHE_KEYS.PATIENTS, clinicId, CACHE_TTL.MEDIUM);
  if (cached) {
    setPatients(cached);
    return;
  }
  
  // Se não tem cache, buscar do banco
  const data = await PatientsService.fetchAll(clinicId);
  setPatients(data);
  globalCache.set(CACHE_KEYS.PATIENTS, clinicId, data, CACHE_TTL.MEDIUM);
};
```

---

## 🧪 Testabilidade

### Vantagens da Nova Arquitetura

```typescript
// ✅ Services podem ser testados isoladamente
describe('PatientsService', () => {
  it('should fetch all patients', async () => {
    const patients = await PatientsService.fetchAll('clinic-123');
    expect(patients).toHaveLength(10);
  });
});

// ✅ Mappers são funções puras
describe('patientDbToFrontend', () => {
  it('should convert snake_case to camelCase', () => {
    const db = { full_name: 'John Doe', phone: '123' };
    const result = patientDbToFrontend(db);
    expect(result.fullName).toBe('John Doe');
  });
});

// ✅ Contexts podem ser testados com mock services
describe('PatientsProvider', () => {
  it('should load patients on mount', async () => {
    jest.spyOn(PatientsService, 'fetchAll').mockResolvedValue([...]);
    const { result } = renderHook(() => usePatients());
    await waitFor(() => expect(result.current.patients).toHaveLength(5));
  });
});
```

---

## 📊 Migração Gradual

### Estratégia de Implementação

#### Fase 1: Preparação ✅
- [x] Criar estrutura de pastas
- [x] Documentar arquitetura
- [x] Definir convenções

#### Fase 2: Implementação Módulo por Módulo
- [x] **Patients** (Módulo piloto)
  - [x] patient.mapper.ts
  - [x] patients.service.ts
  - [x] PatientsContext.tsx
  - [x] usePatients.ts
- [ ] **Professionals**
- [ ] **Appointments**
- [ ] **Financial**
- [ ] **MedicalRecords**
- [ ] **Leads**
- [ ] **Dashboard**

#### Fase 3: Migração de Componentes
- [ ] Atualizar componentes para usar novos hooks
- [ ] Testar cada tela isoladamente
- [ ] Validar funcionalidades

#### Fase 4: Limpeza
- [ ] Remover código antigo do ClinicContext
- [ ] Simplificar ClinicProvider
- [ ] Atualizar testes

---

## 🎯 Checklist de Implementação

### Para cada novo módulo:

- [ ] Criar interfaces DB em `types/`
- [ ] Implementar mapper em `services/mappers/`
- [ ] Implementar service em `services/database/`
- [ ] Criar context em `contexts/modules/`
- [ ] Criar hook em `hooks/`
- [ ] Adicionar Provider no App.tsx
- [ ] Atualizar componentes para usar novo hook
- [ ] Escrever testes unitários
- [ ] Documentar API pública

---

## 📈 Métricas de Sucesso

| Métrica | Antes | Meta | Atual |
|---------|-------|------|-------|
| **Linhas por arquivo** | 1820 | <350 | ~250-300 ✅ |
| **Contextos** | 1 gigante | 8 modulares | **6/8** ✅ (75%) |
| **Testabilidade** | 0% | 80% | 60% ⏳ |
| **Tempo de build** | ~45s | <30s | - |
| **Re-renders** | Alto | Baixo | - |

### 🎉 Módulos Implementados (6/8)
1. ✅ **Patients** - Mapper + Service + Context + Hook
2. ✅ **Professionals** - Mapper + Service + Context + Hook
3. ✅ **Appointments** - Mapper + Service + Context + Hook (com WhatsApp)
4. ✅ **Rooms** - Mapper + Service + Context + Hook
5. ✅ **Financial** - Mapper + Service + Context + Hook (Payables + Receivables)
6. ✅ **Leads** - Mapper + Service + Context + Hook (CRM pipeline)
7. ⏳ **Medical Records** - Pending (anamnesis + evolutions)
8. ⏳ **Dashboard** - Pending (stats + clinic settings)

---

## 🔗 Referências

- [React Context Best Practices](https://react.dev/learn/passing-data-deeply-with-context)
- [Supabase TypeScript Guide](https://supabase.com/docs/guides/api/generating-types)
- [Separation of Concerns](https://en.wikipedia.org/wiki/Separation_of_concerns)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)

---

## 💡 Próximos Passos

### Fase 1: Completar Módulos Restantes (⏳ Em Progresso)
1. **Medical Records Module**: 
   - Criar mapper com JSONB anamnesis parsing
   - Implementar service com evolutions sub-entity
   - Context com operações de anamnese + evolução
   
2. **Dashboard Module**:
   - Criar service de agregação de estatísticas
   - Context com clinic settings integration
   - KPIs: appointments, revenue, leads conversion

### Fase 2: Provider Integration (📋 Planejado)
1. **Update App.tsx**: Adicionar Provider tree completo
2. **Nest Providers**: Auth → Permissions → Products → Clinic → [Modular Contexts]
3. **Test isolated contexts**: Validar independência

### Fase 3: Component Migration (📋 Planejado)
1. **PatientsPage**: Trocar `useClinic()` por `usePatients()`
2. **ProfessionalsPage**: Trocar por `useProfessionals()`
3. **AppointmentsPage**: Trocar por `useAppointments()`
4. **FinancialPage**: Trocar por `useFinancial()`
5. **CRMPage**: Trocar por `useLeads()`
6. **Dashboard**: Trocar por `useDashboard()`

### Fase 4: Cleanup (📋 Planejado)
1. **Simplify ClinicContext**: Remover código migrado
2. **Update tests**: Testar módulos isolados
3. **Performance audit**: Medir re-renders e cache hits
4. **Documentation**: Atualizar docs de uso

---

**Última atualização**: Janeiro de 2025  
**Versão**: 2.0.0 (Modular Architecture)  
**Status**: 6/8 módulos implementados (75% completo)  
**Autor**: Tech Group BR
