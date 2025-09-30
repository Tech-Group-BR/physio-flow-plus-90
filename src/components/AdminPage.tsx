import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { Settings, Users, CreditCard, FileText, Crown, BarChart3, Shield } from "lucide-react"
import { toast } from "sonner"

export function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [clinics, setClinics] = useState<any[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<string | null>(null);
  const [entryCode, setEntryCode] = useState<string>("");
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);

  // Só permite acesso se for super admin
  useEffect(() => {
    if (!loading && user?.profile?.role !== "super") {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Carregar clínicas disponíveis
  useEffect(() => {
    if (user?.profile?.role === "super") {
      supabase
        .from("clinic_settings")
        .select("id, name")
        .then(({ data }) => {
          setClinics(data || []);
        });
    }
  }, [user]);

  // Se super admin, pode navegar entre clínicas
  const handleSelectClinic = (clinicId: string) => {
    setSelectedClinic(clinicId);
    setShowAdminPanel(false);
  };

  // Se código de entrada for 000000, mostra painel admin
  const handleEntryCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.profile?.role === "super" && entryCode === "000000") {
      setShowAdminPanel(true);
      setSelectedClinic(null);
      toast.success("Acesso ao painel de super admin liberado!");
    } else {
      toast.error("Código inválido ou permissão insuficiente.");
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-blue-800">Painel do Super Admin</h1>

      {/* Formulário de entrada para super admin */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Entrar como Super Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEntryCodeSubmit} className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Código de entrada (000000)"
              value={entryCode}
              onChange={e => setEntryCode(e.target.value)}
              className="border rounded px-3 py-2"
            />
            <Button type="submit">Entrar</Button>
          </form>
        </CardContent>
      </Card>

      {/* Navegação entre clínicas */}
      {!showAdminPanel && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Selecionar Clínica</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {clinics.map((clinic) => (
                <Button
                  key={clinic.id}
                  variant={selectedClinic === clinic.id ? "default" : "outline"}
                  onClick={() => handleSelectClinic(clinic.id)}
                >
                  {clinic.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Painel de gestão inicial */}
      {showAdminPanel && (
        <Card>
          <CardHeader>
            <CardTitle>Gestão Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li>
                <Button variant="outline" onClick={() => alert('Em breve: Editar Landing Page')}>Editar Landing Page</Button>
              </li>
              <li>
                <Button variant="outline" onClick={() => alert('Em breve: Gerenciar Planos')}>Gerenciar Planos</Button>
              </li>
              <li>
                <Button variant="outline" onClick={() => alert('Em breve: Gerenciar Planos Comprados')}>Planos Comprados</Button>
              </li>
              <li>
                <Button variant="outline" onClick={() => alert('Em breve: Dar Período Grátis')}>Dar Período Grátis</Button>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}