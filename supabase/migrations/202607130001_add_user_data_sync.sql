-- User ownership and cross-device budget goal sync.
-- Existing rows remain unassigned until the owner migration below is run manually.

alter table public.expenses
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.recurring_expenses
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists expenses_user_id_idx on public.expenses(user_id);
create index if not exists recurring_expenses_user_id_idx on public.recurring_expenses(user_id);

create table if not exists public.spending_goals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  weekly_goal numeric not null default 300 check (weekly_goal >= 0),
  monthly_goal numeric not null default 1200 check (monthly_goal >= 0),
  updated_at timestamptz not null default now()
);

alter table public.expenses enable row level security;
alter table public.recurring_expenses enable row level security;
alter table public.spending_goals enable row level security;

do $$
declare policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('expenses', 'recurring_expenses', 'spending_goals')
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  end loop;
end $$;

create policy "Users read own expenses"
  on public.expenses for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users insert own expenses"
  on public.expenses for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users update own expenses"
  on public.expenses for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users delete own expenses"
  on public.expenses for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users read own recurring expenses"
  on public.recurring_expenses for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users insert own recurring expenses"
  on public.recurring_expenses for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users update own recurring expenses"
  on public.recurring_expenses for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users delete own recurring expenses"
  on public.recurring_expenses for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users read own goals"
  on public.spending_goals for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users insert own goals"
  on public.spending_goals for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Users update own goals"
  on public.spending_goals for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- After signing in once, find your UUID in Supabase Authentication > Users.
-- Replace YOUR_USER_UUID and run these two statements once to retain legacy data:
-- update public.expenses set user_id = 'YOUR_USER_UUID' where user_id is null;
-- update public.recurring_expenses set user_id = 'YOUR_USER_UUID' where user_id is null;
