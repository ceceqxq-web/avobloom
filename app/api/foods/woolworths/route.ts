import { nutritionFromWoolworthsProduct, woolworthsProductId, woolworthsImageUrl, type WoolworthsProduct } from "@/lib/foodNutrition";
export const runtime = "nodejs";
const origin = "https://www.woolworths.com.au";
class UpstreamError extends Error {}
async function woolFetch(path: string) {
  const response = await fetch(origin + path, { headers: { Accept: "application/json", "User-Agent": "Qingheng/1.0 (local personal nutrition app)" }, signal: AbortSignal.timeout(12000), cache: "no-store", redirect: "error" });
  if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) throw new UpstreamError("Woolworths 暂时限制自动访问。可在官网搜索商品，再复制营养表到下方自动识别；不会生成或猜测缺失数据。");
  return response.json();
}
function flatten(data: { Products?: { Products?: WoolworthsProduct[] }[] }): WoolworthsProduct[] {
  return (Array.isArray(data.Products) ? data.Products : []).flatMap(group => group.Products || []);
}
// Cache only public catalog responses. Avoid repeated requests when the same product is selected.
const cache = new Map<string, { expires: number; data: object }>();
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const input = (params.get("q") || "").trim();
  if (!input || input.length > 300) return Response.json({ error: "请输入商品关键词、商品编号或 Woolworths 商品链接。" }, { status: 400 });
  const id = woolworthsProductId(input);
  if (/^https?:/i.test(input) && !id) return Response.json({ error: "仅支持 https://www.woolworths.com.au/shop/productdetails/… 商品链接。" }, { status: 400 });
  const key = id || input.toLowerCase();
  const cached = params.get("refresh")==="1" ? undefined : cache.get(key);
  if (cached && cached.expires > Date.now()) return Response.json(cached.data);
  try {
    let result: object;
    if (id) {
      // Search responses commonly omit the NIP. Read product detail first,
      // even if keyword search is empty or unavailable.
      const detail = await woolFetch(`/apis/ui/product/detail/${id}`);
      const product: WoolworthsProduct = detail.Product || detail;
      const nutrition = nutritionFromWoolworthsProduct(product);
      if (!nutrition) return Response.json({ code:"LABEL_UNREADABLE", error: "已找到商品，但系统暂未能读取完整营养标签，不代表官网没有。可重试读取，或复制官网完整营养表（包含每100g列）后识别。" }, { status: 422, headers:{"Cache-Control":"no-store"} });
      result = { product: nutrition };
    } else {
      const search = await woolFetch(`/apis/ui/Search/products?searchTerm=${encodeURIComponent(input)}&pageSize=12&pageNumber=1&sortType=TraderRelevance`);
      const products = flatten(search);
      for(const product of products){const nutrition=nutritionFromWoolworthsProduct(product);if(nutrition)cache.set(String(product.Stockcode),{data:{product:nutrition},expires:Date.now()+5*60*1000});}
      result = { products: products.filter(p=>p.Stockcode && (p.Name || p.DisplayName)).map(p=>({ id: String(p.Stockcode), name: p.DisplayName || [p.Name,p.PackageSize].filter(Boolean).join(" "), url: `${origin}/shop/productdetails/${p.Stockcode}`, imageUrl: woolworthsImageUrl(p), nutrition: nutritionFromWoolworthsProduct(p) })) };
    }
    while (cache.size >= 100) cache.delete(cache.keys().next().value!);
    cache.set(key, { data: result, expires: Date.now() + 5 * 60 * 1000 });
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error instanceof UpstreamError ? error.message : "商品查询暂时不可用或超时。请打开 Woolworths 官网搜索，再粘贴营养表导入。" }, { status: 502 });
  }
}
