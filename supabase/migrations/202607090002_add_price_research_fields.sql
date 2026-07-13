alter table public.expenses
  add column if not exists brand_positioning text,
  add column if not exists market_price_low numeric,
  add column if not exists market_price_high numeric,
  add column if not exists price_confidence numeric check (
    price_confidence is null or (price_confidence >= 0 and price_confidence <= 1)
  ),
  add column if not exists price_estimate_source text,
  add column if not exists price_reasoning text;

update public.expenses
set
  brand_positioning = coalesce(brand_positioning, 'Unknown'),
  market_price_low = coalesce(market_price_low, purchase_price),
  market_price_high = coalesce(market_price_high, purchase_price),
  price_confidence = coalesce(price_confidence, 0),
  price_estimate_source = coalesce(price_estimate_source, 'Legacy entry'),
  price_reasoning = coalesce(price_reasoning, 'No price research was stored for this entry.');
