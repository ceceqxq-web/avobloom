"use client";

import AppLogo from "@/components/AppLogo";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function signInWithGoogle() {
    setIsLoading(true);
    setError("");
    const supabase = createClient();
    const next = searchParams.get("next") || "/";
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
    }
  }

  return (
    <main className="app-shell grid min-h-screen place-items-center px-5 py-12 text-[#1c2520]">
      <section className="w-full max-w-md rounded-[30px] border border-[#d9dfd7] bg-white/90 p-7 shadow-[0_24px_70px_rgba(48,69,56,.12)] sm:p-9">
        <AppLogo />
        <p className="eyebrow mt-10">Private, synced ledger</p>
        <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em]">Sign in</h1>
        <p className="mt-4 text-sm leading-6 text-[#68766d]">
          Sign in to keep your expenses and budget goals securely synced across web and mobile.
        </p>
        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={isLoading}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-[#1f382b] px-5 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#294936] disabled:opacity-60"
        >
          <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-sm font-bold text-[#4285F4]">G</span>
          {isLoading ? "Signing in…" : "Sign in with Google"}
        </button>
        {(error || searchParams.get("error")) && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error || "Sign-in could not be completed. Please try again."}
          </p>
        )}
        <p className="mt-6 text-center text-xs leading-5 text-[#879188]">
          Your account controls which ledger rows can be read or changed.
        </p>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="app-shell min-h-screen" />}>
      <LoginContent />
    </Suspense>
  );
}
