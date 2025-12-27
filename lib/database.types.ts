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
      customer_google_ads_accounts: {
        Row: {
          id: string
          customer_id: string
          google_ads_customer_id: string
          access_token: string
          refresh_token: string
          expires_at: string
          scope: string | null
          account_name: string | null
          currency_code: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          google_ads_customer_id: string
          access_token: string
          refresh_token: string
          expires_at: string
          scope?: string | null
          account_name?: string | null
          currency_code?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          google_ads_customer_id?: string
          access_token?: string
          refresh_token?: string
          expires_at?: string
          scope?: string | null
          account_name?: string | null
          currency_code?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      google_ads_campaigns: {
        Row: {
          id: string
          customer_id: string
          campaign_id: string
          name: string
          status: string
          budget_amount_micros: number
          impressions: number
          clicks: number
          cost_micros: number
          conversions: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          campaign_id: string
          name: string
          status: string
          budget_amount_micros: number
          impressions?: number
          clicks?: number
          cost_micros?: number
          conversions?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          campaign_id?: string
          name?: string
          status?: string
          budget_amount_micros?: number
          impressions?: number
          clicks?: number
          cost_micros?: number
          conversions?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          created_at?: string
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
