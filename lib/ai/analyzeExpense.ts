import {
  ExpenseAnalysis,
  ExpenseAnalysisResult,
  FinancialType,
  calculateNetWorthImpact,
  financialTypes,
  recurrenceFrequencies,
} from "@/lib/expenseTypes";

type AnalyzeExpenseInput = {
  rawText?: string;
  merchant?: string;
  itemName?: string;
  price?: number;
  category?: string;
  imageBase64?: string;
  imageMimeType?: string;
};

const categoryKeywords: Array<[string, string[]]> = [
  [
    "Clothing > Apparel",
    ["shirt", "dress", "top", "pants", "jeans", "uniqlo", "zara"],
  ],
  [
    "Clothing > Activewear",
    ["gym", "activewear", "workout", "leggings", "sports bra", "nike", "adidas"],
  ],
  [
    "Clothing > Footwear",
    ["shoe", "shoes", "slipper", "slippers", "sneaker", "boot", "boots", "ugg"],
  ],
  [
    "Home > Bedding",
    [
      "quilt",
      "cover",
      "pillow",
      "枕套",
      "被套",
      "床品",
      "adairs",
    ],
  ],
  [
    "Home > Kitchen & Dining",
    ["teapot", "cup", "mug", "plate", "bowl", "drinkware", "tableware", "dining"],
  ],
  [
    "Home > Bathroom",
    ["bathroom", "bathroom scale", "scale", "towel", "bath mat"],
  ],
  [
    "Home > Furniture",
    ["sofa", "chair", "desk", "table", "cabinet", "ikea"],
  ],
  ["Electronics", ["iphone", "macbook", "laptop", "camera", "headphone"]],
  ["Food & Drink", ["coffee", "lunch", "dinner", "restaurant", "cafe", "meal"]],
  [
    "Accommodation > Hotel stays",
    ["hotel", "accommodation", "stay", "mercure", "airbnb", "酒店", "住宿"],
  ],
  ["Accommodation > Rent", ["rent", "housing", "apartment", "房租", "公寓", "租金"]],
  ["Transport", ["uber", "train", "metro", "flight", "taxi", "fuel"]],
  ["Subscription", ["subscription", "netflix", "spotify", "membership"]],
  ["Investment", ["stock", "etf", "bond", "crypto", "fund"]],
];

const ongoingKeywords = [
  "subscription",
  "weekly",
  "monthly",
  "membership",
  "rent",
  "insurance",
  "每周",
  "周租",
  "月卡",
  "包月",
];
const assetKeywords = [
  "iphone",
  "macbook",
  "laptop",
  "camera",
  "watch",
  "bag",
  "sofa",
  "chair",
  "table",
  "jewelry",
];
const investmentKeywords = ["stock", "etf", "bond", "crypto", "fund", "shares"];

const brandProfiles: Record<
  string,
  {
    brand_positioning: string;
    categoryHint?: string;
  }
> = {
  adairs: {
    brand_positioning: "Mid-market to premium homewares",
    categoryHint: "Home > Homewares",
  },
  ikea: {
    brand_positioning: "Budget to mid-market homewares",
    categoryHint: "Home > Furniture",
  },
  apple: {
    brand_positioning: "Premium electronics",
    categoryHint: "Electronics",
  },
  uniqlo: {
    brand_positioning: "Mid-market apparel",
    categoryHint: "Clothing > Apparel",
  },
  zara: {
    brand_positioning: "Mid-market fashion",
    categoryHint: "Clothing > Apparel",
  },
};

