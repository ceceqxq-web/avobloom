import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/database.types";
import type {
  ExpenseCreateInput,
  RecurringExpenseCreateInput,
  SaveExpensesErrorCode,
  SaveExpensesRequest,
  SaveExpensesResponse,
} from "@/lib/expenseContracts";

const financialTypes = new Set([
  "expense",
  "ongoing_cost",
  "value_asset",
  "investment",
]);

function isOptionalString(value: unknown) {
  return value === undefined || value === null || typeof value === "string";
}

function isOptionalNumber(value: unknown) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "number" && Number.isFinite(value))
  );
}

function hasValidCommonFields(value: unknown) {
  const expense = value as Record<string, unknown> | null;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof expense?.merchant === "string" &&
    typeof expense.item_name === "string" &&
    typeof expense.purchase_price === "number" &&
    Number.isFinite(expense.purchase_price) &&
    typeof expense.category === "string" &&
    isOptionalNumber(expense.current_estimated_value) &&
    isOptionalString(expense.brand) &&
    isOptionalString(expense.brand_positioning) &&
    isOptionalNumber(expense.consumption_rate) &&
    isOptionalNumber(expense.market_price_low) &&
    isOptionalNumber(expense.market_price_high) &&
    isOptionalNumber(expense.price_confidence) &&
    isOptionalString(expense.price_estimate_source) &&
    isOptionalString(expense.price_reasoning) &&
    isOptionalNumber(expense.ai_confidence) &&
    isOptionalString(expense.ai_summary)
  );
}

function isValidExpense(value: unknown): value is ExpenseCreateInput {
  const expense = value as Record<string, unknown> | null;
  return (
    hasValidCommonFields(value) &&
    financialTypes.has(String(expense?.financial_type)) &&
    isOptionalString(expense?.expense_date) &&
    isOptionalNumber(expense?.net_worth_impact)
  );
}

function isValidRecurringExpense(
  value: unknown,
): value is RecurringExpenseCreateInput {
  const expense = value as Record<string, unknown> | null;
  return (
    hasValidCommonFields(value) &&
    (expense?.recurrence_frequency === "weekly" ||
      expense?.recurrence_frequency === "monthly") &&
    typeof expense.start_date === "string" &&
    typeof expense.next_occurrence_date === "string" &&
    (expense.is_active === undefined || typeof expense.is_active === "boolean")
  );
}

function classifyWriteError(code: string | undefined): SaveExpensesErrorCode {
  if (code === "PGRST204" || code === "PGRST205") return "SCHEMA_OUTDATED";
  if (code === "42501") return "PERMISSION_DENIED";
  return "DATABASE_WRITE_FAILED";
}

function isSaveExpensesRequest(value: unknown): value is SaveExpensesRequest {
  if (!value || typeof value !== "object") return false;
  const body = value as Partial<SaveExpensesRequest>;
  if (!Array.isArray(body.expenses) || !Array.isArray(body.recurringExpenses)) {
    return false;
  }
  const count = body.expenses.length + body.recurringExpenses.length;
  return (
    count > 0 &&
    count <= 50 &&
    body.expenses.every(isValidExpense) &&
    body.recurringExpenses.every(isValidRecurringExpense)
  );
}

function toExpenseInsert(
  expense: ExpenseCreateInput,
  userId: string,
): TablesInsert<"expenses"> {
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
    brand: expense.brand,
    brand_positioning: expense.brand_positioning,
    consumption_rate: expense.consumption_rate,
    market_price_low: expense.market_price_low,
    market_price_high: expense.market_price_high,
    price_confidence: expense.price_confidence,
    price_estimate_source: expense.price_estimate_source,
    price_reasoning: expense.price_reasoning,
    ai_confidence: expense.ai_confidence,
    ai_summary: expense.ai_summary,
  };
}

function toRecurringExpenseInsert(
  expense: RecurringExpenseCreateInput,
  userId: string,
): TablesInsert<"recurring_expenses"> {
  return {
    user_id: userId,
    merchant: expense.merchant,
    item_name: expense.item_name,
    purchase_price: expense.purchase_price,
    category: expense.category,
    current_estimated_value: expense.current_estimated_value,
    brand: expense.brand,
    brand_positioning: expense.brand_positioning,
    consumption_rate: expense.consumption_rate,
    market_price_low: expense.market_price_low,
    market_price_high: expense.market_price_high,
    price_confidence: expense.price_confidence,
    price_estimate_source: expense.price_estimate_source,
    price_reasoning: expense.price_reasoning,
    ai_confidence: expense.ai_confidence,
    ai_summary: expense.ai_summary,
    recurrence_frequency: expense.recurrence_frequency,
    start_date: expense.start_date,
    next_occurrence_date: expense.next_occurrence_date,
    is_active: expense.is_active,
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json(
      { ok: false, code: "UNAUTHENTICATED" } satisfies SaveExpensesResponse,
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, code: "INVALID_PAYLOAD" } satisfies SaveExpensesResponse,
      { status: 400 },
    );
  }

  if (!isSaveExpensesRequest(body)) {
    return Response.json(
      { ok: false, code: "INVALID_PAYLOAD" } satisfies SaveExpensesResponse,
      { status: 400 },
    );
  }

  const [expenseResult, recurringResult] = await Promise.all([
    body.expenses.length
      ? supabase
          .from("expenses")
          .insert(body.expenses.map((expense) => toExpenseInsert(expense, user.id)))
      : Promise.resolve({ error: null }),
    body.recurringExpenses.length
      ? supabase
          .from("recurring_expenses")
          .insert(
            body.recurringExpenses.map((expense) =>
              toRecurringExpenseInsert(expense, user.id),
            ),
          )
      : Promise.resolve({ error: null }),
  ]);
  const error = expenseResult.error || recurringResult.error;

  if (error) {
    console.error("Expense save failed", { code: error.code, message: error.message });
    return Response.json(
      { ok: false, code: classifyWriteError(error.code) } satisfies SaveExpensesResponse,
      { status: 500 },
    );
  }

  revalidatePath("/");
  revalidatePath("/expenses");
  revalidatePath("/reports");

  return Response.json({ ok: true } satisfies SaveExpensesResponse);
}
