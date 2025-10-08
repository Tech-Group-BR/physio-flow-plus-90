# 🔐 Sistema de Permissões - PhysioFlow Plus

## 📋 Documentação e Configuração

### Backend (Database)
✅ Migration: `20241006000001_permissions_system.sql`  
✅ Migration: `20241006000004_invitations_system.sql`  
✅ Migration: `20250106000001_fix_admin_permissions.sql`  
✅ Tabelas: `permissions`, `user_permissions`, `permission_presets`  
✅ Tabela: `user_invitations` (sistema de convites)  
✅ Funções SQL: `apply_role_preset_permissions`  
✅ Políticas RLS configuradas  
✅ Trigger para auto-admin na criação de clínica

### Frontend (React)
✅ Context: `PermissionsContext.tsx`  
✅ Hook: `usePermissions.ts`  
✅ Gestão de usuários: `UserPermissionsManager.tsx`  
✅ Sistema de convites: `InviteUserForm.tsx`  
✅ Página aceitar convite: `AcceptInvitePage.tsx`  
✅ Integração no `App.tsx`  
✅ Página de configurações: `ConfigurationsPage.tsx`  
✅ Rota `/admin` para Super Admin

---

## 👥 Permissões Padrão por Cargo

### 🔵 Administrador
**Acesso quase completo ao sistema**

- ✅ Pacientes: Gerenciar (criar, ler, editar, excluir)
- ✅ Profissionais: Gerenciar (criar, ler, editar, excluir)
- ✅ Agendamentos: Gerenciar (criar, ler, editar, excluir)
- ✅ Financeiro: Gerenciar (criar, ler, editar, excluir)
- ✅ Configurações: Gerenciar (acesso total incluindo usuários e permissões)
- ✅ Relatórios: Gerenciar
- ✅ WhatsApp: Gerenciar
- ✅ Dashboard: Ver

### 🟢 Profissional (Fisioterapeuta)
**Foco em atendimento e evolução clínica**

- ✅ Pacientes: Ler e editar
- ✅ Agendamentos: Ler, criar e editar
- ✅ Financeiro: Apenas ler
- ✅ Dashboard: Ver
- ❌ Profissionais: Sem acesso
- ❌ Configurações: Sem acesso
- ❌ Relatórios: Sem acesso
- ❌ WhatsApp: Sem acesso

### 🟡 Secretária(o) / Recepcionista
**Foco em agenda e atendimento ao público**

- ✅ Pacientes: Criar, ler e editar
- ✅ Agendamentos: Gerenciar (criar, ler, editar, excluir)
- ✅ Financeiro: Apenas ler
- ✅ Dashboard: Ver
- ❌ Profissionais: Sem acesso
- ❌ Configurações: Sem acesso
- ❌ Relatórios: Sem acesso
- ❌ WhatsApp: Sem acesso

### 🟣 Responsável (Guardian)
**Acesso limitado para acompanhamento**

- ✅ Dashboard: Ver apenas
- ❌ Sem acesso a outras funcionalidades

---

## ⚙️ Configuração Personalizada de Permissões

Caso precise customizar as permissões de um usuário específico, você pode configurar permissões individuais para cada recurso:

### 📱 WhatsApp
- **Ler**: Visualizar mensagens e histórico
- **Gerenciar**: Configurar, enviar mensagens e templates

### 👤 Pacientes
- **Ler**: Visualizar lista e detalhes
- **Criar**: Adicionar novos pacientes
- **Editar**: Atualizar informações
- **Excluir**: Remover pacientes
- **Gerenciar**: Acesso completo (todas as ações acima)

### 👨‍⚕️ Profissionais
- **Ler**: Visualizar lista e detalhes
- **Criar**: Adicionar novos profissionais
- **Editar**: Atualizar informações
- **Excluir**: Remover profissionais
- **Gerenciar**: Acesso completo (todas as ações acima)

### 📅 Agendamentos
- **Ler**: Visualizar agenda
- **Criar**: Criar novos agendamentos
- **Editar**: Modificar agendamentos existentes
- **Excluir**: Cancelar agendamentos
- **Gerenciar**: Acesso completo (todas as ações acima)

### 💰 Financeiro
- **Ler**: Visualizar relatórios financeiros
- **Criar**: Lançar receitas e despesas
- **Editar**: Modificar lançamentos
- **Excluir**: Remover lançamentos
- **Gerenciar**: Acesso completo (todas as ações acima)

### ⚙️ Configurações
- **Ler**: Visualizar configurações
- **Editar**: Modificar configurações básicas
- **Gerenciar**: Acesso total incluindo gestão de usuários e permissões

### 📊 Relatórios
- **Ler**: Visualizar relatórios
- **Gerenciar**: Gerar e exportar relatórios avançados

### 📊 Dashboard
- **Ler**: Visualizar dashboard e estatísticas

---

## 🚀 Como Usar o Sistema

### Para Administradores da Clínica:

1. **Acessar Gestão de Usuários:**
   - Vá em **Configurações** → Aba **Usuários**

2. **Convidar Novo Usuário:**
   - Clique em "Convidar usuário"
   - Digite o email do usuário
   - Selecione o cargo (Admin, Profissional, Secretária, etc.)
   - Personalize permissões específicas se necessário
   - Clique em "Enviar Convite"

3. **Gerenciar Usuários Existentes:**
   - Na lista de usuários, clique em "Editar"
   - Altere o cargo ou ajuste permissões específicas
   - Salve as alterações

4. **Visualizar Permissões:**
   - Veja quais permissões cada usuário possui
   - Identifique usuários ativos e inativos

### Para Usuários Convidados:

1. **Aceitar Convite:**
   - Receba o email com link de convite
   - Clique no link (válido por 7 dias)
   - Faça login ou crie sua conta
   - Confirme a aceitação do convite
   - Será redirecionado para o dashboard

### Para Super Admin:

1. **Acessar Painel de Super Admin:**
   - Acesse a rota `/admin` na URL
   - Visualize estatísticas globais do sistema
   - Gerencie todas as clínicas
   - Monitore logs e atividades

---

## 🔒 Segurança

- **RLS (Row Level Security)**: Todas as tabelas protegidas
- **Validação de Tokens**: Convites com tokens únicos e expiração
- **Proteção de Rotas**: Verificação de permissões no frontend
- **Auditoria**: Registro de quem concedeu cada permissão
- **Auto-Admin**: Criador da clínica vira admin automaticamente

---

## 📧 Próximos Passos

1. ✅ Todas as migrations executadas
2. ⏳ Configurar serviço de email para envio de convites (opcional)
3. ⏳ Configurar usuário super admin via SQL (se necessário)
4. ✅ Sistema pronto para uso!

---

**Sistema totalmente funcional!** Use as configurações para gerenciar usuários, enviar convites e configurar permissões detalhadas para sua clínica.
