alter table public.expenses
  add column if not exists brand text,
  add column if not exists consumption_rate numeric check (
    consumption_rate is null or (consumption_rate >= 1 and consumption_rate <= 10)
  ),
  add column if not exists ai_confidence numeric check (
    ai_confidence is null or (ai_confidence >= 0 and ai_confidence <= 1)
  ),
  add column if not exists ai_summary text,
  add column if not exists expense_date date default current_date;

update public.expenses
set
  brand = coalesce(brand, merchant),
  consumption_rate = coalesce(consumption_rate, 5),
  ai_confidence = coalesce(ai_confidence, 0),
  ai_summary = coalesce(ai_summary, 'Legacy manually entered expense.'),
  expense_date = coalesce(expense_date, created_at::date, current_date);