function getBrandProfile(brand: string) {
  return brandProfiles[brand.toLowerCase()];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function normaliseFinancialType(value: unknown): FinancialType {
  if (typeof value === "string" && financialTypes.includes(value as FinancialType)) {
    return value as FinancialType;
  }

  return "expense";
}

function normaliseCategory(value: unknown, itemName?: unknown) {
  const rawCategory = String(value || "").trim();
  const itemText = String(itemName || "").toLowerCase();
  const categoryText = rawCategory.toLowerCase();
  const combinedText = `${categoryText} ${itemText}`;

  if (!rawCategory) return "Uncategorized";

  if (
    combinedText.includes("fast food") ||
    combinedText.includes("dining out / fast food") ||
    combinedText.includes("eating out") ||
    combinedText.includes("mcdonald") ||
    combinedText.includes("mcwings") ||
    combinedText.includes("burger") ||
    combinedText.includes("takeaway")
  ) {
    return "Food & Drink > Fast Food";
  }

  if (
    combinedText.includes("cafe") ||
    combinedText.includes("café") ||
    combinedText.includes("coffee")
  ) {
    return "Food & Drink > Cafés & Coffee";
  }

  if (
    combinedText.includes("grocer") ||
    combinedText.includes("supermarket")
  ) {
    return "Food & Drink > Groceries";
  }

  if (combinedText.includes("restaurant") || combinedText.includes("dining out")) {
    return "Food & Drink > Dining Out";
  }

  if (
    combinedText.includes("activewear") ||
    combinedText.includes("gym") ||
    combinedText.includes("workout") ||
    combinedText.includes("leggings")
  ) {
    return "Clothing > Activewear";
  }

  if (
    combinedText.includes("footwear") ||
    combinedText.includes("shoe") ||
    combinedText.includes("slipper") ||
    combinedText.includes("sneaker") ||
    combinedText.includes("boot") ||
    combinedText.includes("ugg")
  ) {
    return "Clothing > Footwear";
  }

  if (
    combinedText.includes("clothing") ||
    combinedText.includes("fashion") ||
    combinedText.includes("apparel") ||
    combinedText.includes("shirt") ||
    combinedText.includes("dress") ||
    combinedText.includes("top") ||
    combinedText.includes("pants") ||
    combinedText.includes("jeans")
  ) {
    return "Clothing > Apparel";
  }

  if (
    combinedText.includes("bedding") ||
    combinedText.includes("quilt") ||
    combinedText.includes("pillow") ||
    combinedText.includes("枕套") ||
    combinedText.includes("被套") ||
    combinedText.includes("床品")
  ) {
    return "Home > Bedding";
  }

  if (
    combinedText.includes("drinkware") ||
    combinedText.includes("tableware") ||
    combinedText.includes("dining") ||
    combinedText.includes("teapot") ||
    combinedText.includes("cup") ||
    combinedText.includes("mug") ||
    combinedText.includes("plate") ||
    combinedText.includes("bowl")
  ) {
    return "Home > Kitchen & Dining";
  }

  if (
    combinedText.includes("bathroom") ||
    combinedText.includes("bath mat") ||
    combinedText.includes("towel") ||
    combinedText.includes("scale")
  ) {
    return "Home > Bathroom";
  }

  if (
    combinedText.includes("household") ||
    combinedText.includes("homewares") ||
    combinedText.includes("home & garden") ||
    combinedText.includes("home and garden") ||
    combinedText.includes("furniture") ||
    combinedText.includes("sofa") ||
    combinedText.includes("chair") ||
    combinedText.includes("cabinet")
  ) {
    return "Home > Homewares";
  }

  if (
    combinedText.includes("rent") ||
    combinedText.includes("housing") ||
    combinedText.includes("apartment") ||
    combinedText.includes("房租") ||
    combinedText.includes("公寓") ||
    combinedText.includes("租金")
  ) {
    return "Accommodation > Rent";
  }

  if (
    combinedText.includes("hotel") ||
    combinedText.includes("accommodation") ||
    combinedText.includes("stay") ||
    combinedText.includes("mercure") ||
    combinedText.includes("airbnb") ||
    combinedText.includes("酒店") ||
    combinedText.includes("住宿")
  ) {
    return "Accommodation > Hotel stays";
  }

  return rawCategory;
}

function normaliseExpenseDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return date.toISOString().slice(0, 10);
}

function normaliseRecurrenceFrequency(value: unknown, rawText = "") {
  const text = `${String(value || "")} ${rawText}`.toLowerCase();

  if (/每周|周租|weekly|per\s+week|\/week|a\s+week/.test(text)) {
    return "weekly";
  }

  if (/每月|月租|monthly|per\s+month|\/month|a\s+month|包月|月卡/.test(text)) {
    return "monthly";
  }

  return undefined;
}

function deriveBrandPositioning(value: unknown, consumptionRate: number) {
  const raw = String(value || "").trim();

  if (raw && raw.toLowerCase() !== "unknown") return raw;

  if (consumptionRate >= 10) return "luxury";
  if (consumptionRate >= 7) return "premium";
  if (consumptionRate >= 4) return "mid-market";
  return "budget";
}

