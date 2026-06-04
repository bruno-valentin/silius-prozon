-- ============================================================
-- SILIUS — Prozon Demo
-- Paste this entirely in Supabase SQL Editor and Run
-- ============================================================

-- 1. TABLES
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  created_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete cascade,
  name text not null,
  slug text not null unique,
  ref text not null unique,
  price_ht numeric(10,2) not null,
  description text,
  image_url text,
  stock int default 100,
  active boolean default true,
  created_at timestamptz default now()
);

-- 2. RLS — allow public read, authenticated write
alter table categories enable row level security;
alter table products enable row level security;

create policy "public read categories" on categories for select using (true);
create policy "public read products" on products for select using (true);
create policy "anon insert categories" on categories for insert with check (true);
create policy "anon update categories" on categories for update using (true);
create policy "anon insert products" on products for insert with check (true);
create policy "anon update products" on products for update using (true);

-- 3. STORAGE BUCKET for product images
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict do nothing;

create policy "public read product images"
  on storage.objects for select
  using (bucket_id = 'products');

create policy "anon upload product images"
  on storage.objects for insert
  with check (bucket_id = 'products');

create policy "anon update product images"
  on storage.objects for update
  using (bucket_id = 'products');

-- 4. SEED CATEGORY
insert into categories (id, name, slug, description, image_url)
values (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Panneaux de signalisation routière permanente',
  'panneaux-signalisation-routiere',
  'Panneaux conformes aux normes CE et NF, disponibles en plusieurs classes rétroréfléchissantes. Idéaux pour les collectivités, mairies et gestionnaires de voirie.',
  null
)
on conflict do nothing;

-- 5. SEED PRODUCTS (images uploaded separately to storage/products/)
insert into products (category_id, name, slug, ref, price_ht, description, image_url) values
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'B14 - Panneau limitation de vitesse à 50 km/h',
  'b14-limitation-vitesse-50',
  '00065', 28.99,
  'Panneau de limitation de vitesse à 50 km/h conforme NF EN 12899-1. Aluminium rétroréfléchissant Classe 1 ou 2. Diamètre 500 mm.',
  null
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Panneau STOP - AB4',
  'panneau-stop-ab4',
  '00146', 34.99,
  'Panneau STOP octogonal conforme à la réglementation française. Disponible en Classe 1, 2 et 3. Côté 700 mm.',
  null
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'B1 - Panneau sens interdit',
  'b1-sens-interdit',
  '00108', 28.99,
  'Panneau sens interdit B1 en aluminium rétroréfléchissant. Diamètre 500 mm. Classe 1 ou 2.',
  null
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'B14 - Panneau limitation de vitesse à 30 km/h',
  'b14-limitation-vitesse-30',
  '01443', 28.99,
  'Panneau de zone 30 conforme NF EN 12899-1. Aluminium rétroréfléchissant Classe 1 ou 2. Diamètre 500 mm.',
  null
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'B14 - Panneau limitation de vitesse à 20 km/h',
  'b14-limitation-vitesse-20',
  '01442', 28.99,
  'Panneau de limitation à 20 km/h. Idéal pour zones résidentielles et aires piétonnes. Classe 1 ou 2.',
  null
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'B6a1 - Panneau stationnement interdit',
  'b6a1-stationnement-interdit',
  '00104', 28.99,
  'Interdiction de stationner B6a1. Aluminium rétroréfléchissant, diamètre 500 mm, Classe 1 ou 2.',
  null
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Panneau B6D - Arrêt et stationnement interdits',
  'b6d-arret-stationnement-interdits',
  '00107', 28.99,
  'Double interdiction arrêt et stationnement B6D. Panneau rond aluminium rétroréfléchissant Classe 1 ou 2.',
  null
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Panneau passage pour piétons - C20A',
  'c20a-passage-pietons',
  '00467', 31.99,
  'Signalisation de passage piéton C20A. Panneau carré 500x500 mm en aluminium rétroréfléchissant.',
  null
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'B9a - Panneau accès interdit aux piétons',
  'b9a-acces-interdit-pietons',
  '00052', 28.99,
  'Accès interdit aux piétons B9a. Panneau rond 500 mm, aluminium rétroréfléchissant Classe 1 ou 2.',
  null
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'B9b - Panneau accès interdit aux cycles',
  'b9b-acces-interdit-cycles',
  '00053', 28.99,
  'Accès interdit aux cycles B9b. Aluminium rétroréfléchissant, diamètre 500 mm, Classe 1 ou 2.',
  null
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'B3 - Panneau interdiction de doubler',
  'b3-interdiction-doubler',
  '00043', 28.99,
  'Interdiction de doubler tous les véhicules à moteur B3. Panneau rond 500 mm rétroréfléchissant.',
  null
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Panneau limitation de tonnage - B13',
  'b13-limitation-tonnage',
  '00063', 28.99,
  'Limitation de tonnage B13 personnalisable. Aluminium rétroréfléchissant Classe 1 ou 2, diamètre 500 mm.',
  null
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Panneau B12 - Limitation de hauteur',
  'b12-limitation-hauteur',
  '00062', 28.99,
  'Limitation de hauteur B12 personnalisable (de 2 m à 4,5 m). Aluminium rétroréfléchissant Classe 1 ou 2.',
  null
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'D21B - Panneau de signalisation directionnelle',
  'd21b-signalisation-directionnelle',
  '00469', 71.99,
  'Panneau directionnel D21B personnalisable. Aluminium avec texte et flèche rétroréfléchissants.',
  null
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'EB10 - Panneau Entrée d''Agglomération',
  'eb10-entree-agglomeration',
  '02118', 71.99,
  'Panneau entrée d''agglomération EB10 personnalisé avec le nom de votre commune. Aluminium rétroréfléchissant.',
  null
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'EB20 - Panneau Sortie d''Agglomération',
  'eb20-sortie-agglomeration',
  '02123', 71.99,
  'Panneau sortie d''agglomération EB20, barré en rouge. Personnalisable avec le nom de la commune.',
  null
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'B56 - Panneau Zone à Faibles Émissions',
  'b56-zone-faibles-emissions',
  '05373', 70.49,
  'Panneau ZFE B56 conforme à la réglementation 2021. Aluminium rétroréfléchissant avec vignette Crit''Air.',
  null
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'B51 - Panneau fin de zone à vitesse limitée à 30 km/h',
  'b51-fin-zone-30',
  '00110', 60.49,
  'Fin de zone 30 B51, panneau barré. Aluminium rétroréfléchissant Classe 1 ou 2, diamètre 500 mm.',
  null
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Panonceau M9z : Rappel',
  'panonceau-m9z-rappel',
  '02716', 20.49,
  'Panonceau de rappel M9z à fixer sous un panneau principal. Aluminium rétroréfléchissant 350x175 mm.',
  null
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Poteau déporté (potence)',
  'poteau-deporte-potence',
  '01379', 211.99,
  'Poteau déporté type potence pour panneaux en porte-à-faux. Acier galvanisé, hauteur minimale 2800 mm.',
  null
)
on conflict (ref) do nothing;

-- Done! Now upload images to Storage > products bucket
-- filename format: panneau-{ref}.jpg  (e.g. panneau-00065.jpg)
-- Then run 02_update_image_urls.sql
