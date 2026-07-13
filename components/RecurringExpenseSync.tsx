"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RecurringExpenseSync() {
  const router = useRouter();

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/revalidate-expenses", {
      method: "POST",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { materializedCount?: number };
      })
      .then((result) => {
        if (result?.materializedCount) router.refresh();
      })
      .catch(() => {
        // Navigation should remain usable if background sync is temporarily offline.
      });

    return () => controller.abort();
  }, [router]);

  return null;
}
