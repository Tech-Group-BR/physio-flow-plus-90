/**
 * usePatients Hook
 * 
 * Hook conveniente para acessar o PatientsContext.
 * Re-exporta o hook do contexto para uso simplificado nos componentes.
 * 
 * Pode ser estendido no futuro para incluir lógica adicional como:
 * - Composição com usePermissions para validar ações
 * - Filtros personalizados
 * - Ordenação customizada
 */

export { usePatients } from '@/contexts/modules/PatientsContext';

// Exemplo de composição com permissões (futuro):
// import { usePatients as usePatientsContext } from '@/contexts/modules/PatientsContext';
// import { usePermissionActions } from '@/hooks/usePermissions';
// 
// export function usePatients() {
//   const patients = usePatientsContext();
//   const { patients: patientsPermissions } = usePermissionActions();
//   
//   return {
//     ...patients,
//     permissions: patientsPermissions
//   };
// }
