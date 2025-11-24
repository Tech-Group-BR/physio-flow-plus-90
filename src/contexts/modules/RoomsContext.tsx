/**
 * Rooms Context
 * 
 * Context modularizado para gerenciamento de salas de atendimento.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { RoomsService } from '@/services/database/rooms.service';
import { globalCache, CACHE_KEYS, CACHE_TTL } from '@/lib/globalCache';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Room } from '@/types';

interface RoomsContextType {
  rooms: Room[];
  loading: boolean;
  error: string | null;
  fetchRooms: () => Promise<void>;
  addRoom: (room: Omit<Room, 'id'>) => Promise<Room | undefined>;
  updateRoom: (id: string, updates: Partial<Room>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  getRoomById: (id: string) => Room | undefined;
  getActiveRooms: () => Room[];
  refreshRooms: () => Promise<void>;
}

const RoomsContext = createContext<RoomsContextType | undefined>(undefined);

export function RoomsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const clinicId = user?.profile?.clinic_id;
  
  const isInitialized = useRef(false);
  const lastClinicId = useRef<string | null>(null);
  
  const [rooms, setRooms] = useState<Room[]>(() => {
    if (clinicId) {
      const cached = globalCache.get<Room[]>(CACHE_KEYS.ROOMS, clinicId, CACHE_TTL.MEDIUM);
      if (cached) {
        console.log('⚡ [RoomsContext] Loaded from cache:', cached.length);
        return cached;
      }
    }
    return [];
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clinicId && lastClinicId.current && clinicId !== lastClinicId.current) {
      console.log('🔄 [RoomsContext] Clinic changed, resetting state');
      setRooms([]);
      setError(null);
      if (lastClinicId.current) globalCache.invalidateClinic(lastClinicId.current);
      isInitialized.current = false;
    }
    lastClinicId.current = clinicId || null;
  }, [clinicId]);

  useEffect(() => {
    if (isInitialized.current || !clinicId) return;
    
    const cached = globalCache.get<Room[]>(CACHE_KEYS.ROOMS, clinicId, CACHE_TTL.MEDIUM);
    if (cached) {
      console.log('⚡ [RoomsContext] Using cached data on mount');
      setRooms(cached);
      isInitialized.current = true;
      return;
    }
    
    console.log('🚀 [RoomsContext] Initial load for clinic:', clinicId);
    isInitialized.current = true;
    fetchRooms();
  }, [clinicId]);

  const fetchRooms = useCallback(async () => {
    if (!clinicId) {
      console.warn('⚠️ [RoomsContext] Cannot fetch: No clinic ID');
      return;
    }

    const cached = globalCache.get<Room[]>(CACHE_KEYS.ROOMS, clinicId, CACHE_TTL.MEDIUM);
    if (cached) {
      console.log('⚡ [RoomsContext] Using cached rooms:', cached.length);
      setRooms(cached);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 [RoomsContext] Fetching rooms from database...');
      const data = await RoomsService.fetchAll(clinicId);
      
      setRooms(data);
      globalCache.set(CACHE_KEYS.ROOMS, data, clinicId, CACHE_TTL.MEDIUM);
      
      console.log(`✅ [RoomsContext] Loaded ${data.length} rooms`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch rooms';
      console.error('❌ [RoomsContext] Error fetching rooms:', err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  const addRoom = useCallback(async (
    room: Omit<Room, 'id'>
  ): Promise<Room | undefined> => {
    if (!clinicId) {
      console.warn('⚠️ [RoomsContext] Cannot add: No clinic ID');
      toast.error('Erro: Clínica não identificada');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('➕ [RoomsContext] Adding room:', room.name);
      const newRoom = await RoomsService.create(clinicId, room);
      
      setRooms(prev => [...prev, newRoom]);
      globalCache.invalidate(CACHE_KEYS.ROOMS);
      
      toast.success(`Sala ${newRoom.name} adicionada com sucesso!`);
      console.log('✅ [RoomsContext] Room added:', newRoom.id);
      
      return newRoom;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add room';
      console.error('❌ [RoomsContext] Error adding room:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  const updateRoom = useCallback(async (id: string, updates: Partial<Room>) => {
    if (!clinicId) {
      console.warn('⚠️ [RoomsContext] Cannot update: No clinic ID');
      toast.error('Erro: Clínica não identificada');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('📝 [RoomsContext] Updating room:', id);
      const updatedRoom = await RoomsService.update(id, updates);
      
      setRooms(prev => prev.map(r => r.id === id ? updatedRoom : r));
      globalCache.invalidate(CACHE_KEYS.ROOMS);
      
      toast.success('Sala atualizada com sucesso!');
      console.log('✅ [RoomsContext] Room updated:', id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update room';
      console.error('❌ [RoomsContext] Error updating room:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  const deleteRoom = useCallback(async (id: string) => {
    if (!clinicId) {
      console.warn('⚠️ [RoomsContext] Cannot delete: No clinic ID');
      toast.error('Erro: Clínica não identificada');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🗑️ [RoomsContext] Deleting room:', id);
      await RoomsService.delete(id);
      
      setRooms(prev => prev.filter(r => r.id !== id));
      globalCache.invalidate(CACHE_KEYS.ROOMS);
      
      toast.success('Sala removida com sucesso!');
      console.log('✅ [RoomsContext] Room deleted:', id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete room';
      console.error('❌ [RoomsContext] Error deleting room:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  const getRoomById = useCallback((id: string): Room | undefined => {
    return rooms.find(r => r.id === id);
  }, [rooms]);

  const getActiveRooms = useCallback((): Room[] => {
    return rooms.filter(r => r.is_active);
  }, [rooms]);

  const refreshRooms = useCallback(async () => {
    if (!clinicId) return;
    globalCache.invalidate(CACHE_KEYS.ROOMS);
    await fetchRooms();
  }, [clinicId, fetchRooms]);

  const value: RoomsContextType = {
    rooms,
    loading,
    error,
    fetchRooms,
    addRoom,
    updateRoom,
    deleteRoom,
    getRoomById,
    getActiveRooms,
    refreshRooms
  };

  return (
    <RoomsContext.Provider value={value}>
      {children}
    </RoomsContext.Provider>
  );
}

export function useRooms(): RoomsContextType {
  const context = useContext(RoomsContext);
  if (!context) {
    throw new Error('useRooms must be used within a RoomsProvider');
  }
  return context;
}
