export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type PlaceStatus = "pending" | "visited" | "favorite";

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
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_by: string;
          join_code: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          join_code?: string;
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
          latitude: number;
          longitude: number;
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
          latitude: number;
          longitude: number;
          notes?: string | null;
          status?: PlaceStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          name?: string;
          address?: string;
          latitude?: number;
          longitude?: number;
          notes?: string | null;
          status?: PlaceStatus;
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
