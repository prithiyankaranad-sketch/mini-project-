// Browser API intentionally exposes only profile tables and typed RPC boundaries. Full rows are Zod-validated in portal.ts. Regenerate complete server catalog types after linking:
// supabase gen types typescript --linked > src/types/database.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
export type AppRole = "student" | "organizer" | "admin";
export type Profile = {
  id: string;
  email: string;
  rrn: string;
  full_name: string;
  department: string;
  study_year: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: never;
        Update: Pick<Profile, "full_name" | "department" | "study_year">;
        Relationships: [];
      };
      user_roles: {
        Row: {
          user_id: string;
          role: AppRole;
          granted_by: string | null;
          granted_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: number;
          actor_id: string | null;
          subject_id: string | null;
          action: string;
          details: Record<string, unknown>;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      portal_public: { Args: { resource: string; args?: Json }; Returns: Json };
      portal_read: { Args: { resource: string; args?: Json }; Returns: Json };
      portal_command: {
        Args: { operation: string; payload?: Json };
        Returns: Json;
      };
    };
    Enums: { app_role: AppRole };
    CompositeTypes: Record<never, never>;
  };
};
