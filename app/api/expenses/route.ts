import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ExpenseInput, RecurringExpenseInput } from "@/lib/expenseTypes";

type SaveExpensesBody = {
  expenses?: ExpenseInput[];
  recurringExpenses?: RecurringExpenseInput[];
};

function isValidExpense(value: unknown) {
  const expense = value as Partial<ExpenseInput> | null;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof expense?.item_name === "string" &&
    Number.isFinite(Number(expense.purchase_price))
  );
}

function isMissingColumnError(message?: string) {
  return Boolean(
    message?.includes("schema cache") ||
      message?.includes("Could not find") ||
      message?.includes("column"),
  );
}

function toCompatibleExpense(expense: ExpenseInput, userId: string) {
  return {
    user_id: userId,
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

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json(
      { error: "Your login session has expired. Please sign in again." },
      { status: 401 },
    );
  }

  let body: SaveExpensesBody;
  try {
    body = (await request.json()) as SaveExpensesBody;
  } catch {
    return Response.json({ error: "Invalid expense request." }, { status: 400 });
  }

  const expenses = Array.isArray(body.expenses) ? body.expenses : [];
  const recurringExpenses = Array.isArray(body.recurringExpenses)
    ? body.recurringExpenses
    : [];

  if (
    (!expenses.length && !recurringExpenses.length) ||
    expenses.length + recurringExpenses.length > 50 ||
    !expenses.every(isValidExpense) ||
    !recurringExpenses.every(isValidExpense)
  ) {
    return Response.json({ error: "Invalid expense items." }, { status: 400 });
  }

  const [initialExpenseResult, recurringResult] = await Promise.all([
    expenses.length
      ? supabase
          .from("expenses")
          .insert(expenses.map((expense) => ({ ...expense, user_id: user.id })))
      : Promise.resolve({ error: null }),
    recurringExpenses.length
      ? supabase
          .from("recurring_expenses")
          .insert(
            recurringExpenses.map((expense) => ({ ...expense, user_id: user.id })),
          )
      : Promise.resolve({ error: null }),
  ]);
  let expenseResult = initialExpenseResult;

  if (expenses.length && isMissingColumnError(expenseResult.error?.message)) {
    expenseResult = await supabase
      .from("expenses")
      .insert(expenses.map((expense) => toCompatibleExpense(expense, user.id)));
  }

  const error = expenseResult.error || recurringResult.error;

  if (error) {
    console.error("Expense save failed", { code: error.code, message: error.message });
    return Response.json({ error: error.message }, { status: 400 });
  }

  revalidatePath("/");
  revalidatePath("/expenses");
  revalidatePath("/reports");

  return Response.json({ ok: true });
}
