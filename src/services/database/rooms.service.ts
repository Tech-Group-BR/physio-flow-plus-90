/**
 * Rooms Service
 * 
 * Camada de serviço para operações de banco de dados relacionadas a salas de atendimento.
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  roomDbToFrontend, 
  roomFrontendToDb, 
  roomsBatchDbToFrontend,
  type DbRoom 
} from '@/services/mappers/room.mapper';
import type { Room } from '@/types';

export class RoomsService {
  /**
   * Fetch all rooms for a clinic
   */
  static async fetchAll(clinicId: string): Promise<Room[]> {
    console.log('🔍 [RoomsService] Fetching all rooms for clinic:', clinicId);
    
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ [RoomsService] Error fetching rooms:', error);
      throw new Error(`Failed to fetch rooms: ${error.message}`);
    }

    console.log(`✅ [RoomsService] Fetched ${data?.length || 0} rooms`);
    return roomsBatchDbToFrontend(data || []);
  }

  /**
   * Fetch a single room by ID
   */
  static async fetchById(id: string): Promise<Room> {
    console.log('🔍 [RoomsService] Fetching room by ID:', id);
    
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ [RoomsService] Error fetching room:', error);
      throw new Error(`Failed to fetch room: ${error.message}`);
    }

    if (!data) {
      throw new Error('Room not found');
    }

    console.log('✅ [RoomsService] Room fetched:', data.name);
    return roomDbToFrontend(data);
  }

  /**
   * Create a new room
   */
  static async create(
    clinicId: string, 
    room: Omit<Room, 'id'>
  ): Promise<Room> {
    console.log('➕ [RoomsService] Creating room:', room.name);
    
    const dbRoom = roomFrontendToDb(room);
    
    const insertData: any = {
      ...dbRoom,
      clinic_id: clinicId
    };

    const { data, error } = await supabase
      .from('rooms')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ [RoomsService] Error creating room:', error);
      throw new Error(`Failed to create room: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to create room: No data returned');
    }

    console.log('✅ [RoomsService] Room created with ID:', data.id);
    return roomDbToFrontend(data);
  }

  /**
   * Update an existing room
   */
  static async update(id: string, updates: Partial<Room>): Promise<Room> {
    console.log('📝 [RoomsService] Updating room:', id);
    
    const dbUpdates = roomFrontendToDb(updates);
    
    const updateData = {
      ...dbUpdates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('rooms')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ [RoomsService] Error updating room:', error);
      throw new Error(`Failed to update room: ${error.message}`);
    }

    if (!data) {
      throw new Error('Room not found or update failed');
    }

    console.log('✅ [RoomsService] Room updated:', data.name);
    return roomDbToFrontend(data);
  }

  /**
   * Delete a room
   */
  static async delete(id: string): Promise<void> {
    console.log('🗑️ [RoomsService] Deleting room:', id);
    
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ [RoomsService] Error deleting room:', error);
      throw new Error(`Failed to delete room: ${error.message}`);
    }

    console.log('✅ [RoomsService] Room deleted');
  }

  /**
   * Fetch active rooms only
   */
  static async fetchActive(clinicId: string): Promise<Room[]> {
    console.log('🔍 [RoomsService] Fetching active rooms');
    
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ [RoomsService] Error fetching active rooms:', error);
      throw new Error(`Failed to fetch active rooms: ${error.message}`);
    }

    console.log(`✅ [RoomsService] Fetched ${data?.length || 0} active rooms`);
    return roomsBatchDbToFrontend(data || []);
  }
}
