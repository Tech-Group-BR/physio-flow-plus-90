import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AgendaFiltersProps {
  selectedDate: Date;
  viewMode: "day" | "week";
  selectedPhysio: string;
  selectedRoom: string;
  professionals: any[];
  rooms: any[];
  onViewModeChange: (mode: "day" | "week") => void;
  onPhysioChange: (physio: string) => void;
  onRoomChange: (room: string) => void;
  onNavigateDate: (direction: 'prev' | 'next' | 'today') => void;
}

export function AgendaFilters({
  selectedDate,
  viewMode,
  selectedPhysio,
  selectedRoom,
  professionals,
  rooms,
  onViewModeChange,
  onPhysioChange,
  onRoomChange,
  onNavigateDate
}: AgendaFiltersProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Navigation */}
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => onNavigateDate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onNavigateDate('today')}>
              Hoje
            </Button>
            <Button variant="outline" size="sm" onClick={() => onNavigateDate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Date Display */}
          <div className="text-lg font-semibold text-gray-900 flex-1 lg:text-center">
            {viewMode === "week" 
              ? `${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd/MM')} - ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd/MM/yyyy')}`
              : format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })
            }
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Select value={viewMode} onValueChange={onViewModeChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Dia</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPhysio} onValueChange={onPhysioChange}>
              <SelectTrigger className="w-40 lg:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Fisioterapeuta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {professionals.map((physio) => (
                  <SelectItem key={physio.id} value={physio.id}>
                    {physio.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRoom} onValueChange={onRoomChange}>
              <SelectTrigger className="w-32 lg:w-40">
                <SelectValue placeholder="Sala" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}