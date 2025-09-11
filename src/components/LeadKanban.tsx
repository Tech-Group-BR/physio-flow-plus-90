
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@/types";
import { format } from "date-fns";

interface LeadKanbanProps {
  leads: Lead[];
}

export function LeadKanban({ leads }: LeadKanbanProps) {
  const columns = [
    { id: 'novo', title: 'Novos Leads', status: 'novo' as const },
    { id: 'contato_inicial', title: 'Contato Inicial', status: 'contato_inicial' as const },
    { id: 'agendamento', title: 'Agendamento', status: 'agendamento' as const },
    { id: 'avaliacao', title: 'Avaliação', status: 'avaliacao' as const },
    { id: 'proposta', title: 'Proposta', status: 'proposta' as const },
    { id: 'cliente', title: 'Cliente', status: 'cliente' as const },
    { id: 'perdido', title: 'Perdido', status: 'perdido' as const }
  ];

  const getLeadsByStatus = (status: Lead['status']) => {
    return leads.filter(lead => lead.status === status);
  };

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'novo': return 'bg-blue-100';
      case 'contato_inicial': return 'bg-yellow-100';
      case 'agendamento': return 'bg-orange-100';
      case 'avaliacao': return 'bg-purple-100';
      case 'proposta': return 'bg-indigo-100';
      case 'cliente': return 'bg-green-100';
      case 'perdido': return 'bg-red-100';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 min-h-[600px]">
      {columns.map((column) => {
        const columnLeads = getLeadsByStatus(column.status);
        return (
          <div key={column.id} className="space-y-4">
            <div className={`p-3 rounded-lg ${getStatusColor(column.status)}`}>
              <h3 className="font-semibold text-sm">{column.title}</h3>
              <p className="text-xs text-muted-foreground">{columnLeads.length} leads</p>
            </div>
            
            <div className="space-y-3">
              {columnLeads.map((lead) => (
                <Card key={lead.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">{lead.name}</h4>
                      <p className="text-xs text-muted-foreground">{lead.email}</p>
                      <p className="text-xs text-muted-foreground">{lead.phone}</p>
                      
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="text-xs">
                          {lead.source}
                        </Badge>
                        {lead.lastContact && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(lead.lastContact), 'dd/MM')}
                          </span>
                        )}
                      </div>
                      
                      {lead.treatmentInterest && (
                        <p className="text-xs text-muted-foreground truncate">
                          {lead.treatmentInterest}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
