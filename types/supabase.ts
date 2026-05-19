export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type PlaceStatus = "pending" | "visited" | "favorite";
export type PlaceSource = "manual" | "google_maps" | "tiktok" | "instagram" | "website";
export type PlaceProvider = "manual" | "mapbox" | "google_places";
export type GroupPlaceEditPolicy = "owner_only" | "members_can_edit";
export type GroupJoinPolicy = "invite_only" | "open_by_code" | "request_to_join";
export type GroupJoinRequestStatus = "pending" | "approved" | "rejected";
export type FriendRequestStatus = "pending" | "accepted" | "rejected";
export type GroupInvitationStatus = "pending" | "accepted" | "rejected";

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
          city: string | null;
          original_url: string | null;
          source: PlaceSource | null;
          provider: PlaceProvider | null;
          external_place_id: string | null;
          google_maps_url: string | null;
          business_status: string | null;
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
          city?: string | null;
          original_url?: string | null;
          source?: PlaceSource | null;
          provider?: PlaceProvider | null;
          external_place_id?: string | null;
          google_maps_url?: string | null;
          business_status?: string | null;
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
          city?: string | null;
          original_url?: string | null;
          source?: PlaceSource | null;
          provider?: PlaceProvider | null;
          external_place_id?: string | null;
          google_maps_url?: string | null;
          business_status?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          notes?: string | null;
          status?: PlaceStatus;
          updated_at?: string;
        };
      };
      personal_places: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          address: string | null;
          city: string | null;
          latitude: number;
          longitude: number;
          category: string | null;
          notes: string | null;
          source: PlaceSource | null;
          provider: PlaceProvider | null;
          external_place_id: string | null;
          google_maps_url: string | null;
          business_status: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          address?: string | null;
          city?: string | null;
          latitude: number;
          longitude: number;
          category?: string | null;
          notes?: string | null;
          source?: PlaceSource | null;
          provider?: PlaceProvider | null;
          external_place_id?: string | null;
          google_maps_url?: string | null;
          business_status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          address?: string | null;
          city?: string | null;
          latitude?: number;
          longitude?: number;
          category?: string | null;
          notes?: string | null;
          source?: PlaceSource | null;
          provider?: PlaceProvider | null;
          external_place_id?: string | null;
          google_maps_url?: string | null;
          business_status?: string | null;
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
      friend_requests: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          status: FriendRequestStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          status?: FriendRequestStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: FriendRequestStatus;
          updated_at?: string;
        };
      };
      friendships: {
        Row: {
          id: string;
          user_a_id: string;
          user_b_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_a_id: string;
          user_b_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      group_invitations: {
        Row: {
          id: string;
          group_id: string;
          invited_by: string;
          invited_user_id: string;
          status: GroupInvitationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          invited_by: string;
          invited_user_id: string;
          status?: GroupInvitationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: GroupInvitationStatus;
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
