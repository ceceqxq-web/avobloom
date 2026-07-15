import AppLogo from "@/components/AppLogo";
import ExpenseForm from "@/components/ExpenseForm";
import PurchaseAgent from "@/components/PurchaseAgent";
import SpendingGoalDashboard from "@/components/SpendingGoalDashboard";
import SmartShoppingList, { type ShoppingSuggestion } from "@/components/SmartShoppingList";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import UserMenu from "@/components/UserMenu";
import { redirect } from "next/navigation";
import {
  ExpenseRecord,
  RecurringExpenseRecord,
} from "@/lib/expenseTypes";

export const dynamic = "force-dynamic";

const money = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

function formatMoney(value: number) {
  return money.format(value);
}

function getExpenseDate(record: ExpenseRecord) {
  const value = record.expense_date || record.created_at || "";
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) return new Date(+dateOnly[1], +dateOnly[2] - 1, +dateOnly[3]);
  return new Date(value);
}

function getWeekStart(date: Date) {
  const result = new Date(date);
  result.setDate(result.getDate() - (result.getDay() === 0 ? 6 : result.getDay() - 1));
  result.setHours(0, 0, 0, 0);
  return result;
}

function getWeekEnd(date: Date) {
  const result = getWeekStart(date);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
}

function getMonthEnd(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addRecurringPeriod(
  date: Date,
  frequency: RecurringExpenseRecord["recurrence_frequency"],
) {
  const next = new Date(date);
  if (frequency === "weekly") next.setDate(next.getDate() + 7);
  else next.setMonth(next.getMonth() + 1);
  return next;
}

function getScheduledTotal(
  recurringExpenses: RecurringExpenseRecord[],
  start: Date,
  end: Date,
) {
  return recurringExpenses.reduce((total, expense) => {
    let occurrence = parseDateOnly(expense.next_occurrence_date);
    let scheduled = 0;
    let guard = 0;

    while (occurrence < start && guard < 60) {
      occurrence = addRecurringPeriod(occurrence, expense.recurrence_frequency);
      guard += 1;
    }
    while (occurrence <= end && guard < 60) {
      scheduled += Number(expense.purchase_price || 0);
      occurrence = addRecurringPeriod(occurrence, expense.recurrence_frequency);
      guard += 1;
    }
    return total + scheduled;
  }, 0);
}

function categoryName(value?: string | null) {
  return value?.split(">")[0]?.trim() || "Other";
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current stroke-2">
      <path d="M4 10h11M11 5l5 5-5 5" />
    </svg>
  );
}

