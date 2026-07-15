"use client";

import { useMemo, useState } from "react";
import type { PurchaseOrderResponse } from "@/lib/purchaseOrderContracts";

export type ShoppingSuggestion = {
  id: string;
  itemName: string;
  merchant: string;
  unitPrice: number;
  reason: string;
};

type ShoppingItem = ShoppingSuggestion & {
  selected: boolean;
  quantity: number;
  method: "delivery" | "pickup" | "subscription";
};

async function confirmationToken(value: object) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export default function SmartShoppingList({ suggestions }: { suggestions: ShoppingSuggestion[] }) {
  const [items, setItems] = useState<ShoppingItem[]>(() => suggestions.map((item) => ({ ...item, selected: true, quantity: 1, method: "delivery" })));
  const [reviewing, setReviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const selected = items.filter((item) => item.selected);
  const total = useMemo(() => selected.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [selected]);

  function update(id: string, values: Partial<ShoppingItem>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...values } : item));
  }

  async function enableNotifications() {
    if (!("Notification" in window)) {
      setMessage("此浏览器不支持购买提醒通知。");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      new Notification("AI 待购清单", { body: `有 ${items.length} 件物品建议确认购买。`, icon: "/icon.png" });
      setMessage("购买提醒已开启。发现新的待购物品时会提醒你查看。 ");
    } else {
      setMessage("通知权限未开启，你仍可以在首页查看清单。");
    }
  }

  async function confirmAll() {
    setSubmitting(true);
    setMessage("");
    try {
      for (const item of selected) {
        const draft = {
          itemName: item.itemName,
          merchant: item.merchant || "待确认商家",
          productUrl: "",
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          deliveryNotes: `购买方式：${item.method}`,
        };
        const response = await fetch("/api/purchase-orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...draft, confirmationToken: await confirmationToken(draft) }),
        });
        const result = (await response.json()) as PurchaseOrderResponse;
        if (!response.ok || !result.ok) throw new Error("save failed");
      }
      setItems((current) => current.filter((item) => !item.selected));
      setReviewing(false);
      setMessage(`已确认 ${selected.length} 件，预计总价 A$${total.toFixed(2)}。当前等待商家履约，尚未扣款。`);
    } catch {
      setMessage("清单提交失败。请确认 purchase_orders migration 已执行后重试。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-[26px] border border-[#d9dfd7] bg-[#fffdf8] shadow-[0_18px_50px_rgba(48,69,56,.07)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e4e9e2] px-5 py-5 sm:px-6">
        <div>
          <p className="eyebrow">AI proactive list</p>
          <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">可能需要购买</h2>
          <p className="mt-2 text-sm text-[#68766d]">根据重复消费与补货类别生成，不进行货比三家。</p>
        </div>
        <button type="button" onClick={() => void enableNotifications()} className="rounded-full border border-[#ccd6cc] px-4 py-2 text-xs font-semibold text-[#365342]">开启购买提醒</button>
      </div>

      <div className="space-y-3 p-5 sm:p-6">
        {items.length ? items.map((item) => (
          <div key={item.id} className={`rounded-[20px] border p-4 ${item.selected ? "border-[#b9cbbb] bg-[#f4f7f1]" : "border-[#e3e6df] bg-white opacity-65"}`}>
            <div className="flex items-start gap-3">
              <input aria-label={`选择 ${item.itemName}`} type="checkbox" checked={item.selected} onChange={(event) => update(item.id, { selected: event.target.checked })} className="mt-1 h-5 w-5 accent-[#1f382b]" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap justify-between gap-2"><strong>{item.itemName}</strong><span className="text-sm text-[#68766d]">{item.reason}</span></div>
                <p className="mt-1 text-xs text-[#7b867f]">{item.merchant || "商家待确认"}</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#68766d]">购买方式
                    <select value={item.method} onChange={(e) => update(item.id, { method: e.target.value as ShoppingItem["method"] })} className="mt-1 w-full rounded-xl border border-[#d8ded6] bg-white px-2 py-2 text-sm normal-case">
                      <option value="delivery">配送</option><option value="pickup">到店自取</option><option value="subscription">定期购</option>
                    </select>
                  </label>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#68766d]">数量
                    <input type="number" min={1} max={99} value={item.quantity} onChange={(e) => update(item.id, { quantity: Math.max(1, Number(e.target.value)) })} className="mt-1 w-full rounded-xl border border-[#d8ded6] bg-white px-2 py-2 text-sm" />
                  </label>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#68766d]">单价 AUD
                    <input type="number" min={0} step="0.01" value={item.unitPrice} onChange={(e) => update(item.id, { unitPrice: Math.max(0, Number(e.target.value)) })} className="mt-1 w-full rounded-xl border border-[#d8ded6] bg-white px-2 py-2 text-sm" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )) : <p className="rounded-2xl border border-dashed border-[#d9dfd7] p-5 text-sm text-[#738078]">暂时没有足够明确的补货信号。继续记录消费后，AI 会在这里整理清单。</p>}

        {items.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e4e9e2] pt-4"><p className="text-sm">已选 {selected.length} 件 · 预计总价 <strong className="text-lg">A${total.toFixed(2)}</strong></p><button disabled={!selected.length} onClick={() => setReviewing(true)} className="rounded-full bg-[#1f382b] px-5 py-3 text-sm font-semibold text-white disabled:opacity-40">确认购买清单</button></div>}
        {message && <p aria-live="polite" className="rounded-2xl bg-[#edf3ed] p-3 text-sm text-[#365342]">{message}</p>}
      </div>

      {reviewing && <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#142019]/55 p-3 backdrop-blur-sm sm:items-center"><div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-[28px] bg-[#fffdf8] p-6 shadow-2xl"><p className="eyebrow">最终确认</p><h3 className="mt-2 text-2xl font-medium">确认这份购买清单？</h3><div className="mt-4 max-h-64 space-y-2 overflow-auto">{selected.map((item) => <div key={item.id} className="flex justify-between rounded-xl bg-[#f1f4ee] p-3 text-sm"><span>{item.itemName} × {item.quantity} · {item.method === "delivery" ? "配送" : item.method === "pickup" ? "自取" : "定期购"}</span><strong>A${(item.unitPrice * item.quantity).toFixed(2)}</strong></div>)}</div><div className="mt-4 flex justify-between text-lg"><span>总价格</span><strong>A${total.toFixed(2)}</strong></div><p className="mt-3 text-xs leading-5 text-[#7a7067]">确认后创建购买请求；目前尚未连接商家支付接口，不会立即扣款。</p><div className="mt-5 grid grid-cols-2 gap-3"><button onClick={() => setReviewing(false)} className="rounded-full border border-[#ccd4cb] px-4 py-3 text-sm font-semibold">返回修改</button><button disabled={submitting} onClick={() => void confirmAll()} className="rounded-full bg-[#c55f38] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{submitting ? "正在提交…" : "确认全部"}</button></div></div></div>}
    </section>
  );
}

