
// Utility para limpar completamente o estado de autenticação
export const cleanupAuthState = () => {
  console.log('🧹 Limpando estado de autenticação...');
  
  // Remover tokens padrão do Supabase
  localStorage.removeItem('supabase.auth.token');
  
  // Remover todas as chaves do Supabase auth do localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      console.log('🗑️ Removendo chave:', key);
      localStorage.removeItem(key);
    }
  });
  
  // Remover do sessionStorage se estiver em uso
  if (typeof sessionStorage !== 'undefined') {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        console.log('🗑️ Removendo chave do sessionStorage:', key);
        sessionStorage.removeItem(key);
      }
    });
  }
  
  console.log('✅ Estado de autenticação limpo');
};

export const forceSignOut = async (supabase: any) => {
  try {
    console.log('🚪 Tentando logout global...');
    await supabase.auth.signOut({ scope: 'global' });
    console.log('✅ Logout global realizado');
  } catch (err) {
    console.log('⚠️ Erro no logout global (ignorando):', err);
  }
};
