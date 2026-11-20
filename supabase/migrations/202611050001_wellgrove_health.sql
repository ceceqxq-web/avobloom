-- Wellgrove cloud storage. No desktop health records are included in this migration.
create table if not exists public.wellgrove_health (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 0 check (revision >= 0),
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.wellgrove_health enable row level security;
revoke all on public.wellgrove_health from anon;
grant select, insert, update on public.wellgrove_health to authenticated;
create policy "Read own Wellgrove data" on public.wellgrove_health
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Create own Wellgrove data" on public.wellgrove_health
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own Wellgrove data" on public.wellgrove_health
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
