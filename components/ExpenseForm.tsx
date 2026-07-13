"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createExpenses,
  createRecurringExpenses,
  isMissingRecurringExpensesTableError,
} from "@/lib/expenseService";
import { revalidateExpenseViews } from "@/lib/revalidateExpenses";
import {
  ExpenseAnalysis,
  ExpenseAnalysisResult,
  FinancialType,
  RecurrenceFrequency,
  calculateNetWorthImpact,
} from "@/lib/expenseTypes";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-[#8A8176]">
        {label}
      </span>
      {children}
    </label>
  );
}

function canPreviewImage(file: File) {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  return (
    type === "image/jpeg" ||
    type === "image/png" ||
    type === "image/webp" ||
    type === "image/gif" ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".webp") ||
    name.endsWith(".gif")
  );
}

function isHeicImage(file: File) {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  return (
    type === "image/heic" ||
    type === "image/heif" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

function blankItem(): ExpenseAnalysis {
  return {
    merchant: "",
    item_name: "",
    purchase_price: 0,
    expense_date: new Date().toISOString().slice(0, 10),
    category: "",
    financial_type: "expense",
    current_estimated_value: 0,
    net_worth_impact: 0,
    brand: "",
    brand_positioning: "Unknown",
    consumption_rate: 5,
    market_price_low: 0,
    market_price_high: 0,
    price_confidence: 0,
    price_estimate_source: "",
    price_reasoning: "",
    ai_confidence: 0,
    ai_summary: "",
    recurrence_frequency: "none",
    recurring_start_date: new Date().toISOString().slice(0, 10),
  };
}

export default function ExpenseForm() {
  const router = useRouter();
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const [rawText, setRawText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [imagePreviewStatus, setImagePreviewStatus] = useState("");
  const [items, setItems] = useState<ExpenseAnalysis[]>([]);
  const [analysisSummary, setAnalysisSummary] = useState("");
  const [analysisError, setAnalysisError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [hasOpenAIKey, setHasOpenAIKey] = useState<boolean | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTextFocused, setIsTextFocused] = useState(false);

  useEffect(() => {
    async function loadAiStatus() {
      try {
        const response = await fetch("/api/ai-status");
        const data = await response.json();
        setHasOpenAIKey(Boolean(data.hasOpenAIKey));
      } catch {
        setHasOpenAIKey(false);
      }
    }

    void loadAiStatus();
  }, []);

  useEffect(() => {
    const textArea = textAreaRef.current;
    if (!textArea) return;
    const minHeight = rawText.trim() || isTextFocused ? 92 : 54;

    textArea.style.height = "auto";
    textArea.style.height = `${Math.min(Math.max(textArea.scrollHeight, minHeight), 220)}px`;
  }, [isTextFocused, rawText]);

  function updateItem(index: number, patch: Partial<ExpenseAnalysis>) {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        const next = { ...item, ...patch };
        const purchasePrice = Number(next.purchase_price || 0);
        const estimatedValue = Number(next.current_estimated_value || 0);
        const financialType =
          estimatedValue > 0 && next.financial_type === "expense"
            ? "value_asset"
            : next.financial_type;
        const recurrenceFrequency =
          financialType === "ongoing_cost"
            ? next.recurrence_frequency || "monthly"
            : "none";

        return {
          ...next,
          purchase_price: purchasePrice,
          financial_type: financialType,
          recurrence_frequency: recurrenceFrequency,
          recurring_start_date: next.recurring_start_date || next.expense_date,
          current_estimated_value: estimatedValue,
          net_worth_impact: calculateNetWorthImpact(financialType, estimatedValue),
        };
      }),
    );
  }

  function applyAnalysis(result: ExpenseAnalysisResult) {
    setItems(result.items.length ? result.items : [blankItem()]);
    setAnalysisSummary(result.ai_summary);
  }

  function updateAllItemsType(financialType: FinancialType) {
    setItems((currentItems) =>
      currentItems.map((item) => {
        const estimatedValue =
          financialType === "expense" || financialType === "ongoing_cost"
            ? 0
            : Number(item.current_estimated_value || 0);

        return {
          ...item,
          financial_type: financialType,
          recurrence_frequency: financialType === "ongoing_cost" ? "monthly" : "none",
          recurring_start_date:
            item.recurring_start_date || item.expense_date || new Date().toISOString().slice(0, 10),
          current_estimated_value: estimatedValue,
          net_worth_impact: calculateNetWorthImpact(financialType, estimatedValue),
        };
      }),
    );
  }

  async function handleImageChange(file: File | null) {
    setImageFile(file);
    setImagePreviewUrl("");
    setImagePreviewStatus("");

    if (!file) return;

    if (canPreviewImage(file)) {
      setImagePreviewUrl(URL.createObjectURL(file));
      return;
    }

    if (!isHeicImage(file)) {
      setImagePreviewStatus("Image selected. Preview is not available for this format.");
      return;
    }

    setImagePreviewStatus("Converting HEIC preview...");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/preview-image", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || !data.imageDataUrl) {
        throw new Error("Preview conversion failed");
      }

      setImagePreviewUrl(data.imageDataUrl);
      setImagePreviewStatus("HEIC converted to JPEG for preview and AI analysis.");
    } catch {
      setImagePreviewStatus(
        "HEIC selected, but preview conversion failed. Try exporting the image as JPEG/PNG.",
      );
    }
  }

  async function handleAnalyze() {
    if (!rawText.trim() && !imageFile) {
      alert("Please describe the expense or upload an image first.");
      return;
    }

    if (imageFile && hasOpenAIKey === false) {
      setItems([]);
      setAnalysisSummary("");
      setAnalysisError(
        "Receipt image analysis is not enabled yet. Add OPENAI_API_KEY to .env.local and restart the dev server.",
      );
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError("");

    try {
      const response = imageFile
        ? await fetch("/api/analyze-expense", {
            method: "POST",
            body: (() => {
              const formData = new FormData();
              formData.append("rawText", rawText);
              formData.append("image", imageFile);
              return formData;
            })(),
          })
        : await fetch("/api/analyze-expense", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              rawText,
            }),
          });

      const data = await response.json();

      if (!response.ok) {
        setItems([]);
        setAnalysisSummary("");
        setAnalysisError(data.error || "AI analysis failed. Please try again.");
        return;
      }

      applyAnalysis(data.analysis);
    } catch {
      setItems([]);
      setAnalysisSummary("");
      setAnalysisError("AI analysis failed. Please check your API key and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleSave() {
    if (isSaving) return;
    setSaveError("");
    const validItems = items
      .filter((item) => item.item_name.trim() || item.purchase_price > 0)
      .map((item) => {
        const base = {
        merchant: item.merchant,
        item_name: item.item_name,
        purchase_price: Number(item.purchase_price || 0),
        expense_date: item.expense_date || new Date().toISOString().slice(0, 10),
        category: item.category,
        financial_type: item.financial_type,
        current_estimated_value: Number(item.current_estimated_value || 0),
        net_worth_impact: calculateNetWorthImpact(
          item.financial_type,
          Number(item.current_estimated_value || 0),
        ),
        brand: item.brand,
        brand_positioning: item.brand_positioning,
        consumption_rate: Number(item.consumption_rate || 1),
        market_price_low: Number(item.market_price_low || 0),
        market_price_high: Number(item.market_price_high || 0),
        price_confidence: Number(item.price_confidence || 0),
        price_estimate_source: item.price_estimate_source,
        price_reasoning: item.price_reasoning,
        ai_confidence: Number(item.ai_confidence || 0),
        ai_summary: item.ai_summary || analysisSummary,
        };

        return {
          ...base,
          recurrence_frequency: item.recurrence_frequency || "none",
          recurring_start_date:
            item.recurring_start_date || item.expense_date || new Date().toISOString().slice(0, 10),
        };
      });
    const expenses = validItems.filter(
      (item) => item.financial_type !== "ongoing_cost" || item.recurrence_frequency === "none",
    );
    const recurringExpenses = validItems
      .filter(
        (item) =>
          item.financial_type === "ongoing_cost" &&
          (item.recurrence_frequency === "weekly" || item.recurrence_frequency === "monthly"),
      )
      .map((item) => ({
        merchant: item.merchant,
        item_name: item.item_name,
        purchase_price: item.purchase_price,
        category: item.category,
        current_estimated_value: 0,
        brand: item.brand,
        brand_positioning: item.brand_positioning,
        consumption_rate: item.consumption_rate,
        market_price_low: item.market_price_low,
        market_price_high: item.market_price_high,
        price_confidence: item.price_confidence,
        price_estimate_source: item.price_estimate_source,
        price_reasoning: item.price_reasoning,
        ai_confidence: item.ai_confidence,
        ai_summary: item.ai_summary,
        recurrence_frequency: item.recurrence_frequency as "weekly" | "monthly",
        start_date: item.recurring_start_date,
        next_occurrence_date: item.recurring_start_date,
        is_active: true,
      }));

    if (!expenses.length && !recurringExpenses.length) {
      setSaveError("Please add at least one expense item.");
      return;
    }

    setIsSaving(true);

    try {
      const [expenseResult, recurringResult] = await Promise.all([
        expenses.length ? createExpenses(expenses) : Promise.resolve({ error: null }),
        recurringExpenses.length
          ? createRecurringExpenses(recurringExpenses)
          : Promise.resolve({ error: null }),
      ]);
      const error = expenseResult.error || recurringResult.error;

      if (error) {
        setSaveError(
          isMissingRecurringExpensesTableError(error.message)
            ? "还差一次数据库设置：循环支出需要 recurring_expenses 表。请在 Supabase SQL Editor 执行数据库迁移后再保存。"
            : error.message,
        );
        return;
      }

      setRawText("");
      setImageFile(null);
      setImagePreviewUrl("");
      setImagePreviewStatus("");
      setItems([]);
      setAnalysisSummary("");
      setAnalysisError("");
      setSaveError("");
      void revalidateExpenseViews();
      router.refresh();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "The expense could not be saved. Check your connection and try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-full border border-[#D7CFC2] bg-[#FFFCF7] px-5 py-3.5 text-sm leading-6 text-[#22211F] outline-none placeholder:text-[#A9A19A] focus:border-[#1F1F1F]";
  const compactInputClass =
    "w-full rounded-lg border border-[#D7CFC2] bg-white px-4 py-3 text-sm leading-6 text-[#22211F] outline-none placeholder:text-[#A9A19A] focus:border-[#1F1F1F]";
  const labelClass =
    "mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-[#8A8176]";
  const total = items.reduce((sum, item) => sum + Number(item.purchase_price || 0), 0);
  const recurringItemCount = items.filter(
    (item) =>
      item.financial_type === "ongoing_cost" &&
      (item.recurrence_frequency === "weekly" || item.recurrence_frequency === "monthly"),
  ).length;
  const isExpanded =
    isTextFocused ||
    Boolean(rawText.trim()) ||
    Boolean(imageFile) ||
    items.length > 0 ||
    Boolean(analysisError) ||
    Boolean(saveError);

  return (
    <div className={`space-y-3 transition-all duration-300 ${isExpanded ? "" : "space-y-2"}`}>
      <div>
        <label className={isExpanded ? labelClass : "sr-only"}>AI Input</label>
        <textarea
          ref={textAreaRef}
          rows={1}
          className={`max-h-56 w-full resize-none rounded-[22px] border border-[#CFC6B8] bg-[#FFFCF7] px-5 text-sm leading-6 text-[#22211F] outline-none transition-[height,border-color,box-shadow,padding] duration-300 placeholder:text-[#A9A19A] focus:border-[#1F1F1F] focus:shadow-[0_8px_24px_rgba(31,31,31,0.08)] ${
            isExpanded ? "py-4" : "py-3"
          }`}
          placeholder={
            isExpanded
              ? "例如：在 [商家] 购买了 [商品或服务]，共花费 [金额]，日期是 [日期]。"
              : "描述一笔消费，或粘贴收据信息…"
          }
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
          onBlur={() => setIsTextFocused(false)}
          onFocus={() => setIsTextFocused(true)}
        />
      </div>

      <div>
        <label className={isExpanded ? labelClass : "sr-only"}>
          Receipt / Product Image 图片上传
        </label>
        <label
          className={`block cursor-pointer rounded-[22px] border border-dashed border-[#CFC6B8] bg-[#FBF8F3] text-sm leading-6 text-[#6D675F] transition-all duration-300 hover:border-[#1F1F1F] ${
            isExpanded ? "p-4" : "p-2"
          }`}
        >
          <input
            accept="image/*"
            className="sr-only"
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0] || null;
              void handleImageChange(file);
            }}
          />
          {imageFile ? (
            <div className="space-y-3">
              {imagePreviewUrl ? (
                <div
                  aria-label="Uploaded expense source"
                  className="h-56 w-full rounded-[18px] bg-cover bg-center"
                  role="img"
                  style={{ backgroundImage: `url(${imagePreviewUrl})` }}
                />
              ) : (
                <div className="flex h-56 w-full items-center justify-center rounded-[18px] border border-[#E6E0D6] bg-white px-6 text-center">
                  {imagePreviewStatus ||
                    (isHeicImage(imageFile)
                      ? "HEIC selected. It will be converted to JPEG during AI analysis."
                      : "Image selected. Preview is not available for this format.")}
                </div>
              )}
              <div>{imageFile.name}</div>
              {imagePreviewUrl && imagePreviewStatus && (
                <div className="text-xs text-[#8A8176]">{imagePreviewStatus}</div>
              )}
            </div>
          ) : (
            <div
              className={`text-center transition-all duration-300 ${
                isExpanded ? "py-4" : "py-0.5 text-xs"
              }`}
            >
              {isExpanded
                ? "Upload a receipt, product screenshot, or purchase photo"
                : "Upload receipt / product image"}
            </div>
          )}
        </label>
        {imageFile && (
          <button
          className="mt-2 rounded-full border border-[#D7CFC2] px-4 py-2 text-xs leading-5 text-[#6D675F]"
            onClick={() => {
              setImageFile(null);
              setImagePreviewUrl("");
              setImagePreviewStatus("");
            }}
          >
            Remove image
          </button>
        )}
      </div>

      <button
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        className={`w-full rounded-full border border-[#1F1F1F] px-5 text-sm font-medium leading-6 text-[#1F1F1F] transition-all duration-300 hover:bg-[#1F1F1F] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 ${
          isExpanded ? "py-3.5" : "py-2"
        }`}
      >
        {isAnalyzing ? "Analyzing..." : "Analyze with AI"}
      </button>

      {imageFile && hasOpenAIKey === false && (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          Image preview is working, but receipt analysis needs OpenAI. Add{" "}
          <span className="font-semibold">OPENAI_API_KEY</span> to{" "}
          <span className="font-semibold">.env.local</span>, then restart the dev
          server.
        </div>
      )}

      {analysisError && (
        <div className="rounded-[24px] border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
          {analysisError}
        </div>
      )}

      {items.length > 0 && (
        <div className="flex items-center justify-between text-sm text-[#6D675F]">
          <span>{items.length} item{items.length === 1 ? "" : "s"} ready</span>
          <span>Total ${total.toFixed(2)}</span>
        </div>
      )}

      {items.length > 0 && (
        <div className="sticky top-2 z-30 space-y-2 rounded-[24px] bg-[#fbf8f3]/95 p-2 shadow-[0_10px_30px_rgba(31,31,31,.08)] backdrop-blur md:static md:bg-transparent md:p-0 md:shadow-none">
          {saveError && (
            <div
              aria-live="assertive"
              className="rounded-[18px] border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-700"
              role="alert"
            >
              {saveError}
            </div>
          )}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            aria-busy={isSaving}
            className="flex w-full touch-manipulation items-center justify-center gap-2 rounded-full bg-[#1F1F1F] px-5 py-3.5 text-sm font-medium leading-6 text-white transition active:scale-[0.98] hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
          >
            {isSaving && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {isSaving
              ? "Saving expense…"
              : recurringItemCount
                ? `Save ${recurringItemCount} Subscription Schedule${
                    recurringItemCount === 1 ? "" : "s"
                  }`
                : `Save ${items.length} Expense Item${items.length === 1 ? "" : "s"}`}
          </button>
        </div>
      )}

      {items.length > 0 && analysisSummary && (
        <div className="rounded-[24px] border border-[#D7CFC2] bg-[#FBF8F3] p-4 text-sm leading-6 text-[#6D675F]">
          {analysisSummary}
        </div>
      )}

      {items.length > 1 && (
        <div className="rounded-[18px] border border-[#E6E0D6] bg-white p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8A8176]">
            Batch type 批量消费类型
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ["expense", "Expense 固定消费"],
              ["ongoing_cost", "Subscription 循环订阅"],
              ["value_asset", "Value Asset 有残值"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => updateAllItemsType(value as FinancialType)}
                className="rounded-full border border-[#D7CFC2] px-3 py-1.5 text-xs font-medium text-[#4D4740] transition hover:border-[#1F1F1F] hover:text-[#1F1F1F]"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={index}
          className="rounded-[22px] border border-[#D7CFC2] bg-[#FBF8F3] p-4"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[#22211F]">
                Item {index + 1}
              </div>
              {items.length > 1 && (
                <button
                  onClick={() =>
                    setItems((currentItems) =>
                      currentItems.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                  className="rounded-full border border-[#D7CFC2] px-3 py-1 text-xs text-[#6D675F]"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Merchant 店家">
                <input
                  className={compactInputClass}
                  placeholder="Adairs"
                  value={item.merchant}
                  onChange={(event) =>
                    updateItem(index, { merchant: event.target.value })
                  }
                />
              </Field>

              <Field label="Brand 品牌">
                <input
                  className={compactInputClass}
                  placeholder="Adairs"
                  value={item.brand}
                  onChange={(event) =>
                    updateItem(index, { brand: event.target.value })
                  }
                />
              </Field>

              <Field label="Brand Tier 品牌定位">
                <input
                  className={compactInputClass}
                  placeholder="Mid-market"
                  value={item.brand_positioning}
                  onChange={(event) =>
                    updateItem(index, { brand_positioning: event.target.value })
                  }
                />
              </Field>

              <Field label="Item 商品">
                <input
                  className={compactInputClass}
                  placeholder="Queen quilt cover"
                  value={item.item_name}
                  onChange={(event) =>
                    updateItem(index, { item_name: event.target.value })
                  }
                />
              </Field>

              <Field label="Purchase Price 购买价格">
                <input
                  className={compactInputClass}
                  placeholder="102"
                  type="number"
                  value={item.purchase_price}
                  onChange={(event) =>
                    updateItem(index, { purchase_price: Number(event.target.value) })
                  }
                />
              </Field>

              <Field label="Purchase Date 消费日期">
                <input
                  className={compactInputClass}
                  type="date"
                  value={item.expense_date || ""}
                  onChange={(event) =>
                    updateItem(index, { expense_date: event.target.value })
                  }
                />
              </Field>

              <Field label="Category 类别">
                <input
                  className={compactInputClass}
                  placeholder="Home"
                  value={item.category}
                  onChange={(event) =>
                    updateItem(index, { category: event.target.value })
                  }
                />
              </Field>

              <Field label="Financial Type 消费类型">
                <select
                  className={compactInputClass}
                  value={item.financial_type}
                  onChange={(event) =>
                    updateItem(index, {
                      financial_type: event.target.value as FinancialType,
                    })
                  }
                >
                  <option value="expense">Expense 普通消费</option>
                  <option value="ongoing_cost">Ongoing Cost 持续支出</option>
                  <option value="value_asset">Value Asset 有残值资产</option>
                  <option value="investment">Investment 投资</option>
                </select>
              </Field>

              {item.financial_type === "ongoing_cost" && (
                <>
                  <Field label="Recurring 循环频率">
                    <select
                      className={compactInputClass}
                      value={item.recurrence_frequency || "monthly"}
                      onChange={(event) =>
                        updateItem(index, {
                          recurrence_frequency: event.target.value as RecurrenceFrequency,
                        })
                      }
                    >
                      <option value="weekly">Weekly 每周</option>
                      <option value="monthly">Monthly 每月</option>
                    </select>
                  </Field>

                  <Field label="Next Date 下一次发生">
                    <input
                      className={compactInputClass}
                      type="date"
                      value={
                        item.recurring_start_date ||
                        item.expense_date ||
                        new Date().toISOString().slice(0, 10)
                      }
                      onChange={(event) =>
                        updateItem(index, {
                          recurring_start_date: event.target.value,
                          expense_date: event.target.value,
                        })
                      }
                    />
                  </Field>
                </>
              )}

              <Field label="Residual Value 估计残值">
                <input
                  className={compactInputClass}
                  placeholder="0"
                  type="number"
                  value={item.current_estimated_value}
                  onChange={(event) =>
                    updateItem(index, {
                      current_estimated_value: Number(event.target.value),
                    })
                  }
                />
              </Field>

              <Field label="Consumption Tier 消费档次 1-10">
                <input
                  className={compactInputClass}
                  min="1"
                  max="10"
                  placeholder="3"
                  type="number"
                  value={item.consumption_rate}
                  onChange={(event) =>
                    updateItem(index, {
                      consumption_rate: Number(event.target.value),
                    })
                  }
                />
              </Field>
            </div>

            <div className="mt-3 rounded-lg border border-[#E6E0D6] bg-white p-3 text-sm leading-6 text-[#6D675F]">
              <div className="font-medium text-[#22211F]">
                Market estimate ${Number(item.market_price_low || 0).toFixed(0)}-
                ${Number(item.market_price_high || 0).toFixed(0)} · Price confidence{" "}
                {Math.round(Number(item.price_confidence || 0) * 100)}%
              </div>
              <div>{item.price_reasoning || "No price reasoning yet."}</div>
              {item.price_estimate_source && (
                <div className="mt-1 text-xs text-[#8A8176]">
                  Source: {item.price_estimate_source}
                </div>
              )}
            </div>

            {item.ai_summary && (
              <div className="mt-3 rounded-lg border border-[#E6E0D6] bg-white p-3 text-sm leading-6 text-[#6D675F]">
                <div className="font-medium text-[#22211F]">
                  AI confidence {Math.round(Number(item.ai_confidence || 0) * 100)}%
                </div>
                {item.ai_summary}
              </div>
            )}
          </div>
        ))}
      </div>

      {items.length > 0 && (
        <button
          onClick={() => setItems((currentItems) => [...currentItems, blankItem()])}
          className={inputClass}
        >
          Add another item
        </button>
      )}

    </div>
  );
}
