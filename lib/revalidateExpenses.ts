export async function revalidateExpenseViews() {
  try {
    await fetch("/api/revalidate-expenses", { method: "POST" });
  } catch {
    // Local UI refreshes should still continue if route revalidation fails.
  }
}
