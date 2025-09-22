export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      accounts_payable: {
        Row: {
          amount: number
          category: string | null
          clinic_id: string | null
          created_at: string | null
          description: string
          due_date: string
          id: string
          notes: string | null
          paid_date: string | null
          patient_id: string | null
          payment_method:
            | Database["public"]["Enums"]["payment_method_enum"]
            | null
          professional_id: string | null
          receipt_url: string | null
          status: Database["public"]["Enums"]["account_status"] | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          clinic_id?: string | null
          created_at?: string | null
          description: string
          due_date: string
          id?: string
          notes?: string | null
          paid_date?: string | null
          patient_id?: string | null
          payment_method?:
            | Database["public"]["Enums"]["payment_method_enum"]
            | null
          professional_id?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["account_status"] | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          clinic_id?: string | null
          created_at?: string | null
          description?: string
          due_date?: string
          id?: string
          notes?: string | null
          paid_date?: string | null
          patient_id?: string | null
          payment_method?:
            | Database["public"]["Enums"]["payment_method_enum"]
            | null
          professional_id?: string | null
          receipt_url?: string | null
          status?: Database["public"]["Enums"]["account_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_payable_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts_receivable: {
        Row: {
          amount: number
          appointment_id: string | null
          clinic_id: string | null
          created_at: string | null
          description: string
          discount_amount: number | null
          due_date: string
          id: string
          method: Database["public"]["Enums"]["payment_method_enum"] | null
          notes: string | null
          paid_date: string | null
          patient_id: string | null
          patient_package_id: string | null
          professional_id: string | null
          received_date: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["account_status"] | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          clinic_id?: string | null
          created_at?: string | null
          description: string
          discount_amount?: number | null
          due_date: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method_enum"] | null
          notes?: string | null
          paid_date?: string | null
          patient_id?: string | null
          patient_package_id?: string | null
          professional_id?: string | null
          received_date?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["account_status"] | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          clinic_id?: string | null
          created_at?: string | null
          description?: string
          discount_amount?: number | null
          due_date?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method_enum"] | null
          notes?: string | null
          paid_date?: string | null
          patient_id?: string | null
          patient_package_id?: string | null
          professional_id?: string | null
          received_date?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["account_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_patient_package_id_fkey"
            columns: ["patient_package_id"]
            isOneToOne: false
            referencedRelation: "patient_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          clinic_id: string | null
          confirmation_message_id: string | null
          confirmation_sent_at: string | null
          created_at: string | null
          date: string
          duration: number | null
          followup_sent_at: string | null
          id: string
          notes: string | null
          patient_confirmed_at: string | null
          patient_id: string
          patient_package_id: string | null
          physio_message_id: string | null
          physio_notified_at: string | null
          professional_id: string
          reminder_sent_at: string | null
          room_id: string | null
          status: Database["public"]["Enums"]["appointment_status"] | null
          time: string
          treatment_type: string | null
          updated_at: string | null
          whatsapp_confirmed: boolean | null
          whatsapp_message_id: string | null
          whatsapp_sent_at: string | null
          whatsapp_status: string | null
        }
        Insert: {
          clinic_id?: string | null
          confirmation_message_id?: string | null
          confirmation_sent_at?: string | null
          created_at?: string | null
          date: string
          duration?: number | null
          followup_sent_at?: string | null
          id?: string
          notes?: string | null
          patient_confirmed_at?: string | null
          patient_id: string
          patient_package_id?: string | null
          physio_message_id?: string | null
          physio_notified_at?: string | null
          professional_id: string
          reminder_sent_at?: string | null
          room_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          time: string
          treatment_type?: string | null
          updated_at?: string | null
          whatsapp_confirmed?: boolean | null
          whatsapp_message_id?: string | null
          whatsapp_sent_at?: string | null
          whatsapp_status?: string | null
        }
        Update: {
          clinic_id?: string | null
          confirmation_message_id?: string | null
          confirmation_sent_at?: string | null
          created_at?: string | null
          date?: string
          duration?: number | null
          followup_sent_at?: string | null
          id?: string
          notes?: string | null
          patient_confirmed_at?: string | null
          patient_id?: string
          patient_package_id?: string | null
          physio_message_id?: string | null
          physio_notified_at?: string | null
          professional_id?: string
          reminder_sent_at?: string | null
          room_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"] | null
          time?: string
          treatment_type?: string | null
          updated_at?: string | null
          whatsapp_confirmed?: boolean | null
          whatsapp_message_id?: string | null
          whatsapp_sent_at?: string | null
          whatsapp_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_package_id_fkey"
            columns: ["patient_package_id"]
            isOneToOne: false
            referencedRelation: "patient_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_settings: {
        Row: {
          address: string | null
          clinic_code: string | null
          consultation_price: number | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          timezone: string | null
          updated_at: string | null
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          clinic_code?: string | null
          consultation_price?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          timezone?: string | null
          updated_at?: string | null
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          clinic_code?: string | null
          consultation_price?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          timezone?: string | null
          updated_at?: string | null
          working_hours?: Json | null
        }
        Relationships: []
      }
      evolutions: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          date: string
          files: string[] | null
          id: string
          media: string[] | null
          mobility_scale: number | null
          next_session: string | null
          observations: string
          pain_scale: number | null
          professional_id: string | null
          record_id: string
          treatment_performed: string
          visible_to_guardian: boolean | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          date: string
          files?: string[] | null
          id?: string
          media?: string[] | null
          mobility_scale?: number | null
          next_session?: string | null
          observations: string
          pain_scale?: number | null
          professional_id?: string | null
          record_id: string
          treatment_performed: string
          visible_to_guardian?: boolean | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          date?: string
          files?: string[] | null
          id?: string
          media?: string[] | null
          mobility_scale?: number | null
          next_session?: string | null
          observations?: string
          pain_scale?: number | null
          professional_id?: string | null
          record_id?: string
          treatment_performed?: string
          visible_to_guardian?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "evolutions_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evolutions_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          patient_id: string
          phone: string
          relationship: string | null
          user_id: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          patient_id: string
          phone: string
          relationship?: string | null
          user_id?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          patient_id?: string
          phone?: string
          relationship?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guardians_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardians_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          clinic_id: string | null
          created_at: string | null
          email: string | null
          id: string
          last_contact: string | null
          name: string
          notes: string | null
          phone: string
          source: string | null
          status: Database["public"]["Enums"]["lead_status"] | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          clinic_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_contact?: string | null
          name: string
          notes?: string | null
          phone: string
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          clinic_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_contact?: string | null
          name?: string
          notes?: string | null
          phone?: string
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          anamnesis: Json | null
          clinic_id: string | null
          created_at: string | null
          files: string[] | null
          id: string
          patient_id: string
          updated_at: string | null
        }
        Insert: {
          anamnesis?: Json | null
          clinic_id?: string | null
          created_at?: string | null
          files?: string[] | null
          id?: string
          patient_id: string
          updated_at?: string | null
        }
        Update: {
          anamnesis?: Json | null
          clinic_id?: string | null
          created_at?: string | null
          files?: string[] | null
          id?: string
          patient_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_packages: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          expiry_date: string
          id: string
          is_paid: boolean
          package_id: string
          patient_id: string
          purchase_date: string
          sessions_used: number
          status: Database["public"]["Enums"]["package_status"] | null
          updated_at: string | null
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          expiry_date: string
          id?: string
          is_paid: boolean
          package_id: string
          patient_id: string
          purchase_date?: string
          sessions_used?: number
          status?: Database["public"]["Enums"]["package_status"] | null
          updated_at?: string | null
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          expiry_date?: string
          id?: string
          is_paid?: boolean
          package_id?: string
          patient_id?: string
          purchase_date?: string
          sessions_used?: number
          status?: Database["public"]["Enums"]["package_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_packages_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "session_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_packages_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: Json | null
          birth_date: string | null
          clinic_id: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          emergency_contact: Json | null
          emergency_phone: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          guardian_id: string | null
          id: string
          insurance: string | null
          is_active: boolean | null
          is_minor: boolean | null
          medical_history: string | null
          notes: string | null
          phone: string
          treatment_type: string | null
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          birth_date?: string | null
          clinic_id?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          emergency_contact?: Json | null
          emergency_phone?: string | null
          full_name: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          guardian_id?: string | null
          id?: string
          insurance?: string | null
          is_active?: boolean | null
          is_minor?: boolean | null
          medical_history?: string | null
          notes?: string | null
          phone: string
          treatment_type?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          birth_date?: string | null
          clinic_id?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          emergency_contact?: Json | null
          emergency_phone?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          guardian_id?: string | null
          id?: string
          insurance?: string | null
          is_active?: boolean | null
          is_minor?: boolean | null
          medical_history?: string | null
          notes?: string | null
          phone?: string
          treatment_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          bio: string | null
          clinic_id: string | null
          created_at: string
          crefito: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          profile_id: string | null
          profile_picture_url: string | null
          specialties: string[] | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          clinic_id?: string | null
          created_at?: string
          crefito?: string | null
          email: string
          full_name: string
          id?: string
          is_active: boolean
          phone?: string | null
          profile_id?: string | null
          profile_picture_url?: string | null
          specialties?: string[] | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          clinic_id?: string | null
          created_at?: string
          crefito?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          profile_id?: string | null
          profile_picture_url?: string | null
          specialties?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professionals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          clinic_code: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          clinic_id: string 
        }
        Insert: {
          clinic_code?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          clinic_code?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      rooms: {
        Row: {
          capacity: number | null
          clinic_id: string | null
          created_at: string | null
          equipment: string[] | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          capacity?: number | null
          clinic_id?: string | null
          created_at?: string | null
          equipment?: string[] | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          capacity?: number | null
          clinic_id?: string | null
          created_at?: string | null
          equipment?: string[] | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          type: Database["public"]["Enums"]["service_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price?: number
          type: Database["public"]["Enums"]["service_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          type?: Database["public"]["Enums"]["service_type"]
          updated_at?: string
        }
        Relationships: []
      }
      session_packages: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          sessions: number
          treatment_type: string | null
          updated_at: string | null
          validity_days: number
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          sessions: number
          treatment_type?: string | null
          updated_at?: string | null
          validity_days: number
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          sessions?: number
          treatment_type?: string | null
          updated_at?: string | null
          validity_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "session_packages_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_logs: {
        Row: {
          appointment_id: string | null
          clinic_id: string | null
          delivered_at: string | null
          error_message: string | null
          evolution_message_id: string | null
          id: string
          message_content: string
          message_type: string
          patient_phone: string
          read_at: string | null
          response_content: string | null
          sent_at: string
          status: string
        }
        Insert: {
          appointment_id?: string | null
          clinic_id?: string | null
          delivered_at?: string | null
          error_message?: string | null
          evolution_message_id?: string | null
          id?: string
          message_content: string
          message_type: string
          patient_phone: string
          read_at?: string | null
          response_content?: string | null
          sent_at?: string
          status?: string
        }
        Update: {
          appointment_id?: string | null
          clinic_id?: string | null
          delivered_at?: string | null
          error_message?: string | null
          evolution_message_id?: string | null
          id?: string
          message_content?: string
          message_type?: string
          patient_phone?: string
          read_at?: string | null
          response_content?: string | null
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_logs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_settings: {
        Row: {
          api_key: string
          api_token: string | null
          api_url: string | null
          auto_confirm_enabled: boolean
          base_url: string
          clinic_id: string | null
          confirmation_hours_before: number
          confirmation_template: string
          created_at: string
          followup_enabled: boolean
          followup_hours_after: number
          followup_template: string
          id: string
          instance_name: string
          integration_enabled: boolean | null
          is_active: boolean
          reminder_enabled: boolean
          reminder_hours_before: number
          reminder_template: string
          updated_at: string
          webhook_url: string | null
          welcome_enabled: boolean
          welcome_template: string
        }
        Insert: {
          api_key: string
          api_token?: string | null
          api_url?: string | null
          auto_confirm_enabled?: boolean
          base_url?: string
          clinic_id?: string | null
          confirmation_hours_before?: number
          confirmation_template?: string
          created_at?: string
          followup_enabled?: boolean
          followup_hours_after?: number
          followup_template?: string
          id?: string
          instance_name: string
          integration_enabled?: boolean | null
          is_active?: boolean
          reminder_enabled?: boolean
          reminder_hours_before?: number
          reminder_template?: string
          updated_at?: string
          webhook_url?: string | null
          welcome_enabled?: boolean
          welcome_template?: string
        }
        Update: {
          api_key?: string
          api_token?: string | null
          api_url?: string | null
          auto_confirm_enabled?: boolean
          base_url?: string
          clinic_id?: string | null
          confirmation_hours_before?: number
          confirmation_template?: string
          created_at?: string
          followup_enabled?: boolean
          followup_hours_after?: number
          followup_template?: string
          id?: string
          instance_name?: string
          integration_enabled?: boolean | null
          is_active?: boolean
          reminder_enabled?: boolean
          reminder_hours_before?: number
          reminder_template?: string
          updated_at?: string
          webhook_url?: string | null
          welcome_enabled?: boolean
          welcome_template?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_settings_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinic_settings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      check_email_exists: {
        Args: { user_email: string }
        Returns: boolean
      }
      create_appointment: {
        Args: {
          p_appointment_date: string
          p_appointment_time: string
          p_appointment_type: string
          p_notes?: string
          p_patient_id: string
          p_patient_package_id?: string
          p_price?: number
          p_professional_id: string
          p_room_id?: string
        }
        Returns: string
      }
      ensure_admin_exists: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      generate_clinic_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_patient_financial_report: {
        Args: { p_patient_id: string }
        Returns: Json
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { content: string; content_type: string; uri: string }
          | { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { data: Json; uri: string } | { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { content: string; content_type: string; uri: string }
          | { data: Json; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_admin_or_physio: {
        Args: { user_id: string }
        Returns: boolean
      }
      process_whatsapp_confirmation: {
        Args: {
          p_evolution_message_id: string
          p_message_content: string
          p_phone: string
        }
        Returns: Json
      }
      promote_user_to_admin: {
        Args: { user_email: string }
        Returns: undefined
      }
      schedule_package_session: {
        Args: {
          p_appointment_date: string
          p_appointment_time: string
          p_notes?: string
          p_patient_id: string
          p_patient_package_id: string
          p_professional_id: string
          p_room_id?: string
        }
        Returns: undefined
      }
      sell_package: {
        Args: {
          p_discount_amount?: number
          p_notes?: string
          p_package_id: string
          p_patient_id: string
          p_payment_method: Database["public"]["Enums"]["payment_method_enum"]
          p_professional_id?: string
        }
        Returns: undefined
      }
      test_send_physio_notification: {
        Args: { p_action: string; p_appointment_id: string }
        Returns: Json
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      update_overdue_accounts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
      }
      validate_clinic_code: {
        Args: { code: string }
        Returns: boolean
      }
    }
    Enums: {
      account_status: "pendente" | "pago" | "vencido" | "cancelado"
      appointment_status:
        | "marcado"
        | "confirmado"
        | "realizado"
        | "cancelado"
        | "faltante"
      gender_type: "male" | "female"
      lead_status:
        | "novo"
        | "contatado"
        | "interessado"
        | "agendado"
        | "cliente"
        | "perdido"
      package_status: "active" | "expired" | "completed"
      payment_method_enum:
        | "pix"
        | "credit_card"
        | "debit_card"
        | "cash"
        | "cartao_de_credito"
        | "cartao_de_debito"
        | "dinheiro"
        | "boleto"
      payment_status: "pendente" | "pago" | "cancelado" | "vencido"
      payment_type:
        | "consulta"
        | "mensalidade"
        | "avaliacao"
        | "pacote"
        | "outro"
      service_type: "CONSULTA" | "PACOTE" | "PRODUTO" | "OUTRO"
      user_role: "admin" | "PROFESSIONAL" | "guardian" | "ADMIN" | "SECRETARY"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_status: ["pendente", "pago", "vencido", "cancelado"],
      appointment_status: [
        "marcado",
        "confirmado",
        "realizado",
        "cancelado",
        "faltante",
      ],
      gender_type: ["male", "female"],
      lead_status: [
        "novo",
        "contatado",
        "interessado",
        "agendado",
        "cliente",
        "perdido",
      ],
      package_status: ["active", "expired", "completed"],
      payment_method_enum: [
        "pix",
        "credit_card",
        "debit_card",
        "cash",
        "cartao_de_credito",
        "cartao_de_debito",
        "dinheiro",
        "boleto",
      ],
      payment_status: ["pendente", "pago", "cancelado", "vencido"],
      payment_type: ["consulta", "mensalidade", "avaliacao", "pacote", "outro"],
      service_type: ["CONSULTA", "PACOTE", "PRODUTO", "OUTRO"],
      user_role: ["admin", "PROFESSIONAL", "guardian", "ADMIN", "SECRETARY"],
    },
  },
} as const
