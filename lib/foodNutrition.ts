export type NutritionBounds = Partial<Record<"energyKcal" | "protein" | "carbs" | "fat", true>>;
export type ServingInfo = {
  lessThan?: NutritionBounds;
  description?: string | null;
  quantity?: number | null;
  quantityUnit?: string | null;
  quantitySource?: "label" | "manual";
  grams?: number | null;
  millilitres?: number | null;
  servingsPerPack?: number | null;
  energyKcal?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
};

export type FoodNutrition = {
  lessThan?: NutritionBounds;
  hiddenInKitchen?: boolean;
  artworkName?: string;
  pinned?: boolean;
  dailyPick?: boolean;
  marketDepartmentOverride?: import('./gardenCategories').MarketDepartment;
  id: string;
  name: string;
  protein: number;
  carbs: number;
  fat: number;
  energyKcal: number;
  unit: "g" | "mL";
  source: "Woolworths" | "标签导入" | "照片识别" | "通用估算" | "AI估算";
  labelEvidence?: string;
  sourceUrl?: string;
  importedAt: string;
  serving?: ServingInfo;
  imageUrl?: string | null;
};

export function woolworthsProductId(input: string): string | null {
  if (/^\d{3,18}$/.test(input.trim())) return input.trim();
  try {
    const url = new URL(input);
    if (url.protocol !== "https:" || !["www.woolworths.com.au", "woolworths.com.au"].includes(url.hostname) || url.port || url.username || url.password) return null;
    return url.pathname.match(/^\/shop\/productdetails\/(\d{3,18})(?:\/|$)/i)?.[1] || null;
  } catch { return null; }
}

export function labelText(html: string): string {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<\/(?:tr|p|div|li|h[1-6])>/gi, "\n").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&amp;/gi, "&");
}

/** Accepts an explicit per-100 column; never mistakes per-serving data for per-100. */
export function parseNutritionLabel(input: string, column: "auto" | "first" | "last" = "auto", allowBounds = false) {
  const text = labelText(input).replace(/\r/g, "");
  if (!/(?:per\s*100|每\s*100)/i.test(text)) throw new Error("未找到每 100 g / 100 mL 标题。请复制完整营养表，包含表头和数值。");
  const nutrient = /\b(Energy|Protein|Fat\s*[,，]?\s*Total|Total\s*Fat|Fat|Carbohydrate[s]?|Saturated|Sugars?|Dietary\s*Fibre|Fiber|Sodium)\b|能量|热量|蛋白质|脂肪|碳水化合物|饱和脂肪|糖|钠/gi;
  const matches = [...text.matchAll(nutrient)];
  const values: Record<string, number> = {};
  const lessThan: NutritionBounds = {};
  const headings = text.slice(0, matches[0]?.index ?? 0);
  const servingFirst = /per\s*serv(?:e|ing)/i.test(headings) && headings.search(/per\s*serv(?:e|ing)/i) < headings.search(/per\s*100/i);
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i], key = match[0].toLowerCase().replace(/[,，\s]/g, "");
    if (!/^(energy|能量|热量|protein|蛋白质|fattotal|totalfat|fat|脂肪|carbohydrates?|碳水化合物)$/.test(key)) continue;
    const content = text.slice(match.index! + match[0].length, matches[i + 1]?.index ?? text.length);
    if (/(?:^|\s)-\s*\d/.test(content)) throw new Error("营养数值不能为负数，请核对标签。");
    const nums = [...content.matchAll(/(<\s*)?(\d[\d,]*(?:\.\d+)?)\s*(kcal|kj|g|mg)\b/gi)];
    if (!nums.length) continue;
    const explicit = content.match(/per\s*100\s*(?:grams?\s*or\s*millilitres?|g|ml)?\s*(<\s*)?(\d[\d,]*(?:\.\d+)?)\s*(kcal|kj|g)\b/i);
    let n: number, unit: string, bounded=false;
    if (explicit) {
      if (explicit[1] && !allowBounds) throw new Error("标签含有“小于”数值，请在导入后按包装确认并手动填写，避免把上限当作精确值。");
      bounded=!!explicit[1];
      n = Number(explicit[2].replace(/,/g, "")); unit = explicit[3].toLowerCase();
    } else {
      if(/per\s*serv(?:e|ing)/i.test(headings)&&nums.length<2)throw new Error("此行缺少每100g / mL数值，无法将每份值当作每100值导入。");
      const pick = column === "first" ? nums[0] : column === "last" || servingFirst ? nums.at(-1)! : nums[0];
      if (pick[1] && !allowBounds) throw new Error("标签含有“小于”数值，请手动核对后填写。");
      bounded=!!pick[1];
      n = Number(pick[2].replace(/,/g, "")); unit = pick[3].toLowerCase();
    }
    if (/^(energy|能量|热量)$/.test(key)) values.energyKcal = unit === "kj" ? n / 4.184 : unit === "kcal" ? n : NaN;
    else if (/^(protein|蛋白质)$/.test(key)) values.protein = unit === "g" ? n : NaN;
    else if (/^(fattotal|totalfat|fat|脂肪)$/.test(key)) values.fat = unit === "g" ? n : NaN;
    else if (/^(carbohydrates?|碳水化合物)$/.test(key)) values.carbs = unit === "g" ? n : NaN;
    if(bounded){const field=/^(energy|能量|热量)$/.test(key)?"energyKcal":/^(protein|蛋白质)$/.test(key)?"protein":/^(fattotal|totalfat|fat|脂肪)$/.test(key)?"fat":"carbs";lessThan[field]=true;}
  }
  if (!["energyKcal", "protein", "carbs", "fat"].every(k => Number.isFinite(values[k]) && values[k] >= 0)) throw new Error("未识别到完整的热量、蛋白质、碳水和脂肪。请保留单位（kJ/kcal/g），或手动填写标签。");
  if (values.energyKcal > 1000 || [values.protein, values.carbs, values.fat].some(v => v > 100)) throw new Error("数值超出每 100 g / mL 范围，请检查列顺序与单位。");
  return { energyKcal: values.energyKcal, protein: values.protein, carbs: values.carbs, fat: values.fat, ...(Object.keys(lessThan).length?{lessThan}:{}) };
}

