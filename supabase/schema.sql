create extension if not exists pgcrypto;

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null unique,
  quantity integer not null default 0,
  image_url text not null default '',
  category text not null default 'Other',
  updated_at timestamptz not null default now()
);

create index if not exists inventory_items_updated_at_idx
  on public.inventory_items (updated_at desc);

create table if not exists public.inventory_movements (
  id uuid primary key,
  item_name text not null,
  normalized_name text not null,
  action text not null,
  quantity_change integer not null default 0,
  quantity_after integer,
  category text not null default 'Other',
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists inventory_movements_created_at_idx
  on public.inventory_movements (created_at desc);

insert into storage.buckets (id, name, public)
values ('inventory-images', 'inventory-images', true)
on conflict (id) do nothing;
