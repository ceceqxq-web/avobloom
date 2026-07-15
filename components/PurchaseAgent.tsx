"use client";

import { useMemo, useState } from "react";
import type { PurchaseOrderRequest, PurchaseOrderResponse } from "@/lib/purchaseOrderContracts";

type Draft = Omit<PurchaseOrderRequest, "confirmationToken">;

async function hashDraft(draft: Draft) {
  const bytes = new TextEncoder().encode(JSON.stringify(draft));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export default function PurchaseAgent() {
  const [draft, setDraft] = useState<Draft>({ itemName: "", merchant: "", productUrl: "", quantity: 1, unitPrice: 0, deliveryNotes: "" });
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const total = useMemo(() => draft.quantity * draft.unitPrice, [draft.quantity, draft.unitPrice]);
  const inputClass = "w-full rounded-2xl border border-[#d8ded6] bg-white px-4 py-3 text-sm outline-none focus:border-[#1f382b]";

  function patch(values: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...values }));
    setMessage("");
  }

  async function confirmOrder() {
    setIsSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, confirmationToken: await hashDraft(draft) }),
      });
      const result = (await response.json()) as PurchaseOrderResponse;
      if (!response.ok || !result.ok) {
        setMessage(!result.ok && result.code === "SCHEMA_OUTDATED" ? "订单表尚未安装，请先运行最新 Supabase migration。" : "提交失败，请检查信息后重试。");
        return;
      }
      setIsReviewing(false);
      setMessage(`请求已确认（${result.orderId.slice(0, 8)}）。当前等待商家履约，尚未扣款。`);
      setDraft({ itemName: "", merchant: "", productUrl: "", quantity: 1, unitPrice: 0, deliveryNotes: "" });
    } catch {
      setMessage("网络连接失败，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-[26px] border border-[#d9dfd7] bg-white/90 shadow-[0_18px_50px_rgba(48,69,56,.07)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e4e9e2] px-5 py-5 sm:px-6">
        <div>
          <p className="eyebrow">Quick buy · 不比价</p>
          <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">直接帮我买</h2>
          <p className="mt-2 text-sm text-[#68766d]">指定商品与商家，确认摘要后才提交代下单请求。</p>
        </div>
        <span className="rounded-full bg-[#fbede6] px-3 py-1.5 text-xs font-semibold text-[#a84d2d]">确认前不会下单</span>
      </div>
      <form className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6" onSubmit={(event) => { event.preventDefault(); setIsReviewing(true); }}>
        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#68766d]">商品
          <input className={`${inputClass} mt-2`} required maxLength={200} placeholder="例如：黑色咖啡豆 1kg" value={draft.itemName} onChange={(e) => patch({ itemName: e.target.value })} />
        </label>
        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#68766d]">指定商家
          <input className={`${inputClass} mt-2`} required maxLength={120} placeholder="例如：Market Lane" value={draft.merchant} onChange={(e) => patch({ merchant: e.target.value })} />
        </label>
        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#68766d]">商品链接（可选）
          <input className={`${inputClass} mt-2`} type="url" maxLength={2000} placeholder="https://…" value={draft.productUrl} onChange={(e) => patch({ productUrl: e.target.value })} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#68766d]">数量
            <input className={`${inputClass} mt-2`} type="number" min={1} max={99} required value={draft.quantity} onChange={(e) => patch({ quantity: Number(e.target.value) })} />
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#68766d]">单价 AUD
            <input className={`${inputClass} mt-2`} type="number" min={0} max={1000000} step="0.01" required value={draft.unitPrice} onChange={(e) => patch({ unitPrice: Number(e.target.value) })} />
          </label>
        </div>
        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#68766d] sm:col-span-2">配送说明（可选）
          <textarea className={`${inputClass} mt-2 min-h-20 resize-y`} maxLength={500} placeholder="地址偏好、送达时间或规格要求；不要填写银行卡信息。" value={draft.deliveryNotes} onChange={(e) => patch({ deliveryNotes: e.target.value })} />
        </label>
        <div className="flex items-center justify-between gap-4 sm:col-span-2">
          <p className="text-sm text-[#68766d]">预计商品总额 <strong className="text-[#1f382b]">A${total.toFixed(2)}</strong></p>
          <button className="rounded-full bg-[#1f382b] px-5 py-3 text-sm font-semibold text-white hover:bg-[#294837]" type="submit">查看并确认</button>
        </div>
        {message && <p aria-live="polite" className="rounded-2xl bg-[#edf3ed] p-3 text-sm text-[#365342] sm:col-span-2">{message}</p>}
      </form>

      {isReviewing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#142019]/55 p-3 backdrop-blur-sm sm:items-center" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsReviewing(false); }}>
          <div aria-labelledby="order-review-title" aria-modal="true" className="w-full max-w-lg rounded-[28px] bg-[#fffdf8] p-6 shadow-2xl" role="dialog">
            <p className="eyebrow">最终确认</p>
            <h3 id="order-review-title" className="mt-2 text-2xl font-medium">确认提交这笔代下单请求？</h3>
            <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 rounded-2xl bg-[#f1f4ee] p-4 text-sm">
              <dt className="text-[#68766d]">商品</dt><dd className="text-right font-semibold">{draft.itemName}</dd>
              <dt className="text-[#68766d]">商家</dt><dd className="text-right font-semibold">{draft.merchant}</dd>
              <dt className="text-[#68766d]">数量</dt><dd className="text-right">{draft.quantity}</dd>
              <dt className="text-[#68766d]">商品总额</dt><dd className="text-right text-lg font-semibold">A${total.toFixed(2)}</dd>
            </dl>
            <p className="mt-4 text-xs leading-5 text-[#7a7067]">点击确认只会创建已授权的下单请求；当前版本尚未连接商家支付接口，因此不会扣款，也不会声称商家订单已成功。</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button className="rounded-full border border-[#ccd4cb] px-4 py-3 text-sm font-semibold" type="button" onClick={() => setIsReviewing(false)}>返回修改</button>
              <button className="rounded-full bg-[#c55f38] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={isSubmitting} type="button" onClick={() => void confirmOrder()}>{isSubmitting ? "正在提交…" : "确认提交"}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

