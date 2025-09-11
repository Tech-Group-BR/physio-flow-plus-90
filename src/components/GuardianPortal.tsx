
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClinic } from "@/contexts/ClinicContext";
import { Calendar, FileText, User, Camera, Play } from "lucide-react";
import { format } from "date-fns";

export function GuardianPortal() {
  const { patients, medicalRecords, appointments, currentUser } = useClinic();
  const [selectedPatient, setSelectedPatient] = useState<string>('');

  // Assuming current user is a guardian
  const guardianPatients = patients.filter(p => p.guardianId === currentUser?.id);
  const patient = guardianPatients.find(p => p.id === selectedPatient) || guardianPatients[0];

  if (!patient) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Nenhum paciente encontrado para este responsável.</p>
      </div>
    );
  }

  const patientRecord = medicalRecords.find(r => r.patientId === patient.id);
  const patientAppointments = appointments.filter(a => a.patientId === patient.id);
  const visibleEvolutions = patientRecord?.evolutions.filter(e => e.visibleToGuardian) || [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Portal do Responsável</h1>
        {guardianPatients.length > 1 && (
          <select 
            value={selectedPatient} 
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            {guardianPatients.map(p => (
              <option key={p.id} value={p.id}>{p.fullName}</option>
            ))}
          </select>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Informações do Paciente</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <strong>Nome:</strong> {patient.fullName}
            </div>
            <div>
              <strong>Data de Nascimento:</strong> {format(new Date(patient.birthDate), 'dd/MM/yyyy')}
            </div>
            <div>
              <strong>Tratamento:</strong> {patient.treatmentType}
            </div>
            <div>
              <strong>Status:</strong> 
              <Badge className="ml-2" variant={patient.isActive ? "default" : "secondary"}>
                {patient.isActive ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="evolution" className="space-y-4">
        <TabsList>
          <TabsTrigger value="evolution">Evolução do Tratamento</TabsTrigger>
          <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
          <TabsTrigger value="media">Fotos e Vídeos</TabsTrigger>
        </TabsList>

        <TabsContent value="evolution" className="space-y-4">
          <h2 className="text-xl font-semibold">Evolução do Tratamento</h2>
          {visibleEvolutions.length > 0 ? (
            <div className="space-y-4">
              {visibleEvolutions.map((evolution) => (
                <Card key={evolution.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">{format(new Date(evolution.date), 'dd/MM/yyyy')}</span>
                      </div>
                      <div className="flex space-x-4 text-sm">
                        <span>Dor: {evolution.painScale}/10</span>
                        <span>Mobilidade: {evolution.mobilityScale}/10</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <strong>Observações:</strong>
                        <p className="text-muted-foreground mt-1">{evolution.observations}</p>
                      </div>
                      
                      <div>
                        <strong>Tratamento Realizado:</strong>
                        <p className="text-muted-foreground mt-1">{evolution.treatmentPerformed}</p>
                      </div>
                      
                      {evolution.nextSession && (
                        <div>
                          <strong>Próxima Sessão:</strong>
                          <p className="text-muted-foreground mt-1">{evolution.nextSession}</p>
                        </div>
                      )}

                      {evolution.media && evolution.media.length > 0 && (
                        <div>
                          <strong>Mídia:</strong>
                          <div className="flex space-x-2 mt-2">
                            {evolution.media.map((media) => (
                              <div key={media.id} className="relative">
                                {media.type === 'photo' ? (
                                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                                    <Camera className="h-6 w-6 text-gray-500" />
                                  </div>
                                ) : (
                                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                                    <Play className="h-6 w-6 text-gray-500" />
                                  </div>
                                )}
                                {media.description && (
                                  <p className="text-xs text-center mt-1">{media.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  Nenhuma evolução disponível para visualização ainda.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <h2 className="text-xl font-semibold">Próximos Agendamentos</h2>
          {patientAppointments.length > 0 ? (
            <div className="space-y-4">
              {patientAppointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">
                            {format(new Date(appointment.date), 'dd/MM/yyyy')} às {appointment.time}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Duração: {appointment.duration} minutos
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Tratamento: {appointment.treatmentType}
                        </p>
                      </div>
                      <Badge variant={
                        appointment.status === 'confirmado' ? 'default' :
                        appointment.status === 'marcado' ? 'secondary' :
                        appointment.status === 'cancelado' ? 'destructive' : 'outline'
                      }>
                        {appointment.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  Nenhum agendamento encontrado.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <h2 className="text-xl font-semibold">Fotos e Vídeos do Tratamento</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {visibleEvolutions.flatMap(e => e.media || []).map((media) => (
              <Card key={media.id} className="aspect-square">
                <CardContent className="p-4 h-full flex flex-col">
                  <div className="flex-1 bg-gray-200 rounded-lg flex items-center justify-center mb-2">
                    {media.type === 'photo' ? (
                      <Camera className="h-8 w-8 text-gray-500" />
                    ) : (
                      <Play className="h-8 w-8 text-gray-500" />
                    )}
                  </div>
                  <p className="text-xs text-center">{media.description}</p>
                  <p className="text-xs text-center text-muted-foreground">
                    {format(new Date(media.uploadedAt), 'dd/MM/yyyy')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {visibleEvolutions.flatMap(e => e.media || []).length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  Nenhuma foto ou vídeo disponível ainda.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
