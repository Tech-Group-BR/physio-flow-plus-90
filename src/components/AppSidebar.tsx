
import { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Home, Calendar, Users, DollarSign, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarMenuSection } from "./sidebar/SidebarMenuSection";
import {
  professionalItems,
  adminMainItems,
  adminManagementItems,
  guardianItems,
  type MenuItem
} from "./sidebar/SidebarMenuItems";

export function AppSidebar() {
  const [userName, setUserName] = useState<string>('Usuário');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { signOut, user } = useAuth();
  
  // Usar o role real do usuário
  const userRole = user?.profile?.role || 'guardian';

  useEffect(() => {
    // Buscar apenas o nome, não o role
    const getUserName = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .maybeSingle();
          
          if (profile?.full_name) {
            setUserName(profile.full_name);
          } else if (user.email) {
            // Se não tem nome no perfil, usar email
            setUserName(user.email);
          }
        }
      } catch (error) {
        // Ignorar erros - manter nome padrão
        console.log('⚠️ Erro ao buscar nome do usuário:', error);
      }
    };

    if (user) {
      getUserName();
    }
  }, [user]);

  const handleLogout = async () => {
    // ✅ PROTEÇÃO: Evitar múltiplas chamadas simultâneas
    if (isLoggingOut) {
      console.log('⏳ Logout já em andamento, ignorando clique duplicado');
      return;
    }

    console.log('🚪 Iniciando logout...');
    setIsLoggingOut(true);
    
    try {
      await signOut();
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      setIsLoggingOut(false); // Reset em caso de erro
    }
  };

  // Definir itens de menu baseado no role do usuário
  let mainItems: MenuItem[] = [];
  let managementItems: MenuItem[] = [];
  let mainMenuLabel = 'Sistema GoPhysioTech';
  let roleLabel = 'Usuário';

  switch (userRole) {
    case 'admin':
    case 'super':
      // Admin e Super Admin têm acesso total
      mainItems = adminMainItems;
      managementItems = adminManagementItems;
      mainMenuLabel = 'Sistema Administrativo';
      roleLabel = userRole === 'super' ? 'Super Administrador' : 'Administrador';
      break;
    
    case 'professional':
      // Profissional tem acesso operacional (sem vendas e CRM)
      mainItems = professionalItems;
      managementItems = [];
      mainMenuLabel = 'Sistema GoPhysioTech';
      roleLabel = 'Profissional';
      break;
    
    case 'receptionist':
      // Recepcionista: Agenda, Pacientes, Financeiro básico, Pacotes
      mainItems = [
        { title: "Dashboard", url: "/dashboard", icon: Home, description: "Visão geral" },
        { title: "Agenda", url: "/agenda", icon: Calendar, description: "Atendimentos" },
        { title: "Pacientes", url: "/pacientes", icon: Users, description: "Cadastros" },
        { title: "Financeiro", url: "/financeiro", icon: DollarSign, description: "Controle financeiro" },
        { title: "Pacotes", url: "/pacotes", icon: Package, description: "Pacotes de sessões" },
      ];
      managementItems = [];
      mainMenuLabel = 'Sistema de Atendimento';
      roleLabel = 'Recepcionista';
      break;
    
    case 'guardian':
      // Responsável: Apenas portal do responsável
      mainItems = guardianItems;
      managementItems = [];
      mainMenuLabel = 'Portal do Responsável';
      roleLabel = 'Responsável';
      break;
    
    default:
      // Fallback para guardião
      mainItems = guardianItems;
      managementItems = [];
      mainMenuLabel = 'Portal do Responsável';
      roleLabel = 'Usuário';
  }

  return (
    <Sidebar className="border-r bg-background w-64 min-w-64 lg:w-72 lg:min-w-72">
      <SidebarHeader className="border-b px-4 lg:px-6 py-3 lg:py-4 bg-background">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 lg:h-10 lg:w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
            <span className="text-sm lg:text-base font-bold">F</span>
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
            <span className="truncate font-semibold text-sm lg:text-base">GoPhysioTech</span>
            <span className="truncate text-xs lg:text-sm text-muted-foreground">Sistema SAAS</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1 sm:px-2 py-2 bg-background flex-1">
        <SidebarMenuSection 
          label={mainMenuLabel}
          items={mainItems}
        />
        {managementItems.length > 0 && (
          <SidebarMenuSection 
            label="Gestão"
            items={managementItems}
          />
        )}
      </SidebarContent>

      <SidebarFooter className="border-t px-4 lg:px-6 py-3 lg:py-4 bg-background">
        <div className="flex items-center gap-2 mb-3 min-w-0">
          <div className="flex h-8 w-8 lg:h-10 lg:w-10 items-center justify-center rounded-full bg-muted shrink-0">
            <span className="text-sm lg:text-base font-medium">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
            <span className="truncate font-medium text-sm lg:text-base">{userName}</span>
            <span className="truncate text-xs lg:text-sm text-muted-foreground">
              {roleLabel}
            </span>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 text-sm lg:text-base h-9 lg:h-10"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? 'Saindo...' : 'Sair'}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
