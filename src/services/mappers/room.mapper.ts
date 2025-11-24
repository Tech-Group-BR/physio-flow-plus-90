/**
 * Room Mapper
 * 
 * Responsável por transformar dados entre o formato do banco de dados (snake_case)
 * e o formato do frontend (camelCase) para salas de atendimento.
 */

import type { Room } from '@/types';

// ============================================================
// DATABASE TYPES (snake_case)
// ============================================================

export interface DbRoom {
  id: string;
  created_at: string;
  updated_at?: string;
  name: string;
  capacity?: number;
  equipment?: string[];
  is_active: boolean;
  clinic_id?: string;
}

// ============================================================
// MAIN MAPPERS
// ============================================================

/**
 * Convert database room (snake_case) to frontend room (camelCase)
 */
export const roomDbToFrontend = (dbRoom: DbRoom): Room => {
  return {
    id: dbRoom.id,
    name: dbRoom.name,
    capacity: dbRoom.capacity || 1,
    equipment: dbRoom.equipment || [],
    is_active: dbRoom.is_active
  };
};

/**
 * Convert frontend room (camelCase) to database format (snake_case)
 */
export const roomFrontendToDb = (room: Partial<Room>): Partial<DbRoom> => {
  const dbRoom: Partial<DbRoom> = {};

  if (room.name !== undefined) {
    dbRoom.name = room.name;
  }
  
  if (room.capacity !== undefined) {
    dbRoom.capacity = room.capacity;
  }
  
  if (room.equipment !== undefined) {
    dbRoom.equipment = room.equipment;
  }
  
  if (room.is_active !== undefined) {
    dbRoom.is_active = room.is_active;
  }

  return dbRoom;
};

/**
 * Batch convert multiple rooms from DB to Frontend
 */
export const roomsBatchDbToFrontend = (dbRooms: DbRoom[]): Room[] => {
  return dbRooms.map(roomDbToFrontend);
};
