export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type PlaceStatus = "pending" | "visited" | "favorite";
export type PlaceSource = "manual" | "google_maps" | "tiktok" | "instagram" | "website";
export type GroupPlaceEditPolicy = "owner_only" | "members_can_edit";
export type GroupJoinPolicy = "open_by_code" | "request_to_join";
export type GroupJoinRequestStatus = "pending" | "approved" | "rejected";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          username?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_by: string;
          join_code: string;
          place_edit_policy: GroupPlaceEditPolicy;
          join_policy: GroupJoinPolicy;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_by: string;
          join_code: string;
          place_edit_policy?: GroupPlaceEditPolicy;
          join_policy?: GroupJoinPolicy;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          join_code?: string;
          place_edit_policy?: GroupPlaceEditPolicy;
          join_policy?: GroupJoinPolicy;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: "owner" | "member";
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: "owner" | "member";
          created_at?: string;
        };
        Update: {
          role?: "owner" | "member";
        };
      };
      categories: {
        Row: {
          id: string;
          group_id: string;
          name: string;
          color: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          name: string;
          color?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          color?: string | null;
        };
      };
      places: {
        Row: {
          id: string;
          group_id: string;
          created_by: string;
          category_id: string | null;
          name: string;
          address: string;
          original_url: string | null;
          source: PlaceSource | null;
          latitude: number | null;
          longitude: number | null;
          notes: string | null;
          status: PlaceStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          created_by: string;
          category_id?: string | null;
          name: string;
          address: string;
          original_url?: string | null;
          source?: PlaceSource | null;
          latitude?: number | null;
          longitude?: number | null;
          notes?: string | null;
          status?: PlaceStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          name?: string;
          address?: string;
          original_url?: string | null;
          source?: PlaceSource | null;
          latitude?: number | null;
          longitude?: number | null;
          notes?: string | null;
          status?: PlaceStatus;
          updated_at?: string;
        };
      };
      group_join_requests: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          status: GroupJoinRequestStatus;
          message: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          status?: GroupJoinRequestStatus;
          message?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: GroupJoinRequestStatus;
          message?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
