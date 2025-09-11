
import { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SidebarMenuSection } from "./sidebar/SidebarMenuSection";
import {
  physiotherapistItems,
  adminMainItems,
  adminManagementItems,
  guardianItems
} from "./sidebar/SidebarMenuItems";

export function AppSidebar() {
  const [userName, setUserName] = useState<string>('LUISA HELENA');
  const { signOut, user } = useAuth();
  
  // FIXO: Sempre usar menu do fisioterapeuta
  const userRole = 'physiotherapist';

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
    console.log('🚪 Iniciando logout...');
    try {
      await signOut();
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    }
  };

  // SEMPRE usar itens do fisioterapeuta
  const mainItems = physiotherapistItems;
  const managementItems: any[] = [];

  // Labels fixos
  const mainMenuLabel = 'Sistema FisioTech';
  const roleLabel = 'Fisioterapeuta';

  return (
    <Sidebar className="border-r bg-background w-64 min-w-64">
      <SidebarHeader className="border-b px-6 py-4 bg-background">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">F</span>
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">FisioTech</span>
            <span className="truncate text-xs text-muted-foreground">Sistema SAAS</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2 bg-background flex-1">
        <SidebarMenuSection 
          label={mainMenuLabel}
          items={mainItems}
        />
      </SidebarContent>

      <SidebarFooter className="border-t px-6 py-4 bg-background">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <span className="text-sm font-medium">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{userName}</span>
            <span className="truncate text-xs text-muted-foreground">
              {roleLabel}
            </span>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
