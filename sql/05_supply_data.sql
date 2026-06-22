-- ============================================================
-- SILIUS — Supply data for the reliable delivery estimate (EPIC-1)
-- Feature: "délai de livraison estimé fiable" (V1, fiche produit only).
-- Idempotent. Paste in Supabase SQL Editor and Run. Mirrors the live schema.
--
-- Scope locked 2026-06-22 (see test-plan §3.5 / §4.4):
--   - 4 supply typologies driving the display rule (engine = lib/delivery.ts)
--   - prozon_stock delay = fixed prudent value (J+5 business days), NOT P90-derived
--   - no preparation cutoff ; no zone delta (no checkout in V1)
--   - transit_params kept for the post-MVP ShipUp integration (EPIC-6) but the
--     V1 engine does NOT read transit_p90_days / last_mile_delta_days.
-- ============================================================

-- 1. ENUM — supply typology
-- Wrapped so the migration can be replayed without error.
do $$
begin
  create type supply_type as enum (
    'prozon_stock',   -- own warehouse stock      -> firm date
    'dropship_fr',    -- French partner supplier   -> short range
    'dropship_eu',    -- EU partner supplier        -> medium range
    'made_to_order'   -- import / made to order     -> cautious (long delay + quote)
  );
exception
  when duplicate_object then null;
end
$$;

-- 2. SUPPLIERS (seeded, curated — no full CRUD in V1, only the force_long_delay toggle is editable)
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,                                  -- ISO country code (transport leg hint)
  default_supply_type supply_type not null default 'made_to_order',  -- inherited by its products
  force_long_delay boolean not null default false,                   -- flips ALL its products to cautious
  force_long_delay_at timestamptz,               -- audit (who/when) — public-markets traceability (O3)
  force_long_delay_by text,
  created_at timestamptz not null default now()
);

-- 3. TRANSIT PARAMETERS (ShipUp-derived) — preserved for EPIC-6, unused by the V1 engine
create table if not exists public.transit_params (
  flow text not null,                            -- express_b2b | messagerie_palette | affretement_mobilier
  zone text not null,                            -- metropole | corse_montagne | rdv_hayon
  transit_p90_days int,                          -- P90 transit (never the median)
  last_mile_delta_days int not null default 0,   -- last-mile delta per zone (D3)
  primary key (flow, zone)
);

-- 4. PRODUCTS — supply columns (all nullable / safe defaults; existing 5 400+ rows unaffected)
alter table public.products add column if not exists supply_type supply_type;            -- null => engine fallback (cautious)
alter table public.products add column if not exists supplier_id uuid references public.suppliers(id) on delete set null;
alter table public.products add column if not exists force_long_delay boolean not null default false;
alter table public.products add column if not exists force_long_delay_at timestamptz;     -- audit (who/when)
alter table public.products add column if not exists force_long_delay_by text;

create index if not exists idx_products_supplier_id on public.products (supplier_id);

-- 5. RLS — public read everywhere; writes consistent with the existing demo policies
alter table public.suppliers enable row level security;
alter table public.transit_params enable row level security;

drop policy if exists "public read suppliers" on public.suppliers;
create policy "public read suppliers" on public.suppliers for select using (true);
-- Only the force_long_delay toggle is edited from the back-office (Lucas can react live).
drop policy if exists "anon update suppliers" on public.suppliers;
create policy "anon update suppliers" on public.suppliers for update using (true);
drop policy if exists "anon insert suppliers" on public.suppliers;
create policy "anon insert suppliers" on public.suppliers for insert with check (true);

drop policy if exists "public read transit_params" on public.transit_params;
create policy "public read transit_params" on public.transit_params for select using (true);

-- 6. SEED SUPPLIERS (curated, deterministic ids => idempotent)
-- One supplier per delivery typology, so a product inherits its type from its supplier
-- (products.supply_type left null = inherited; set = override). The own-warehouse source
-- (prozon_stock) is modelled as a supplier too, to carry the firm-date typology.
insert into public.suppliers (id, name, country, default_supply_type) values
  ('5d000000-0000-0000-0000-0000000000b1', 'Prozon — Entrepôt (stock propre)', 'FR', 'prozon_stock'),
  ('5d000000-0000-0000-0000-0000000000f1', 'Fournisseur partenaire France',    'FR', 'dropship_fr'),
  ('5d000000-0000-0000-0000-0000000000e1', 'Fournisseur partenaire Europe',    'DE', 'dropship_eu'),
  ('5d000000-0000-0000-0000-0000000000a1', 'Fournisseur import (sur commande)', 'CN', 'made_to_order')
on conflict (id) do nothing;

-- 7. SEED TRANSIT PARAMS (BRD §2.4: P50 3 j, P90 6 j, zone deltas) — reference data for EPIC-6
insert into public.transit_params (flow, zone, transit_p90_days, last_mile_delta_days) values
  ('express_b2b',        'metropole',      3, 0),
  ('messagerie_palette', 'metropole',      6, 0),
  ('messagerie_palette', 'corse_montagne', 6, 3),
  ('messagerie_palette', 'rdv_hayon',      6, 2)
on conflict (flow, zone) do nothing;
