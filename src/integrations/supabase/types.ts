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
      admin_activity_log: {
        Row: {
          created_at: string | null
          description: string
          event_category: string
          event_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          event_category: string
          event_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          event_category?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_tasks: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          related_id: string | null
          status: string | null
          task_type: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          related_id?: string | null
          status?: string | null
          task_type: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          related_id?: string | null
          status?: string | null
          task_type?: string
        }
        Relationships: []
      }
      artist_badges: {
        Row: {
          badge_description: string | null
          badge_icon: string | null
          badge_name: string
          badge_type: string
          created_at: string
          id: string
          requirement_value: number
        }
        Insert: {
          badge_description?: string | null
          badge_icon?: string | null
          badge_name: string
          badge_type: string
          created_at?: string
          id?: string
          requirement_value: number
        }
        Update: {
          badge_description?: string | null
          badge_icon?: string | null
          badge_name?: string
          badge_type?: string
          created_at?: string
          id?: string
          requirement_value?: number
        }
        Relationships: []
      }
      artist_competition_journey: {
        Row: {
          artist_id: string
          competition_id: string
          created_at: string | null
          current_stage_id: string | null
          elimination_stage_id: string | null
          final_placement: number | null
          highest_rank: number | null
          id: string
          is_eliminated: boolean | null
          journey_data: Json | null
          stages_participated: number | null
          total_votes_received: number | null
          updated_at: string | null
        }
        Insert: {
          artist_id: string
          competition_id: string
          created_at?: string | null
          current_stage_id?: string | null
          elimination_stage_id?: string | null
          final_placement?: number | null
          highest_rank?: number | null
          id?: string
          is_eliminated?: boolean | null
          journey_data?: Json | null
          stages_participated?: number | null
          total_votes_received?: number | null
          updated_at?: string | null
        }
        Update: {
          artist_id?: string
          competition_id?: string
          created_at?: string | null
          current_stage_id?: string | null
          elimination_stage_id?: string | null
          final_placement?: number | null
          highest_rank?: number | null
          id?: string
          is_eliminated?: boolean | null
          journey_data?: Json | null
          stages_participated?: number | null
          total_votes_received?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_competition_journey_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_competition_journey_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_competition_journey_current_stage_id_fkey"
            columns: ["current_stage_id"]
            isOneToOne: false
            referencedRelation: "competition_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_competition_journey_elimination_stage_id_fkey"
            columns: ["elimination_stage_id"]
            isOneToOne: false
            referencedRelation: "competition_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_earned_badges: {
        Row: {
          artist_id: string
          badge_id: string
          earned_at: string
          id: string
        }
        Insert: {
          artist_id: string
          badge_id: string
          earned_at?: string
          id?: string
        }
        Update: {
          artist_id?: string
          badge_id?: string
          earned_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_earned_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "artist_badges"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_profiles: {
        Row: {
          banner_url: string | null
          created_at: string
          genres: string[] | null
          id: string
          social_links: Json | null
          stage_name: string | null
          talent_score: number | null
          total_earnings: number | null
          updated_at: string
          user_id: string
          verified: boolean | null
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          genres?: string[] | null
          id?: string
          social_links?: Json | null
          stage_name?: string | null
          talent_score?: number | null
          total_earnings?: number | null
          updated_at?: string
          user_id: string
          verified?: boolean | null
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          genres?: string[] | null
          id?: string
          social_links?: Json | null
          stage_name?: string | null
          talent_score?: number | null
          total_earnings?: number | null
          updated_at?: string
          user_id?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_profiles: {
        Row: {
          company_name: string
          created_at: string
          description: string | null
          id: string
          industry: string | null
          updated_at: string
          user_id: string
          verified: boolean | null
          website: string | null
        }
        Insert: {
          company_name: string
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          updated_at?: string
          user_id: string
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          updated_at?: string
          user_id?: string
          verified?: boolean | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_requests: {
        Row: {
          created_at: string
          from_artist_id: string
          id: string
          message: string | null
          project_details: Json | null
          status: string
          to_artist_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_artist_id: string
          id?: string
          message?: string | null
          project_details?: Json | null
          status?: string
          to_artist_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_artist_id?: string
          id?: string
          message?: string | null
          project_details?: Json | null
          status?: string
          to_artist_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_requests_from_artist_id_fkey"
            columns: ["from_artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "collaboration_requests_to_artist_id_fkey"
            columns: ["to_artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      collaborations: {
        Row: {
          artist_ids: string[]
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          request_id: string | null
          status: string
          title: string
          track_id: string | null
        }
        Insert: {
          artist_ids: string[]
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          request_id?: string | null
          status?: string
          title: string
          track_id?: string | null
        }
        Update: {
          artist_ids?: string[]
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          request_id?: string | null
          status?: string
          title?: string
          track_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaborations_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "collaboration_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaborations_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          track_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          track_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          track_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_prizes: {
        Row: {
          awarded_at: string | null
          awarded_to: string | null
          competition_id: string
          created_at: string | null
          id: string
          is_awarded: boolean | null
          placement: number
          prize_description: string | null
          prize_type: string
          prize_value: number | null
          sponsor_id: string | null
          stage_id: string | null
        }
        Insert: {
          awarded_at?: string | null
          awarded_to?: string | null
          competition_id: string
          created_at?: string | null
          id?: string
          is_awarded?: boolean | null
          placement: number
          prize_description?: string | null
          prize_type: string
          prize_value?: number | null
          sponsor_id?: string | null
          stage_id?: string | null
        }
        Update: {
          awarded_at?: string | null
          awarded_to?: string | null
          competition_id?: string
          created_at?: string | null
          id?: string
          is_awarded?: boolean | null
          placement?: number
          prize_description?: string | null
          prize_type?: string
          prize_value?: number | null
          sponsor_id?: string | null
          stage_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_prizes_awarded_to_fkey"
            columns: ["awarded_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_prizes_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_prizes_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "brand_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_prizes_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "competition_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_stages: {
        Row: {
          challenge_theme: string | null
          competition_id: string
          created_at: string | null
          description: string | null
          elimination_count: number | null
          end_date: string
          id: string
          max_participants: number | null
          stage_name: string
          stage_number: number
          stage_type: string
          start_date: string
          status: string | null
          updated_at: string | null
          voting_end_date: string | null
          voting_start_date: string | null
        }
        Insert: {
          challenge_theme?: string | null
          competition_id: string
          created_at?: string | null
          description?: string | null
          elimination_count?: number | null
          end_date: string
          id?: string
          max_participants?: number | null
          stage_name: string
          stage_number: number
          stage_type: string
          start_date: string
          status?: string | null
          updated_at?: string | null
          voting_end_date?: string | null
          voting_start_date?: string | null
        }
        Update: {
          challenge_theme?: string | null
          competition_id?: string
          created_at?: string | null
          description?: string | null
          elimination_count?: number | null
          end_date?: string
          id?: string
          max_participants?: number | null
          stage_name?: string
          stage_number?: number
          stage_type?: string
          start_date?: string
          status?: string | null
          updated_at?: string | null
          voting_end_date?: string | null
          voting_start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_stages_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          cover_image: string | null
          created_at: string
          created_by: string
          description: string | null
          end_date: string
          entry_fee: number | null
          genres: string[] | null
          id: string
          max_submissions: number | null
          prize_amount: number
          rules: Json | null
          start_date: string
          status: Database["public"]["Enums"]["competition_status"] | null
          title: string
          updated_at: string
          visibility: string | null
          voting_end_date: string | null
          voting_start_date: string | null
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_date: string
          entry_fee?: number | null
          genres?: string[] | null
          id?: string
          max_submissions?: number | null
          prize_amount: number
          rules?: Json | null
          start_date: string
          status?: Database["public"]["Enums"]["competition_status"] | null
          title: string
          updated_at?: string
          visibility?: string | null
          voting_end_date?: string | null
          voting_start_date?: string | null
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string
          entry_fee?: number | null
          genres?: string[] | null
          id?: string
          max_submissions?: number | null
          prize_amount?: number
          rules?: Json | null
          start_date?: string
          status?: Database["public"]["Enums"]["competition_status"] | null
          title?: string
          updated_at?: string
          visibility?: string | null
          voting_end_date?: string | null
          voting_start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          responded_at: string | null
          status: string | null
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          responded_at?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          responded_at?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: []
      }
      deposit_requests: {
        Row: {
          amount_kes: number
          created_at: string | null
          expected_bak: number | null
          id: string
          metadata: Json | null
          notes: string | null
          receipt_code: string
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_url: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount_kes: number
          created_at?: string | null
          expected_bak?: number | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          receipt_code: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount_kes?: number
          created_at?: string | null
          expected_bak?: number | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          receipt_code?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_url?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposit_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposit_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      early_access_signups: {
        Row: {
          converted: boolean | null
          converted_user_id: string | null
          created_at: string
          email: string
          id: string
          invited: boolean | null
          invited_at: string | null
          notes: string | null
          source: string | null
          user_type: string | null
        }
        Insert: {
          converted?: boolean | null
          converted_user_id?: string | null
          created_at?: string
          email: string
          id?: string
          invited?: boolean | null
          invited_at?: string | null
          notes?: string | null
          source?: string | null
          user_type?: string | null
        }
        Update: {
          converted?: boolean | null
          converted_user_id?: string | null
          created_at?: string
          email?: string
          id?: string
          invited?: boolean | null
          invited_at?: string | null
          notes?: string | null
          source?: string | null
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "early_access_signups_converted_user_id_fkey"
            columns: ["converted_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fan_activities: {
        Row: {
          activity_type: string
          created_at: string
          id: string
          metadata: Json | null
          points_earned: number
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          points_earned?: number
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          points_earned?: number
          user_id?: string
        }
        Relationships: []
      }
      fan_badges: {
        Row: {
          badge_description: string | null
          badge_icon: string | null
          badge_name: string
          badge_type: string
          created_at: string | null
          id: string
          rarity: string | null
          unlock_criteria: Json | null
        }
        Insert: {
          badge_description?: string | null
          badge_icon?: string | null
          badge_name: string
          badge_type: string
          created_at?: string | null
          id?: string
          rarity?: string | null
          unlock_criteria?: Json | null
        }
        Update: {
          badge_description?: string | null
          badge_icon?: string | null
          badge_name?: string
          badge_type?: string
          created_at?: string | null
          id?: string
          rarity?: string | null
          unlock_criteria?: Json | null
        }
        Relationships: []
      }
      fan_rewards_tiers: {
        Row: {
          badge_icon: string | null
          created_at: string
          id: string
          min_points: number
          reward_multiplier: number
          tier_name: string
        }
        Insert: {
          badge_icon?: string | null
          created_at?: string
          id?: string
          min_points: number
          reward_multiplier?: number
          tier_name: string
        }
        Update: {
          badge_icon?: string | null
          created_at?: string
          id?: string
          min_points?: number
          reward_multiplier?: number
          tier_name?: string
        }
        Relationships: []
      }
      followers: {
        Row: {
          artist_id: string
          created_at: string
          follower_id: string
          id: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          follower_id: string
          id?: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          follower_id?: string
          id?: string
        }
        Relationships: []
      }
      listening_history: {
        Row: {
          id: string
          listened_at: string
          track_id: string
          user_id: string
        }
        Insert: {
          id?: string
          listened_at?: string
          track_id: string
          user_id: string
        }
        Update: {
          id?: string
          listened_at?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listening_history_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      live_streams: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          artist_id: string
          created_at: string
          description: string | null
          id: string
          max_viewers: number | null
          scheduled_start: string
          status: string
          stream_url: string | null
          thumbnail_url: string | null
          title: string
          viewer_count: number | null
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          artist_id: string
          created_at?: string
          description?: string | null
          id?: string
          max_viewers?: number | null
          scheduled_start: string
          status?: string
          stream_url?: string | null
          thumbnail_url?: string | null
          title: string
          viewer_count?: number | null
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          artist_id?: string
          created_at?: string
          description?: string | null
          id?: string
          max_viewers?: number | null
          scheduled_start?: string
          status?: string
          stream_url?: string | null
          thumbnail_url?: string | null
          title?: string
          viewer_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "live_streams_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          category: string | null
          created_at: string
          expires_at: string | null
          id: string
          link: string | null
          message: string
          priority: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          category?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          link?: string | null
          message: string
          priority?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          category?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          link?: string | null
          message?: string
          priority?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          email: string
          id: string
          metadata: Json | null
          payment_provider: string | null
          payment_reference: string | null
          reference: string
          selar_customer_id: string | null
          selar_payment_link: string | null
          selar_transaction_id: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          email: string
          id?: string
          metadata?: Json | null
          payment_provider?: string | null
          payment_reference?: string | null
          reference: string
          selar_customer_id?: string | null
          selar_payment_link?: string | null
          selar_transaction_id?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          email?: string
          id?: string
          metadata?: Json | null
          payment_provider?: string | null
          payment_reference?: string | null
          reference?: string
          selar_customer_id?: string | null
          selar_payment_link?: string | null
          selar_transaction_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paystack_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_tracks: {
        Row: {
          added_at: string
          id: string
          playlist_id: string
          position: number
          track_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          playlist_id: string
          position?: number
          track_id: string
        }
        Update: {
          added_at?: string
          id?: string
          playlist_id?: string
          position?: number
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          cover_image: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activation_code: string | null
          activation_code_sent_at: string | null
          avatar_url: string | null
          banned: boolean | null
          bio: string | null
          created_at: string
          email: string
          id: string
          is_activated: boolean | null
          location: string | null
          phone_number: string | null
          updated_at: string
          username: string
        }
        Insert: {
          activation_code?: string | null
          activation_code_sent_at?: string | null
          avatar_url?: string | null
          banned?: boolean | null
          bio?: string | null
          created_at?: string
          email: string
          id: string
          is_activated?: boolean | null
          location?: string | null
          phone_number?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          activation_code?: string | null
          activation_code_sent_at?: string | null
          avatar_url?: string | null
          banned?: boolean | null
          bio?: string | null
          created_at?: string
          email?: string
          id?: string
          is_activated?: boolean | null
          location?: string | null
          phone_number?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          request_count: number
          user_id: string
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          request_count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          request_count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          user_id: string
          uses_count: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          user_id: string
          uses_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          user_id?: string
          uses_count?: number
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          referred_id: string
          referrer_id: string
          reward_amount: number
          rewarded: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          referred_id: string
          referrer_id: string
          reward_amount?: number
          rewarded?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          reward_amount?: number
          rewarded?: boolean
        }
        Relationships: []
      }
      role_upgrades: {
        Row: {
          from_role: Database["public"]["Enums"]["app_role"]
          id: string
          reason: string | null
          to_role: Database["public"]["Enums"]["app_role"]
          upgraded_at: string
          user_id: string
        }
        Insert: {
          from_role: Database["public"]["Enums"]["app_role"]
          id?: string
          reason?: string | null
          to_role: Database["public"]["Enums"]["app_role"]
          upgraded_at?: string
          user_id: string
        }
        Update: {
          from_role?: Database["public"]["Enums"]["app_role"]
          id?: string
          reason?: string | null
          to_role?: Database["public"]["Enums"]["app_role"]
          upgraded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      share_analytics: {
        Row: {
          id: string
          platform: string
          shared_at: string
          track_id: string
          user_id: string | null
        }
        Insert: {
          id?: string
          platform: string
          shared_at?: string
          track_id: string
          user_id?: string | null
        }
        Update: {
          id?: string
          platform?: string
          shared_at?: string
          track_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "share_analytics_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      share_rewards: {
        Row: {
          artist_id: string | null
          created_at: string
          id: string
          reward_amount: number
          share_platform: string | null
          track_id: string | null
          user_id: string
        }
        Insert: {
          artist_id?: string | null
          created_at?: string
          id?: string
          reward_amount?: number
          share_platform?: string | null
          track_id?: string | null
          user_id: string
        }
        Update: {
          artist_id?: string | null
          created_at?: string
          id?: string
          reward_amount?: number
          share_platform?: string | null
          track_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_rewards_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "share_rewards_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_submissions: {
        Row: {
          artist_id: string
          created_at: string | null
          eliminated_at: string | null
          elimination_round: number | null
          id: string
          stage_id: string
          stage_rank: number | null
          status: string | null
          submission_id: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          eliminated_at?: string | null
          elimination_round?: number | null
          id?: string
          stage_id: string
          stage_rank?: number | null
          status?: string | null
          submission_id?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          eliminated_at?: string | null
          elimination_round?: number | null
          id?: string
          stage_id?: string
          stage_rank?: number | null
          status?: string | null
          submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stage_submissions_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_submissions_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "competition_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_submissions_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_viewers: {
        Row: {
          id: string
          joined_at: string
          left_at: string | null
          stream_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          left_at?: string | null
          stream_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          left_at?: string | null
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_viewers_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          ai_analysis: Json | null
          ai_analyzed_at: string | null
          ai_score: number | null
          artist_id: string
          audio_url: string
          competition_id: string
          cover_image: string | null
          created_at: string
          description: string | null
          final_score: number | null
          id: string
          moderated_at: string | null
          moderated_by: string | null
          moderation_notes: string | null
          moderation_status: string | null
          status: Database["public"]["Enums"]["submission_status"] | null
          title: string
          track_id: string | null
          updated_at: string
          vote_count: number | null
        }
        Insert: {
          ai_analysis?: Json | null
          ai_analyzed_at?: string | null
          ai_score?: number | null
          artist_id: string
          audio_url: string
          competition_id: string
          cover_image?: string | null
          created_at?: string
          description?: string | null
          final_score?: number | null
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          moderation_status?: string | null
          status?: Database["public"]["Enums"]["submission_status"] | null
          title: string
          track_id?: string | null
          updated_at?: string
          vote_count?: number | null
        }
        Update: {
          ai_analysis?: Json | null
          ai_analyzed_at?: string | null
          ai_score?: number | null
          artist_id?: string
          audio_url?: string
          competition_id?: string
          cover_image?: string | null
          created_at?: string
          description?: string | null
          final_score?: number | null
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          moderation_status?: string | null
          status?: Database["public"]["Enums"]["submission_status"] | null
          title?: string
          track_id?: string | null
          updated_at?: string
          vote_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price_bak: number
          price_kes: number
          upload_limit: number | null
        }
        Insert: {
          created_at?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price_bak?: number
          price_kes?: number
          upload_limit?: number | null
        }
        Update: {
          created_at?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_bak?: number
          price_kes?: number
          upload_limit?: number | null
        }
        Relationships: []
      }
      subscription_transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          id: string
          payment_reference: string | null
          status: string
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          id?: string
          payment_reference?: string | null
          status?: string
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          payment_reference?: string | null
          status?: string
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          responded_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          responded_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          responded_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      tips: {
        Row: {
          amount: number
          created_at: string
          from_user_id: string
          id: string
          message: string | null
          to_artist_id: string
          track_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          from_user_id: string
          id?: string
          message?: string | null
          to_artist_id: string
          track_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          from_user_id?: string
          id?: string
          message?: string | null
          to_artist_id?: string
          track_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tips_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      track_likes: {
        Row: {
          created_at: string | null
          id: string
          track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          track_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_likes_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          artist_id: string
          audio_url: string
          cover_image: string | null
          created_at: string | null
          duration: number | null
          genre: string | null
          id: string
          moderated_at: string | null
          moderated_by: string | null
          moderation_notes: string | null
          moderation_status: string | null
          plays: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          artist_id: string
          audio_url: string
          cover_image?: string | null
          created_at?: string | null
          duration?: number | null
          genre?: string | null
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          moderation_status?: string | null
          plays?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          artist_id?: string
          audio_url?: string
          cover_image?: string | null
          created_at?: string | null
          duration?: number | null
          genre?: string | null
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          moderation_status?: string | null
          plays?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracks_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          mpesa_phone_number: string | null
          mpesa_receipt_number: string | null
          reference_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          wallet_id: string
          withdrawal_fee: number | null
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          mpesa_phone_number?: string | null
          mpesa_receipt_number?: string | null
          reference_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          wallet_id: string
          withdrawal_fee?: number | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          mpesa_phone_number?: string | null
          mpesa_receipt_number?: string | null
          reference_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          wallet_id?: string
          withdrawal_fee?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          artist_id: string | null
          badge_id: string
          competition_id: string | null
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          artist_id?: string | null
          badge_id: string
          competition_id?: string | null
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          artist_id?: string | null
          badge_id?: string
          competition_id?: string | null
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "fan_badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          auto_renew: boolean | null
          created_at: string | null
          expires_at: string
          id: string
          payment_method: string | null
          plan_id: string
          started_at: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string | null
          expires_at: string
          id?: string
          payment_method?: string | null
          plan_id: string
          started_at?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string | null
          expires_at?: string
          id?: string
          payment_method?: string | null
          plan_id?: string
          started_at?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          created_at: string
          id: string
          stage_id: string | null
          submission_id: string
          vote_weight: number | null
          voted_at: string | null
          voter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          stage_id?: string | null
          submission_id: string
          vote_weight?: number | null
          voted_at?: string | null
          voter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stage_id?: string | null
          submission_id?: string
          vote_weight?: number | null
          voted_at?: string | null
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "competition_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          bak_coins: number
          code: string
          created_at: string | null
          expires_at: string | null
          id: string
          issued_by: string
          issued_to: string | null
          metadata: Json | null
          status: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          bak_coins: number
          code: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          issued_by: string
          issued_to?: string | null
          metadata?: Json | null
          status?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          bak_coins?: number
          code?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          issued_by?: string
          issued_to?: string | null
          metadata?: Json | null
          status?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouchers_issued_to_fkey"
            columns: ["issued_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouchers_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_select_competition_winners: { Args: never; Returns: undefined }
      calculate_submission_final_scores: {
        Args: { competition_uuid: string }
        Returns: undefined
      }
      can_enter_competition: {
        Args: { competition_id_param: string; user_id_param: string }
        Returns: boolean
      }
      can_user_upload_track: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      get_primary_role: { Args: { user_id_param: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_sufficient_balance: {
        Args: { _amount: number; _user_id: string }
        Returns: boolean
      }
      is_not_fan: { Args: { user_id_param: string }; Returns: boolean }
      transfer_funds: {
        Args: {
          recipient_id: string
          sender_id: string
          transfer_amount: number
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "artist" | "brand" | "admin" | "fan"
      competition_status:
        | "draft"
        | "active"
        | "voting"
        | "completed"
        | "cancelled"
      submission_status: "pending" | "approved" | "rejected"
      transaction_type:
        | "purchase"
        | "earning"
        | "vote"
        | "prize"
        | "refund"
        | "spending"
        | "withdrawal"
        | "income"
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
      app_role: ["artist", "brand", "admin", "fan"],
      competition_status: [
        "draft",
        "active",
        "voting",
        "completed",
        "cancelled",
      ],
      submission_status: ["pending", "approved", "rejected"],
      transaction_type: [
        "purchase",
        "earning",
        "vote",
        "prize",
        "refund",
        "spending",
        "withdrawal",
        "income",
      ],
    },
  },
} as const
