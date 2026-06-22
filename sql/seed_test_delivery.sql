-- ============================================================
-- SILIUS — QA reference dataset for the delivery estimate engine
-- NOT part of the production migrations — run by hand for manual QA only.
-- Mirrors test-plan §4.2 / §4.3. All rows prefixed ZZ-TEST- (filterable, removable).
-- Products are created active=false: reachable by direct /product/<slug> URL for
-- review, but excluded from customer search/listings (search_products filters active).
--
-- Reference visit date for expected outputs: Monday 2026-06-22 (test-plan §4.1).
--   P-STOCK        -> firm     -> "Livraison estimée le lun. 29 juin"
--   P-DFR          -> range    -> "entre le 26/06 et le 30/06"
--   P-DEU          -> range    -> "entre le 30/06 et le 03/07"
--   P-MTO / *FORCE / *SUPKO / P-NULL -> cautious -> "Expédié sous 5 à 7 semaines"
--
-- Cleanup:  delete from products where ref like 'ZZ-TEST-%';
--           delete from suppliers where name like 'ZZ-TEST %';
-- ============================================================

-- Test suppliers (deterministic ids; SUP-FR-KO carries the supplier-level force flag)
insert into public.suppliers (id, name, country, default_supply_type, force_long_delay) values
  ('22222222-0000-0000-0000-0000000000f1', 'ZZ-TEST Fournisseur FR',         'FR', 'dropship_fr',   false),
  ('22222222-0000-0000-0000-0000000000e1', 'ZZ-TEST Fournisseur UE',         'DE', 'dropship_eu',   false),
  ('22222222-0000-0000-0000-0000000000f0', 'ZZ-TEST Fournisseur defaillant', 'FR', 'dropship_fr',   true),
  ('22222222-0000-0000-0000-0000000000a1', 'ZZ-TEST Fournisseur import',     'CN', 'made_to_order', false)
on conflict (id) do nothing;

-- Test products — coverage matrix (test-plan §4.3)
insert into public.products (name, slug, ref, price_ht, stock, active, supply_type, supplier_id, force_long_delay) values
  ('ZZ-TEST Produit stock Prozon',            'zz-test-stock',        'ZZ-TEST-STOCK',    10.00, 100, false, 'prozon_stock',  null,                                     false),
  ('ZZ-TEST Produit stock force delai long',  'zz-test-stock-force',  'ZZ-TEST-FORCE',    10.00, 100, false, 'prozon_stock',  null,                                     true),
  ('ZZ-TEST Produit dropship France',         'zz-test-dfr',          'ZZ-TEST-DFR',      10.00, 100, false, 'dropship_fr',   '22222222-0000-0000-0000-0000000000f1',   false),
  ('ZZ-TEST Produit dropship Europe',         'zz-test-deu',          'ZZ-TEST-DEU',      10.00, 100, false, 'dropship_eu',   '22222222-0000-0000-0000-0000000000e1',   false),
  ('ZZ-TEST Produit fournisseur defaillant',  'zz-test-dfr-supko',    'ZZ-TEST-SUPKO',    10.00, 100, false, 'dropship_fr',   '22222222-0000-0000-0000-0000000000f0',   false),
  ('ZZ-TEST Produit sur commande',            'zz-test-mto',          'ZZ-TEST-MTO',      10.00, 100, false, 'made_to_order', '22222222-0000-0000-0000-0000000000a1',   false),
  ('ZZ-TEST Produit type herite fournisseur', 'zz-test-inherit',      'ZZ-TEST-INHERIT',  10.00, 100, false, null,            '22222222-0000-0000-0000-0000000000e1',   false),
  ('ZZ-TEST Produit non qualifie (fallback)', 'zz-test-null',         'ZZ-TEST-NULL',     10.00, 100, false, null,            null,                                     false)
on conflict (ref) do nothing;
