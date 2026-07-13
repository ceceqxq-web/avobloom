import AppLogo from "@/components/AppLogo";
import RecurringExpenseSync from "@/components/RecurringExpenseSync";
import ExpensesTable from "./ExpensesTable";
import UpcomingRecurringCosts from "./UpcomingRecurringCosts";
import { createClient } from "@/lib/supabase/server";
import { ExpenseRecord, RecurringExpenseRecord } from "@/lib/expenseTypes";
import UserMenu from "@/components/UserMenu";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [expenseResult, recurringResult] = await Promise.all([
    supabase.from("expenses").select("*").order("created_at", { ascending: false }),
    supabase
      .from("recurring_expenses")
      .select("*")
      .eq("is_active", true)
      .order("next_occurrence_date", { ascending: true }),
  ]);
  const { data: expenses, error } = expenseResult;
  const { data: recurringExpenses } = recurringResult;

  if (error) {
    return <main className="p-6">Error: {error.message}</main>;
  }

  return (
    <main className="min-h-screen bg-[#F7F5F1] px-6 py-8 text-[#22211F]">
      <RecurringExpenseSync />
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex items-center justify-between gap-4">
          <AppLogo compact />
          <UserMenu email={user.email || "Account"} />
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
