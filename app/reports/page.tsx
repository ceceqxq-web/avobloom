import ReportExplorer from "./ReportExplorer";
import { createClient } from "@/lib/supabase/server";
import { ExpenseRecord } from "@/lib/expenseTypes";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: expenses, error } = await supabase
    .from("expenses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return <main className="p-6">Error: {error.message}</main>;

  return (
    <ReportExplorer
      records={(expenses || []) as ExpenseRecord[]}
      userEmail={user.email || "Account"}
    />
  );
}
