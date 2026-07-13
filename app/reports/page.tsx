import ReportExplorer from "./ReportExplorer";
import { supabase } from "@/lib/supabase";
import { ExpenseRecord } from "@/lib/expenseTypes";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const { data: expenses, error } = await supabase
    .from("expenses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return <main className="p-6">Error: {error.message}</main>;

  return <ReportExplorer records={(expenses || []) as ExpenseRecord[]} />;
}
