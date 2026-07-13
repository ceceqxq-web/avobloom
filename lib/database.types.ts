export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      expenses: {
        Row: {
          id: string;
          created_at: string;
          user_id: string | null;
          merchant: string;
          item_name: string;
          purchase_price: number;
          expense_date: string | null;
          category: string;
          financial_type: "expense" | "ongoing_cost" | "value_asset" | "investment";
          current_estimated_value: number;
          net_worth_impact: number;
          brand: string | null;
          brand_positioning: string | null;
          consumption_rate: number | null;
          market_price_low: number | null;
          market_price_high: number | null;
          price_confidence: number | null;
          price_estimate_source: string | null;
          price_reasoning: string | null;
          ai_confidence: number | null;
          ai_summary: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          merchant: string;
          item_name: string;
          purchase_price: number;
          expense_date?: string | null;
          category: string;
          financial_type: "expense" | "ongoing_cost" | "value_asset" | "investment";
          current_estimated_value?: number;
          net_worth_impact?: number;
          brand?: string | null;
          brand_positioning?: string | null;
          consumption_rate?: number | null;
          market_price_low?: number | null;
          market_price_high?: number | null;
          price_confidence?: number | null;
          price_estimate_source?: string | null;
          price_reasoning?: string | null;
          ai_confidence?: number | null;
          ai_summary?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["expenses"]["Insert"]>;
        Relationships: [];
      };
      recurring_expenses: {
        Row: {
          id: string;
          created_at: string;
          user_id: string | null;
          merchant: string;
          item_name: string;
          purchase_price: number;
          category: string;
          current_estimated_value: number;
          brand: string;
          brand_positioning: string | null;
          consumption_rate: number;
          market_price_low: number | null;
          market_price_high: number | null;
          price_confidence: number | null;
          price_estimate_source: string | null;
          price_reasoning: string | null;
          ai_confidence: number;
          ai_summary: string;
          recurrence_frequency: "weekly" | "monthly";
          start_date: string;
          next_occurrence_date: string;
          last_generated_date: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          merchant?: string;
          item_name?: string;
          purchase_price?: number;
          category?: string;
          current_estimated_value?: number;
          brand?: string;
          brand_positioning?: string | null;
          consumption_rate?: number;
          market_price_low?: number | null;
          market_price_high?: number | null;
          price_confidence?: number | null;
          price_estimate_source?: string | null;
          price_reasoning?: string | null;
          ai_confidence?: number;
          ai_summary?: string;
          recurrence_frequency: "weekly" | "monthly";
          start_date: string;
          next_occurrence_date: string;
          last_generated_date?: string | null;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["recurring_expenses"]["Insert"]>;
        Relationships: [];
      };
      spending_goals: {
        Row: {
          user_id: string;
          weekly_goal: number;
          monthly_goal: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          weekly_goal?: number;
          monthly_goal?: number;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["spending_goals"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
