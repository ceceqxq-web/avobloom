import AppLogo from "@/components/AppLogo";
import ExpensesTable from "./ExpensesTable";
import UpcomingRecurringCosts from "./UpcomingRecurringCosts";
import { materializeDueRecurringExpenses } from "@/lib/expenseService";
import { supabase } from "@/lib/supabase";
import { ExpenseRecord, RecurringExpenseRecord } from "@/lib/expenseTypes";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  await materializeDueRecurringExpenses();

  const { data: expenses, error } = await supabase
    .from("expenses")
    .select("*")
    .order("created_at", { ascending: false });
  const { data: recurringExpenses } = await supabase
    .from("recurring_expenses")
    .select("*")
    .eq("is_active", true)
    .order("next_occurrence_date", { ascending: true });

  if (error) {
    return <main className="p-6">Error: {error.message}</main>;
  }

  return (
    <main className="min-h-screen bg-[#F7F5F1] px-6 py-8 text-[#22211F]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7">
          <AppLogo compact />
        </div>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-[#8A8176]">
              Ledger
            </p>
            <h1 className="text-3xl font-semibold">Expenses</h1>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[#6D675F]">
            Review entries by time range, edit AI fields, and keep each purchase tidy.
          </p>
        </div>

        <UpcomingRecurringCosts
          recurringExpenses={
            (recurringExpenses as RecurringExpenseRecord[] | null) || []
          }
        />
        <ExpensesTable expenses={(expenses as ExpenseRecord[] | null) || []} />
      </div>
    </main>
  );
}
