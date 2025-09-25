# Fluxo de Autenticação - clinicId

## 1. Dados do useAuth após login bem-sucedido:

```jsx
const { 
  user,        // AppUser com profile
  session,     // Session do Supabase
  clinicId,    // string - ID da clínica
  clinicCode,  // string - Código da clínica
  loading      // boolean
} = useAuth();

// user.profile contém:
{
  id: "72cf43c9-5df6-4500-93c2-569661b36186",
  email: "usuario@clinica.com",
  clinic_id: "550e8400-e29b-41d4-a716-446655440000", // ✅ Este é o clinicId
  clinic_code: "CLINICA001",                           // ✅ Este é o clinicCode
  role: "admin",
  full_name: "Dr. João Silva"
}
```

## 2. Como usar nos componentes:

### Opção A - Via useAuth (acesso direto):
```tsx
function Dashboard() {
  const { clinicId, clinicCode, user } = useAuth();
  
  return (
    <div>
      <h1>Dashboard - {clinicCode}</h1>
      <p>Usuário: {user?.profile?.full_name}</p>
      <p>Clínica ID: {clinicId}</p>
    </div>
  );
}
```

### Opção B - Via ClinicContext (dados filtrados):
```tsx
function PatientsPage() {
  const { patients, addPatient } = useClinic();
  
  // Todos os pacientes já vêm filtrados por clinic_id
  // Não precisa se preocupar com clinicId aqui
  
  return (
    <div>
      {patients.map(patient => (
        <div key={patient.id}>{patient.fullName}</div>
      ))}
    </div>
  );
}
```

## 3. Para operações manuais no banco:

```tsx
function CustomComponent() {
  const { clinicId } = useAuth();
  
  const fetchCustomData = async () => {
    if (!clinicId) return;
    
    const { data } = await supabase
      .from('minha_tabela')
      .select('*')
      .eq('clinic_id', clinicId); // ✅ Filtrar por clínica
      
    return data;
  };
  
  const insertCustomData = async (newData) => {
    if (!clinicId) return;
    
    const { error } = await supabase
      .from('minha_tabela')
      .insert({
        ...newData,
        clinic_id: clinicId // ✅ Sempre incluir clinic_id
      });
  };
}
```

## 4. Estados possíveis:

```tsx
function MyComponent() {
  const { clinicId, loading } = useAuth();
  
  if (loading) {
    return <div>Carregando autenticação...</div>;
  }
  
  if (!clinicId) {
    return <div>Erro: Clínica não identificada. Faça login novamente.</div>;
  }
  
  // ✅ Aqui você TEM CERTEZA que clinicId existe
  return <div>Clínica: {clinicId}</div>;
}
```

## 5. Padrão recomendado para páginas:

```tsx
function MinhaPageComponent() {
  const { clinicId, loading } = useAuth();
  
  // Sempre verificar loading primeiro
  if (loading) return <PageLoading />;
  
  // Sempre verificar clinicId depois
  if (!clinicId) return <ErrorPage message="Clínica não identificada" />;
  
  // Só renderizar conteúdo se tiver clinicId
  return <MinhaPageContent />;
}
```