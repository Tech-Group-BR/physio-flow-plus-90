import { useState, useEffect } from "react";
import { Professional, Patient, Appointment } from "@/types";
import { useClinic } from '@/contexts/ClinicContext';
import { useAuth } from '@/contexts/AuthContext';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { toast } from "sonner";
import { normalizePhone, validatePhone as isValidPhone } from '@/shared/utils';

interface ProfessionalStats {
  totalAppointments: number;
  completedAppointments: number;
  totalPatients: number;
  monthlyRevenue: number;
  monthlyPending: number;
  averageRating: number;
  completionRate: number;
  upcomingAppointments: number;
  cancelledAppointments: number;
  revenueGrowth: number;
  patientsGrowth: number;
}

export function useProfessionalDetails(professionalId: string | undefined) {
  const { 
    professionals, 
    patients, 
    appointments, 
    accountsReceivable,
    updateProfessional 
  } = useClinic();
  const { clinicId } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    crefito: '',
    specialties: [] as string[],
    bio: '',
    isActive: true,
    profile_picture_url: '',
  });
  const [stats, setStats] = useState<ProfessionalStats>({
    totalAppointments: 0,
    completedAppointments: 0,
    totalPatients: 0,
    monthlyRevenue: 0,
    monthlyPending: 0,
    averageRating: 4.8,
    completionRate: 0,
    upcomingAppointments: 0,
    cancelledAppointments: 0,
    revenueGrowth: 0,
    patientsGrowth: 0
  });

  const professional = professionals.find(p => p.id === professionalId);

  // Dados calculados
  const professionalAppointments = appointments.filter(a => a.professionalId === professionalId);
  const uniquePatientIds = new Set(
    professionalAppointments
      .filter(a => a.status === 'realizado')
      .map(a => a.patientId)
  );
  const professionalPatients = patients.filter(p => uniquePatientIds.has(p.id));
  const professionalRevenue = accountsReceivable.filter(ar => ar.professional_id === professionalId);

  // Calcular estatísticas
  useEffect(() => {
    if (!professional || !professionalId) {
      setIsLoading(false);
      return;
    }

    console.log('🔄 Calculando estatísticas para profissional:', professional.name);

    const now = new Date();
    const currentMonth = {
      start: startOfMonth(now),
      end: endOfMonth(now)
    };

    const completedAppointments = professionalAppointments.filter(a => 
      a.status === 'realizado'
    );
    
    const upcomingAppointments = professionalAppointments.filter(a => 
      new Date(a.date) > now && (a.status === 'marcado' || a.status === 'confirmado')
    );

    const cancelledAppointments = professionalAppointments.filter(a => 
      a.status === 'cancelado'
    );

    // Receita mensal baseada no professional_id direto do banco
    const monthlyReceivables = accountsReceivable.filter(ar => 
      ar.professional_id === professionalId &&
      isWithinInterval(new Date(ar.dueDate), currentMonth) &&
      ar.status === 'pago'
    );

    const monthlyRevenue = monthlyReceivables.reduce((sum, ar) => sum + ar.amount, 0);

    // Valores a receber (pendentes) do mês atual
    const pendingReceivables = accountsReceivable.filter(ar => 
      ar.professional_id === professionalId &&
      isWithinInterval(new Date(ar.dueDate), currentMonth) &&
      ar.status === 'pendente'
    );

    const monthlyPending = pendingReceivables.reduce((sum, ar) => sum + ar.amount, 0);

    // Calcular evolução mensal real (mês atual vs anterior)
    const lastMonth = {
      start: startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      end: endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1))
    };

    const lastMonthRevenue = accountsReceivable
      .filter(ar => 
        ar.professional_id === professionalId &&
        isWithinInterval(new Date(ar.dueDate), lastMonth) &&
        ar.status === 'pago'
      )
      .reduce((sum, ar) => sum + ar.amount, 0);

    const lastMonthPatients = new Set(
      professionalAppointments
        .filter(a => 
          isWithinInterval(new Date(a.date), lastMonth) && 
          a.status === 'realizado'
        )
        .map(a => a.patientId)
    ).size;

    const revenueGrowth = lastMonthRevenue > 0 
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : monthlyRevenue > 0 ? 100 : 0;

    const uniquePatients = uniquePatientIds.size;
    
    const completionRate = professionalAppointments.length > 0 
      ? (completedAppointments.length / professionalAppointments.length) * 100 
      : 0;

    const patientsGrowth = lastMonthPatients > 0 
      ? ((uniquePatients - lastMonthPatients) / lastMonthPatients) * 100 
      : uniquePatients > 0 ? 100 : 0;

    setStats({
      totalAppointments: professionalAppointments.length,
      completedAppointments: completedAppointments.length,
      totalPatients: uniquePatients,
      monthlyRevenue,
      monthlyPending,
      averageRating: 0, // Sistema de avaliação não implementado
      completionRate,
      upcomingAppointments: upcomingAppointments.length,
      cancelledAppointments: cancelledAppointments.length,
      revenueGrowth,
      patientsGrowth
    });

    setIsLoading(false);
  }, [professional?.id, appointments, accountsReceivable, professionalId]);

  // Initialize edit form when professional changes
  useEffect(() => {
    if (professional) {
      setEditFormData({
        name: professional.name,
        email: professional.email,
        phone: professional.phone,
        crefito: professional.crefito,
        specialties: professional.specialties || [],
        bio: professional.bio || '',
        isActive: professional.isActive,
        profile_picture_url: professional.profile_picture_url || '',
      });
    }
  }, [professional]);

  const handleSaveProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professional) return;

    // Normalize and validate phone
    const normalizedPhone = editFormData.phone ? normalizePhone(editFormData.phone) : '';

    if (editFormData.phone && !isValidPhone(normalizedPhone)) {
      toast.error('Telefone inválido. Use o formato: (66) 99999-9999');
      return;
    }

    try {
      await updateProfessional(professional.id, {
        ...editFormData,
        phone: normalizedPhone
      });
      setIsEditDialogOpen(false);
      toast.success('Profissional atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar profissional');
      console.error('Erro:', error);
    }
  };

  return {
    professional,
    professionalPatients,
    professionalAppointments,
    professionalRevenue,
    stats,
    isLoading,
    isEditDialogOpen,
    setIsEditDialogOpen,
    editFormData,
    setEditFormData,
    handleSaveProfessional
  };
}