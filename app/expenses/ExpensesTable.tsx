"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DeleteButton from "./DeleteButton";
import EditButton from "./EditButton";
import { revalidateExpenseViews } from "@/lib/revalidateExpenses";
import { supabase } from "@/lib/supabase";
import {
  ExpenseRecord,
  FinancialType,
  calculateNetWorthImpact,
} from "@/lib/expenseTypes";

type FilterMode = "today" | "week" | "month" | "year" | "all";
type NetFilterMode = "all" | "zero" | "nonzero";
type TypeFilterMode = "all" | FinancialType;
type ExpenseGroup = {
  key: string;
  label: string;
  entries: ExpenseRecord[];
};

const pageSize = 20;
const ratingOverridesKey = "expense-rating-overrides";
const filterOptions: Array<[FilterMode, string]> = [
  ["today", "Today"],
  ["week", "Week"],
  ["month", "Month"],
  ["year", "Year"],
  ["all", "All"],
];
const filterDescriptions: Record<FilterMode, string> = {
  today: "Showing today",
  week: "Showing current week",
  month: "Showing current month",
  year: "Showing current year",
  all: "Showing all time",
};
const netFilterOptions: Array<[NetFilterMode, string]> = [
  ["all", "All net"],
  ["zero", "Net = 0"],
  ["nonzero", "Net > 0"],
];
const netFilterDescriptions: Record<NetFilterMode, string> = {
  all: "All net values",
  zero: "Net = 0 only",
  nonzero: "Can resell",
};
const typeFilterOptions: Array<[TypeFilterMode, string]> = [
  ["all", "All types"],
  ["expense", "Expense"],
  ["value_asset", "Asset"],
  ["ongoing_cost", "Subscription"],
  ["investment", "Investment"],
];
const typeFilterDescriptions: Record<TypeFilterMode, string> = {
  all: "All types",
  expense: "Expense only",
  value_asset: "Assets only",
  ongoing_cost: "Subscriptions only",
  investment: "Investments only",
};

function FilterMenu({
  activeLabel,
  children,
  label,
}: {
  activeLabel: string;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <details className="group relative inline-block">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md border border-transparent px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#8A8176] transition hover:border-[#D7CFC2] hover:bg-white">
        <span>{label}</span>
        <span className="grid h-5 w-5 place-items-center rounded bg-[#1F1F1F] text-[10px] leading-none text-white transition group-open:rotate-180">
          v
        </span>
        <span className="normal-case tracking-normal text-[#6D675F]">{activeLabel}</span>
      </summary>
      <div className="absolute left-0 top-full z-30 mt-2 min-w-44 rounded-lg border border-[#D7CFC2] bg-white p-1 shadow-lg">
        {children}
      </div>
    </details>
  );
}

