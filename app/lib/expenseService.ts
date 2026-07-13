import { supabase } from "@/lib/supabase";
import { ExpenseInput } from "@/lib/expenseTypes";

function toLegacyExpense(expense: ExpenseInput) {
  return {
    merchant: expense.merchant,
    item_name: expense.item_name,
    purchase_price: expense.purchase_price,
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

export async function createExpense(expense: ExpenseInput) {
  const result = await supabase.from("expenses").insert(expense);

  if (isMissingColumnError(result.error?.message)) {
    return await supabase.from("expenses").insert(toLegacyExpense(expense));
  }

  return result;
}

export async function createExpenses(expenses: ExpenseInput[]) {
  const result = await supabase.from("expenses").insert(expenses);

  if (isMissingColumnError(result.error?.message)) {
    return await supabase.from("expenses").insert(expenses.map(toLegacyExpense));
  }

  return result;
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
