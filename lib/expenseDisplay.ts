export function getMeaningfulItemName(
  itemName?: string | null,
  merchant?: string | null,
) {
  const name = String(itemName || "").trim();
  if (!name) return "";

  const normalized = name.toLowerCase().replace(/[’]/g, "'");
  const normalizedMerchant = String(merchant || "")
    .trim()
    .toLowerCase()
    .replace(/[’]/g, "'");
  const genericNames = [
    "general purchase",
    "untitled item",
    "purchase",
    "expense",
    "food",
    "meal",
    "fast food",
    "takeaway",
    "food delivery",
    "delivery",
  ];

  if (genericNames.includes(normalized)) return "";
  if (/^(eating|dining) out\b/.test(normalized)) return "";
  if (/^(purchase|food|meal|takeaway|delivery) (at|from)\b/.test(normalized)) return "";
  if (normalizedMerchant && normalized === normalizedMerchant) return "";

  return name;
}
