-- ============================================================
-- SILIUS — Taxonomy (N1/N2/N3) + full-text search
-- Idempotent. Reflects the live schema so the project is reproducible.
-- ============================================================

-- 1. TAXONOMY COLUMNS
-- The catalogue is organised by three free-text taxonomy levels carried on each
-- product row (rather than the legacy `categories` table / `category_id` FK).
alter table products add column if not exists category_n1 text;
alter table products add column if not exists category_n2 text;
alter table products add column if not exists category_n3 text;

create index if not exists idx_products_n1 on products (category_n1);
create index if not exists idx_products_n2 on products (category_n2);

-- 2. FULL-TEXT SEARCH (accent-insensitive)
-- Custom config = french stemmer + unaccent, so "barriere" and "barrière" match.
-- Targeted by supabase-js .textSearch('search_vector', ..., { config: 'fr_unaccent' }).
create extension if not exists unaccent;

drop text search configuration if exists fr_unaccent cascade;
create text search configuration fr_unaccent (copy = french);
alter text search configuration fr_unaccent
  alter mapping for hword, hword_part, word
  with unaccent, french_stem;

-- Stored generated tsvector covering name + ref + category_n2 + category_n3.
alter table products drop column if exists search_vector;
alter table products
  add column search_vector tsvector
  generated always as (
    to_tsvector(
      'fr_unaccent',
      coalesce(name, '') || ' ' ||
      coalesce(ref, '') || ' ' ||
      coalesce(category_n2, '') || ' ' ||
      coalesce(category_n3, '')
    )
  ) stored;

create index if not exists idx_products_search_vector
  on products using gin (search_vector);

-- 3. CATEGORY TREE RPC
-- Aggregates the n1/n2 taxonomy with product counts in a single round-trip so the
-- UI can build menus without fetching thousands of rows.
create or replace function public.get_category_tree()
returns table (category_n1 text, category_n2 text, product_count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select category_n1, category_n2, count(*)
  from products
  where active is true and category_n1 is not null
  group by category_n1, category_n2
  order by category_n1, count(*) desc
$$;

grant execute on function public.get_category_tree() to anon, authenticated;
