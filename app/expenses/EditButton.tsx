"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { updateExpense } from "@/lib/expenseService";
import { revalidateExpenseViews } from "@/lib/revalidateExpenses";
import {
  ExpenseRecord,
  FinancialType,
  calculateNetWorthImpact,
} from "@/lib/expenseTypes";

const ratingOverridesKey = "expense-rating-overrides";

function saveRatingOverride(id: string, rating: number) {
  if (typeof window === "undefined" || !rating) return;

  try {
    const overrides = JSON.parse(
      window.localStorage.getItem(ratingOverridesKey) || "{}",
    ) as Record<string, number>;
    overrides[id] = rating;
    window.localStorage.setItem(ratingOverridesKey, JSON.stringify(overrides));
    window.dispatchEvent(new Event("expense-rating-overrides-change"));
  } catch {
    // Ignore local persistence errors. The server update still succeeds.
  }
}

function readRatingOverride(id: string) {
  if (typeof window === "undefined") return 0;

  try {
    const overrides = JSON.parse(
      window.localStorage.getItem(ratingOverridesKey) || "{}",
    ) as Record<string, number>;
    return Number(overrides[id] || 0);
  } catch {
    return 0;
  }
}

function getDateInputValue(value?: string) {
  if (!value) return new Date().toISOString().slice(0, 10);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);

  return date.toISOString().slice(0, 10);
}

