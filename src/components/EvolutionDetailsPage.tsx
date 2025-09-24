import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useClinic } from '@/contexts/ClinicContext';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

export function EvolutionDetailsPage() {
  const { evoId } = useParams<{ evoId: string }>();
  const navigate = useNavigate();
  const { evolutions, professionals } = useClinic();

  const [isLoading, setIsLoading] = useState(true);

  // Encontra a evolução e o profissional correspondente nos dados do contexto
  const evolution = evolutions.find(e => e.id === evoId);
  const professional = professionals.find(p => p.id === evolution?.professional_id);

  useEffect(() => {
    // A lógica de carregamento permanece a mesma
    // Em um app real, aqui você poderia buscar a evolução da API se ela não estiver no contexto
    setIsLoading(false);
  }, [evoId, evolution]);

  // Helper para renderizar um campo de texto, mantido por ser útil
  const renderDetailText = (label: string, value: string | undefined | null) => {
    if (!value || value.trim() === '') return null;
    return (
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-1">{label}</h3>
        <pre className="text-sm whitespace-pre-wrap font-sans text-gray-800 bg-muted/50 p-3 rounded-md">{value}</pre>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!evolution) {
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-red-600">Evolução não encontrada.</h1>
        <Button className="mt-4" onClick={() => navigate(-1)}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Detalhes da Evolução</h1>
          <p className="text-muted-foreground">
            Registrado em {format(new Date(evolution.date), 'dd/MM/yyyy')}
            {professional && ` por ${professional.name}`}
          </p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Resumo da Sessão</CardTitle>
          {/* Informa se a evolução está ou não visível para o paciente */}
          <CardDescription>
            {evolution.visibleToGuardian 
              ? "Esta evolução está visível para o paciente/responsável." 
              : "Esta evolução NÃO está visível para o paciente/responsável."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Campos de texto principais que foram mantidos */}
          {renderDetailText("Observações", evolution.observations)}
          {renderDetailText("Tratamento Realizado", evolution.treatmentPerformed)}
          
          {/* REMOVIDO: Exibição da Escala de Dor, Escala de Mobilidade e Próxima Sessão */}
          
          {/* Seção para exibir as fotos (funcionalidade mantida) */}
          {evolution.files && evolution.files.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Mídias da Evolução</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {evolution.files.map((file) =>
                  file.type === 'photo' || file.type === 'image' ? (
                    <a key={file.id} href={file.url} target="_blank" rel="noopener noreferrer" title="Clique para ampliar">
                      <img
                        src={file.url}
                        alt="Foto da evolução"
                        className="w-full h-32 object-cover rounded-lg border hover:opacity-80 transition-opacity"
                      />
                    </a>
                  ) : (
                    <div key={file.id} className="relative">
                      <video
                        src={file.url}
                        controls
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}