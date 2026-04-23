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
  ('Leche Entera', 'leche entera', 2, '', 'Dairy', now() - interval '2 day'),
  ('Huevos', 'huevos', 12, '', 'Dairy', now() - interval '1 day'),
  ('Pechuga de Pollo', 'pechuga de pollo', 3, '', 'Protein', now() - interval '6 hour'),
  ('Pasta Penne', 'pasta penne', 4, '', 'Pantry', now() - interval '5 hour'),
  ('Tomate', 'tomate', 6, '', 'Produce', now() - interval '4 hour'),
  ('Cebolla Blanca', 'cebolla blanca', 5, '', 'Produce', now() - interval '4 hour'),
  ('Cafe Molido', 'cafe molido', 1, '', 'Beverages', now() - interval '3 hour'),
  ('Detergente Liquido', 'detergente liquido', 1, '', 'Household', now() - interval '2 hour')
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
  (gen_random_uuid(), 'Leche Entera', 'leche entera', 'created', 2, 2, 'Dairy', 'Mock data inicial para demo.', now() - interval '2 day'),
  (gen_random_uuid(), 'Huevos', 'huevos', 'created', 12, 12, 'Dairy', 'Mock data inicial para demo.', now() - interval '1 day'),
  (gen_random_uuid(), 'Pechuga de Pollo', 'pechuga de pollo', 'created', 3, 3, 'Protein', 'Mock data inicial para demo.', now() - interval '6 hour'),
  (gen_random_uuid(), 'Tomate', 'tomate', 'incremented', 2, 6, 'Produce', 'Reposicion registrada en demo.', now() - interval '4 hour'),
  (gen_random_uuid(), 'Cafe Molido', 'cafe molido', 'decremented', -1, 1, 'Beverages', 'Consumo registrado en demo.', now() - interval '90 minute'),
  (gen_random_uuid(), 'Detergente Liquido', 'detergente liquido', 'created', 1, 1, 'Household', 'Mock data inicial para demo.', now() - interval '2 hour')
on conflict (id) do nothing;
