import type { TablesInsert } from "@/lib/database.types";

export type ExpenseCreateInput = Omit<
  TablesInsert<"expenses">,
  "id" | "created_at" | "user_id"
>;

export type RecurringExpenseCreateInput = Omit<
  TablesInsert<"recurring_expenses">,
  "id" | "created_at" | "user_id" | "last_generated_date"
>;

export type SaveExpensesRequest = {
  expenses: ExpenseCreateInput[];
  recurringExpenses: RecurringExpenseCreateInput[];
};

export type SaveExpensesErrorCode =
  | "UNAUTHENTICATED"
  | "INVALID_PAYLOAD"
  | "SCHEMA_OUTDATED"
  | "PERMISSION_DENIED"
  | "DATABASE_WRITE_FAILED";

export type SaveExpensesResponse =
  | { ok: true }
  | { ok: false; code: SaveExpensesErrorCode; detail?: string };

export const saveExpensesErrorMessages: Record<SaveExpensesErrorCode, string> = {
  UNAUTHENTICATED: "Your login session has expired. Please sign in again.",
  INVALID_PAYLOAD:
    "The analyzed expense is incomplete. Open the item and check its fields.",
  SCHEMA_OUTDATED:
    "The expense database schema is out of date. Apply the latest Supabase migration and retry.",
  PERMISSION_DENIED:
    "Your account does not have permission to save this expense. Sign in again and retry.",
  DATABASE_WRITE_FAILED:
    "The expense could not be saved. Please retry in a moment.",
};
