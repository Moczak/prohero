export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string
          email: string
          name: string | null
          avatar_url: string | null
          phone: string | null
          birth_date: string | null
          role: 'admin' | 'atleta' | 'fa' | 'tecnico'
          team_id: string | null
          auth_user_id: string
          onboarding: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          email: string
          name?: string | null
          avatar_url?: string | null
          phone?: string | null
          birth_date?: string | null
          role?: 'admin' | 'atleta' | 'fa' | 'tecnico'
          team_id?: string | null
          auth_user_id: string
          onboarding?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          phone?: string | null
          birth_date?: string | null
          role?: 'admin' | 'atleta' | 'fa' | 'tecnico'
          team_id?: string | null
          auth_user_id?: string
          onboarding?: boolean
        }
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
  }
}
