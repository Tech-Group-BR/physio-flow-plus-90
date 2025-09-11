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
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
];