"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { revalidateExpenseViews } from "@/lib/revalidateExpenses";

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();

  async function handleDelete() {
    const ok = confirm("Delete this expense?");
    if (!ok) return;

    const { error } = await supabase.from("expenses").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await revalidateExpenseViews();
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="rounded-md border border-[#E8C7C2] px-3 py-1.5 text-xs font-medium text-[#B42318] transition hover:bg-[#FFF4F2]"
    >
      Delete
    </button>
  );
}
