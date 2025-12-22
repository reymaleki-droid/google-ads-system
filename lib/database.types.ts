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
      leads: {
        Row: {
          id: string
          created_at: string
          full_name: string
          email: string
          phone: string
          whatsapp: string | null
          company_name: string | null
          website_url: string | null
          industry: string | null
          city: string | null
          goal_primary: string
          monthly_budget_range: string
          response_within_5_min: boolean
          decision_maker: boolean
          timeline: string
          recommended_package: string
          lead_score: number
          lead_grade: string
          status: string
          consent: boolean
          raw_answers: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          full_name: string
          email: string
          phone: string
          whatsapp?: string | null
          company_name?: string | null
          website_url?: string | null
          industry?: string | null
          city?: string | null
          goal_primary: string
          monthly_budget_range: string
          response_within_5_min: boolean
          decision_maker: boolean
          timeline: string
          recommended_package: string
          lead_score: number
          lead_grade: string
          status?: string
          consent: boolean
          raw_answers?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          full_name?: string
          email?: string
          phone?: string
          whatsapp?: string | null
          company_name?: string | null
          website_url?: string | null
          industry?: string | null
          city?: string | null
          goal_primary?: string
          monthly_budget_range?: string
          response_within_5_min?: boolean
          decision_maker?: boolean
          timeline?: string
          recommended_package?: string
          lead_score?: number
          lead_grade?: string
          status?: string
          consent?: boolean
          raw_answers?: Json | null
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
