create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_name text not null,
  merchant text not null,
  product_url text,
  quantity integer not null check (quantity between 1 and 99),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  total_price numeric(12, 2) not null check (total_price >= 0),
  delivery_notes text,
  status text not null default 'confirmed_pending_fulfilment' check (status in ('confirmed_pending_fulfilment', 'submitted_to_merchant', 'completed', 'cancelled')),
  confirmed_at timestamptz not null
);

alter table public.purchase_orders enable row level security;

create policy "Users can read their purchase orders"
on public.purchase_orders for select
using (auth.uid() = user_id);

create policy "Users can create their purchase orders"
on public.purchase_orders for insert
with check (auth.uid() = user_id);

