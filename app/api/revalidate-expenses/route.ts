import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { materializeDueRecurringExpenses } from "@/lib/expenseService";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const result = await materializeDueRecurringExpenses(supabase);
  if (result.error) {
    return Response.json({ error: "Recurring expense sync failed" }, { status: 500 });
  }
  revalidatePath("/");
  revalidatePath("/expenses");
  revalidatePath("/reports");

  return Response.json({ ok: true, materializedCount: result.materializedCount || 0 });
}
