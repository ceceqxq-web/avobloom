"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type GoalMode = "week" | "month";

type SpendingGoalDashboardProps = {
  weekTotal: number;
  monthTotal: number;
  entryCount: number;
  estimatedValue: number;
  netWorthImpact: number;
  weekUpcoming: number;
  monthUpcoming: number;
  userId: string;
  initialGoals: Record<GoalMode, number>;
};

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

export default function SpendingGoalDashboard({
  weekTotal,
  monthTotal,
  entryCount,
  estimatedValue,
  netWorthImpact,
  weekUpcoming,
  monthUpcoming,
  userId,
  initialGoals,
}: SpendingGoalDashboardProps) {
  const [mode, setMode] = useState<GoalMode>("week");
  const [goals, setGoals] = useState(initialGoals);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [draftGoals, setDraftGoals] = useState<Record<GoalMode, string>>({
    week: String(initialGoals.week),
    month: String(initialGoals.month),
  });

  const activeTotal = mode === "week" ? weekTotal : monthTotal;
  const activeUpcoming = mode === "week" ? weekUpcoming : monthUpcoming;
  const committedTotal = activeTotal + activeUpcoming;
  const activeGoal = goals[mode] || defaultGoals[mode];
  const period = getPeriodMeta(mode);
  const spentPercent = activeGoal > 0 ? (activeTotal / activeGoal) * 100 : 0;
  const upcomingPercent = activeGoal > 0 ? (activeUpcoming / activeGoal) * 100 : 0;
  const isOver = committedTotal > activeGoal;
  const status = isOver ? "Over goal" : "Within goal";
  const remaining = activeGoal - committedTotal;
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

  async function saveGoal() {
    const nextGoals = {
      week: Math.max(Number(draftGoals.week || 0), 0) || defaultGoals.week,
      month: Math.max(Number(draftGoals.month || 0), 0) || defaultGoals.month,
    };
    setIsSaving(true);
    setSaveError("");
    const { error } = await createClient().from("spending_goals").upsert({
      user_id: userId,
      weekly_goal: nextGoals.week,
      monthly_goal: nextGoals.month,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      setSaveError(error.message);
      setIsSaving(false);
      return;
    }
    setGoals(nextGoals);
    setIsEditing(false);
    setIsSaving(false);
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
            {activeUpcoming > 0 && (
              <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#5F7667]">
                <span className="inline-block h-2 w-2 rounded-full bg-[#2F7D4E]/35" />
                + {formatMoney(activeUpcoming)} scheduled
              </div>
            )}
            <div className="mt-1 text-xs text-[#6D675F]">{period.helper}</div>
          </div>
          <div className="text-right text-xs text-[#6D675F]">
            Goal
            <div className="mt-1 text-base font-semibold text-[#22211F]">
              {formatMoney(activeGoal)}
            </div>
          </div>
        </div>

        <div
          className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-[#E8E1D6]"
          aria-label={`${formatMoney(activeTotal)} spent and ${formatMoney(activeUpcoming)} scheduled`}
        >
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(spentPercent, 100)}%`,
              background: statusStyles.bar,
            }}
          />
          <div
            className="h-full border-l border-white/70 transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(upcomingPercent, Math.max(100 - spentPercent, 0))}%`,
              background: statusStyles.bar,
              opacity: 0.32,
            }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-[#6D675F]">
          <span>
            {Math.round(spentPercent)}% used
            {activeUpcoming > 0
              ? ` · ${Math.round(upcomingPercent)}% scheduled`
              : ""}
          </span>
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
            onClick={() => void saveGoal()}
            disabled={isSaving}
            type="button"
            className="mt-3 w-full rounded-lg bg-[#1F1F1F] px-3 py-2 text-sm text-white disabled:opacity-60"
          >
            {isSaving ? "Saving…" : "Save goals"}
          </button>
          {saveError && <p className="mt-2 text-xs text-red-700">{saveError}</p>}
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
