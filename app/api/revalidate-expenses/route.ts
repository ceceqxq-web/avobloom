import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  revalidatePath("/");
  revalidatePath("/expenses");
  revalidatePath("/reports");

  return Response.json({ ok: true });
}
