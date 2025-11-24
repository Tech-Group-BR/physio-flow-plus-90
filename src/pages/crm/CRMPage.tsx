
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useClinic } from "@/contexts/ClinicContext";
import { Plus, Search, Users, TrendingUp, Target, Phone } from "lucide-react";
import { LeadForm } from "@/components/forms/leads/LeadForm";
import { LeadKanban } from "@/components/LeadKanban";

export function CRMPage() {
  const { leads, dashboardStats } = useClinic();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<'kanban' | 'list'>('kanban');

  const filteredLeads = leads?.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone.includes(searchTerm)
  ) || [];

  const handleSave = () => {
    setShowForm(false);
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Novo Lead</h1>
        </div>
        <LeadForm onSave={handleSave} onCancel={handleCancel} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">CRM - Gestão de Leads</h1>
        <Button onClick={() => setShowForm(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Novo Lead</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Leads</p>
                <p className="text-2xl font-bold">{leads?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Novos Leads</p>
                <p className="text-2xl font-bold text-green-600">{dashboardStats?.newLeads || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Convertidos</p>
                <p className="text-2xl font-bold text-purple-600">{dashboardStats?.convertedLeads || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Phone className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-orange-600">
                  {leads && leads.length > 0 
                    ? ((dashboardStats?.convertedLeads || 0) / leads.length * 100).toFixed(1) 
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex space-x-2">
          <Button
            variant={view === 'kanban' ? 'default' : 'outline'}
            onClick={() => setView('kanban')}
          >
            Kanban
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            onClick={() => setView('list')}
          >
            Lista
          </Button>
        </div>
      </div>

      {view === 'kanban' ? (
        <LeadKanban leads={filteredLeads} />
      ) : (
        <div className="grid gap-4">
          {filteredLeads.map((lead) => (
            <Card key={lead.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">{lead.name}</h3>
                      <Badge variant={
                        lead.status === 'novo' ? 'default' :
                        lead.status === 'cliente' ? 'default' :
                        lead.status === 'perdido' ? 'destructive' : 'secondary'
                      }>
                        {lead.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <strong>Email:</strong> {lead.email}
                      </div>
                      <div>
                        <strong>Telefone:</strong> {lead.phone}
                      </div>
                      <div>
                        <strong>Origem:</strong> {lead.source}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredLeads.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  {searchTerm ? 
                    "Nenhum lead encontrado com os critérios de busca." : 
                    "Nenhum lead cadastrado."
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
