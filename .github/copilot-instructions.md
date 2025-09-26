# PhysioFlow Plus - AI Agent Instructions

## Project Overview
PhysioFlow Plus is a comprehensive physiotherapy clinic management system built with React/TypeScript, Supabase, and WhatsApp API integration. The system manages patients, appointments, professionals, finances, and automated WhatsApp communications.

## Architecture & Key Patterns

### Database Schema Convention
**Critical**: Database uses `snake_case` columns, TypeScript interfaces use `camelCase` properties.
- Database: `patient_id`, `full_name`, `created_at`
- TypeScript: `patientId`, `fullName`, `createdAt`
- Always transform keys when updating database records (see `useAgendaLogic.ts:94-106`)

### Context Architecture
- **ClinicContext** (`src/contexts/ClinicContext.tsx`): Central data store with CRUD operations for all entities
- **AuthContext** (`src/contexts/AuthContext.tsx`): Authentication with extended `AppUser` type including profile and clinicId
- Multi-tenant architecture: All entities filtered by `clinic_id`

### Data Transformation Patterns
```typescript
// Example from ClinicContext - DB to Frontend transformation
const dbToMainAppointment = (dbAppt: DbAppointment): MainAppointment => ({
  id: dbAppt.id,
  patientId: dbAppt.patient_id,  // snake_case to camelCase
  professionalId: dbAppt.professional_id,
  // ... other transformations
});
```

## WhatsApp Integration System

### Edge Functions Architecture
- **send-whatsapp-message**: Sends messages via Evolution API
- **whatsapp-webhook**: Processes incoming confirmation responses
- **whatsapp-response-webhook**: Handles patient responses and notifies professionals

### Integration Points
- Uses Evolution API with instance-based authentication
- Webhook URL pattern: `${SUPABASE_URL}/functions/v1/whatsapp-webhook`
- All WhatsApp functions require `base_url`, `instance_name`, `api_key` from `whatsapp_settings` table
- Phone number normalization handles Brazilian format variations

### Message Templates
Templates support placeholders: `{nome}`, `{data}`, `{horario}`, `{fisioterapeuta}`, `{title}`
- Stored in `whatsapp_settings` table
- Professional title detection: `isDra` logic based on first name ending

## Development Workflows

### Key Commands
```bash
npm run dev          # Development server (Vite)
npm run build        # Production build
npm run build:dev    # Development build
```

### Database Operations
- Use `supabase` client from `@/integrations/supabase/client`
- All mutations should update local state via Context methods
- Realtime subscriptions configured for appointments table
- Edge functions use `SUPABASE_SERVICE_ROLE_KEY` for elevated permissions

## Component Patterns

### Form Components
- Use `react-hook-form` with `zod` validation
- shadcn/ui components for consistent styling
- Toast notifications with `sonner`

### Page Structure
```typescript
// Standard page component pattern
export function PageComponent() {
  const { data, updateMethod } = useClinic();
  const [loading, setLoading] = useState(false);
  
  // Component logic...
  
  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Responsive header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Content */}
      </div>
    </div>
  );
}
```

### Responsive Design
- Mobile-first approach with Tailwind CSS
- Use `sm:`, `md:`, `lg:` breakpoints consistently
- Sidebar pattern with shadcn/ui `Sidebar` components

## Critical Files
- **Types**: `src/types/index.ts` - Central type definitions
- **Database Types**: `src/integrations/supabase/types.ts` - Generated Supabase types
- **Contexts**: Main data management in `src/contexts/`
- **Edge Functions**: `supabase/functions/` - Server-side WhatsApp logic
- **Migrations**: `supabase/migrations/` - Database schema evolution

## Common Gotchas
1. **Column Case Mismatch**: Always use key transformation when updating DB records
2. **Phone Normalization**: Brazilian phones need format variations handling
3. **Clinic Filtering**: All operations must respect `clinic_id` multi-tenancy
4. **Realtime Updates**: Use Context methods to maintain UI consistency
5. **WhatsApp API**: Requires active `whatsapp_settings` with valid credentials

## Dependencies
- **Frontend**: React 18, TypeScript, Vite, Tailwind, shadcn/ui
- **Backend**: Supabase (Auth, Database, Edge Functions, Realtime)
- **External APIs**: Evolution API for WhatsApp integration
- **Key Libraries**: react-query, react-hook-form, date-fns, zod