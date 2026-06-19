-- ============================================================
-- SILIUS — Anonymous customer-search log + back-office stats
-- Idempotent. Mirrors the live schema so the project is reproducible.
-- ============================================================

-- 1. RAW LOG
-- One row per committed customer search. GDPR by design: stores ONLY the typed
-- term, an optional scope, the result count and a timestamp. No user id, no
-- session, no IP, no persona link — nothing here can re-identify who searched.
create table if not exists public.search_queries (
  id uuid primary key default gen_random_uuid(),
  term text not null,
  scope text,                       -- top-level category if scoped, else null (global)
  results_count integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_search_queries_created_at on public.search_queries (created_at desc);
create index if not exists idx_search_queries_term_lower on public.search_queries (lower(term));

alter table public.search_queries enable row level security;

-- Permissive policies, consistent with the rest of this demo schema.
drop policy if exists "public read search_queries" on public.search_queries;
create policy "public read search_queries" on public.search_queries for select using (true);

drop policy if exists "anon insert search_queries" on public.search_queries;
create policy "anon insert search_queries" on public.search_queries for insert with check (true);

-- 2. AGGREGATED STATS VIEW
-- One row per normalised (lower-cased) keyword: how many times searched, when
-- last, and how many products the most recent search returned (0 = unmet demand).
-- security_invoker so the table's public-read RLS policy still governs access.
create or replace view public.search_query_stats
with (security_invoker = true) as
select
  lower(term)                                                as term,
  count(*)::int                                              as search_count,
  max(created_at)                                            as last_searched,
  (array_agg(results_count order by created_at desc))[1]     as last_results_count
from public.search_queries
group by lower(term);

grant select on public.search_query_stats to anon, authenticated;
