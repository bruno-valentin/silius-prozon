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

-- Stored generated tsvector, weighted per field so relevance ranking favours a
-- name/ref match over a category match (ts_rank_cd weights A=1.0,B=0.4,C=0.2).
alter table products drop column if exists search_vector;
alter table products
  add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('fr_unaccent', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('fr_unaccent', coalesce(ref, '')), 'A') ||
    setweight(to_tsvector('fr_unaccent', coalesce(category_n2, '')), 'B') ||
    setweight(to_tsvector('fr_unaccent', coalesce(category_n3, '')), 'C')
  ) stored;

create index if not exists idx_products_search_vector
  on products using gin (search_vector);

-- Relevance-ranked search used by every search bar (ts_rank_cd desc, price asc).
-- p_scope null = global; otherwise restricts to a top-level category (n1).
create or replace function public.search_products(
  p_term text,
  p_scope text default null,
  p_limit int default 100
)
returns setof products
language sql
stable
security invoker
set search_path = public
as $$
  select p.*
  from products p,
       websearch_to_tsquery('fr_unaccent', p_term) as q
  where p.active is true
    and (p_scope is null or p.category_n1 = p_scope)
    and p.search_vector @@ q
  order by ts_rank_cd(p.search_vector, q) desc, p.price_ht asc
  limit greatest(1, least(coalesce(p_limit, 100), 200))
$$;

grant execute on function public.search_products(text, text, int) to anon, authenticated;

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
