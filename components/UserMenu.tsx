"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function UserMenu({ email }: { email: string }) {
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-[#d9dfd7] bg-white/70 p-1 pl-2 shadow-sm backdrop-blur">
      <span
        aria-hidden="true"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#e8efe9] text-xs font-bold uppercase text-[#1f382b]"
      >
        {email.charAt(0) || "A"}
      </span>
      <span className="hidden max-w-40 truncate text-xs text-[#526057] sm:block">{email}</span>
      <button
        type="button"
        onClick={signOut}
        className="rounded-full bg-[#1f382b] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#294936]"
      >
        Sign out
      </button>
    </div>
  );
}