export type WoolworthsProduct = {
  Stockcode?: number;
  Name?: string;
  DisplayName?: string;
  PackageSize?: string;
  SmallImageFile?: string;
  MediumImageFile?: string;
  AdditionalAttributes?: Record<string, unknown>;
};

/** Woolworths uses JSON NIP attributes, including exact per-100 keys and serving units. */
export function nutritionFromWoolworthsProduct(product: WoolworthsProduct): FoodNutrition | null {
  try {
    const raw = product.AdditionalAttributes?.nutritionalinformation;
    const nip = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!nip || !Array.isArray(nip.Attributes) || !product.Stockcode) return null;
    const attributes = nip.Attributes as { Name?: string; Value?: string }[];
    const valueFor = (pattern: RegExp) => attributes.find(a => pattern.test(a.Name || ""))?.Value || "";
    const serving = valueFor(/^Serving Size - Total - NIP$/i);
    const unit = /\bml\b|millilit/i.test(serving) ? "mL" : /\bg\b|\d\s*g\b|grams?/i.test(serving) ? "g" : null;
    if (!unit) return null;
    const energy = valueFor(/^Energy (?:kJ|kcal) Quantity Per 100(?:g|mL) - Total - NIP$/i);
    const protein = valueFor(/^Protein Quantity Per 100(?:g|mL) - Total - NIP$/i);
    const fat = valueFor(/^Fat Total Quantity Per 100(?:g|mL) - Total - NIP$/i);
    const carbs = valueFor(/^Carbohydrate Quantity Per 100(?:g|mL) - Total - NIP$/i);
    const nutrition = parseNutritionLabel(`Per 100 ${unit}\nEnergy ${energy}\nProtein ${protein}\nFat, Total ${fat}\nCarbohydrate ${carbs}`, "auto", true);
    const info = servingMetadata(serving, valueFor(/^Servings Per Pack - Total - NIP$/i));
    const perServing = {
      energyKcal: nutrientNumber(valueFor(/^Energy (?:kJ|kcal) Quantity Per Serve - Total - NIP$/i), "energy"),
      protein: nutrientNumber(valueFor(/^Protein Quantity Per Serve - Total - NIP$/i), "g"),
      carbs: nutrientNumber(valueFor(/^Carbohydrate Quantity Per Serve - Total - NIP$/i), "g"),
      fat: nutrientNumber(valueFor(/^Fat Total Quantity Per Serve - Total - NIP$/i), "g"),
    };
    const servingBounds: NutritionBounds = {};
    for(const [field,pattern] of [["energyKcal",/^Energy (?:kJ|kcal) Quantity Per Serve - Total - NIP$/i],["protein",/^Protein Quantity Per Serve - Total - NIP$/i],["carbs",/^Carbohydrate Quantity Per Serve - Total - NIP$/i],["fat",/^Fat Total Quantity Per Serve - Total - NIP$/i]] as const)if(valueFor(pattern).trim().startsWith("<"))servingBounds[field]=true;
    return { ...nutrition, serving: { ...info, ...perServing, ...(Object.keys(servingBounds).length?{lessThan:servingBounds}:{}) }, labelEvidence: Object.keys(nutrition.lessThan||{}).length?"标签含小于值，已保留 < 标记；餐盘营养统计按该上限估计，并非精确含量。":undefined, imageUrl: woolworthsImageUrl(product), id: `woolworths-${product.Stockcode}`, name: product.DisplayName || [product.Name,product.PackageSize].filter(Boolean).join(" "), unit, source: "Woolworths", sourceUrl: `https://www.woolworths.com.au/shop/productdetails/${product.Stockcode}`, importedAt: new Date().toISOString() };
  } catch { return null; }
}


