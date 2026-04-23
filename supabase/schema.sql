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

insert into public.inventory_items (
  name,
  normalized_name,
  quantity,
  image_url,
  category,
  updated_at
)
values
  ('Whole Milk', 'whole milk', 2, '', 'Dairy', now() - interval '2 day'),
  ('Eggs', 'eggs', 12, '', 'Dairy', now() - interval '1 day'),
  ('Chicken Breast', 'chicken breast', 3, '', 'Protein', now() - interval '6 hour'),
  ('Pasta Penne', 'pasta penne', 4, '', 'Pantry', now() - interval '5 hour'),
  ('Tomatoes', 'tomatoes', 6, '', 'Produce', now() - interval '4 hour'),
  ('White Onion', 'white onion', 5, '', 'Produce', now() - interval '4 hour'),
  ('Ground Coffee', 'ground coffee', 1, '', 'Beverages', now() - interval '3 hour'),
  ('Liquid Detergent', 'liquid detergent', 1, '', 'Household', now() - interval '2 hour')
on conflict (normalized_name) do nothing;

insert into public.inventory_movements (
  id,
  item_name,
  normalized_name,
  action,
  quantity_change,
  quantity_after,
  category,
  note,
  created_at
)
values
  (gen_random_uuid(), 'Whole Milk', 'whole milk', 'created', 2, 2, 'Dairy', 'Initial mock data for the demo.', now() - interval '2 day'),
  (gen_random_uuid(), 'Eggs', 'eggs', 'created', 12, 12, 'Dairy', 'Initial mock data for the demo.', now() - interval '1 day'),
  (gen_random_uuid(), 'Chicken Breast', 'chicken breast', 'created', 3, 3, 'Protein', 'Initial mock data for the demo.', now() - interval '6 hour'),
  (gen_random_uuid(), 'Tomatoes', 'tomatoes', 'incremented', 2, 6, 'Produce', 'Restock recorded in the demo.', now() - interval '4 hour'),
  (gen_random_uuid(), 'Ground Coffee', 'ground coffee', 'decremented', -1, 1, 'Beverages', 'Usage recorded in the demo.', now() - interval '90 minute'),
  (gen_random_uuid(), 'Liquid Detergent', 'liquid detergent', 'created', 1, 1, 'Household', 'Initial mock data for the demo.', now() - interval '2 hour')
on conflict (id) do nothing;
