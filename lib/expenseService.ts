import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "./database.types";
import { supabase } from "./supabase";

type RecurringExpenseRecord = Tables<"recurring_expenses">;

function addFrequency(
  dateValue: string,
  frequency: RecurringExpenseRecord["recurrence_frequency"],
) {
  const date = new Date(`${dateValue}T00:00:00`);

  if (frequency === "weekly") {
    date.setDate(date.getDate() + 7);
  } else {
    date.setMonth(date.getMonth() + 1);
  }

  return date.toISOString().slice(0, 10);
}

function toExpenseFromRecurring(
  recurring: RecurringExpenseRecord,
  expenseDate: string,
): TablesInsert<"expenses"> | null {
  if (!recurring.user_id) return null;

  return {
    user_id: recurring.user_id,
    merchant: recurring.merchant,
    item_name: recurring.item_name,
    purchase_price: recurring.purchase_price,
    expense_date: expenseDate,
    category: recurring.category,
    financial_type: "ongoing_cost",
    current_estimated_value: 0,
    net_worth_impact: 0,
    brand: recurring.brand,
    brand_positioning: recurring.brand_positioning,
    consumption_rate: recurring.consumption_rate,
    market_price_low: recurring.market_price_low,
    market_price_high: recurring.market_price_high,
    price_confidence: recurring.price_confidence,
    price_estimate_source: recurring.price_estimate_source,
    price_reasoning: recurring.price_reasoning,
    ai_confidence: recurring.ai_confidence,
    ai_summary: recurring.ai_summary,
  };
}

export async function materializeDueRecurringExpenses(
  client: SupabaseClient<Database> = supabase,
) {
  const today = new Date().toISOString().slice(0, 10);
  let materializedCount = 0;
  const { data, error } = await client
    .from("recurring_expenses")
    .select("*")
    .eq("is_active", true)
    .lte("next_occurrence_date", today);

  if (error) return { error };

  for (const recurring of data ?? []) {
    const dueExpenses: TablesInsert<"expenses">[] = [];
    let nextDate = recurring.next_occurrence_date;
    let lastGeneratedDate: string | null = null;
    let guard = 0;

    while (nextDate <= today && guard < 24) {
      const dueExpense = toExpenseFromRecurring(recurring, nextDate);
      if (dueExpense) {
        dueExpenses.push(dueExpense);
        lastGeneratedDate = nextDate;
      }
      nextDate = addFrequency(nextDate, recurring.recurrence_frequency);
      guard += 1;
    }

    if (dueExpenses.length && lastGeneratedDate) {
      const { error: insertError } = await client
        .from("expenses")
        .insert(dueExpenses);
      if (insertError) return { error: insertError };
      materializedCount += dueExpenses.length;

      const { error: updateError } = await client
        .from("recurring_expenses")
        .update({
          last_generated_date: lastGeneratedDate,
          next_occurrence_date: nextDate,
        })
        .eq("id", recurring.id);

      if (updateError) return { error: updateError };
    }
  }

  return { error: null, materializedCount };
}

export async function updateExpense(
  id: string,
  expense: TablesUpdate<"expenses">,
) {
  return supabase.from("expenses").update(expense).eq("id", id);
}
