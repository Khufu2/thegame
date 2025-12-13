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
      ab_test_experiments: {
        Row: {
          confidence_level: number | null
          created_at: string | null
          end_date: string | null
          experiment_name: string
          experiment_type: string
          id: string
          start_date: string | null
          status: string | null
          total_predictions: number | null
          variant_a: string
          variant_a_accuracy: number | null
          variant_a_correct: number | null
          variant_a_predictions: number | null
          variant_b: string
          variant_b_accuracy: number | null
          variant_b_correct: number | null
          variant_b_predictions: number | null
          winner: string | null
        }
        Insert: {
          confidence_level?: number | null
          created_at?: string | null
          end_date?: string | null
          experiment_name: string
          experiment_type: string
          id?: string
          start_date?: string | null
          status?: string | null
          total_predictions?: number | null
          variant_a: string
          variant_a_accuracy?: number | null
          variant_a_correct?: number | null
          variant_a_predictions?: number | null
          variant_b: string
          variant_b_accuracy?: number | null
          variant_b_correct?: number | null
          variant_b_predictions?: number | null
          winner?: string | null
        }
        Update: {
          confidence_level?: number | null
          created_at?: string | null
          end_date?: string | null
          experiment_name?: string
          experiment_type?: string
          id?: string
          start_date?: string | null
          status?: string | null
          total_predictions?: number | null
          variant_a?: string
          variant_a_accuracy?: number | null
          variant_a_correct?: number | null
          variant_a_predictions?: number | null
          variant_b?: string
          variant_b_accuracy?: number | null
          variant_b_correct?: number | null
          variant_b_predictions?: number | null
          winner?: string | null
        }
        Relationships: []
      }
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
          excerpt: string | null
          featured_image_url: string | null
          id: string
          image_url: string | null
          language: string | null
          metadata: Json | null
          published_at: string | null
          reading_time_minutes: number | null
          related_match_id: string | null
          source: string | null
          tags: string[] | null
          title: string | null
          type: string
          word_count: number | null
        }
        Insert: {
          author?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          image_url?: string | null
          language?: string | null
          metadata?: Json | null
          published_at?: string | null
          reading_time_minutes?: number | null
          related_match_id?: string | null
          source?: string | null
          tags?: string[] | null
          title?: string | null
          type: string
          word_count?: number | null
        }
        Update: {
          author?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          image_url?: string | null
          language?: string | null
          metadata?: Json | null
          published_at?: string | null
          reading_time_minutes?: number | null
          related_match_id?: string | null
          source?: string | null
          tags?: string[] | null
          title?: string | null
          type?: string
          word_count?: number | null
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
      news_content_tags: {
        Row: {
          confidence: number | null
          created_at: string | null
          feed_id: string
          id: string
          tag_type: string
          tag_value: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          feed_id: string
          id?: string
          tag_type: string
          tag_value: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          feed_id?: string
          id?: string
          tag_type?: string
          tag_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_content_tags_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "feeds"
            referencedColumns: ["id"]
          },
        ]
      }
      news_entities: {
        Row: {
          confidence: number | null
          created_at: string | null
          entity_id: string
          entity_name: string
          entity_type: string
          feed_id: string
          id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          entity_id: string
          entity_name: string
          entity_type: string
          feed_id: string
          id?: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          entity_id?: string
          entity_name?: string
          entity_type?: string
          feed_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_entities_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "feeds"
            referencedColumns: ["id"]
          },
        ]
      }
      news_shares: {
        Row: {
          feed_id: string
          id: string
          share_method: string | null
          shared_at: string | null
          user_id: string | null
        }
        Insert: {
          feed_id: string
          id?: string
          share_method?: string | null
          shared_at?: string | null
          user_id?: string | null
        }
        Update: {
          feed_id?: string
          id?: string
          share_method?: string | null
          shared_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_shares_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "feeds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_stats: {
        Row: {
          age: number | null
          assists: number | null
          assists_per_90: number | null
          average_rating: number | null
          clean_sheets: number | null
          clearances: number | null
          data_source: string | null
          dribble_success_rate: number | null
          dribbles_attempted: number | null
          dribbles_completed: number | null
          expected_return: string | null
          form_rating: number | null
          goals: number | null
          goals_conceded: number | null
          goals_per_90: number | null
          id: string
          injury_status: string | null
          injury_type: string | null
          interceptions: number | null
          last_updated: string | null
          league: string
          matches_played: number | null
          minutes_played: number | null
          nationality: string | null
          pass_accuracy: number | null
          passes_attempted: number | null
          passes_completed: number | null
          player_id: string
          player_name: string
          position: string | null
          recent_assists: number | null
          recent_goals: number | null
          recent_matches: number | null
          recent_minutes: number | null
          red_cards: number | null
          saves: number | null
          season: string
          shots_on_target: number | null
          shots_on_target_percentage: number | null
          shots_total: number | null
          suspension_matches_remaining: number | null
          tackles_total: number | null
          tackles_won: number | null
          team_id: string
          team_name: string
          yellow_cards: number | null
        }
        Insert: {
          age?: number | null
          assists?: number | null
          assists_per_90?: number | null
          average_rating?: number | null
          clean_sheets?: number | null
          clearances?: number | null
          data_source?: string | null
          dribble_success_rate?: number | null
          dribbles_attempted?: number | null
          dribbles_completed?: number | null
          expected_return?: string | null
          form_rating?: number | null
          goals?: number | null
          goals_conceded?: number | null
          goals_per_90?: number | null
          id?: string
          injury_status?: string | null
          injury_type?: string | null
          interceptions?: number | null
          last_updated?: string | null
          league: string
          matches_played?: number | null
          minutes_played?: number | null
          nationality?: string | null
          pass_accuracy?: number | null
          passes_attempted?: number | null
          passes_completed?: number | null
          player_id: string
          player_name: string
          position?: string | null
          recent_assists?: number | null
          recent_goals?: number | null
          recent_matches?: number | null
          recent_minutes?: number | null
          red_cards?: number | null
          saves?: number | null
          season?: string
          shots_on_target?: number | null
          shots_on_target_percentage?: number | null
          shots_total?: number | null
          suspension_matches_remaining?: number | null
          tackles_total?: number | null
          tackles_won?: number | null
          team_id: string
          team_name: string
          yellow_cards?: number | null
        }
        Update: {
          age?: number | null
          assists?: number | null
          assists_per_90?: number | null
          average_rating?: number | null
          clean_sheets?: number | null
          clearances?: number | null
          data_source?: string | null
          dribble_success_rate?: number | null
          dribbles_attempted?: number | null
          dribbles_completed?: number | null
          expected_return?: string | null
          form_rating?: number | null
          goals?: number | null
          goals_conceded?: number | null
          goals_per_90?: number | null
          id?: string
          injury_status?: string | null
          injury_type?: string | null
          interceptions?: number | null
          last_updated?: string | null
          league?: string
          matches_played?: number | null
          minutes_played?: number | null
          nationality?: string | null
          pass_accuracy?: number | null
          passes_attempted?: number | null
          passes_completed?: number | null
          player_id?: string
          player_name?: string
          position?: string | null
          recent_assists?: number | null
          recent_goals?: number | null
          recent_matches?: number | null
          recent_minutes?: number | null
          red_cards?: number | null
          saves?: number | null
          season?: string
          shots_on_target?: number | null
          shots_on_target_percentage?: number | null
          shots_total?: number | null
          suspension_matches_remaining?: number | null
          tackles_total?: number | null
          tackles_won?: number | null
          team_id?: string
          team_name?: string
          yellow_cards?: number | null
        }
        Relationships: []
      }
      prediction_history: {
        Row: {
          actual_outcome: string | null
          actual_score: string | null
          ai_reasoning: string | null
          away_team: string
          betting_angle: string | null
          confidence: number
          created_at: string | null
          home_team: string
          id: string
          is_value_pick: boolean | null
          key_insight: string | null
          league: string
          match_date: string | null
          match_id: string
          model_edge: number | null
          odds: Json | null
          predicted_outcome: string
          predicted_score: string | null
          probability: Json | null
          resolved_at: string | null
          risk_level: string | null
          status: string | null
          system_record: string | null
        }
        Insert: {
          actual_outcome?: string | null
          actual_score?: string | null
          ai_reasoning?: string | null
          away_team: string
          betting_angle?: string | null
          confidence: number
          created_at?: string | null
          home_team: string
          id?: string
          is_value_pick?: boolean | null
          key_insight?: string | null
          league: string
          match_date?: string | null
          match_id: string
          model_edge?: number | null
          odds?: Json | null
          predicted_outcome: string
          predicted_score?: string | null
          probability?: Json | null
          resolved_at?: string | null
          risk_level?: string | null
          status?: string | null
          system_record?: string | null
        }
        Update: {
          actual_outcome?: string | null
          actual_score?: string | null
          ai_reasoning?: string | null
          away_team?: string
          betting_angle?: string | null
          confidence?: number
          created_at?: string | null
          home_team?: string
          id?: string
          is_value_pick?: boolean | null
          key_insight?: string | null
          league?: string
          match_date?: string | null
          match_id?: string
          model_edge?: number | null
          odds?: Json | null
          predicted_outcome?: string
          predicted_score?: string | null
          probability?: Json | null
          resolved_at?: string | null
          risk_level?: string | null
          status?: string | null
          system_record?: string | null
        }
        Relationships: []
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
      prompt_performance: {
        Row: {
          accuracy: number | null
          average_confidence: number | null
          correct_predictions: number | null
          created_at: string | null
          id: string
          last_used: string | null
          prompt_hash: string
          prompt_template: string
          roi: number | null
          total_points: number | null
          total_predictions: number | null
          updated_at: string | null
        }
        Insert: {
          accuracy?: number | null
          average_confidence?: number | null
          correct_predictions?: number | null
          created_at?: string | null
          id?: string
          last_used?: string | null
          prompt_hash: string
          prompt_template: string
          roi?: number | null
          total_points?: number | null
          total_predictions?: number | null
          updated_at?: string | null
        }
        Update: {
          accuracy?: number | null
          average_confidence?: number | null
          correct_predictions?: number | null
          created_at?: string | null
          id?: string
          last_used?: string | null
          prompt_hash?: string
          prompt_template?: string
          roi?: number | null
          total_points?: number | null
          total_predictions?: number | null
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
      team_stats: {
        Row: {
          average_goals_conceded: number | null
          average_goals_scored: number | null
          average_possession: number | null
          away_draws: number | null
          away_goals_against: number | null
          away_goals_for: number | null
          away_losses: number | null
          away_wins: number | null
          clean_sheets: number | null
          data_source: string | null
          draws: number | null
          elo_rating: number | null
          failed_to_score: number | null
          goal_difference: number | null
          goals_against: number | null
          goals_for: number | null
          home_draws: number | null
          home_goals_against: number | null
          home_goals_for: number | null
          home_losses: number | null
          home_wins: number | null
          id: string
          injuries_count: number | null
          last_updated: string | null
          league: string
          losses: number | null
          matches_played: number | null
          points: number | null
          recent_form: string | null
          recent_goals_against: number | null
          recent_goals_for: number | null
          recent_points: number | null
          season: string
          shots_on_target_pg: number | null
          shots_pg: number | null
          suspensions_count: number | null
          team_id: string
          team_name: string
          win_percentage: number | null
          wins: number | null
        }
        Insert: {
          average_goals_conceded?: number | null
          average_goals_scored?: number | null
          average_possession?: number | null
          away_draws?: number | null
          away_goals_against?: number | null
          away_goals_for?: number | null
          away_losses?: number | null
          away_wins?: number | null
          clean_sheets?: number | null
          data_source?: string | null
          draws?: number | null
          elo_rating?: number | null
          failed_to_score?: number | null
          goal_difference?: number | null
          goals_against?: number | null
          goals_for?: number | null
          home_draws?: number | null
          home_goals_against?: number | null
          home_goals_for?: number | null
          home_losses?: number | null
          home_wins?: number | null
          id?: string
          injuries_count?: number | null
          last_updated?: string | null
          league: string
          losses?: number | null
          matches_played?: number | null
          points?: number | null
          recent_form?: string | null
          recent_goals_against?: number | null
          recent_goals_for?: number | null
          recent_points?: number | null
          season?: string
          shots_on_target_pg?: number | null
          shots_pg?: number | null
          suspensions_count?: number | null
          team_id: string
          team_name: string
          win_percentage?: number | null
          wins?: number | null
        }
        Update: {
          average_goals_conceded?: number | null
          average_goals_scored?: number | null
          average_possession?: number | null
          away_draws?: number | null
          away_goals_against?: number | null
          away_goals_for?: number | null
          away_losses?: number | null
          away_wins?: number | null
          clean_sheets?: number | null
          data_source?: string | null
          draws?: number | null
          elo_rating?: number | null
          failed_to_score?: number | null
          goal_difference?: number | null
          goals_against?: number | null
          goals_for?: number | null
          home_draws?: number | null
          home_goals_against?: number | null
          home_goals_for?: number | null
          home_losses?: number | null
          home_wins?: number | null
          id?: string
          injuries_count?: number | null
          last_updated?: string | null
          league?: string
          losses?: number | null
          matches_played?: number | null
          points?: number | null
          recent_form?: string | null
          recent_goals_against?: number | null
          recent_goals_for?: number | null
          recent_points?: number | null
          season?: string
          shots_on_target_pg?: number | null
          shots_pg?: number | null
          suspensions_count?: number | null
          team_id?: string
          team_name?: string
          win_percentage?: number | null
          wins?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
