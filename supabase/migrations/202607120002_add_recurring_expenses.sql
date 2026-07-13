create table if not exists public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  merchant text not null default '',
  item_name text not null default '',
  purchase_price numeric not null default 0,
  category text not null default '',
  current_estimated_value numeric not null default 0,
  brand text not null default '',
  brand_positioning text,
  consumption_rate numeric not null default 5,
  market_price_low numeric,
  market_price_high numeric,
  price_confidence numeric,
  price_estimate_source text,
  price_reasoning text,
  ai_confidence numeric not null default 0,
  ai_summary text not null default '',
  recurrence_frequency text not null check (recurrence_frequency in ('weekly', 'monthly')),
  start_date date not null,
  next_occurrence_date date not null,
  last_generated_date date,
  is_active boolean not null default true
);

alter table public.recurring_expenses enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'recurring_expenses'
      and policyname = 'Allow recurring expenses read'
  ) then
    create policy "Allow recurring expenses read"
      on public.recurring_expenses
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'recurring_expenses'
      and policyname = 'Allow recurring expenses insert'
  ) then
    create policy "Allow recurring expenses insert"
      on public.recurring_expenses
      for insert
      to anon, authenticated
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'recurring_expenses'
      and policyname = 'Allow recurring expenses update'
  ) then
    create policy "Allow recurring expenses update"
      on public.recurring_expenses
      for update
      to anon, authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'recurring_expenses'
      and policyname = 'Allow recurring expenses delete'
  ) then
    create policy "Allow recurring expenses delete"
      on public.recurring_expenses
      for delete
      to anon, authenticated
      using (true);
  end if;
end $$;
