
import {
  Calendar,
  Users,
  FileText,
  DollarSign,
  Package,
  BarChart,
  Settings,
  UserPlus,
  Home,
  ShoppingCart,
  MessageCircle
} from "lucide-react";

export interface MenuItem {
  title: string;
  url: string;
  icon: any;
  description: string;
}

// Itens para fisioterapeutas - acesso completo às funcionalidades
export const professionalItems: MenuItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    description: "Visão geral do sistema"
  },
  {
    title: "Agenda",
    url: "/agenda",
    icon: Calendar,
    description: "Meus atendimentos e consultas"
  },
  {
    title: "Confirmações",
    url: "/whatsapp",
    icon: MessageCircle,
    description: "Mensagens automáticas"
  },
  {
    title: "Pacientes",
    url: "/pacientes",
    icon: Users,
    description: "Cadastros de pacientes"
  },
  // {
  //   title: "Prontuários",
  //   url: "/prontuarios",
  //   icon: FileText,
  //   description: "Registros médicos"
  // },
  {
    title: "Financeiro",
    url: "/financeiro",
    icon: DollarSign,
    description: "Controle financeiro"
  },
  {
    title: "Pacotes",
    url: "/pacotes",
    icon: Package,
    description: "Pacotes de sessões"
  },
  {
    title: "Relatórios",
    url: "/relatorios",
    icon: BarChart,
    description: "Relatórios e análises"
  },
  {
    title: "Fisioterapeutas",
    url: "/fisioterapeutas",
    icon: UserPlus,
    description: "Gestão da equipe"
  },
  {
    title: "Configurações",
    url: "/configuracoes",
    icon: Settings,
    description: "Configurações do sistema"
  },
  // {
  //   title: "Vendas",
  //   url: "/vendas",
  //   icon: ShoppingCart,
  //   description: "Sistema de vendas"
  // },
  // {
  //   title: "CRM",
  //   url: "/crm",
  //   icon: Phone,
  //   description: "Gestão de leads"
  // },
  // {
  //   title: "Relatório Financeiro",
  //   url: "/relatorios/pacientes",
  //   icon: DollarSign,
  //   description: "Faturamento detalhado"
  // }
];

// Itens para administradores - acesso completo
export const adminMainItems: MenuItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    description: "Visão geral"
  },
  {
    title: "Agenda",
    url: "/agenda",
    icon: Calendar,
    description: "Atendimentos"
  },
  {
    title: "Confirmações",
    url: "/whatsapp",
    icon: MessageCircle,
    description: "Mensagens"
  },
  {
    title: "Pacientes",
    url: "/pacientes",
    icon: Users,
    description: "Cadastros"
  },
  {
    title: "Financeiro",
    url: "/financeiro",
    icon: DollarSign,
    description: "Pagamentos"
  },
  {
    title: "Pacotes",
    url: "/pacotes",
    icon: Package,
    description: "Sessões"
  },
  {
    title: "Relatórios",
    url: "/relatorios",
    icon: BarChart,
    description: "Análises"
  },
];

export const adminManagementItems: MenuItem[] = [
  {
    title: "Fisioterapeutas",
    url: "/fisioterapeutas",
    icon: UserPlus,
    description: "Equipe"
  },
  {
    title: "Configurações",
    url: "/configuracoes",
    icon: Settings,
    description: "Sistema"
  }
];

// Menu básico para guardiões
export const guardianItems: MenuItem[] = [
  {
    title: "Portal do Responsável",
    url: "/portal-responsavel",
    icon: FileText,
    description: "Evolução do Paciente"
  }
];

console.log('📋 Menu items initialized:', {
  professionalItems: professionalItems.length,
  adminMainItems: adminMainItems.length,
  adminManagementItems: adminManagementItems.length,
  guardianItems: guardianItems.length
});
