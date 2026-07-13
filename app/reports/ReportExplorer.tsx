"use client";

import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import AppLogo from "@/components/AppLogo";
import { ExpenseRecord, calculateNetWorthImpact } from "@/lib/expenseTypes";
import { getMeaningfulItemName } from "@/lib/expenseDisplay";

type GroupedEntry = {
  name: string;
  total: number;
  entries: ExpenseRecord[];
  children: Map<string, GroupedEntry>;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPreciseMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function splitCategory(category: string) {
  return category
    .split(">")
    .map((part) => part.trim())
    .filter(Boolean);
}

function getPrimaryCategory(category: string) {
  const parts = splitCategory(category);
  const top = (parts[0] || "Other").toLowerCase();
  const categoryText = category.toLowerCase();

  if (
    categoryText.includes("fast food") ||
    categoryText.includes("dining out") ||
    categoryText.includes("eating out") ||
    categoryText.includes("restaurant") ||
    categoryText.includes("cafe") ||
    categoryText.includes("coffee") ||
    categoryText.includes("grocer")
  ) {
    return "Food & Drink";
  }

  if (
    categoryText.includes("accommodation") ||
    categoryText.includes("hotel") ||
    categoryText.includes("rent") ||
    categoryText.includes("housing") ||
    categoryText.includes("酒店") ||
    categoryText.includes("住宿") ||
    categoryText.includes("房租")
  ) {
    return "Accommodation";
  }

  if (top.includes("clothing") || top.includes("fashion") || top.includes("apparel")) {
    return "Clothing";
  }
  if (
    top.includes("home") ||
    top.includes("garden") ||
    top.includes("household") ||
    top.includes("bathroom") ||
    top.includes("kitchen") ||
    top.includes("drinkware") ||
    top.includes("tableware")
  ) {
    return "Home Experience";
  }
  if (top.includes("shopping")) return "Shopping";
  if (top.includes("food") || top.includes("restaurant")) return "Food & Drink";
  if (top.includes("transport") || top.includes("travel")) return "Transport";
  if (top.includes("subscription")) return "Subscriptions";
  if (top.includes("investment")) return "Investments";

  return parts[0] || "Other";
}

function getSecondaryCategory(category: string) {
  const parts = splitCategory(category);
  const primary = getPrimaryCategory(category);
  const categoryText = category.toLowerCase();

  if (primary === "Food & Drink") {
    if (
      categoryText.includes("fast food") ||
      categoryText.includes("dining out / fast food") ||
      categoryText.includes("eating out") ||
      categoryText.includes("mcdonald") ||
      categoryText.includes("burger") ||
      categoryText.includes("takeaway")
    ) {
      return "Fast Food";
    }
    if (
      categoryText.includes("cafe") ||
      categoryText.includes("café") ||
      categoryText.includes("coffee")
    ) {
      return "Cafés & Coffee";
    }
    if (
      categoryText.includes("grocer") ||
      categoryText.includes("supermarket")
    ) {
      return "Groceries";
    }
    if (categoryText.includes("restaurant") || categoryText.includes("dining out")) {
      return "Dining Out";
    }
    return parts[1] || "Other Food & Drink";
  }

  if (primary === "Home Experience") {
    if (categoryText.includes("bedding")) return "Bedding";
    if (
      categoryText.includes("bathroom") ||
      categoryText.includes("bath mat") ||
      categoryText.includes("towel") ||
      categoryText.includes("scale")
    ) {
      return "Bathroom";
    }
    if (
      categoryText.includes("kitchen") ||
      categoryText.includes("dining") ||
      categoryText.includes("drinkware") ||
      categoryText.includes("tableware") ||
      categoryText.includes("teapot") ||
      categoryText.includes("cup") ||
      categoryText.includes("mug") ||
      categoryText.includes("plate") ||
      categoryText.includes("bowl")
    ) {
      return "Kitchen & Dining";
    }
    if (categoryText.includes("furniture")) return "Furniture";
    if (parts[1]) return parts[1];
    return "Homewares";
  }

  if (primary === "Clothing") {
    if (
      categoryText.includes("activewear") ||
      categoryText.includes("gym") ||
      categoryText.includes("workout")
    ) {
      return "Activewear";
    }
    if (
      categoryText.includes("footwear") ||
      categoryText.includes("shoe") ||
      categoryText.includes("slipper") ||
      categoryText.includes("sneaker") ||
      categoryText.includes("boot")
    ) {
      return "Footwear";
    }
    if (categoryText.includes("accessories")) return "Accessories";
    return parts[1] || "Apparel";
  }

  if (primary === "Accommodation") {
    if (
      categoryText.includes("rent") ||
      categoryText.includes("housing") ||
      categoryText.includes("房租")
    ) {
      return "Rent";
    }
    if (
      categoryText.includes("hotel") ||
      categoryText.includes("accommodation") ||
      categoryText.includes("酒店") ||
      categoryText.includes("住宿")
    ) {
      return "Hotel stays";
    }
    return parts[1] || "Accommodation";
  }

  return parts[1] || parts[0] || "Uncategorized";
}

function groupRecords(records: ExpenseRecord[]) {
  const groups = new Map<string, GroupedEntry>();

  records.forEach((record) => {
    const amount = Number(record.purchase_price || 0);
    const primaryName = getPrimaryCategory(record.category || "");
    const secondaryName = getSecondaryCategory(record.category || "");
    const primary = groups.get(primaryName) || {
      name: primaryName,
      total: 0,
      entries: [],
      children: new Map<string, GroupedEntry>(),
    };
    const secondary = primary.children.get(secondaryName) || {
      name: secondaryName,
      total: 0,
      entries: [],
      children: new Map<string, GroupedEntry>(),
    };

    primary.total += amount;
    primary.entries.push(record);
    secondary.total += amount;
    secondary.entries.push(record);
    primary.children.set(secondaryName, secondary);
    groups.set(primaryName, primary);
  });

  return [...groups.values()].sort((a, b) => b.total - a.total);
}

function getMonth(record: ExpenseRecord) {
  const date = new Date(record.expense_date || record.created_at || "");

  if (Number.isNaN(date.getTime())) return "Unknown month";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getStoredOrEstimatedRating(record: ExpenseRecord) {
  const stored = Number(record.consumption_rate || 0);
  if (stored) return stored;

  const price = Number(record.purchase_price || 0);

  if (price <= 20) return 2;
  if (price <= 80) return 4;
  if (price <= 250) return 6;
  if (price <= 1000) return 8;
  return 10;
}

function getGroupAccent(index: number) {
  const accents = [
    {
      bar: "#6F4E37",
      tint: "#F4EEE6",
      border: "#D9C8B6",
      text: "#5A3F2C",
    },
    {
      bar: "#2F6F68",
      tint: "#EEF7F5",
      border: "#C5DED9",
      text: "#275C57",
    },
    {
      bar: "#6B6477",
      tint: "#F1EFF4",
      border: "#D4CEDC",
      text: "#514B5C",
    },
    {
      bar: "#8A6A3F",
      tint: "#F6F1E8",
      border: "#DCCDAF",
      text: "#6D5231",
    },
  ];

  return accents[index % accents.length];
}

export default function ReportExplorer({ records }: { records: ExpenseRecord[] }) {
  const [openPrimary, setOpenPrimary] = useState<string[]>([]);
  const [openSecondary, setOpenSecondary] = useState<string[]>([]);

  function toggleOpen(key: string, setter: Dispatch<SetStateAction<string[]>>) {
    setter((currentKeys) =>
      currentKeys.includes(key)
        ? currentKeys.filter((currentKey) => currentKey !== key)
        : [...currentKeys, key],
    );
  }

  const summary = useMemo(() => {
    const totalSpending = records.reduce(
      (sum, record) => sum + Number(record.purchase_price || 0),
      0,
    );
    const totalEstimatedValue = records.reduce(
      (sum, record) => sum + Number(record.current_estimated_value || 0),
      0,
    );
    const totalNetWorthImpact = records.reduce(
      (sum, record) =>
        sum +
        calculateNetWorthImpact(
          record.financial_type,
          Number(record.current_estimated_value || 0),
        ),
      0,
    );
    const averageRating = records.length
      ? records.reduce((sum, record) => sum + getStoredOrEstimatedRating(record), 0) /
        records.length
      : 0;

    return {
      totalSpending,
      totalEstimatedValue,
      totalNetWorthImpact,
      averageRating,
    };
  }, [records]);

  const categoryGroups = useMemo(() => groupRecords(records), [records]);
  const typeTotals = useMemo(() => {
    const totals = new Map<string, number>();
    records.forEach((record) => {
      const type = record.financial_type || "expense";
      totals.set(type, (totals.get(type) || 0) + Number(record.purchase_price || 0));
    });

    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, [records]);
  const monthTotals = useMemo(() => {
    const totals = new Map<string, number>();
    records.forEach((record) => {
      const month = getMonth(record);
      totals.set(month, (totals.get(month) || 0) + Number(record.purchase_price || 0));
    });

    return [...totals.entries()];
  }, [records]);
  const maxCategoryTotal = Math.max(...categoryGroups.map((group) => group.total), 1);
  const summaryCards = [
    {
      label: "Total Spending",
      value: formatMoney(summary.totalSpending),
      note: `${records.length} entries`,
      accent: "#0F766E",
    },
    {
      label: "Estimated Value",
      value: formatMoney(summary.totalEstimatedValue),
      note: "Current asset value",
      accent: "#4F46E5",
    },
    {
      label: "Net Worth Impact",
      value: formatMoney(summary.totalNetWorthImpact),
      note: "Expenses count as 0",
      accent: "#B45309",
    },
    {
      label: "Avg Tier",
      value: `${summary.averageRating.toFixed(1)} / 10`,
      note: "Spending tier",
      accent: "#6F4E37",
    },
  ];

  return (
    <main className="min-h-screen bg-[#F7F5F1] px-5 py-7 text-[#22211F] sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7">
          <AppLogo compact />
        </div>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#8A8176]">
              Live Report
            </p>
            <h1 className="text-3xl font-semibold tracking-normal">The Shape of Spending</h1>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[#6D675F]">
            Life area first, subcategory second, exact entries on demand.
          </p>
        </div>

        <section className="grid gap-3 md:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-lg border border-[#DED8CD] bg-white p-4 shadow-sm"
            >
              <div className="mb-3 h-1 w-10 rounded-full" style={{ background: card.accent }} />
              <div className="text-sm text-[#6D675F]">{card.label}</div>
              <div className="mt-1 text-2xl font-semibold">{card.value}</div>
              <div className="mt-2 text-xs text-[#8A8176]">{card.note}</div>
            </div>
          ))}
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.45fr_0.55fr]">
          <div className="overflow-hidden rounded-lg border border-[#DED8CD] bg-white shadow-sm">
            <div className="border-b border-[#E6E0D6] px-5 py-4">
              <h2 className="text-xl font-semibold">Spending by Life Area</h2>
              <p className="mt-1 text-sm text-[#6D675F]">
                Expand a life area, then drill into a subcategory to trace entries.
              </p>
            </div>

            <div className="divide-y divide-[#ECE6DC]">
              {categoryGroups.map((group, index) => {
                const isOpen = openPrimary.includes(group.name);
                const children = [...group.children.values()].sort((a, b) => b.total - a.total);
                const accent = getGroupAccent(index);

                return (
                  <div key={group.name}>
                    <button
                      aria-expanded={isOpen}
                      onClick={() => toggleOpen(group.name, setOpenPrimary)}
                      className="w-full px-5 py-4 text-left transition hover:bg-[#FBF8F3]"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="grid h-8 w-8 place-items-center rounded-full text-sm font-semibold transition-transform duration-200"
                            style={{
                              background: accent.tint,
                              color: accent.text,
                              border: `1px solid ${accent.border}`,
                            }}
                          >
                            {isOpen ? "-" : "+"}
                          </span>
                          <div>
                            <div className="font-medium">{group.name}</div>
                            <div className="mt-1 text-xs text-[#6D675F]">
                              {children.length} subcategories · {group.entries.length} entries
                            </div>
                          </div>
                        </div>
                        <div className="font-semibold">{formatMoney(group.total)}</div>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-[#F1ECE4]">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${Math.max((group.total / maxCategoryTotal) * 100, 4)}%`,
                            background: accent.bar,
                          }}
                        />
                      </div>
                    </button>

                    <div
                      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="bg-[#FBF8F3] px-5 pb-4">
                          <div className="space-y-2">
                            {children.map((child) => {
                              const childKey = `${group.name}:${child.name}`;
                              const childOpen = openSecondary.includes(childKey);

                              return (
                                <div
                                  key={child.name}
                                  className="overflow-hidden rounded-lg border border-[#DED8CD] bg-white"
                                >
                                  <button
                                    aria-expanded={childOpen}
                                    onClick={() => toggleOpen(childKey, setOpenSecondary)}
                                    className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
                                  >
                                    <div>
                                      <div className="font-medium">{child.name}</div>
                                      <div className="text-xs text-[#6D675F]">
                                        {child.entries.length} entries · trace source rows
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="font-semibold">
                                        {formatMoney(child.total)}
                                      </span>
                                      <span className="text-sm text-[#8A8176]">
                                        {childOpen ? "Hide" : "Trace"}
                                      </span>
                                    </div>
                                  </button>

                                  <div
                                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                                      childOpen
                                        ? "grid-rows-[1fr] opacity-100"
                                        : "grid-rows-[0fr] opacity-0"
                                    }`}
                                  >
                                    <div className="overflow-hidden">
                                      <div className="border-t border-[#E6E0D6] bg-[#FFFCF7]">
                                        {child.entries.map((entry) => {
                                          const itemName = getMeaningfulItemName(
                                            entry.item_name,
                                            entry.merchant,
                                          );

                                          return (
                                            <div
                                              key={entry.id}
                                              className="grid gap-2 border-b border-[#F1ECE4] px-4 py-3 text-sm last:border-b-0 sm:grid-cols-[1fr_auto]"
                                            >
                                              <div>
                                                <div className="font-medium">
                                                  {itemName || entry.merchant || "Unknown merchant"}
                                                </div>
                                                <div className="mt-1 text-xs text-[#6D675F]">
                                                  {itemName && entry.merchant
                                                    ? `${entry.merchant} · `
                                                    : ""}
                                                  {entry.financial_type}
                                                </div>
                                              </div>
                                              <div className="font-medium">
                                                {formatPreciseMoney(
                                                  Number(entry.purchase_price || 0),
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-5">
            <section className="rounded-lg border border-[#DED8CD] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">By Type</h2>
              <div className="mt-4 space-y-3">
                {typeTotals.map(([type, total]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="text-[#5F5951]">{type}</span>
                    <span className="font-semibold">{formatMoney(total)}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[#DED8CD] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold">By Month</h2>
              <div className="mt-4 space-y-3">
                {monthTotals.map(([month, total]) => (
                  <div key={month} className="flex items-center justify-between text-sm">
                    <span className="text-[#5F5951]">{month}</span>
                    <span className="font-semibold">{formatMoney(total)}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