function normaliseAnalysis(value: Partial<ExpenseAnalysis>): ExpenseAnalysis {
  const purchasePrice = Number(value.purchase_price || 0);
  const currentEstimatedValue = Number(value.current_estimated_value || 0);
  const financialType = normaliseFinancialType(value.financial_type);
  const normalisedEstimatedValue = Number.isFinite(currentEstimatedValue)
    ? currentEstimatedValue
    : 0;
  const consumptionRate = clamp(Number(value.consumption_rate || 5), 1, 10);
  const recurrenceFrequency = normaliseRecurrenceFrequency(value.recurrence_frequency);

  return {
    merchant: String(value.merchant || "Unknown"),
    item_name: String(value.item_name || ""),
    purchase_price: Number.isFinite(purchasePrice) ? purchasePrice : 0,
    expense_date: normaliseExpenseDate(value.expense_date),
    category: normaliseCategory(value.category, value.item_name),
    financial_type: financialType,
    current_estimated_value: normalisedEstimatedValue,
    net_worth_impact: calculateNetWorthImpact(financialType, normalisedEstimatedValue),
    brand: String(value.brand || value.merchant || "Unknown"),
    brand_positioning: deriveBrandPositioning(value.brand_positioning, consumptionRate),
    consumption_rate: consumptionRate,
    market_price_low: Math.max(Number(value.market_price_low || 0), 0),
    market_price_high: Math.max(Number(value.market_price_high || 0), 0),
    price_confidence: clamp(Number(value.price_confidence || 0.4), 0, 1),
    price_estimate_source: String(value.price_estimate_source || "Not researched"),
    price_reasoning: String(
      value.price_reasoning ||
        "No external price benchmark was available for this estimate.",
    ),
    ai_confidence: clamp(Number(value.ai_confidence || 0.55), 0, 1),
    ai_summary: String(
      value.ai_summary ||
        "AI prepared an initial classification. Please review before saving.",
    ),
    recurrence_frequency:
      financialType === "ongoing_cost"
        ? recurrenceFrequency || "monthly"
        : "none",
    recurring_start_date:
      normaliseExpenseDate(value.recurring_start_date) ||
      normaliseExpenseDate(value.expense_date),
  };
}

function normaliseResult(value: Partial<ExpenseAnalysisResult>): ExpenseAnalysisResult {
  const items = Array.isArray(value.items)
    ? value.items.map((item) => normaliseAnalysis(item))
    : [];
  const totalPrice =
    Number(value.total_price) ||
    items.reduce((sum, item) => sum + item.purchase_price, 0);

  return {
    items: items.length
      ? items
      : [
          normaliseAnalysis({
            item_name: "General purchase",
          }),
        ],
    total_price: totalPrice,
    ai_summary: String(
      value.ai_summary ||
        (items.length > 1
          ? `Split this purchase into ${items.length} expense items.`
          : "Prepared one expense item."),
    ),
  };
}

function guessBrand(text: string, merchant?: string) {
  if (merchant?.trim()) return merchant.trim();

  const knownBrands = [
    "Adairs",
    "IKEA",
    "Apple",
    "Nike",
    "Adidas",
    "Uniqlo",
    "Zara",
    "Amazon",
    "Woolworths",
    "Coles",
    "Spotify",
    "Netflix",
    "Mercure",
  ];
  const match = knownBrands.find((brand) =>
    text.toLowerCase().includes(brand.toLowerCase()),
  );

  return match || "Unknown";
}

function estimateFallbackMarketPrice(itemName: string, brand: string) {
  const text = `${itemName} ${brand}`.toLowerCase();

  if (brand.toLowerCase() === "adairs") {
    if (text.includes("pillow") || text.includes("枕套")) {
      return {
        low: 35,
        high: 80,
        source: "Local brand profile",
      };
    }

    if (text.includes("quilt cover") || text.includes("被套")) {
      return {
        low: 120,
        high: 240,
        source: "Local brand profile",
      };
    }

    return {
      low: 40,
      high: 220,
      source: "Local brand profile",
    };
  }

  return {
    low: 0,
    high: 0,
    source: "User-provided text only",
  };
}

