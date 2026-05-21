-- Market Pulse initial schema + RLS

create extension if not exists "uuid-ossp";

-- Users profile (synced from auth.users)
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  email text not null,
  avatar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Canonical product catalog (synced / cached from external APIs)
create table public.products (
  id text primary key,
  name text not null,
  category text not null default 'general',
  current_price numeric(18, 6) not null,
  currency text not null default 'USD',
  region text not null default 'global',
  source text not null,
  price_change_pct numeric(8, 4),
  image_url text,
  metadata jsonb default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index products_category_idx on public.products (category);
create index products_source_idx on public.products (source);
create index products_updated_at_idx on public.products (updated_at desc);

-- User watchlists
create table public.watchlists (
  user_id uuid not null references public.users (id) on delete cascade,
  product_id text not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index watchlists_user_id_idx on public.watchlists (user_id);

-- Aggregated product views (flushed from Redis periodically / on view)
create table public.views (
  product_id text primary key references public.products (id) on delete cascade,
  views_count bigint not null default 0,
  updated_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    name = coalesce(excluded.name, public.users.name),
    avatar = coalesce(excluded.avatar, public.users.avatar),
    updated_at = now();
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- RLS
alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.watchlists enable row level security;
alter table public.views enable row level security;

-- Users: own row only
create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Products: authenticated read
create policy "products_select_authenticated"
  on public.products for select
  to authenticated
  using (true);

-- Service role inserts/updates via API (no direct client write policies)

-- Watchlists: own rows
create policy "watchlists_select_own"
  on public.watchlists for select
  using (auth.uid() = user_id);

create policy "watchlists_insert_own"
  on public.watchlists for insert
  with check (auth.uid() = user_id);

create policy "watchlists_delete_own"
  on public.watchlists for delete
  using (auth.uid() = user_id);

-- Views: authenticated read only
create policy "views_select_authenticated"
  on public.views for select
  to authenticated
  using (true);

-- Grants
grant usage on schema public to anon, authenticated;
grant select on public.products to authenticated;
grant select on public.views to authenticated;
grant select, update on public.users to authenticated;
grant select, insert, delete on public.watchlists to authenticated;
