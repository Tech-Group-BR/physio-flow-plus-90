export const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmado': return 'bg-green-100 text-green-800 border-green-300';
    case 'marcado': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'faltante': return 'bg-red-50 text-red-700 border-red-200';
    case 'cancelado': return 'bg-red-100 text-red-800 border-red-300';
    case 'realizado': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default: return 'bg-blue-50 text-blue-700 border-blue-200';
  }
};

export const timeSlots = [
  '07:00', '07:45', '08:30', '09:15', '10:00', '10:45', '11:30', 
  '13:00', '13:45', '14:30', '15:15', '16:00', '16:45', '17:30', '18:15'
];

export const durationOptions = [
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 75, label: '1h 15min' },
  { value: 90, label: '1h 30min' },
  { value: 105, label: '1h 45min' },
  { value: 120, label: '2 horas' }
];

// Calcular quantos slots um agendamento deve ocupar baseado na duração de 45 minutos
export const calculateSlotsForDuration = (duration: number): number => {
  return Math.ceil(duration / 45); // 45 minutos = 1 slot
};

// Obter todos os slots que um agendamento ocupa
export const getOccupiedSlots = (startTime: string, duration: number = 45): string[] => {
  const startIndex = timeSlots.indexOf(startTime);
  if (startIndex === -1) return [startTime];
  
  const slotsNeeded = calculateSlotsForDuration(duration);
  const occupiedSlots: string[] = [];
  
  for (let i = 0; i < slotsNeeded && (startIndex + i) < timeSlots.length; i++) {
    occupiedSlots.push(timeSlots[startIndex + i]);
  }
  
  return occupiedSlots;
};

// Verificar se um slot está ocupado por algum agendamento
export const isSlotOccupied = (targetTime: string, targetDate: Date, appointments: any[]): boolean => {
  return appointments.some(appointment => {
    if (!appointment.date || !appointment.time) return false;
    
    const appointmentDate = new Date(appointment.date + 'T00:00:00');
    if (!isSameDay(appointmentDate, targetDate)) return false;
    
    const occupiedSlots = getOccupiedSlots(appointment.time, appointment.duration || 45);
    return occupiedSlots.includes(targetTime);
  });
};

// Verificar se é possível agendar em um horário específico
export const canScheduleAtTime = (
  targetTime: string, 
  targetDate: Date, 
  duration: number, 
  appointments: any[]
): boolean => {
  const requiredSlots = getOccupiedSlots(targetTime, duration);
  
  return !requiredSlots.some(slot => 
    isSlotOccupied(slot, targetDate, appointments)
  );
};

// Helper para verificar se duas datas são iguais
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};