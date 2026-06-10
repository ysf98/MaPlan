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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          color: string | null
          created_at: string
          group_id: string
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          group_id: string
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          group_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_requests: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          id: string
          user_a_id: string
          user_b_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_a_id: string
          user_b_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_a_id?: string
          user_b_id?: string
        }
        Relationships: []
      }
      group_activity_events: {
        Row: {
          actor_user_id: string
          created_at: string
          entity_id: string | null
          entity_name: string | null
          event_type: string
          group_id: string
          id: string
          metadata: Json | null
        }
        Insert: {
          actor_user_id: string
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          event_type: string
          group_id: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          actor_user_id?: string
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          event_type?: string
          group_id?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "group_activity_events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_invitations: {
        Row: {
          created_at: string
          group_id: string
          id: string
          invited_by: string
          invited_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          invited_by: string
          invited_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          invited_by?: string
          invited_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_invitations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_join_requests: {
        Row: {
          created_at: string
          group_id: string
          id: string
          message: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_join_requests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_plan_places: {
        Row: {
          added_by: string
          created_at: string
          id: string
          note: string | null
          place_id: string
          plan_id: string
          planned_at: string | null
        }
        Insert: {
          added_by: string
          created_at?: string
          id?: string
          note?: string | null
          place_id: string
          plan_id: string
          planned_at?: string | null
        }
        Update: {
          added_by?: string
          created_at?: string
          id?: string
          note?: string | null
          place_id?: string
          plan_id?: string
          planned_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_plan_places_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_plan_places_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "group_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      group_plan_votes: {
        Row: {
          created_at: string
          id: string
          plan_id: string
          updated_at: string
          user_id: string
          vote: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_id: string
          updated_at?: string
          user_id: string
          vote?: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_id?: string
          updated_at?: string
          user_id?: string
          vote?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_plan_votes_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "group_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      group_plans: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          group_id: string
          id: string
          planned_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          group_id: string
          id?: string
          planned_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          group_id?: string
          id?: string
          planned_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_plans_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_place_user_states: {
        Row: {
          created_at: string
          id: string
          is_favorite: boolean
          place_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_favorite?: boolean
          place_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_favorite?: boolean
          place_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_place_user_states_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          cover_image_url: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          join_code: string
          join_policy: string
          name: string
          privacy: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          join_code: string
          join_policy?: string
          name: string
          privacy?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          join_code?: string
          join_policy?: string
          name?: string
          privacy?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_places: {
        Row: {
          address: string | null
          business_status: string | null
          category: string | null
          city: string | null
          created_at: string
          external_place_id: string | null
          google_maps_url: string | null
          id: string
          image_url: string | null
          is_favorite: boolean
          latitude: number
          longitude: number
          name: string
          notes: string | null
          phone_number: string | null
          provider: string | null
          rating: number | null
          source: string | null
          status: string
          updated_at: string
          user_id: string
          user_ratings_total: number | null
        }
        Insert: {
          address?: string | null
          business_status?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          external_place_id?: string | null
          google_maps_url?: string | null
          id?: string
          image_url?: string | null
          is_favorite?: boolean
          latitude: number
          longitude: number
          name: string
          notes?: string | null
          phone_number?: string | null
          provider?: string | null
          rating?: number | null
          source?: string | null
          status?: string
          updated_at?: string
          user_id: string
          user_ratings_total?: number | null
        }
        Update: {
          address?: string | null
          business_status?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          external_place_id?: string | null
          google_maps_url?: string | null
          id?: string
          image_url?: string | null
          is_favorite?: boolean
          latitude?: number
          longitude?: number
          name?: string
          notes?: string | null
          phone_number?: string | null
          provider?: string | null
          rating?: number | null
          source?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          user_ratings_total?: number | null
        }
        Relationships: []
      }
      places: {
        Row: {
          address: string
          business_status: string | null
          category_id: string | null
          city: string | null
          created_at: string
          created_by: string
          external_place_id: string | null
          google_maps_url: string | null
          group_id: string
          id: string
          image_url: string | null
          is_favorite: boolean
          latitude: number | null
          longitude: number | null
          name: string
          notes: string | null
          original_url: string | null
          phone_number: string | null
          provider: string | null
          rating: number | null
          source: string | null
          status: string
          updated_at: string
          user_ratings_total: number | null
        }
        Insert: {
          address: string
          business_status?: string | null
          category_id?: string | null
          city?: string | null
          created_at?: string
          created_by: string
          external_place_id?: string | null
          google_maps_url?: string | null
          group_id: string
          id?: string
          image_url?: string | null
          is_favorite?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          notes?: string | null
          original_url?: string | null
          phone_number?: string | null
          provider?: string | null
          rating?: number | null
          source?: string | null
          status?: string
          updated_at?: string
          user_ratings_total?: number | null
        }
        Update: {
          address?: string
          business_status?: string | null
          category_id?: string | null
          city?: string | null
          created_at?: string
          created_by?: string
          external_place_id?: string | null
          google_maps_url?: string | null
          group_id?: string
          id?: string
          image_url?: string | null
          is_favorite?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          notes?: string | null
          original_url?: string | null
          phone_number?: string | null
          provider?: string | null
          rating?: number | null
          source?: string | null
          status?: string
          updated_at?: string
          user_ratings_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "places_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "places_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "places_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          full_name: string | null
          id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          full_name?: string | null
          id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          full_name?: string | null
          id?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_friend_request: {
        Args: { request_id: string }
        Returns: undefined
      }
      accept_group_invitation: {
        Args: { invitation_id: string }
        Returns: undefined
      }
      approve_group_join_request: {
        Args: { p_group_id: string; p_request_id: string }
        Returns: undefined
      }
      get_group_members_with_profiles: {
        Args: { p_group_id: string; p_limit?: number }
        Returns: {
          avatar_url: string | null
          created_at: string
          role: string
          user_id: string
          username: string | null
        }[]
      }
      get_profiles_by_ids: {
        Args: { p_ids: string[] }
        Returns: {
          avatar_url: string | null
          id: string
          username: string | null
        }[]
      }
      can_join_group_as_member: { Args: { p_group_id: string; p_user_id: string }; Returns: boolean }
      kick_group_member: { Args: { p_group_id: string; p_member_user_id: string }; Returns: undefined }
      can_manage_group_members: { Args: { p_group_id: string; p_user_id: string }; Returns: boolean }
      can_access_group: { Args: { p_group_id: string; p_user_id: string }; Returns: boolean }
      can_edit_group_shared_content: { Args: { p_group_id: string; p_user_id: string }; Returns: boolean }
      is_group_creator: { Args: { p_group_id: string; p_user_id: string }; Returns: boolean }
      is_group_member: { Args: { target_group_id: string }; Returns: boolean }
      is_group_owner: { Args: { target_group_id: string }; Returns: boolean }
      search_profiles_by_username: {
        Args: { p_query: string }
        Returns: {
          id: string
          username: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type PlaceStatus = "pending" | "visited"
export type PlaceSource = "manual" | "google_maps" | "tiktok" | "instagram" | "website"
export type PlaceProvider = "manual" | "mapbox" | "google_places"
export type GroupJoinPolicy = "invite_only" | "open_by_code" | "request_to_join"
export type GroupJoinRequestStatus = "pending" | "approved" | "rejected"
export type GroupPrivacy = "privado" | "abierto"
export type GroupPlanVote = "attending" | "not_attending"
export type FriendRequestStatus = "pending" | "accepted" | "rejected"
export type GroupInvitationStatus = "pending" | "accepted" | "rejected"

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
