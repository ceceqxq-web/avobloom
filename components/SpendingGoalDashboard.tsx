"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type GoalMode = "week" | "month";

type SpendingGoalDashboardProps = {
  weekTotal: number;
  monthTotal: number;
  entryCount: number;
  estimatedValue: number;
  netWorthImpact: number;
};

const storageKey = "expense-spending-goals";
const defaultGoals: Record<GoalMode, number> = {
  week: 300,
  month: 1200,
};

const dayMs = 24 * 60 * 60 * 1000;

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function getWeekBounds(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const offset = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - offset);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getMonthBounds(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getPeriodMeta(mode: GoalMode) {
  const now = new Date();
  const { start, end } = mode === "week" ? getWeekBounds(now) : getMonthBounds(now);
  const daysLeft = Math.max(Math.ceil((end.getTime() - now.getTime()) / dayMs), 0);

  if (mode === "week") {
    return {
      label: `${formatShortDate(start)} - ${formatShortDate(end)}`,
      helper: "Current week, Monday to Sunday",
      daysLeft,
    };
  }

  return {
    label: new Intl.DateTimeFormat("en-AU", {
      month: "long",
      year: "numeric",
    }).format(start),
    helper: "Current calendar month",
    daysLeft,
  };
}

function readGoals() {
  if (typeof window === "undefined") return defaultGoals;

  try {
    return {
      ...defaultGoals,
      ...(JSON.parse(window.localStorage.getItem(storageKey) || "{}") as Partial<
        Record<GoalMode, number>
      >),
    };
  } catch {
    return defaultGoals;
  }
}

export default function SpendingGoalDashboard({
  weekTotal,
  monthTotal,
  entryCount,
  estimatedValue,
  netWorthImpact,
}: SpendingGoalDashboardProps) {
  const [mode, setMode] = useState<GoalMode>("week");
  const [goals, setGoals] = useState(defaultGoals);
  const [isEditing, setIsEditing] = useState(false);
  const [draftGoals, setDraftGoals] = useState<Record<GoalMode, string>>({
    week: String(defaultGoals.week),
    month: String(defaultGoals.month),
  });

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setGoals(readGoals());
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const activeTotal = mode === "week" ? weekTotal : monthTotal;
  const activeGoal = goals[mode] || defaultGoals[mode];
  const period = getPeriodMeta(mode);
  const percent = activeGoal > 0 ? Math.round((activeTotal / activeGoal) * 100) : 0;
  const isOver = activeTotal > activeGoal;
  const status = isOver ? "Over goal" : "Within goal";
  const remaining = activeGoal - activeTotal;
  const dailyRoom = Math.max(remaining, 0) / Math.max(period.daysLeft, 1);
  const statusStyles = isOver
    ? {
        panel: "bg-[#FFF7E0] border-[#E8C46A]",
        bar: "#B7791F",
        text: "#7A4E05",
      }
    : {
        panel: "bg-[#EDF8F0] border-[#BFDCC8]",
        bar: "#2F7D4E",
        text: "#245B3A",
      };

  const stats = useMemo(
    () => [
      ["Entries", String(entryCount)],
      ["Value", formatMoney(estimatedValue)],
      ["Net impact", formatMoney(netWorthImpact)],
    ],
    [entryCount, estimatedValue, netWorthImpact],
  );

  function saveGoal() {
    const nextGoals = {
      week: Math.max(Number(draftGoals.week || 0), 0) || defaultGoals.week,
      month: Math.max(Number(draftGoals.month || 0), 0) || defaultGoals.month,
    };
    setGoals(nextGoals);
    window.localStorage.setItem(storageKey, JSON.stringify(nextGoals));
    setIsEditing(false);
  }

  return (
    <section className={`rounded-xl border p-3 shadow-sm ${statusStyles.panel}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8A8176]">
            Spending Goal
          </p>
          <h2 className="mt-1.5 text-xl font-semibold text-[#22211F]">Budget pulse</h2>
          <p className="mt-1 text-xs text-[#6D675F]">{period.label}</p>
        </div>
        <div className="inline-flex rounded-full border border-black/10 bg-white/60 p-1 text-xs">
          {[
            ["week", "Week"],
            ["month", "Month"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setMode(value as GoalMode);
                setIsEditing(false);
              }}
              className={`rounded-full px-3 py-1.5 transition ${
                mode === value ? "bg-[#1F1F1F] text-white" : "text-[#5F5951]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-lg bg-white/70 p-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-xs font-medium" style={{ color: statusStyles.text }}>
              {status}
            </div>
            <div className="mt-1 text-2xl font-semibold text-[#22211F]">
              {formatMoney(activeTotal)}
            </div>
            <div className="mt-1 text-xs text-[#6D675F]">{period.helper}</div>
          </div>
          <div className="text-right text-xs text-[#6D675F]">
            Goal
            <div className="mt-1 text-base font-semibold text-[#22211F]">
              {formatMoney(activeGoal)}
            </div>
          </div>
        </div>

        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#E8E1D6]">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(percent, 100)}%`,
              background: statusStyles.bar,
            }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-[#6D675F]">
          <span>{percent}% used</span>
          <button
            type="button"
            onClick={() => {
              setDraftGoals({
                week: String(goals.week || defaultGoals.week),
                month: String(goals.month || defaultGoals.month),
              });
              setIsEditing((current) => !current);
            }}
            className="rounded-full border border-[#CFC6B8] bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-[#22211F] shadow-sm transition hover:border-[#1F1F1F] hover:bg-white"
          >
            Edit goal
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-white px-3 py-2 text-[#6D675F]">
            {remaining >= 0 ? "Remaining" : "Over by"}
            <div className="mt-1 font-semibold text-[#22211F]">
              {formatMoney(Math.abs(remaining))}
            </div>
          </div>
          <div className="rounded-lg bg-white px-3 py-2 text-[#6D675F]">
            {mode === "week" ? "Daily room" : "Days left"}
            <div className="mt-1 font-semibold text-[#22211F]">
              {mode === "week" ? formatMoney(dailyRoom) : period.daysLeft}
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="mt-2 rounded-lg border border-[#CFC6B8] bg-white/70 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs text-[#6D675F]">Weekly goal</span>
              <input
                className="w-full rounded-lg border border-[#CFC6B8] bg-white px-3 py-2 text-sm outline-none focus:border-[#1F1F1F]"
                min="0"
                type="number"
                value={draftGoals.week}
                onChange={(event) =>
                  setDraftGoals((current) => ({ ...current, week: event.target.value }))
                }
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-[#6D675F]">Monthly goal</span>
              <input
                className="w-full rounded-lg border border-[#CFC6B8] bg-white px-3 py-2 text-sm outline-none focus:border-[#1F1F1F]"
                min="0"
                type="number"
                value={draftGoals.month}
                onChange={(event) =>
                  setDraftGoals((current) => ({ ...current, month: event.target.value }))
                }
              />
            </label>
          </div>
          <button
            onClick={saveGoal}
            type="button"
            className="mt-3 w-full rounded-lg bg-[#1F1F1F] px-3 py-2 text-sm text-white"
          >
            Save goals
          </button>
        </div>
      )}

      <div className="mt-2 grid grid-cols-3 gap-2">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-lg bg-white/60 p-2.5">
            <div className="text-xs text-[#6D675F]">{label}</div>
            <div className="mt-1 text-sm font-semibold text-[#22211F]">{value}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-end">
        <Link
          href="/reports"
          className="text-[11px] font-semibold uppercase tracking-[0.16em] hover:opacity-70"
          style={{ color: statusStyles.text }}
        >
          click to check spending report
        </Link>
      </div>
    </section>
  );
}
