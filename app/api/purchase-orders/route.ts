import { createHash, timingSafeEqual } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/database.types";
import type { PurchaseOrderRequest, PurchaseOrderResponse } from "@/lib/purchaseOrderContracts";

export const runtime = "nodejs";

function confirmationToken(body: Omit<PurchaseOrderRequest, "confirmationToken">) {
  return createHash("sha256")
    .update(JSON.stringify(body))
    .digest("hex");
}

function validString(value: unknown, max: number, required = true) {
  return typeof value === "string" && value.length <= max && (!required || value.trim().length > 0);
}

function isValidRequest(value: unknown): value is PurchaseOrderRequest {
  if (!value || typeof value !== "object") return false;
  const body = value as Record<string, unknown>;
  return (
    validString(body.itemName, 200) &&
    validString(body.merchant, 120) &&
    validString(body.productUrl, 2000, false) &&
    validString(body.deliveryNotes, 500, false) &&
    validString(body.confirmationToken, 64) &&
    typeof body.quantity === "number" &&
    Number.isInteger(body.quantity) &&
    body.quantity >= 1 &&
    body.quantity <= 99 &&
    typeof body.unitPrice === "number" &&
    Number.isFinite(body.unitPrice) &&
    body.unitPrice >= 0 &&
    body.unitPrice <= 1_000_000
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ ok: false, code: "UNAUTHENTICATED" } satisfies PurchaseOrderResponse, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, code: "INVALID_PAYLOAD" } satisfies PurchaseOrderResponse, { status: 400 });
  }
  if (!isValidRequest(body)) {
    return Response.json({ ok: false, code: "INVALID_PAYLOAD" } satisfies PurchaseOrderResponse, { status: 400 });
  }

  const { confirmationToken: suppliedToken, ...confirmedDetails } = body;
  const expectedToken = confirmationToken(confirmedDetails);
  const supplied = Buffer.from(suppliedToken, "utf8");
  const expected = Buffer.from(expectedToken, "utf8");
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return Response.json({ ok: false, code: "INVALID_CONFIRMATION" } satisfies PurchaseOrderResponse, { status: 409 });
  }

  const insert: TablesInsert<"purchase_orders"> = {
    user_id: user.id,
    item_name: body.itemName.trim(),
    merchant: body.merchant.trim(),
    product_url: body.productUrl.trim() || null,
    quantity: body.quantity,
    unit_price: body.unitPrice,
    total_price: body.unitPrice * body.quantity,
    delivery_notes: body.deliveryNotes.trim() || null,
    status: "confirmed_pending_fulfilment",
    confirmed_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("purchase_orders").insert(insert).select("id").single();
  if (error) {
    const code = error.code === "PGRST204" || error.code === "PGRST205" ? "SCHEMA_OUTDATED" : "DATABASE_WRITE_FAILED";
    return Response.json({ ok: false, code } satisfies PurchaseOrderResponse, { status: 500 });
  }
  return Response.json({ ok: true, orderId: data.id, status: "confirmed_pending_fulfilment" } satisfies PurchaseOrderResponse);
}

