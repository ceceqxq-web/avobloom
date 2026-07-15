import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/database.types";

const editableColumns = new Set([
  "merchant", "item_name", "purchase_price", "expense_date", "category", "financial_type",
  "current_estimated_value", "net_worth_impact", "brand", "brand_positioning",
  "consumption_rate", "market_price_low", "market_price_high", "price_confidence",
  "price_estimate_source", "price_reasoning", "ai_confidence", "ai_summary",
]);

const optionalLegacyColumns = new Set([
  "current_estimated_value", "net_worth_impact", "brand", "brand_positioning",
  "consumption_rate", "market_price_low", "market_price_high", "price_confidence",
  "price_estimate_source", "price_reasoning", "ai_confidence", "ai_summary",
]);

function missingSchemaColumn(message: string) {
  return message.match(/Could not find the '([^']+)' column/i)?.[1];
}

function validUpdate(value: unknown): value is TablesUpdate<"expenses"> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  return entries.length > 0 && entries.every(([key, field]) =>
    editableColumns.has(key) &&
    field !== undefined &&
    (field === null || ["string", "number"].includes(typeof field)),
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ ok: false, error: "Login expired." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid expense data." }, { status: 400 });
  }
  if (!validUpdate(body)) {
    return Response.json({ ok: false, error: "Invalid expense data." }, { status: 400 });
  }

  const { id } = await params;
  let payload = { ...body };
  for (let attempt = 0; attempt <= optionalLegacyColumns.size; attempt += 1) {
    const result = await supabase
      .from("expenses")
      .update(payload)
      .eq("id", id)
      .eq("user_id", user.id);
    if (!result.error) {
      revalidatePath("/");
      revalidatePath("/expenses");
      revalidatePath("/reports");
      return Response.json({ ok: true });
    }

    const missing = missingSchemaColumn(result.error.message);
    if (result.error.code === "PGRST204" && missing && optionalLegacyColumns.has(missing)) {
      const next = { ...payload } as Record<string, unknown>;
      delete next[missing];
      payload = next as TablesUpdate<"expenses">;
      continue;
    }

    const detail = missing
      ? `Database column “${missing}” is unavailable.`
      : `Database rejected the update (code ${result.error.code || "unknown"}).`;
    return Response.json({ ok: false, error: detail }, { status: 500 });
  }

  return Response.json({ ok: false, error: "The expense could not be updated." }, { status: 500 });
}

