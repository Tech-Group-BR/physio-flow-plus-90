export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
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
          created_at: string | null
          description: string
          due_date: string
          id: string
          notes: string | null
          paid_date: string | null
          status: Database["public"]["Enums"]["account_status"] | null
          supplier: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          description: string
          due_date: string
          id?: string
          notes?: string | null
          paid_date?: string | null
          status?: Database["public"]["Enums"]["account_status"] | null
          supplier?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          description?: string
          due_date?: string
          id?: string
          notes?: string | null
          paid_date?: string | null
          status?: Database["public"]["Enums"]["account_status"] | null
          supplier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      accounts_receivable: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          due_date: string
          id: string
          paid_date: string | null
          patient_id: string | null
          status: Database["public"]["Enums"]["account_status"] | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          due_date: string
          id?: string
          paid_date?: string | null
          patient_id?: string | null
          status?: Database["public"]["Enums"]["account_status"] | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          due_date?: string
          id?: string
          paid_date?: string | null
          patient_id?: string | null
          status?: Database["public"]["Enums"]["account_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_financial_report"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "accounts_receivable_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
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
          physio_message_id: string | null
          physio_notified_at: string | null
          physiotherapist_id: string
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
          physio_message_id?: string | null
          physio_notified_at?: string | null
          physiotherapist_id: string
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
          physio_message_id?: string | null
          physio_notified_at?: string | null
          physiotherapist_id?: string
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
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_financial_report"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
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
      evolutions: {
        Row: {
          created_at: string | null
          date: string
          files: string[] | null
          id: string
          media: string[] | null
          mobility_scale: number | null
          next_session: string | null
          observations: string
          pain_scale: number | null
          physiotherapist_id: string
          record_id: string
          treatment_performed: string
          visible_to_guardian: boolean | null
        }
        Insert: {
          created_at?: string | null
          date: string
          files?: string[] | null
          id?: string
          media?: string[] | null
          mobility_scale?: number | null
          next_session?: string | null
          observations: string
          pain_scale?: number | null
          physiotherapist_id: string
          record_id: string
          treatment_performed: string
          visible_to_guardian?: boolean | null
        }
        Update: {
          created_at?: string | null
          date?: string
          files?: string[] | null
          id?: string
          media?: string[] | null
          mobility_scale?: number | null
          next_session?: string | null
          observations?: string
          pain_scale?: number | null
          physiotherapist_id?: string
          record_id?: string
          treatment_performed?: string
          visible_to_guardian?: boolean | null
        }
        Relationships: [
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
            foreignKeyName: "guardians_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_financial_report"
            referencedColumns: ["patient_id"]
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
        Relationships: []
      }
      medical_records: {
        Row: {
          anamnesis: Json | null
          created_at: string | null
          files: string[] | null
          id: string
          patient_id: string
          updated_at: string | null
        }
        Insert: {
          anamnesis?: Json | null
          created_at?: string | null
          files?: string[] | null
          id?: string
          patient_id: string
          updated_at?: string | null
        }
        Update: {
          anamnesis?: Json | null
          created_at?: string | null
          files?: string[] | null
          id?: string
          patient_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_financial_report"
            referencedColumns: ["patient_id"]
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
      patients: {
        Row: {
          address: Json | null
          birth_date: string | null
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
          session_value: number | null
          treatment_type: string | null
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          birth_date?: string | null
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
          session_value?: number | null
          treatment_type?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          birth_date?: string | null
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
          session_value?: number | null
          treatment_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          appointment_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          paid_date: string | null
          patient_id: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          type: Database["public"]["Enums"]["payment_type"]
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          paid_date?: string | null
          patient_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          type: Database["public"]["Enums"]["payment_type"]
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          paid_date?: string | null
          patient_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          type?: Database["public"]["Enums"]["payment_type"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_financial_report"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          crefito: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          specialties: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          crefito?: string | null
          email?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          specialties?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          crefito?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          specialties?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rooms: {
        Row: {
          capacity: number | null
          created_at: string | null
          equipment: string[] | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          equipment?: string[] | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          equipment?: string[] | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      whatsapp_logs: {
        Row: {
          appointment_id: string | null
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
        ]
      }
      whatsapp_settings: {
        Row: {
          api_key: string
          api_token: string | null
          api_url: string | null
          auto_confirm_enabled: boolean
          base_url: string
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
        Relationships: []
      }
    }
    Views: {
      patient_financial_report: {
        Row: {
          cancelled_appointments: number | null
          completed_appointments: number | null
          confirmed_appointments: number | null
          missed_appointments: number | null
          patient_id: string | null
          patient_name: string | null
          session_value: number | null
          total_appointments: number | null
          total_billed: number | null
          total_pending: number | null
          total_receivable: number | null
          total_received: number | null
        }
        Relationships: []
      }
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
      ensure_admin_exists: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { uri: string }
          | { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { uri: string } | { uri: string; data: Json }
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
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { uri: string; content: string; content_type: string }
          | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { uri: string; content: string; content_type: string }
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
          p_phone: string
          p_message_content: string
          p_evolution_message_id: string
        }
        Returns: Json
      }
      promote_user_to_admin: {
        Args: { user_email: string }
        Returns: undefined
      }
      test_send_physio_notification: {
        Args: { p_appointment_id: string; p_action: string }
        Returns: Json
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
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
      payment_method: "dinheiro" | "pix" | "cartao" | "transferencia"
      payment_status: "pendente" | "pago" | "cancelado" | "vencido"
      payment_type:
        | "consulta"
        | "mensalidade"
        | "avaliacao"
        | "pacote"
        | "outro"
      user_role: "admin" | "physiotherapist" | "guardian"
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
      payment_method: ["dinheiro", "pix", "cartao", "transferencia"],
      payment_status: ["pendente", "pago", "cancelado", "vencido"],
      payment_type: ["consulta", "mensalidade", "avaliacao", "pacote", "outro"],
      user_role: ["admin", "physiotherapist", "guardian"],
    },
  },
} as const
