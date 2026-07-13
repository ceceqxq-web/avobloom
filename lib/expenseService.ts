import { supabase } from "./supabase";
import {
  ExpenseInput,
  RecurringExpenseInput,
  RecurringExpenseRecord,
} from "./expenseTypes";
import type { SupabaseClient } from "@supabase/supabase-js";

async function getUserId(client: SupabaseClient = supabase) {
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new Error("Please sign in before changing expenses.");
  return user.id;
}

function toLegacyExpense(expense: ExpenseInput) {
  return {
    merchant: expense.merchant,
    item_name: expense.item_name,
    purchase_price: expense.purchase_price,
    expense_date: expense.expense_date,
    category: expense.category,
    financial_type: expense.financial_type,
    current_estimated_value: expense.current_estimated_value,
    net_worth_impact: expense.net_worth_impact,
  };
}

function isMissingColumnError(message?: string) {
  return Boolean(
    message?.includes("schema cache") ||
      message?.includes("column") ||
      message?.includes("Could not find"),
  );
}

export function isMissingRecurringExpensesTableError(message?: string) {
  return Boolean(
    message?.includes("recurring_expenses") &&
      (message.includes("schema cache") ||
        message.includes("relation") ||
        message.includes("does not exist") ||
        message.includes("Could not find")),
  );
}

export async function createExpense(expense: ExpenseInput) {
  const userId = await getUserId();
  const ownedExpense = { ...expense, user_id: userId };
  const result = await supabase.from("expenses").insert(ownedExpense);

  if (isMissingColumnError(result.error?.message)) {
    return await supabase.from("expenses").insert(toLegacyExpense(ownedExpense));
  }

  return result;
}

export async function createExpenses(expenses: ExpenseInput[]) {
  const userId = await getUserId();
  const ownedExpenses = expenses.map((expense) => ({ ...expense, user_id: userId }));
  const result = await supabase.from("expenses").insert(ownedExpenses);

  if (isMissingColumnError(result.error?.message)) {
    return await supabase.from("expenses").insert(ownedExpenses.map(toLegacyExpense));
  }

  return result;
}

function addFrequency(dateValue: string, frequency: RecurringExpenseRecord["recurrence_frequency"]) {
  const date = new Date(`${dateValue}T00:00:00`);

  if (frequency === "weekly") {
    date.setDate(date.getDate() + 7);
  } else {
    date.setMonth(date.getMonth() + 1);
  }

  return date.toISOString().slice(0, 10);
}

function toExpenseFromRecurring(recurring: RecurringExpenseRecord): ExpenseInput {
  return {
    user_id: recurring.user_id,
    merchant: recurring.merchant,
    item_name: recurring.item_name,
    purchase_price: recurring.purchase_price,
    expense_date: recurring.next_occurrence_date,
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

export async function createRecurringExpenses(recurringExpenses: RecurringExpenseInput[]) {
  if (!recurringExpenses.length) return { error: null };
  const userId = await getUserId();
  const result = await supabase
    .from("recurring_expenses")
    .insert(recurringExpenses.map((expense) => ({ ...expense, user_id: userId })));

  if (result.error) {
    if (isMissingRecurringExpensesTableError(result.error.message)) {
      return {
        ...result,
        error: {
          ...result.error,
          message:
            "循环支出功能需要先在 Supabase 创建 recurring_expenses 表。请在 Supabase SQL Editor 执行 `supabase/migrations/202607120002_add_recurring_expenses.sql`，然后刷新页面。",
        },
      };
    }

    return result;
  }

  return await materializeDueRecurringExpenses();
}

export async function materializeDueRecurringExpenses(client: SupabaseClient = supabase) {
  const today = new Date().toISOString().slice(0, 10);
  let materializedCount = 0;
  const { data, error } = await client
    .from("recurring_expenses")
    .select("*")
    .eq("is_active", true)
    .lte("next_occurrence_date", today);

  if (error) return { error };

  for (const recurring of ((data || []) as RecurringExpenseRecord[])) {
    const dueExpenses: ExpenseInput[] = [];
    let nextDate = recurring.next_occurrence_date;
    let guard = 0;

    while (nextDate <= today && guard < 24) {
      dueExpenses.push({
        ...toExpenseFromRecurring({
          ...recurring,
          next_occurrence_date: nextDate,
        }),
      });
      nextDate = addFrequency(nextDate, recurring.recurrence_frequency);
      guard += 1;
    }

    if (dueExpenses.length) {
      const { error: insertError } = await client.from("expenses").insert(dueExpenses);
      if (insertError) return { error: insertError };
      materializedCount += dueExpenses.length;

      const { error: updateError } = await client
        .from("recurring_expenses")
        .update({
          last_generated_date: dueExpenses[dueExpenses.length - 1].expense_date,
          next_occurrence_date: nextDate,
        })
        .eq("id", recurring.id);

      if (updateError) return { error: updateError };
    }
  }

  return { error: null, materializedCount };
}

export async function updateExpense(id: string, expense: ExpenseInput) {
  const result = await supabase.from("expenses").update(expense).eq("id", id);

  if (isMissingColumnError(result.error?.message)) {
    return await supabase
      .from("expenses")
      .update(toLegacyExpense(expense))
      .eq("id", id);
  }

  return result;
}