function FilterMenuOption({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded-md px-3 py-2 text-left text-sm transition ${
        active
          ? "bg-[#1F1F1F] text-white"
          : "text-[#4D4740] hover:bg-[#F7F5F1]"
      }`}
    >
      {children}
    </button>
  );
}

function readRatingOverrides() {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(window.localStorage.getItem(ratingOverridesKey) || "{}") as Record<
      string,
      number
    >;
  } catch {
    return {};
  }
}

function getExpenseDate(expense: ExpenseRecord) {
  const dateValue = expense.expense_date || expense.created_at || "";
  const dateOnlyMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return new Date(dateValue);
}

function isSameMonth(date: Date, now: Date) {
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function isSameDay(date: Date, now: Date) {
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isSameYear(date: Date, now: Date) {
  return date.getFullYear() === now.getFullYear();
}

function getWeekStart(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const offset = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - offset);
  start.setHours(0, 0, 0, 0);

  return start;
}

function getWeekEnd(date: Date) {
  const end = getWeekStart(date);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return end;
}

function formatMoney(value: unknown) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(expense: ExpenseRecord) {
  const date = getExpenseDate(expense);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function getDisplayRating(expense: ExpenseRecord, ratingOverrides: Record<string, number>) {
  const overrideRating = Number(ratingOverrides[expense.id] || 0);
  if (overrideRating > 0) {
    return {
      value: overrideRating,
      estimated: false,
    };
  }

  const storedRating = Number(expense.consumption_rate || 0);

  if (storedRating > 0) {
    return {
      value: storedRating,
      estimated: false,
    };
  }

  const price = Number(expense.purchase_price || 0);
  let value = 10;

  if (price <= 20) value = 2;
  else if (price <= 80) value = 4;
  else if (price <= 250) value = 6;
  else if (price <= 1000) value = 8;

  return {
    value,
    estimated: true,
  };
}

function getDisplayNetWorthImpact(expense: ExpenseRecord) {
  return calculateNetWorthImpact(
    expense.financial_type,
    Number(expense.current_estimated_value || 0),
  );
}

function getGroupLabel(expense: ExpenseRecord) {
  return (expense.item_name || "Untitled item")
    .replace(/\s*\(\d+\/\d+\)\s*$/u, "")
    .trim();
}

function getGroupKey(expense: ExpenseRecord) {
  return [
    expense.merchant || "",
    expense.brand || "",
    expense.category || "",
    expense.purchase_price || 0,
    getGroupLabel(expense),
  ]
    .join("::")
    .toLowerCase();
}

function groupExpenses(expenses: ExpenseRecord[]) {
  const groupMap = new Map<string, ExpenseGroup>();

  expenses.forEach((expense) => {
    const key = getGroupKey(expense);
    const group = groupMap.get(key) || {
      key,
      label: getGroupLabel(expense),
      entries: [],
    };

    group.entries.push(expense);
    groupMap.set(key, group);
  });

  return [...groupMap.values()]
    .map((group) => ({
      ...group,
      entries: [...group.entries].sort(
        (a, b) => getExpenseDate(a).getTime() - getExpenseDate(b).getTime(),
      ),
    }))
    .sort((a, b) => {
      const aDate = getExpenseDate(a.entries[a.entries.length - 1]).getTime();
      const bDate = getExpenseDate(b.entries[b.entries.length - 1]).getTime();

      if (aDate !== bDate) return bDate - aDate;
      return a.label.localeCompare(b.label);
    });
}

function getGroupDateRange(entries: ExpenseRecord[]) {
  if (entries.length === 1) return formatDate(entries[0]);

  return `${formatDate(entries[0])} - ${formatDate(entries[entries.length - 1])}`;
}

function getGroupType(entries: ExpenseRecord[]) {
  const firstType = entries[0].financial_type || "expense";
  const hasSameType = entries.every((entry) => entry.financial_type === firstType);

  return hasSameType ? firstType : "mixed";
}

export default function ExpensesTable({ expenses }: { expenses: ExpenseRecord[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterMode>("month");
  const [netFilter, setNetFilter] = useState<NetFilterMode>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilterMode>("all");
  const [page, setPage] = useState(1);
  const [isRangeSwitching, setIsRangeSwitching] = useState(false);
  const switchTimerRef = useRef<number | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [updatingGroupKey, setUpdatingGroupKey] = useState("");
  const [ratingOverrides, setRatingOverrides] =
    useState<Record<string, number>>(readRatingOverrides);

  useEffect(() => {
    function handleRatingOverride() {
      setRatingOverrides(readRatingOverrides());
    }

    window.addEventListener("expense-rating-overrides-change", handleRatingOverride);

    return () => {
      window.removeEventListener("expense-rating-overrides-change", handleRatingOverride);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (switchTimerRef.current) window.clearTimeout(switchTimerRef.current);
    };
  }, []);

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const weekStart = getWeekStart(now);
    const weekEnd = getWeekEnd(now);

    return expenses
      .filter((expense) => {
        const passesDateFilter = (() => {
          if (filter === "all") return true;

          const date = getExpenseDate(expense);
          if (Number.isNaN(date.getTime())) return false;

          if (filter === "today") return isSameDay(date, now);
          if (filter === "week") return date >= weekStart && date <= weekEnd;
          if (filter === "month") return isSameMonth(date, now);
          return isSameYear(date, now);
        })();

        if (!passesDateFilter) return false;

        if (typeFilter !== "all" && expense.financial_type !== typeFilter) {
          return false;
        }

        const netImpact = getDisplayNetWorthImpact(expense);
        const isZeroNet = Math.abs(netImpact) < 0.005;

        if (netFilter === "zero") return isZeroNet;
        if (netFilter === "nonzero") return netImpact > 0.005;
        return true;
      })
      .sort((a, b) => {
        const dateDiff = getExpenseDate(b).getTime() - getExpenseDate(a).getTime();
        if (dateDiff !== 0) return dateDiff;

        return `${a.merchant}${a.item_name}`.localeCompare(`${b.merchant}${b.item_name}`);
      });
  }, [expenses, filter, netFilter, typeFilter]);

  const groupedExpenses = useMemo(() => groupExpenses(filteredExpenses), [filteredExpenses]);
  const totalPages = Math.max(Math.ceil(groupedExpenses.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const visibleGroups = groupedExpenses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const total = filteredExpenses.reduce(
    (sum, expense) => sum + Number(expense.purchase_price || 0),
    0,
  );
  const activeFilterLabel = filterOptions.find(([value]) => value === filter)?.[1] || "Month";
  const activeTypeLabel =
    typeFilterOptions.find(([value]) => value === typeFilter)?.[1] || "All types";
  const activeNetLabel = netFilterOptions.find(([value]) => value === netFilter)?.[1] || "All net";

  function triggerFilterFeedback() {
    if (switchTimerRef.current) window.clearTimeout(switchTimerRef.current);
    setIsRangeSwitching(true);
    switchTimerRef.current = window.setTimeout(() => {
      setIsRangeSwitching(false);
    }, 220);
  }

  function updateFilter(nextFilter: FilterMode) {
    if (nextFilter === filter) return;

    triggerFilterFeedback();
    setFilter(nextFilter);
    setPage(1);
  }

  function updateNetFilter(nextNetFilter: NetFilterMode) {
    if (nextNetFilter === netFilter) return;

    triggerFilterFeedback();
    setNetFilter(nextNetFilter);
    setPage(1);
  }

  function updateTypeFilter(nextTypeFilter: TypeFilterMode) {
    if (nextTypeFilter === typeFilter) return;

    triggerFilterFeedback();
    setTypeFilter(nextTypeFilter);
    setPage(1);
  }

  function toggleGroup(key: string) {
    setOpenGroups((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  async function updateGroupType(group: ExpenseGroup, financialType: FinancialType) {
    const ids = group.entries.map((entry) => entry.id);

    setUpdatingGroupKey(group.key);
    const { error } = await supabase
      .from("expenses")
      .update({
        financial_type: financialType,
        current_estimated_value: 0,
        net_worth_impact: 0,
      })
      .in("id", ids);

    if (error) {
      setUpdatingGroupKey("");
      alert(error.message);
      return;
    }

    await revalidateExpenseViews();
    setUpdatingGroupKey("");
    router.refresh();
  }

  return (
    <section className="rounded-lg border border-[#DED8CD] bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-[#E6E0D6] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-sm text-[#6D675F]">
            {filteredExpenses.length} entries · {groupedExpenses.length} groups ·{" "}
            {formatMoney(total)}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-[#22211F]">Expense entries</h2>
            <span
              className={`rounded-full bg-[#F1ECE4] px-2.5 py-1 text-xs font-medium text-[#6D675F] transition duration-200 ${
                isRangeSwitching ? "scale-95 opacity-50" : "scale-100 opacity-100"
              }`}
            >
              {filterDescriptions[filter]}
            </span>
            {netFilter !== "all" && (
              <span
                className={`rounded-full bg-[#EAF4EE] px-2.5 py-1 text-xs font-medium text-[#2F6845] transition duration-200 ${
                  isRangeSwitching ? "scale-95 opacity-50" : "scale-100 opacity-100"
                }`}
              >
                {netFilterDescriptions[netFilter]}
              </span>
            )}
            {typeFilter !== "all" && (
              <span
                className={`rounded-full bg-[#EEF1F7] px-2.5 py-1 text-xs font-medium text-[#44506A] transition duration-200 ${
                  isRangeSwitching ? "scale-95 opacity-50" : "scale-100 opacity-100"
                }`}
              >
                {typeFilterDescriptions[typeFilter]}
              </span>
            )}
          </div>
        </div>

        <div className="text-sm text-[#8A8176]">
          20 groups per page · filters live in column headers
        </div>
      </div>

      <div
        className={`overflow-x-auto transition duration-200 ease-out ${
          isRangeSwitching ? "translate-y-1 opacity-60" : "translate-y-0 opacity-100"
        }`}
      >
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead className="bg-[#F7F5F1] text-xs uppercase tracking-[0.12em] text-[#8A8176]">
            <tr>
              <th className="px-5 py-3 font-medium">
                <FilterMenu activeLabel={activeFilterLabel} label="Date">
                  {filterOptions.map(([value, label]) => (
                    <FilterMenuOption
                      key={value}
                      active={filter === value}
                      onClick={() => updateFilter(value)}
                    >
                      {label}
                    </FilterMenuOption>
                  ))}
                </FilterMenu>
              </th>
              <th className="px-5 py-3 font-medium">Merchant / Item</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">
                <FilterMenu activeLabel={activeTypeLabel} label="Type">
                  {typeFilterOptions.map(([value, label]) => (
                    <FilterMenuOption
                      key={value}
                      active={typeFilter === value}
                      onClick={() => updateTypeFilter(value)}
                    >
                      {label}
                    </FilterMenuOption>
                  ))}
                </FilterMenu>
              </th>
              <th className="px-5 py-3 text-right font-medium">Price</th>
              <th className="px-5 py-3 text-right font-medium">Tier</th>
              <th className="px-5 py-3 text-right font-medium">
                <div className="flex justify-end">
                  <FilterMenu activeLabel={activeNetLabel} label="Net">
                    {netFilterOptions.map(([value, label]) => (
                      <FilterMenuOption
                        key={value}
                        active={netFilter === value}
                        onClick={() => updateNetFilter(value)}
                      >
                        {label}
                      </FilterMenuOption>
                    ))}
                  </FilterMenu>
                </div>
              </th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ECE6DC]">
            {visibleGroups.map((group) => {
              const primary = group.entries[group.entries.length - 1];
              const isGrouped = group.entries.length > 1;
              const isOpen = Boolean(openGroups[group.key]);
              const groupTotal = group.entries.reduce(
                (sum, entry) => sum + Number(entry.purchase_price || 0),
                0,
              );
              const groupNet = group.entries.reduce(
                (sum, entry) => sum + getDisplayNetWorthImpact(entry),
                0,
              );
              const groupRating = Math.round(
                group.entries.reduce(
                  (sum, entry) => sum + getDisplayRating(entry, ratingOverrides).value,
                  0,
                ) / group.entries.length,
              );
              const groupType = getGroupType(group.entries);

              return (
                <Fragment key={group.key}>
                  <tr
                    className={isGrouped ? "bg-[#FFFCF7] hover:bg-[#FBF8F3]" : "hover:bg-[#FBF8F3]"}
                  >
                    <td className="whitespace-nowrap px-5 py-3 text-[#6D675F]">
                      {getGroupDateRange(group.entries)}
                    </td>
                    <td className="max-w-[360px] px-5 py-3">
                      <div className="truncate font-medium text-[#22211F]">
                        {group.label}
                      </div>
                      <div className="truncate text-xs text-[#6D675F]">
                        {primary.merchant || "Unknown merchant"} ·{" "}
                        {isGrouped
                          ? `${group.entries.length} entries grouped`
                          : primary.brand || "Unknown brand"}
                      </div>
                    </td>
                    <td className="max-w-[220px] px-5 py-3">
                      <div className="truncate text-[#4D4740]">{primary.category || "-"}</div>
                      {primary.brand_positioning && (
                        <div className="truncate text-xs text-[#8A8176]">
                          {primary.brand_positioning}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-[#4D4740]">
                      {groupType}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-medium">
                      {formatMoney(groupTotal)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right text-[#4D4740]">
                      {groupRating} / 10{isGrouped ? "*" : ""}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right text-[#4D4740]">
                      {formatMoney(groupNet)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <div className="flex justify-end gap-2">
                        {isGrouped ? (
                          <>
                            <button
                              type="button"
                              onClick={() => toggleGroup(group.key)}
                              className="rounded-md border border-[#D7CFC2] px-3 py-1.5 text-xs font-medium text-[#4D4740] transition hover:border-[#1F1F1F] hover:text-[#1F1F1F]"
                            >
                              {isOpen ? "Hide" : "Expand"}
                            </button>
                            <button
                              type="button"
                              disabled={updatingGroupKey === group.key}
                              onClick={() => updateGroupType(group, "expense")}
                              className="rounded-md border border-[#D7CFC2] px-3 py-1.5 text-xs font-medium text-[#4D4740] transition hover:border-[#1F1F1F] hover:text-[#1F1F1F] disabled:opacity-50"
                            >
                              Set Expense
                            </button>
                            <button
                              type="button"
                              disabled={updatingGroupKey === group.key}
                              onClick={() => updateGroupType(group, "ongoing_cost")}
                              className="rounded-md border border-[#D7CFC2] px-3 py-1.5 text-xs font-medium text-[#4D4740] transition hover:border-[#1F1F1F] hover:text-[#1F1F1F] disabled:opacity-50"
                            >
                              Set Subscription
                            </button>
                          </>
                        ) : (
                          <>
                            <EditButton expense={primary} />
                            <DeleteButton id={primary.id} />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {isGrouped &&
                    isOpen &&
                    group.entries.map((expense) => {
                      const rating = getDisplayRating(expense, ratingOverrides);

                      return (
                        <tr key={expense.id} className="bg-[#FBF8F3]">
                          <td className="whitespace-nowrap px-5 py-2 text-xs text-[#8A8176]">
                            {formatDate(expense)}
                          </td>
                          <td className="max-w-[360px] px-5 py-2">
                            <div className="truncate text-xs font-medium text-[#4D4740]">
                              {expense.item_name}
                            </div>
                            <div className="truncate text-[11px] text-[#8A8176]">
                              {expense.merchant || "Unknown merchant"} ·{" "}
                              {expense.brand || "Unknown brand"}
                            </div>
                          </td>
                          <td className="max-w-[220px] px-5 py-2 text-xs text-[#6D675F]">
                            {expense.category || "-"}
                          </td>
                          <td className="whitespace-nowrap px-5 py-2 text-xs text-[#6D675F]">
                            {expense.financial_type || "-"}
                          </td>
                          <td className="whitespace-nowrap px-5 py-2 text-right text-xs font-medium">
                            {formatMoney(expense.purchase_price)}
                          </td>
                          <td className="whitespace-nowrap px-5 py-2 text-right text-xs text-[#6D675F]">
                            {rating.value} / 10{rating.estimated ? "*" : ""}
                          </td>
                          <td className="whitespace-nowrap px-5 py-2 text-right text-xs text-[#6D675F]">
                            {formatMoney(getDisplayNetWorthImpact(expense))}
                          </td>
                          <td className="whitespace-nowrap px-5 py-2">
                            <div className="flex justify-end gap-2">
                              <EditButton expense={expense} />
                              <DeleteButton id={expense.id} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {visibleGroups.length === 0 && (
        <div className="px-5 py-12 text-center text-sm text-[#6D675F]">
          No expenses match these filters.
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-[#E6E0D6] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-[#6D675F]">
          Page {currentPage} of {totalPages}
          <span className="ml-3">* estimated when tier is not stored</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            disabled={currentPage === 1}
            className="rounded-md border border-[#D7CFC2] px-3 py-2 text-sm text-[#4D4740] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="rounded-md border border-[#D7CFC2] px-3 py-2 text-sm text-[#4D4740] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
