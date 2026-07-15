-- Production repair for projects whose PostgREST schema cache predates the
-- enriched expense fields used by receipt uploads.
alter table public.expenses
  add column if not exists ai_summary text;

alter table public.recurring_expenses
  add column if not exists ai_summary text not null default '';

-- Re-assert authenticated ownership policies in case production ran the
-- recurring-table migration but skipped the later user-sync migration.
alter table public.expenses
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.recurring_expenses
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.expenses enable row level security;
alter table public.recurring_expenses enable row level security;

drop policy if exists "Users insert own expenses" on public.expenses;
create policy "Users insert own expenses"
  on public.expenses for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users insert own recurring expenses" on public.recurring_expenses;
create policy "Users insert own recurring expenses"
  on public.recurring_expenses for insert to authenticated
  with check ((select auth.uid()) = user_id);

notify pgrst, 'reload schema';
