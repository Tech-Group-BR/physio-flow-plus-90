
import {
  Calendar,
  Users,
  FileText,
  DollarSign,
  Package,
  BarChart,
  Settings,
  UserPlus,
  Phone,
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
export const physiotherapistItems: MenuItem[] = [
  {
    title: "Dashboard",
    url: "/",
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
    title: "WhatsApp",
    url: "/whatsapp",
    icon: MessageCircle,
    description: "Mensagens automáticas"
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
  {
    title: "Vendas",
    url: "/vendas",
    icon: ShoppingCart,
    description: "Sistema de vendas"
  },
  {
    title: "CRM",
    url: "/crm",
    icon: Phone,
    description: "Gestão de leads"
  },
  {
    title: "Relatório Financeiro",
    url: "/relatorios/pacientes",
    icon: DollarSign,
    description: "Faturamento detalhado"
  }
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
    title: "Pacientes",
    url: "/pacientes",
    icon: Users,
    description: "Cadastros"
  },
  {
    title: "Prontuários",
    url: "/prontuarios",
    icon: FileText,
    description: "Registros"
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
    title: "WhatsApp",
    url: "/whatsapp",
    icon: MessageCircle,
    description: "Mensagens"
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
    title: "Relatório Financeiro",
    url: "/relatorios/pacientes",
    icon: DollarSign,
    description: "Faturamento por paciente"
  },
  {
    title: "Configurações",
    url: "/configuracoes",
    icon: Settings,
    description: "Sistema"
  },
  {
    title: "Vendas",
    url: "/vendas",
    icon: ShoppingCart,
    description: "SAAS"
  },
  {
    title: "CRM",
    url: "/crm",
    icon: Phone,
    description: "Leads"
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
  physiotherapistItems: physiotherapistItems.length,
  adminMainItems: adminMainItems.length,
  adminManagementItems: adminManagementItems.length,
  guardianItems: guardianItems.length
});
