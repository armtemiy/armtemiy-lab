-- Armtemiy Lab базовая схема (MVP)

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id text unique not null,
  username text,
  is_admin boolean default false,
  created_at timestamp with time zone default now()
);

create table if not exists public.diagnostic_trees (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  version int default 1,
  title text not null,
  tree_json jsonb not null,
  status text default 'draft',
  created_at timestamp with time zone default now()
);

create table if not exists public.diagnostic_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  tree_id uuid references public.diagnostic_trees(id),
  answers_json jsonb not null,
  result_json jsonb not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  item_slug text not null,
  stars_amount int not null,
  status text default 'pending',
  created_at timestamp with time zone default now()
);

-- MVP: RLS выключен для ускорения запуска
alter table public.users disable row level security;
alter table public.diagnostic_trees disable row level security;
alter table public.diagnostic_results disable row level security;
alter table public.purchases disable row level security;
