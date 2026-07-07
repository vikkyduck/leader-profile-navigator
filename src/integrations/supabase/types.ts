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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      anonymous_team_responses: {
        Row: {
          courage: number
          created_at: string | null
          hiring: number
          id: string
          integration: number
          responsibility: number
          sincerity: number
          team_id: string
        }
        Insert: {
          courage?: number
          created_at?: string | null
          hiring?: number
          id?: string
          integration?: number
          responsibility?: number
          sincerity?: number
          team_id: string
        }
        Update: {
          courage?: number
          created_at?: string | null
          hiring?: number
          id?: string
          integration?: number
          responsibility?: number
          sincerity?: number
          team_id?: string
        }
        Relationships: []
      }
      blue_ocean_responses: {
        Row: {
          client: number
          created_at: string | null
          economics: number
          id: string
          market: number
          product: number
          sustainability: number
          team_id: string
          uniqueness: number
        }
        Insert: {
          client?: number
          created_at?: string | null
          economics?: number
          id?: string
          market?: number
          product?: number
          sustainability?: number
          team_id: string
          uniqueness?: number
        }
        Update: {
          client?: number
          created_at?: string | null
          economics?: number
          id?: string
          market?: number
          product?: number
          sustainability?: number
          team_id?: string
          uniqueness?: number
        }
        Relationships: []
      }
      edtech_risk_responses: {
        Row: {
          antifragile: number
          cheap_bets: number
          created_at: string
          crisis_playbook: number
          early_signals: number
          focus_core: number
          formed_demand: number
          free_resource: number
          id: string
          portfolio: number
          risk_map: number
          switching_cost: number
          team_id: string
        }
        Insert: {
          antifragile?: number
          cheap_bets?: number
          created_at?: string
          crisis_playbook?: number
          early_signals?: number
          focus_core?: number
          formed_demand?: number
          free_resource?: number
          id?: string
          portfolio?: number
          risk_map?: number
          switching_cost?: number
          team_id: string
        }
        Update: {
          antifragile?: number
          cheap_bets?: number
          created_at?: string
          crisis_playbook?: number
          early_signals?: number
          focus_core?: number
          formed_demand?: number
          free_resource?: number
          id?: string
          portfolio?: number
          risk_map?: number
          switching_cost?: number
          team_id?: string
        }
        Relationships: []
      }
      indicator_radar_responses: {
        Row: {
          cognitive_engineering: number
          created_at: string | null
          creative_economy: number
          experience_economy: number
          id: string
          meaningful_legacy: number
          platform_economy: number
          team_id: string
        }
        Insert: {
          cognitive_engineering?: number
          created_at?: string | null
          creative_economy?: number
          experience_economy?: number
          id?: string
          meaningful_legacy?: number
          platform_economy?: number
          team_id: string
        }
        Update: {
          cognitive_engineering?: number
          created_at?: string | null
          creative_economy?: number
          experience_economy?: number
          id?: string
          meaningful_legacy?: number
          platform_economy?: number
          team_id?: string
        }
        Relationships: []
      }
      resource_radar_responses: {
        Row: {
          biohacker: number
          created_at: string | null
          deep_worker: number
          empath: number
          id: string
          team_id: string
          visionary: number
        }
        Insert: {
          biohacker?: number
          created_at?: string | null
          deep_worker?: number
          empath?: number
          id?: string
          team_id: string
          visionary?: number
        }
        Update: {
          biohacker?: number
          created_at?: string | null
          deep_worker?: number
          empath?: number
          id?: string
          team_id?: string
          visionary?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
