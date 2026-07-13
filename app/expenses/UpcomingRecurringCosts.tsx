import { RecurringExpenseRecord } from "@/lib/expenseTypes";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function UpcomingRecurringCosts({
  recurringExpenses,
}: {
  recurringExpenses: RecurringExpenseRecord[];
}) {
  if (!recurringExpenses.length) return null;

  return (
    <section className="mb-5 rounded-lg border border-[#DED8CD] bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A8176]">
            Upcoming recurring costs
          </p>
          <h2 className="mt-1 text-lg font-semibold">Scheduled, not yet in entries</h2>
        </div>
        <span className="rounded-full bg-[#EEF1F7] px-3 py-1 text-xs font-medium text-[#44506A]">
          {recurringExpenses.length} active
        </span>
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {recurringExpenses.map((expense) => (
          <div
            key={expense.id}
            className="rounded-lg border border-[#E6E0D6] bg-[#FFFCF7] p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-[#22211F]">
                  {expense.item_name}
                </div>
                <div className="mt-1 truncate text-xs text-[#6D675F]">
                  {expense.merchant || "Unknown merchant"} · {expense.recurrence_frequency}
                </div>
              </div>
              <div className="text-right text-sm font-semibold">
                {formatMoney(Number(expense.purchase_price || 0))}
              </div>
            </div>
            <div className="mt-3 text-xs text-[#6D675F]">
              Next:{" "}
              <span className="font-medium text-[#22211F]">
                {formatDate(expense.next_occurrence_date)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