function allocatePricesFromMarketRanges(itemNames: string[], totalPrice: number, brand: string) {
  const ranges = itemNames.map((name) => estimateFallbackMarketPrice(name, brand));
  const midpointTotal = ranges.reduce(
    (sum, range) => sum + (range.low + range.high) / 2,
    0,
  );

  if (!totalPrice || !midpointTotal) {
    return itemNames.map(() => totalPrice || 0);
  }

  let allocatedTotal = 0;
  return itemNames.map((name, index) => {
    if (index === itemNames.length - 1) {
      return Math.round((totalPrice - allocatedTotal) * 100) / 100;
    }

    const range = ranges[index];
    const midpoint = (range.low + range.high) / 2;
    const price = Math.round(((midpoint / midpointTotal) * totalPrice) * 100) / 100;
    allocatedTotal += price;
    return price;
  });
}

function inferYearForParsedDate(month: number, day: number) {
  const now = new Date();
  const parsed = new Date(now.getFullYear(), month - 1, day);

  if (parsed.getTime() - now.getTime() > 30 * 24 * 60 * 60 * 1000) {
    parsed.setFullYear(parsed.getFullYear() - 1);
  }

  return parsed.toISOString().slice(0, 10);
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function inferYearForRange(month: number, day: number) {
  const now = new Date();
  const parsed = new Date(now.getFullYear(), month - 1, day);

  if (parsed.getTime() - now.getTime() > 180 * 24 * 60 * 60 * 1000) {
    parsed.setFullYear(parsed.getFullYear() - 1);
  }

  return parsed.getFullYear();
}

function enumerateDates(start: Date, end: Date, includeEnd: boolean) {
  const dates: string[] = [];
  const current = new Date(start);

  while ((includeEnd ? current <= end : current < end) && dates.length < 90) {
    dates.push(formatLocalDate(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function extractDailyRange(rawText: string) {
  const text = rawText.trim();
  const hasDailySignal = /每日|每天|每晚|daily|per\s+day|per\s+night/i.test(text);
  const isAccommodationNightly =
    /每晚|per\s+night|hotel|accommodation|酒店|住宿|入住|退房/i.test(text);

  if (!hasDailySignal) return undefined;

  const rangeMatch = text.match(
    /(?:从\s*)?(\d{1,2})[/.月-](\d{1,2})(?:日)?\s*(?:-|–|—|~|到|至)\s*(?:(\d{1,2})[/.月-])?(\d{1,2})(?:日)?/,
  );

  if (!rangeMatch) return undefined;

  const [, startMonthRaw, startDayRaw, endMonthRaw, endDayRaw] = rangeMatch;
  const startMonth = Number(startMonthRaw);
  const startDay = Number(startDayRaw);
  const endMonth = Number(endMonthRaw || startMonthRaw);
  const endDay = Number(endDayRaw);
  const year = inferYearForRange(startMonth, startDay);
  const start = new Date(year, startMonth - 1, startDay);
  let end = new Date(year, endMonth - 1, endDay);

  if (end < start) {
    end = new Date(year + 1, endMonth - 1, endDay);
  }

  const unitPriceMatch =
    text.match(/(?:每日|每天|每晚|daily|per\s+day|per\s+night)[^\d]*(\d+(?:\.\d{1,2})?)/i) ||
    text.match(/(\d+(?:\.\d{1,2})?)\s*(?:澳元|aud|\$)?\s*(?:每日|每天|每晚|daily|per\s+day|per\s+night)/i);
  const unitPrice = Number(unitPriceMatch?.[1] || 0);

  if (!unitPrice) return undefined;

  const dates = enumerateDates(start, end, !isAccommodationNightly);
  if (dates.length < 2) return undefined;

  return {
    dates,
    unitPrice,
    unitLabel: isAccommodationNightly ? "night" : "day",
  };
}

function extractFallbackExpenseDate(rawText: string) {
  const text = rawText.trim();
  const isoMatch = text.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return normaliseExpenseDate(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
  }

  const auMatch = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2}|\d{2})\b/);
  if (auMatch) {
    const [, day, month, rawYear] = auMatch;
    const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
    return normaliseExpenseDate(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
  }

  const zhMatch = text.match(/(20\d{2})年\s*(\d{1,2})月\s*(\d{1,2})日/);
  if (zhMatch) {
    const [, year, month, day] = zhMatch;
    return normaliseExpenseDate(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
  }

  const monthDayMatch = text.match(/\b(\d{1,2})[-/.](\d{1,2})\b/);
  if (monthDayMatch) {
    const [, first, second] = monthDayMatch;
    const firstNumber = Number(first);
    const secondNumber = Number(second);
    const month = secondNumber > 12 ? firstNumber : secondNumber;
    const day = secondNumber > 12 ? secondNumber : firstNumber;

    return inferYearForParsedDate(month, day);
  }

  return undefined;
}

function getFallbackConsumptionRate(
  price: number,
  brandProfile: { brand_positioning: string } | undefined,
) {
  const positioning = brandProfile?.brand_positioning.toLowerCase() || "";

  if (positioning.includes("luxury")) return 10;
  if (positioning.includes("premium")) return Math.max(price > 250 ? 8 : 7, 7);
  if (positioning.includes("mid-market")) return price > 80 ? 5 : 4;

  if (price <= 20) return 2;
  if (price <= 80) return 4;
  if (price <= 250) return 6;
  if (price <= 1000) return 8;
  return 10;
}

export function fallbackAnalyzeExpense(input: AnalyzeExpenseInput): ExpenseAnalysis {
  return fallbackAnalyzeExpenses(input).items[0];
}

function splitItemNames(rawText: string, itemName?: string) {
  const source = itemName || rawText;
  const purchaseMatch =
    source.match(/买了(.+?)(?:总共|一共|共花|花费|合计|花了|$)/) ||
    source.match(/买了(.+?)(?:。|\.|，|,|两个|两件|$)/) ||
    source.match(/bought\s+(.+?)(?:\.|,| for | total |$)/i);
  const itemText = (purchaseMatch?.[1] || source)
    .replace(/一个/g, "")
    .replace(/两个/g, "")
    .replace(/一套/g, "")
    .replace(/一件/g, "")
    .replace(/同材质的/g, "")
    .replace(/同款的/g, "")
    .replace(/同系列的/g, "")
    .replace(/总共.*$/g, "")
    .replace(/一共.*$/g, "")
    .replace(/花费.*$/g, "")
    .replace(/\bone\b/gi, "")
    .replace(/\bat\s+\w+/gi, "")
    .trim();

  const parts = itemText
    .split(/\s*(?:以及|和|、|&|\band\b|\+)\s*/i)
    .map((part) =>
      part
        .replace(/[。.,，]/g, "")
        .replace(/^的/, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((part) => part.length > 1);

  return parts.length > 1 ? parts : [itemName || rawText || "General purchase"];
}

function expandRecurringRangeIfNeeded(
  result: ExpenseAnalysisResult,
  input: AnalyzeExpenseInput,
) {
  const dailyRange = extractDailyRange(input.rawText || "");

  if (!dailyRange || result.items.length === dailyRange.dates.length) return result;
  if (result.items.length !== 1) return result;

  const baseItem = result.items[0];
  const rawText = input.rawText || "";
  const isAccommodation = /hotel|accommodation|stay|酒店|住宿/i.test(rawText);
  const baseItemName = isAccommodation
    ? `Accommodation (${dailyRange.unitLabel}ly rate) — ${baseItem.brand || baseItem.merchant || "Hotel"}`
    : baseItem.item_name || "Recurring daily expense";
  const expandedItems = dailyRange.dates.map((date, index) =>
    normaliseAnalysis({
      ...baseItem,
      item_name: `${baseItemName} (${index + 1}/${dailyRange.dates.length})`,
      purchase_price: dailyRange.unitPrice,
      expense_date: date,
      category: normaliseCategory(
        baseItem.category || "Accommodation > Hotel stays",
        baseItem.item_name,
      ),
      financial_type: "expense",
      current_estimated_value: 0,
      net_worth_impact: 0,
      market_price_low: dailyRange.unitPrice,
      market_price_high: dailyRange.unitPrice,
      price_confidence: Math.max(Number(baseItem.price_confidence || 0), 0.8),
      price_estimate_source: `User-stated ${dailyRange.unitLabel}ly rate`,
      price_reasoning: `User stated a ${dailyRange.unitLabel}ly rate of ${dailyRange.unitPrice} across a fixed ${dailyRange.dates.length}-${dailyRange.unitLabel} range, so the range was expanded into separate expense entries.`,
      ai_confidence: Math.max(Number(baseItem.ai_confidence || 0), 0.8),
      ai_summary: `Expanded from a fixed date range into ${dailyRange.dates.length} ${dailyRange.unitLabel}ly expense entries.`,
    }),
  );

  return {
    items: expandedItems,
    total_price: Math.round(dailyRange.unitPrice * dailyRange.dates.length * 100) / 100,
    ai_summary: `Detected a fixed ${dailyRange.unitLabel === "night" ? "nightly accommodation" : "daily"} expense across ${dailyRange.dates.length} ${dailyRange.unitLabel}s and prepared one expense entry per ${dailyRange.unitLabel}.`,
  };
}

function applyInputDerivedRecurringMetadata(
  result: ExpenseAnalysisResult,
  input: AnalyzeExpenseInput,
) {
  const rawText = input.rawText || "";
  const inferredFrequency = normaliseRecurrenceFrequency(undefined, rawText);
  const inferredStartDate = extractFallbackExpenseDate(rawText);

  if (!inferredFrequency && !inferredStartDate) return result;

  return {
    ...result,
    items: result.items.map((item) => {
      if (item.financial_type !== "ongoing_cost") return item;

      return {
        ...item,
        recurrence_frequency: inferredFrequency || item.recurrence_frequency,
        recurring_start_date: inferredStartDate || item.recurring_start_date || item.expense_date,
        expense_date: inferredStartDate || item.expense_date,
      };
    }),
  };
}

export function fallbackAnalyzeExpenses(input: AnalyzeExpenseInput): ExpenseAnalysisResult {
  const rawText = input.rawText || "";
  const text = `${rawText} ${input.merchant || ""} ${input.itemName || ""}`.toLowerCase();
  const totalPriceMatch =
    rawText.match(/(?:总共|一共|共花|花费|total)[^\d]*(\d+(?:\.\d{1,2})?)/i) ||
    rawText.match(/\$?\s*(\d+(?:\.\d{1,2})?)/);
  const purchasePrice = Number(input.price || totalPriceMatch?.[1] || 0);
  const itemNames = splitItemNames(rawText, input.itemName);
  const brand = guessBrand(rawText, input.merchant);
  const expenseDate = extractFallbackExpenseDate(rawText);
  const brandProfile = getBrandProfile(brand);
  const allocatedPrices =
    itemNames.length > 1
      ? allocatePricesFromMarketRanges(itemNames, purchasePrice, brand)
      : [purchasePrice];
  const inferCategory = (itemName: string) => {
    const itemText = `${itemName} ${text}`.toLowerCase();

    return normaliseCategory(
      input.category ||
        categoryKeywords.find(([, words]) => words.some((word) => itemText.includes(word)))?.[0] ||
        brandProfile?.categoryHint ||
        "Uncategorized",
      itemName,
    );
  };

  let financialType: FinancialType = "expense";
  if (investmentKeywords.some((word) => text.includes(word))) {
    financialType = "investment";
  } else if (ongoingKeywords.some((word) => text.includes(word))) {
    financialType = "ongoing_cost";
  } else if (assetKeywords.some((word) => text.includes(word))) {
    financialType = "value_asset";
  }

  const items = itemNames.map((name, index) => {
    const itemPrice = allocatedPrices[index] || 0;
    const rate = getFallbackConsumptionRate(itemPrice, brandProfile);
    const marketPrice = estimateFallbackMarketPrice(name, brand);
    const estimatedValue =
      financialType === "investment"
        ? itemPrice
        : financialType === "value_asset"
          ? Math.round(itemPrice * 0.45 * 100) / 100
          : 0;
    const usedLocalMarketProfile = marketPrice.low > 0 || Boolean(brandProfile);

    return normaliseAnalysis({
      merchant: input.merchant || brand,
      item_name: name,
      purchase_price: itemPrice,
      expense_date: expenseDate,
      category: inferCategory(name),
      financial_type: financialType,
      current_estimated_value: estimatedValue,
      brand,
      brand_positioning: brandProfile?.brand_positioning || "Unknown",
      consumption_rate: rate,
      market_price_low: marketPrice.low || itemPrice,
      market_price_high: marketPrice.high || itemPrice,
      price_confidence: usedLocalMarketProfile ? 0.45 : 0.25,
      price_estimate_source: marketPrice.source,
      price_reasoning:
        usedLocalMarketProfile && itemNames.length > 1
          ? "OpenAI web search was not available, so a local brand profile and item type price ranges were used to split the total. Consumption tier reflects the item's price band and brand tier. Please review before saving."
          : itemNames.length > 1
            ? "OpenAI web search was not available, so the total was split evenly. Adjust item prices after review."
            : "OpenAI web search was not available, so the entered or detected price was used.",
      ai_confidence: 0.45,
      ai_summary:
        itemNames.length > 1
          ? `Local fallback split ${purchasePrice} across ${itemNames.length} items. Please adjust each item price if needed.`
          : "Local fallback estimate. Add OPENAI_API_KEY for stronger brand, category and value analysis.",
      recurrence_frequency: normaliseRecurrenceFrequency(undefined, rawText),
      recurring_start_date: expenseDate,
    });
  });

  const result = {
    items,
    total_price: purchasePrice,
    ai_summary:
      itemNames.length > 1
        ? `Detected ${itemNames.length} purchasable items and prepared separate expense rows. Local fallback was used because OPENAI_API_KEY is not configured.`
        : "Prepared one expense item. Local fallback was used because OPENAI_API_KEY is not configured.",
  };

  return applyInputDerivedRecurringMetadata(expandRecurringRangeIfNeeded(result, input), input);
}

function extractResponseText(data: {
  output_text?: string;
  output?: Array<{ content?: Array<{ text?: string }> }>;
}) {
  if (data.output_text) return data.output_text;

  return data.output
    ?.flatMap((item) => item.content || [])
    .map((content) => content.text)
    .find(Boolean);
}

export async function analyzeExpense(input: AnalyzeExpenseInput) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    if (input.imageBase64) {
      throw new Error(
        "Image analysis requires OPENAI_API_KEY. Local fallback cannot read receipt images.",
      );
    }

    return fallbackAnalyzeExpenses(input);
  }

  const fallback = fallbackAnalyzeExpenses(input);
  const shouldSearch = process.env.OPENAI_DISABLE_WEB_SEARCH !== "true";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.5",
      ...(shouldSearch
        ? {
            tools: [
              {
                type: "web_search",
                search_context_size: "low",
                user_location: {
                  type: "approximate",
                  country: process.env.OPENAI_SEARCH_COUNTRY || "AU",
                  city: process.env.OPENAI_SEARCH_CITY || "Melbourne",
                  region: process.env.OPENAI_SEARCH_REGION || "Victoria",
                },
              },
            ],
            tool_choice: "auto",
          }
        : {}),
      input: [
        {
          role: "system",
          content:
            "You classify personal expenses for an expense tracker. Return only valid JSON that matches the requested schema. Keep merchant and item_name strictly separate: merchant is the store or provider, while item_name is only the specific product or service explicitly stated by the user or visible on a receipt. If the user only says they ate at or ordered from a merchant without naming the food, return item_name as an empty string; never invent labels such as Eating out (Merchant), General purchase, Meal, Takeaway, or Fast food as the item name. If the user provides an image, read visible receipt, product, merchant, item, transaction date and price information from it. If the user mentions a purchase date in text, use that purchase date. expense_date must be the actual purchase/receipt date in YYYY-MM-DD, not the data entry date; use an empty string only when no date is visible or stated. If the user bought multiple distinct items in one transaction, split them into separate items. If the user gives a fixed date range with a daily/per-night/per-day amount, expand it into one item per charged date in the range, using the daily amount for each item and financial_type expense. For hotel or accommodation stays, treat the end date as checkout and do not charge the checkout date by default, so 7/5-7/17 is 12 nights unless the user explicitly says the end date is also charged. Only use financial_type ongoing_cost for open-ended or automatically recurring subscriptions, weekly/monthly rent, monthly cards, memberships, insurance, or repeating weekly/monthly spend. If the user says 每周, weekly, per week, /week, or weekly rent, recurrence_frequency must be weekly. If the user says 每月, monthly, per month, /month, monthly card, or monthly subscription, recurrence_frequency must be monthly. For non-recurring items, recurrence_frequency must be none and recurring_start_date should be empty. Use web search when it would help estimate item prices, brand positioning, resale value, or category. If only a total price is provided, estimate a reasonable per-item allocation using public price signals when available and make sure item prices sum to total_price. Use local market context when possible. Use category as a stable hierarchy in the format Top > Subcategory. Use broad life-area top categories such as Accommodation, Food & Drink, Clothing, Home, Shopping, Transport, Subscriptions, and Investments. Accommodation is its own top category: use Accommodation > Rent for rent/housing/apartment costs and Accommodation > Hotel stays for hotels, stays, or lodging; do not put accommodation under Travel or Transport. Keep clothing under the single top category Clothing, for example Clothing > Activewear, Clothing > Footwear, Clothing > Apparel, or Clothing > Accessories; do not create competing top categories like Clothing & Footwear, Clothing & Accessories, or Fashion. Keep home and household goods under the single top category Home, for example Home > Bedding, Home > Bathroom, Home > Kitchen & Dining, Home > Furniture, or Home > Homewares; do not create competing top categories like Household or Home & Garden. Use financial_type expense for pure consumption, value_asset for items with resale/residual value, ongoing_cost for subscriptions or repeating costs, and investment for financial assets. brand_positioning should be one of budget, mid-market, premium, luxury, unknown, or a short equivalent label. If brand_positioning would be unknown but consumption_rate is known, infer positioning from the price tier: 1-3 budget/basic, 4-6 mid-market, 7-9 premium, 10 luxury. consumption_rate means consumption price tier, not usefulness: 1-3 is cheap everyday/basic goods, 4-6 is mid-priced consumer spending, 7-9 is high-end/premium spending, and 10 is luxury-level spending. price_reasoning should briefly explain how the item price was estimated.",
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                rawText: input.rawText,
                merchant: input.merchant,
                itemName: input.itemName,
                price: input.price,
                category: input.category,
                fallback,
              }),
            },
            ...(input.imageBase64 && input.imageMimeType
              ? [
                  {
                    type: "input_image",
                    image_url: `data:${input.imageMimeType};base64,${input.imageBase64}`,
                    detail: "high",
                  },
                ]
              : []),
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "expense_analysis",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              items: {
                type: "array",
                minItems: 1,
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    merchant: { type: "string" },
                    item_name: { type: "string" },
                    purchase_price: { type: "number" },
                    expense_date: { type: "string" },
                    category: { type: "string" },
                    financial_type: {
                      type: "string",
                      enum: financialTypes,
                    },
                    current_estimated_value: { type: "number" },
                    net_worth_impact: { type: "number" },
                    brand: { type: "string" },
                    brand_positioning: { type: "string" },
                    consumption_rate: { type: "number", minimum: 1, maximum: 10 },
                    market_price_low: { type: "number" },
                    market_price_high: { type: "number" },
                    price_confidence: { type: "number", minimum: 0, maximum: 1 },
                    price_estimate_source: { type: "string" },
                    price_reasoning: { type: "string" },
                    ai_confidence: { type: "number", minimum: 0, maximum: 1 },
                    ai_summary: { type: "string" },
                    recurrence_frequency: {
                      type: "string",
                      enum: recurrenceFrequencies,
                    },
                    recurring_start_date: { type: "string" },
                  },
                  required: [
                    "merchant",
                    "item_name",
                    "purchase_price",
                    "expense_date",
                    "category",
                    "financial_type",
                    "current_estimated_value",
                    "net_worth_impact",
                    "brand",
                    "brand_positioning",
                    "consumption_rate",
                    "market_price_low",
                    "market_price_high",
                    "price_confidence",
                    "price_estimate_source",
                    "price_reasoning",
                    "ai_confidence",
                    "ai_summary",
                    "recurrence_frequency",
                    "recurring_start_date",
                  ],
                },
              },
              total_price: { type: "number" },
              ai_summary: { type: "string" },
            },
            required: [
              "items",
              "total_price",
              "ai_summary",
            ],
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    if (input.imageBase64) {
      throw new Error(`OpenAI image analysis failed. ${errorText}`);
    }

    return {
      ...fallback,
      ai_summary: `OpenAI analysis failed, using local estimate instead. ${fallback.ai_summary}`,
    };
  }

  const data = await response.json();
  const text = extractResponseText(data);

  if (!text) {
    if (input.imageBase64) {
      throw new Error("OpenAI image analysis returned no readable result.");
    }

    return fallback;
  }

  try {
    return applyInputDerivedRecurringMetadata(
      expandRecurringRangeIfNeeded(normaliseResult(JSON.parse(text)), input),
      input,
    );
  } catch {
    if (input.imageBase64) {
      throw new Error("OpenAI image analysis returned invalid JSON.");
    }

    return fallback;
  }
}
