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
  '07:00', '07:15', '07:30', '07:45', '08:00', '08:15', '08:30', '08:45', 
  '09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45',
  '11:00', '11:15', '11:30', '11:45', '12:00', '12:15', '12:30', '12:45',
  '13:00', '13:15', '13:30', '13:45', '14:00', '14:15', '14:30', '14:45',
  '15:00', '15:15', '15:30', '15:45', '16:00', '16:15', '16:30', '16:45',
  '17:00', '17:15', '17:30', '17:45', '18:00', '18:15', '18:30', '18:45',
  '19:00', '19:15', '19:30', '19:45'
];

export const durationOptions = [
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 75, label: '1h 15min' },
  { value: 90, label: '1h 30min' },
  { value: 105, label: '1h 45min' },
  { value: 120, label: '2 horas' }
];