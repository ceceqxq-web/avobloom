import type { Tables } from "./database.types";

export const financialTypes = [
  "expense",
  "ongoing_cost",
  "value_asset",
  "investment",
] as const;

export type FinancialType = (typeof financialTypes)[number];
export const recurrenceFrequencies = ["none", "weekly", "monthly"] as const;

export type RecurrenceFrequency = (typeof recurrenceFrequencies)[number];

export type ExpenseInput = {
  user_id?: string;
  merchant: string;
  item_name: string;
  purchase_price: number;
  category: string;
  financial_type: FinancialType;
  current_estimated_value: number;
  net_worth_impact: number;
  brand: string;
  brand_positioning?: string;
  consumption_rate: number;
  market_price_low?: number;
  market_price_high?: number;
  price_confidence?: number;
  price_estimate_source?: string;
  price_reasoning?: string;
  ai_confidence: number;
  ai_summary: string;
  expense_date?: string;
  recurrence_frequency?: RecurrenceFrequency;
  recurring_start_date?: string;
};

export type ExpenseRecord = Tables<"expenses">;

export type ExpenseAnalysis = {
  merchant: string;
  item_name: string;
  purchase_price: number;
  expense_date?: string;
  category: string;
  financial_type: FinancialType;
  current_estimated_value: number;
  net_worth_impact: number;
  brand: string;
  brand_positioning: string;
  consumption_rate: number;
  market_price_low: number;
  market_price_high: number;
  price_confidence: number;
  price_estimate_source: string;
  price_reasoning: string;
  ai_confidence: number;
  ai_summary: string;
  recurrence_frequency?: RecurrenceFrequency;
  recurring_start_date?: string;
};

export type RecurringExpenseInput = Omit<
  ExpenseInput,
  "expense_date" | "financial_type" | "net_worth_impact"
> & {
  recurrence_frequency: Exclude<RecurrenceFrequency, "none">;
  start_date: string;
  next_occurrence_date: string;
  is_active?: boolean;
};

export type RecurringExpenseRecord = Tables<"recurring_expenses">;

export type ExpenseAnalysisResult = {
  items: ExpenseAnalysis[];
  total_price: number;
  ai_summary: string;
};

export function calculateNetWorthImpact(
  financialType: FinancialType,
  currentEstimatedValue: number,
) {
  if (financialType === "value_asset" || financialType === "investment") {
    return Math.max(Number(currentEstimatedValue || 0), 0);
  }

  return 0;
}