export default function EditButton({
  expense,
}: {
  expense: ExpenseRecord;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [merchant, setMerchant] = useState(expense.merchant || "");
  const [itemName, setItemName] = useState(expense.item_name || "");
  const [price, setPrice] = useState(String(expense.purchase_price || 0));
  const [expenseDate, setExpenseDate] = useState(
    getDateInputValue(expense.expense_date || expense.created_at),
  );
  const [category, setCategory] = useState(expense.category || "");
  const [financialType, setFinancialType] = useState<FinancialType>(
    expense.financial_type || "expense",
  );
  const [estimatedValue, setEstimatedValue] = useState(
    String(expense.current_estimated_value || 0),
  );
  const [brand, setBrand] = useState(expense.brand || "");
  const [brandPositioning, setBrandPositioning] = useState(
    expense.brand_positioning || "",
  );
  const [consumptionRate, setConsumptionRate] = useState(
    String(readRatingOverride(expense.id) || expense.consumption_rate || 5),
  );
  const [marketPriceLow, setMarketPriceLow] = useState(
    String(expense.market_price_low || 0),
  );
  const [marketPriceHigh, setMarketPriceHigh] = useState(
    String(expense.market_price_high || 0),
  );
  const [priceConfidence, setPriceConfidence] = useState(
    String(expense.price_confidence || 0),
  );
  const [priceEstimateSource, setPriceEstimateSource] = useState(
    expense.price_estimate_source || "",
  );
  const [priceReasoning, setPriceReasoning] = useState(
    expense.price_reasoning || "",
  );
  const [aiSummary, setAiSummary] = useState(expense.ai_summary || "");
  const [isSaving, setIsSaving] = useState(false);

  function updateEstimatedValue(nextValue: string) {
    setEstimatedValue(nextValue);

    if (Number(nextValue || 0) > 0 && financialType === "expense") {
      setFinancialType("value_asset");
    }
  }

  async function handleSave() {
    const value = Number(estimatedValue || 0);
    const nextFinancialType =
      value > 0 && financialType === "expense" ? "value_asset" : financialType;
    setIsSaving(true);

    const { error } = await updateExpense(expense.id, {
      merchant,
      item_name: itemName,
      purchase_price: Number(price || 0),
      expense_date: expenseDate,
      category,
      financial_type: nextFinancialType,
      current_estimated_value: value,
      net_worth_impact: calculateNetWorthImpact(nextFinancialType, value),
      brand,
      brand_positioning: brandPositioning,
      consumption_rate: Number(consumptionRate || 1),
      market_price_low: Number(marketPriceLow || 0),
      market_price_high: Number(marketPriceHigh || 0),
      price_confidence: Number(priceConfidence || 0),
      price_estimate_source: priceEstimateSource,
      price_reasoning: priceReasoning,
      ai_confidence: expense.ai_confidence || 0,
      ai_summary: aiSummary,
    });

    if (error) {
      setIsSaving(false);
      alert(error.message);
      return;
    }

    saveRatingOverride(expense.id, Number(consumptionRate || 0));
    setIsSaving(false);
    setIsEditing(false);
    await revalidateExpenseViews();
    router.refresh();
  }

  if (isEditing) {
    const inputClass =
      "w-full rounded-lg border border-[#D7CFC2] bg-white px-3 py-2 text-sm text-[#22211F] outline-none focus:border-[#1F1F1F]";

    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-[#DED8CD] bg-[#FFFCF7] p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit expense</h2>
          <button
            onClick={() => setIsEditing(false)}
            className="rounded-md border border-[#D7CFC2] px-3 py-1 text-sm text-[#5F5951]"
          >
            Close
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className={inputClass}
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="Merchant"
          />
          <input
            className={inputClass}
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="Item"
          />
          <input
            className={inputClass}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price"
            type="number"
          />
          <input
            className={inputClass}
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            type="date"
          />
          <input
            className={inputClass}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
          />
          <select
            className={inputClass}
            value={financialType}
            onChange={(e) => setFinancialType(e.target.value as FinancialType)}
          >
            <option value="expense">Expense</option>
            <option value="ongoing_cost">Ongoing Cost</option>
            <option value="value_asset">Value Asset</option>
            <option value="investment">Investment</option>
          </select>
          <input
            className={inputClass}
            value={estimatedValue}
            onChange={(e) => updateEstimatedValue(e.target.value)}
            placeholder="Estimated value"
            type="number"
          />
          <input
            className={inputClass}
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Brand"
          />
          <input
            className={inputClass}
            value={brandPositioning}
            onChange={(e) => setBrandPositioning(e.target.value)}
            placeholder="Brand positioning"
          />
          <input
            className={inputClass}
            min="1"
            max="10"
            value={consumptionRate}
            onChange={(e) => setConsumptionRate(e.target.value)}
            placeholder="Consumption tier"
            type="number"
          />
          <input
            className={inputClass}
            value={marketPriceLow}
            onChange={(e) => setMarketPriceLow(e.target.value)}
            placeholder="Market price low"
            type="number"
          />
          <input
            className={inputClass}
            value={marketPriceHigh}
            onChange={(e) => setMarketPriceHigh(e.target.value)}
            placeholder="Market price high"
            type="number"
          />
          <input
            className={inputClass}
            min="0"
            max="1"
            step="0.01"
            value={priceConfidence}
            onChange={(e) => setPriceConfidence(e.target.value)}
            placeholder="Price confidence"
            type="number"
          />
        </div>
        <textarea
          className="min-h-16 w-full rounded-lg border border-[#D7CFC2] bg-white px-3 py-2 text-sm text-[#22211F] outline-none focus:border-[#1F1F1F]"
          value={priceReasoning}
          onChange={(e) => setPriceReasoning(e.target.value)}
          placeholder="Price reasoning"
        />
        <input
          className={inputClass}
          value={priceEstimateSource}
          onChange={(e) => setPriceEstimateSource(e.target.value)}
          placeholder="Price estimate source"
        />
        <textarea
          className="min-h-20 w-full rounded-lg border border-[#D7CFC2] bg-white px-3 py-2 text-sm text-[#22211F] outline-none focus:border-[#1F1F1F]"
          value={aiSummary}
          onChange={(e) => setAiSummary(e.target.value)}
          placeholder="AI summary"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded bg-[#1F1F1F] px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="rounded border border-[#D7CFC2] px-3 py-2 text-sm text-[#5F5951]"
          >
            Cancel
          </button>
        </div>
        </div>
      </div>
      ,
      document.body,
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="rounded-md border border-[#D7CFC2] px-3 py-1.5 text-xs font-medium text-[#4D4740] transition hover:border-[#1F1F1F] hover:text-[#1F1F1F]"
    >
      Edit
    </button>
  );
}