export function woolworthsImageUrl(product: WoolworthsProduct): string | null {
  const raw = product.SmallImageFile || product.MediumImageFile;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && /^cdn\d*\.woolworths\.media$/.test(url.hostname) && !url.port && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

function nutrientNumber(value: string, kind: "energy" | "g"): number | null {
  const match = value.trim().match(/^(?:<\s*)?(\d+(?:\.\d+)?)\s*(kJ|kcal|g)$/i);
  if (!match) return null;
  const n = Number(match[1]), unit = match[2].toLowerCase();
  return kind === "energy" ? unit === "kj" ? n / 4.184 : unit === "kcal" ? n : null : unit === "g" ? n : null;
}

export function servingMetadata(description: string, pack: string): ServingInfo {
  const grams = description.match(/(?:^|[\s(])(\d+(?:\.\d+)?)\s*(?:g|grams?)\b/i);
  const ml = description.match(/(?:^|[\s(])(\d+(?:\.\d+)?)\s*(?:ml|millilitres?)\b/i);
  // A count may appear before OR after the gram value: '3 crackers (20g)' / '20g (3 crackers)'.
  const counts = [...description.matchAll(/(?:^|[\s(,=])(?:approx\.?\s*)?(\d+(?:\.\d+)?)\s*([a-z]+(?:\s+[a-z]+)*|[个片块颗枚只袋包条杯])/gi)];
  const count = counts.find(match => !/^(g|grams?|ml|millilitres?|kg|l|kj|kcal)$/i.test(match[2].trim()));
  return {
    description: description.trim() || null,
    quantity: count ? Number(count[1]) : null,
    quantitySource: count ? "label" : undefined,
    quantityUnit: count ? count[2].trim().replace(/\s+per\s+.*$/i, "") : null,
    grams: grams ? Number(grams[1]) : null,
    millilitres: ml ? Number(ml[1]) : null,
    servingsPerPack: /^\d+(?:\.\d+)?$/.test(pack.trim()) ? Number(pack) : null,
  };
}

/** Optional serving data is read independently; missing fields remain null, never inferred. */
export function servingFromLabel(input: string, per100Column: "first" | "last"): ServingInfo {
  const text = labelText(input);
  const description = text.match(/(?:Serving\s*size|每份(?:大小|重量))\s*[:,]?\s*([^\n]+)/i)?.[1]?.trim() || "";
  const pack = text.match(/(?:Servings?\s*per\s*(?:pack(?:age)?|container)|每包装份数)\s*[:,]?\s*([^\n]+)/i)?.[1]?.trim() || "";
  const info = servingMetadata(description, pack);
  const nutrients = [...text.matchAll(/\b(Energy|Protein|Fat\s*[,，]?\s*Total|Total\s*Fat|Carbohydrate[s]?|Saturated|Sugars?|Sodium|Dietary\s*Fibre)\b/gi)];
  const header = text.slice(0, nutrients[0]?.index ?? 0);
  const hasServingColumn = /per\s*serv(?:e|ing)\b/i.test(header);
  for (let i=0; i<nutrients.length; i++) {
    const key = nutrients[i][0].toLowerCase().replace(/[,\s]/g, "");
    const field = key === "energy" ? "energyKcal" : key === "protein" ? "protein" : /^(fattotal|totalfat)$/.test(key) ? "fat" : /^carbohydrates?$/.test(key) ? "carbs" : null;
    if (!field) continue;
    const content = text.slice(nutrients[i].index! + nutrients[i][0].length, nutrients[i+1]?.index ?? text.length);
    const explicit = content.match(/Per\s*serv(?:e|ing)\s*((?:<\s*)?\d+(?:\.\d+)?\s*(?:kcal|kJ|g))\b/i);
    let value = explicit?.[1];
    if (!value && hasServingColumn) {
      // Require both columns; do not treat the lone per-100 value as a serving value.
      const cells = content.trim().split(/\t|\s{2,}/).filter(Boolean);
      const nums = [...content.matchAll(/(?:<\s*)?-?\d+(?:\.\d+)?\s*(?:kcal|kJ|g)\b/gi)];
      if (cells.length >= 2) value = per100Column === "last" ? cells[0] : cells.at(-1);
      else if (nums.length === 2 && !/(?:not available|n\/a|暂无|(?:^|\s)-(?=\s|$))/i.test(content)) value = (per100Column === "last" ? nums[0] : nums[1])[0];
    }
    info[field] = value ? nutrientNumber(value, field === "energyKcal" ? "energy" : "g") : null;
    if(value?.trim().startsWith("<")&&info[field]!=null)info.lessThan={...info.lessThan,[field]:true};
  }
  return info;
}
