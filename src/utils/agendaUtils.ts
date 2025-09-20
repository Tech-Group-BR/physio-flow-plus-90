import { isSameDay } from 'date-fns';

/**
 * Mapeia o status do agendamento para uma classe de cor.
 * @param {string} status - O status do agendamento.
 * @returns {string} - As classes CSS para a cor.
 */
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

/**
 * Slots de tempo de 30 em 30 minutos.
 * Os horários de 07:00 às 20:00.
 */
export const timeSlots = [
  '07:00', '07:30', '08:00', '08:30', 
  '09:00', '09:30', '10:00', '10:30', 
  '11:00', '11:30', '12:00', '12:30', 
  '13:00', '13:30', '14:00', '14:30', 
  '15:00', '15:30', '16:00', '16:30', 
  '17:00', '17:30', '18:00', '18:30', 
  '19:00', '19:30'
];

/**
 * Opções de duração de agendamento em incrementos de 30 minutos.
 */
export const durationOptions = [
  { value: 30, label: '30 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1h 30min' },
  { value: 120, label: '2 horas' }
];

/**
 * Calcula quantos slots um agendamento deve ocupar com base na duração.
 * @param {number} duration - Duração do agendamento em minutos.
 * @returns {number} - O número de slots de 30 minutos.
 */
export const calculateSlotsForDuration = (duration: number): number => {
  return Math.ceil(duration / 30); // 30 minutos = 1 slot
};

/**
 * Obtém todos os slots que um agendamento ocupa.
 * @param {string} startTime - O horário de início do agendamento.
 * @param {number} duration - A duração do agendamento em minutos.
 * @returns {string[]} - Um array de strings com os horários dos slots ocupados.
 */
export const getOccupiedSlots = (startTime: string, duration: number): string[] => {
  const startIndex = timeSlots.indexOf(startTime);
  if (startIndex === -1) return [startTime];
  
  const slotsNeeded = calculateSlotsForDuration(duration);
  const occupiedSlots: string[] = [];
  
  for (let i = 0; i < slotsNeeded && (startIndex + i) < timeSlots.length; i++) {
    occupiedSlots.push(timeSlots[startIndex + i]);
  }
  
  return occupiedSlots;
};

/**
 * Verifica se um slot de tempo está ocupado por algum agendamento.
 * @param {string} targetTime - O horário do slot a ser verificado.
 * @param {Date} targetDate - A data do agendamento.
 * @param {any[]} appointments - Uma lista de agendamentos existentes.
 * @returns {boolean} - Verdadeiro se o slot estiver ocupado, falso caso contrário.
 */
export const isSlotOccupied = (targetTime: string, targetDate: Date, appointments: any[]): boolean => {
  return appointments.some(appointment => {
    if (!appointment.date || !appointment.time) return false;
    
    const appointmentDate = new Date(appointment.date + 'T00:00:00');
    if (!isSameDay(appointmentDate, targetDate)) return false;
    
    const occupiedSlots = getOccupiedSlots(appointment.time, appointment.duration || 60);
    return occupiedSlots.includes(targetTime);
  });
};

/**
 * Verifica se é possível agendar um novo compromisso em um horário e duração específicos.
 * @param {string} targetTime - O horário de início desejado.
 * @param {Date} targetDate - A data do agendamento.
 * @param {number} duration - A duração do agendamento em minutos.
 * @param {any[]} appointments - Uma lista de agendamentos existentes.
 * @returns {boolean} - Verdadeiro se for possível agendar, falso caso contrário.
 */
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

export { isSameDay };