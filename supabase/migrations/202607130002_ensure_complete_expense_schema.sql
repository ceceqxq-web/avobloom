-- Consolidated, idempotent repair for production projects that skipped an
-- earlier expense enrichment migration.
alter table public.expenses
  add column if not exists brand text,
  add column if not exists brand_positioning text,
  add column if not exists consumption_rate numeric default 5 check (
    consumption_rate is null or (consumption_rate >= 1 and consumption_rate <= 10)
  ),
  add column if not exists ai_confidence numeric default 0 check (
    ai_confidence is null or (ai_confidence >= 0 and ai_confidence <= 1)
  ),
  add column if not exists ai_summary text,
  add column if not exists expense_date date default current_date,
  add column if not exists market_price_low numeric,
  add column if not exists market_price_high numeric,
  add column if not exists price_confidence numeric check (
    price_confidence is null or (price_confidence >= 0 and price_confidence <= 1)
  ),
  add column if not exists price_estimate_source text,
  add column if not exists price_reasoning text,
  add column if not exists current_estimated_value numeric default 0,
  add column if not exists net_worth_impact numeric default 0;

update public.expenses
set
  brand = coalesce(brand, merchant),
  consumption_rate = coalesce(consumption_rate, 5),
  ai_confidence = coalesce(ai_confidence, 0),
  expense_date = coalesce(expense_date, created_at::date, current_date),
  current_estimated_value = coalesce(current_estimated_value, 0),
  net_worth_impact = coalesce(net_worth_impact, 0);

notify pgrst, 'reload schema';
