import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, DollarSign, Calendar, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PatientFinancialData {
  patient_id: string;
  patient_name: string;
  session_value: number;
  total_appointments: number;
  confirmed_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  missed_appointments: number;
  total_billed: number;
  total_receivable: number;
  total_received: number;
  total_pending: number;
}

export function PatientFinancialReport() {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [reportData, setReportData] = useState<PatientFinancialData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setPatients(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar pacientes:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de pacientes",
        variant: "destructive",
      });
    }
  };

  const generateReport = async () => {
    if (!selectedPatient) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patient_financial_report')
        .select('*')
        .eq('patient_id', selectedPatient)
        .single();

      if (error) throw error;
      setReportData(data);
    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório financeiro",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!reportData) return;

    const csvContent = [
      "Campo,Valor",
      `Paciente,${reportData.patient_name}`,
      `Valor da Sessão,R$ ${reportData.session_value.toFixed(2)}`,
      `Total de Consultas,${reportData.total_appointments}`,
      `Consultas Confirmadas,${reportData.confirmed_appointments}`,
      `Consultas Realizadas,${reportData.completed_appointments}`,
      `Consultas Canceladas,${reportData.cancelled_appointments}`,
      `Faltas,${reportData.missed_appointments}`,
      `Total Faturado,R$ ${reportData.total_billed.toFixed(2)}`,
      `Total a Receber,R$ ${reportData.total_receivable.toFixed(2)}`,
      `Total Recebido,R$ ${reportData.total_received.toFixed(2)}`,
      `Pendente,R$ ${reportData.total_pending.toFixed(2)}`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_${reportData.patient_name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          Relatório Financeiro por Paciente
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecionar Paciente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger className="w-full sm:w-80">
                <SelectValue placeholder="Selecione um paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={generateReport} 
              disabled={!selectedPatient || loading}
              className="w-full sm:w-auto"
            >
              {loading ? "Gerando..." : "Gerar Relatório"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <div className="grid gap-6">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Valor da Sessão</p>
                    <p className="text-2xl font-bold text-green-600">
                      R$ {reportData.session_value.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Consultas</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {reportData.total_appointments}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Faturado</p>
                    <p className="text-2xl font-bold text-green-600">
                      R$ {reportData.total_billed.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pendente</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      R$ {reportData.total_pending.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detalhes do Relatório */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Detalhes do Relatório - {reportData.patient_name}</CardTitle>
              <Button onClick={exportReport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Consultas Confirmadas</TableCell>
                    <TableCell className="text-right">{reportData.confirmed_appointments}</TableCell>
                    <TableCell className="text-right">
                      R$ {(reportData.confirmed_appointments * reportData.session_value).toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Consultas Realizadas</TableCell>
                    <TableCell className="text-right">{reportData.completed_appointments}</TableCell>
                    <TableCell className="text-right">
                      R$ {(reportData.completed_appointments * reportData.session_value).toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Consultas Canceladas</TableCell>
                    <TableCell className="text-right">{reportData.cancelled_appointments}</TableCell>
                    <TableCell className="text-right">R$ 0,00</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Faltas</TableCell>
                    <TableCell className="text-right">{reportData.missed_appointments}</TableCell>
                    <TableCell className="text-right">R$ 0,00</TableCell>
                  </TableRow>
                  <TableRow className="font-semibold">
                    <TableCell>Total Faturado</TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right">R$ {reportData.total_billed.toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Resumo Financeiro</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total a Receber:</span>
                    <span className="ml-2 font-semibold">R$ {reportData.total_receivable.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Recebido:</span>
                    <span className="ml-2 font-semibold text-green-600">R$ {reportData.total_received.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Pendente:</span>
                    <span className="ml-2 font-semibold text-yellow-600">R$ {reportData.total_pending.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}