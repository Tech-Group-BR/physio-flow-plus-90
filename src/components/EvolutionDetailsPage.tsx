import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Evolution } from '@/types';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useClinic } from '@/contexts/ClinicContext'; // Importe o useClinic

export function EvolutionDetailsPage() {
  const { evoId } = useParams<{ evoId: string }>();
  const navigate = useNavigate();
  const { evolutions, fetchEvolutions } = useClinic(); // Importe a função de fetch, se houver

  const [isLoading, setIsLoading] = useState(true);

  // Encontra a evolução com base no ID da URL
  const evolution = evolutions.find(e => e.id === evoId);

  useEffect(() => {
    // Se a evolução não for encontrada, tenta recarregar os dados do contexto
    if (!evolution) {
      // Se você tiver uma função para buscar evoluções, chame-a aqui.
      // Exemplo: fetchEvolutions().then(() => setIsLoading(false));
      // Se não, você pode definir um estado de erro
      setIsLoading(false); // Define como falso mesmo que não encontre, para não travar
    } else {
      setIsLoading(false);
    }
  }, [evoId, evolution, fetchEvolutions]);

  // Exibe um estado de carregamento enquanto busca os dados
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Exibe uma mensagem de erro se a evolução não for encontrada
  if (!evolution) {
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-red-600">Evolução não encontrada.</h1>
        <Button className="mt-4" onClick={() => navigate(-1)}>
          Voltar
        </Button>
      </div>
    );
  }

  // Agora que a evolução está garantida, a renderização é segura.
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-3xl font-bold">Detalhes da Evolução</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Evolução</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <strong>Data:</strong> {format(new Date(evolution.date), 'dd/MM/yyyy')}
          </p>
          <p>
            <strong>Observações:</strong> {evolution.observations}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}