function buildShoppingSuggestions(expenses: ExpenseRecord[]): ShoppingSuggestion[] {
  const replenishable = /^(Food & Drink|Home|Shopping)/i;
  const seen = new Set<string>();
  const now = Date.now();

  return expenses.flatMap((expense) => {
    const name = expense.item_name?.trim();
    const key = `${name?.toLowerCase()}|${expense.merchant?.toLowerCase()}`;
    if (!name || seen.has(key) || !replenishable.test(expense.category || "")) return [];
    const ageDays = Math.floor((now - getExpenseDate(expense).getTime()) / 86_400_000);
    if (ageDays < 7) return [];
    seen.add(key);
    return [{
      id: expense.id,
      itemName: name,
      merchant: expense.merchant || "",
      unitPrice: Number(expense.purchase_price || 0),
      reason: `${ageDays} 天前购买`,
    }];
  }).slice(0, 5);
}

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("expenses")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  const { data: recurringData } = await supabase
    .from("recurring_expenses")
    .select("*")
    .eq("is_active", true);
  const { data: goals } = await supabase
    .from("spending_goals")
    .select("weekly_goal, monthly_goal")
    .eq("user_id", user.id)
    .maybeSingle();

  const expenses = (data || []) as ExpenseRecord[];
  const recurringExpenses = (recurringData || []) as RecurringExpenseRecord[];
  const now = new Date();
  const weekStart = getWeekStart(now);
  const upcomingStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const monthExpenses = expenses.filter((item) => {
    const date = getExpenseDate(item);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  });
  const weekTotal = expenses.reduce((sum, item) => {
    const date = getExpenseDate(item);
    return date >= weekStart && date <= now ? sum + Number(item.purchase_price || 0) : sum;
  }, 0);
  const weekUpcoming = getScheduledTotal(
    recurringExpenses,
    upcomingStart,
    getWeekEnd(now),
  );
  const monthUpcoming = getScheduledTotal(
    recurringExpenses,
    upcomingStart,
    getMonthEnd(now),
  );
  const monthTotal = monthExpenses.reduce(
    (sum, item) => sum + Number(item.purchase_price || 0),
    0,
  );
  const estimatedValue = expenses.reduce(
    (sum, item) => sum + Number(item.current_estimated_value || 0),
    0,
  );
  const categoryTotals = new Map<string, number>();
  monthExpenses.forEach((item) => {
    const category = categoryName(item.category);
    categoryTotals.set(category, (categoryTotals.get(category) || 0) + Number(item.purchase_price || 0));
  });
  const topCategories = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxCategory = Math.max(...topCategories.map(([, value]) => value), 1);
  const topCategory = topCategories[0];
  const recentExpenses = expenses.slice(0, 4);
  const shoppingSuggestions = buildShoppingSuggestions(expenses);
  const monthLabel = new Intl.DateTimeFormat("en-AU", { month: "long" }).format(now);

  return (
    <main className="app-shell min-h-screen text-[#1c2520]">
      <nav className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <AppLogo compact />
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 rounded-full border border-[#dfe5dd] bg-white/75 p-1 text-sm shadow-sm backdrop-blur md:flex">
            <Link href="/" className="rounded-full bg-[#1f382b] px-4 py-2 text-white">Overview</Link>
            <Link href="/expenses" className="rounded-full px-4 py-2 text-[#526057] transition hover:bg-[#eef2ed]">Ledger</Link>
            <Link href="/reports" className="rounded-full px-4 py-2 text-[#526057] transition hover:bg-[#eef2ed]">Reports</Link>
          </div>
          <UserMenu email={user.email || "Account"} />
        </div>
      </nav>

      <div className="mx-auto w-full max-w-[1440px] px-5 pb-12 sm:px-8 lg:px-12">
        <header className="mb-7 grid gap-6 border-b border-[#d9dfd7] pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="eyebrow">Your money, made legible</p>
            <h1 className="mt-3 max-w-3xl text-[clamp(2.5rem,6vw,5.5rem)] font-medium leading-[0.95] tracking-[-0.055em] text-[#18271f]">
              Spend with <span className="font-serif italic text-[#c55f38]">clarity.</span>
            </h1>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#66736b] lg:pb-1">
            Drop in a note or receipt. AI organises the details, while you stay in control of what reaches your ledger.
          </p>
        </header>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,.65fr)]">
          <section className="feature-card overflow-hidden rounded-[30px] border border-[#d9dfd7] bg-white/90 shadow-[0_24px_70px_rgba(48,69,56,.09)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#e4e9e2] px-5 py-5 sm:px-7">
              <div>
                <p className="eyebrow">01 · Capture</p>
                <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">What did you buy?</h2>
              </div>
              <span className="hidden rounded-full bg-[#edf3ed] px-3 py-1.5 text-xs font-medium text-[#52685a] sm:block">AI assisted</span>
            </div>
            <div className="p-5 sm:p-7"><ExpenseForm /></div>
          </section>

          <aside className="space-y-5">
            <SpendingGoalDashboard
              entryCount={expenses.length}
              estimatedValue={estimatedValue}
              monthTotal={monthTotal}
              weekTotal={weekTotal}
              weekUpcoming={weekUpcoming}
              monthUpcoming={monthUpcoming}
              userId={user.id}
              initialGoals={{
                week: Number(goals?.weekly_goal || 300),
                month: Number(goals?.monthly_goal || 1200),
              }}
            />

            <section className="rounded-[26px] bg-[#1f382b] p-6 text-[#f6f4ec] shadow-[0_20px_50px_rgba(31,56,43,.16)]">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b8c8bc]">Money note</p>
                <span className="h-2 w-2 rounded-full bg-[#e6845f] shadow-[0_0_0_5px_rgba(230,132,95,.14)]" />
              </div>
              <p className="mt-8 text-xl leading-8 tracking-[-0.02em]">
                {topCategory
                  ? `${topCategory[0]} leads ${monthLabel} at ${formatMoney(topCategory[1])}. It makes up ${Math.round((topCategory[1] / Math.max(monthTotal, 1)) * 100)}% of this month’s spending.`
                  : "Your first useful pattern is one entry away. Add a purchase to start shaping your monthly picture."}
              </p>
              <Link href="/reports" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#f1b097] hover:text-white">
                Explore the full report <ArrowIcon />
              </Link>
            </section>
          </aside>
        </div>

        <div className="mt-5">
          <SmartShoppingList suggestions={shoppingSuggestions} />
        </div>

        <div className="mt-5">
          <PurchaseAgent />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
          <section className="rounded-[26px] border border-[#d9dfd7] bg-white/80 p-6">
            <div className="flex items-end justify-between gap-4">
              <div><p className="eyebrow">This month</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Where it went</h2></div>
              <span className="text-sm text-[#738078]">{formatMoney(monthTotal)}</span>
            </div>
            <div className="mt-7 space-y-5">
              {topCategories.length ? topCategories.map(([name, value], index) => (
                <div key={name}>
                  <div className="mb-2 flex justify-between text-sm"><span>{String(index + 1).padStart(2, "0")} · {name}</span><span className="font-medium">{formatMoney(value)}</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#e7ebe5]"><div className="h-full rounded-full bg-[#c55f38]" style={{ width: `${(value / maxCategory) * 100}%`, opacity: 1 - index * 0.14 }} /></div>
                </div>
              )) : <p className="rounded-2xl border border-dashed border-[#d9dfd7] p-5 text-sm leading-6 text-[#738078]">Your category breakdown will grow here as you add purchases.</p>}
            </div>
          </section>

          <section className="rounded-[26px] border border-[#d9dfd7] bg-[#f8f7f2] p-6">
            <div className="flex items-end justify-between gap-4">
              <div><p className="eyebrow">Latest activity</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Recent entries</h2></div>
              <Link href="/expenses" className="inline-flex items-center gap-2 text-sm font-semibold text-[#516259]">View ledger <ArrowIcon /></Link>
            </div>
            <div className="mt-5 divide-y divide-[#dde2db]">
              {recentExpenses.length ? recentExpenses.map((expense) => (
                <Link key={expense.id} href="/expenses" className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 py-4 first:pt-1">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e7ede6] text-sm font-semibold text-[#46604f]">{(expense.item_name || "E").charAt(0).toUpperCase()}</span>
                  <span className="min-w-0"><span className="block truncate text-sm font-semibold">{expense.item_name || "Untitled item"}</span><span className="mt-0.5 block truncate text-xs text-[#7b867f]">{expense.merchant || categoryName(expense.category)}</span></span>
                  <span className="text-sm font-semibold transition group-hover:text-[#c55f38]">{formatMoney(Number(expense.purchase_price || 0))}</span>
                </Link>
              )) : <p className="py-8 text-sm text-[#738078]">No entries yet. Your latest purchases will appear here.</p>}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
