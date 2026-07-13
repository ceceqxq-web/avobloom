alter table public.expenses
  add column if not exists current_estimated_value numeric default 0,
  add column if not exists net_worth_impact numeric default 0;

update public.expenses
set
  current_estimated_value = coalesce(current_estimated_value, 0),
  net_worth_impact = coalesce(net_worth_impact, 0);
