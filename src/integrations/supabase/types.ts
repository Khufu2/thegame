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
      bets: {
        Row: {
          created_at: string | null
          id: string
          match_id: string | null
          odds: number
          outcome: string | null
          potential_payout: number | null
          selection: string
          settled_at: string | null
          stake: number
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_id?: string | null
          odds: number
          outcome?: string | null
          potential_payout?: number | null
          selection: string
          settled_at?: string | null
          stake: number
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          match_id?: string | null
          odds?: number
          outcome?: string | null
          potential_payout?: number | null
          selection?: string
          settled_at?: string | null
          stake?: number
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bets_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          match_id: string | null
          name: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id: string
          match_id?: string | null
          name: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          match_id?: string | null
          name?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channels_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      feeds: {
        Row: {
          author: string | null
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          metadata: Json | null
          published_at: string | null
          related_match_id: string | null
          source: string | null
          tags: string[] | null
          title: string | null
          type: string
        }
        Insert: {
          author?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          published_at?: string | null
          related_match_id?: string | null
          source?: string | null
          tags?: string[] | null
          title?: string | null
          type: string
        }
        Update: {
          author?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          published_at?: string | null
          related_match_id?: string | null
          source?: string | null
          tags?: string[] | null
          title?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "feeds_related_match_id_fkey"
            columns: ["related_match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          code: string | null
          country: string | null
          created_at: string | null
          external_id: number | null
          id: string
          logo_url: string | null
          name: string
          season: string | null
          sport: string | null
        }
        Insert: {
          code?: string | null
          country?: string | null
          created_at?: string | null
          external_id?: number | null
          id?: string
          logo_url?: string | null
          name: string
          season?: string | null
          sport?: string | null
        }
        Update: {
          code?: string | null
          country?: string | null
          created_at?: string | null
          external_id?: number | null
          id?: string
          logo_url?: string | null
          name?: string
          season?: string | null
          sport?: string | null
        }
        Relationships: []
      }
      matches: {
        Row: {
          away_team: string
          away_team_id: number | null
          away_team_json: Json | null
          away_team_score: number | null
          created_at: string | null
          fixture_id: number | null
          home_team: string
          home_team_id: number | null
          home_team_json: Json | null
          home_team_score: number | null
          id: string
          kickoff_time: string | null
          league: string | null
          league_id: string | null
          lineups: Json | null
          metadata: Json | null
          odds_away: number | null
          odds_draw: number | null
          odds_home: number | null
          odds_source: string | null
          result: string | null
          round: string | null
          score: Json | null
          season: number | null
          stats: Json | null
          status: string | null
          timeline: Json | null
          updated_at: string | null
          venue: string | null
          venue_details: Json | null
        }
        Insert: {
          away_team: string
          away_team_id?: number | null
          away_team_json?: Json | null
          away_team_score?: number | null
          created_at?: string | null
          fixture_id?: number | null
          home_team: string
          home_team_id?: number | null
          home_team_json?: Json | null
          home_team_score?: number | null
          id: string
          kickoff_time?: string | null
          league?: string | null
          league_id?: string | null
          lineups?: Json | null
          metadata?: Json | null
          odds_away?: number | null
          odds_draw?: number | null
          odds_home?: number | null
          odds_source?: string | null
          result?: string | null
          round?: string | null
          score?: Json | null
          season?: number | null
          stats?: Json | null
          status?: string | null
          timeline?: Json | null
          updated_at?: string | null
          venue?: string | null
          venue_details?: Json | null
        }
        Update: {
          away_team?: string
          away_team_id?: number | null
          away_team_json?: Json | null
          away_team_score?: number | null
          created_at?: string | null
          fixture_id?: number | null
          home_team?: string
          home_team_id?: number | null
          home_team_json?: Json | null
          home_team_score?: number | null
          id?: string
          kickoff_time?: string | null
          league?: string | null
          league_id?: string | null
          lineups?: Json | null
          metadata?: Json | null
          odds_away?: number | null
          odds_draw?: number | null
          odds_home?: number | null
          odds_source?: string | null
          result?: string | null
          round?: string | null
          score?: Json | null
          season?: number | null
          stats?: Json | null
          status?: string | null
          timeline?: Json | null
          updated_at?: string | null
          venue?: string | null
          venue_details?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          channel_id: string | null
          created_at: string | null
          id: string
          likes: number | null
          reply_to: string | null
          team_support: string | null
          text: string
          user_id: string | null
        }
        Insert: {
          channel_id?: string | null
          created_at?: string | null
          id?: string
          likes?: number | null
          reply_to?: string | null
          team_support?: string | null
          text: string
          user_id?: string | null
        }
        Update: {
          channel_id?: string | null
          created_at?: string | null
          id?: string
          likes?: number | null
          reply_to?: string | null
          team_support?: string | null
          text?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          balance: number | null
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          is_pro: boolean | null
          preferences: Json | null
          stats: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          balance?: number | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          is_pro?: boolean | null
          preferences?: Json | null
          stats?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          balance?: number | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          is_pro?: boolean | null
          preferences?: Json | null
          stats?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      standings: {
        Row: {
          created_at: string | null
          id: string
          league_code: string | null
          league_id: number | null
          season: string | null
          standings_data: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          league_code?: string | null
          league_id?: number | null
          season?: string | null
          standings_data: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          league_code?: string | null
          league_id?: number | null
          season?: string | null
          standings_data?: Json
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
