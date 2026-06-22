# Project Context — silius (Demo Prozon)

> Document de contexte projet pour les workflows **BMAD** (analyse → planning → solutioning → implementation).
> Source de vérité technique et métier que les agents BMAD doivent lire avant de produire BRD / PRD / Architecture / Stories.
> **Maintenu à jour** au fil des features. Dernière révision : 2026-06-22.

---

## 1. En une phrase

**Silius** est une application e-commerce **B2B** de démonstration pour **Prozon**, fournisseur de **fournitures techniques pour collectivités** (signalisation routière, mobilier urbain, EPI, aménagement). Catalogue, recherche, navigation par taxonomie, panier et tunnel de commande — sans paiement réel.

## 2. Contexte métier

- **Clients cibles** : collectivités, mairies, gestionnaires de voirie, acheteurs publics, chantiers (≈ 99 % B2B).
- **Produits** : **catalogue Prozon complet répliqué** — ~5 400 produits actifs, réf. & prix **réels** (snapshot 02/06/2026), répartis sur la taxonomie 7 N1 / 41 N2 / 151 N3 (signalisation, mobilier urbain, EPI, aménagement, etc.).
- **Logistique B2B** : flux palette (messagerie / affrètement), livraison sur RDV, hayon — pas du colis B2C. Tracking via **ShipUp** (plateforme externe, historique livraisons entrepôt).
- **Enjeux** : confiance sur la promesse de délai, conversion fiche → panier, sécurisation des marchés publics (contraintes de délai contractuelles).

## 3. Stack technique

| Couche | Techno | Notes |
|---|---|---|
| Framework | **Next.js 14** (App Router) | Server Components par défaut |
| Langage | **TypeScript** (strict) | alias `@/*` → racine projet |
| UI | **React 18** + **Tailwind CSS** | design tokens Prozon custom (`tailwind.config.js`) |
| Icônes | **lucide-react** | |
| Backend / DB | **Supabase** (Postgres + Storage + RLS) | projet `dkdvzxtfcpldekhhiies` |
| Auth | Mot de passe d'accès démo (cookie) + `next-auth` (présent, peu utilisé) | voir `middleware.ts` |
| Déploiement | **Vercel** (CI continu sur `main`) | |

**Dépendances clés** : `@supabase/supabase-js`, `next-auth`, `lucide-react`. Pas de couche ORM — accès SQL direct via le client Supabase et des **RPC Postgres**.

## 4. Architecture & arborescence

```
app/                       # App Router (pages = Server Components sauf 'use client')
  page.tsx                 # Accueil : hero + catégories + recherche globale
  category/[slug]/page.tsx # Listing produits d'une catégorie N1 (slug)
  product/[slug]/page.tsx  # Fiche produit  ← contient le "délai d'envoi" ALÉATOIRE (à remplacer)
  cart/page.tsx            # Panier (client-side)
  checkout/page.tsx        # Tunnel commande (sans paiement)
  login/page.tsx           # Accès démo par mot de passe
  admin/                   # Back-office (produits, recherches clients)
    produits/page.tsx
    recherches/page.tsx    # Log de recherches clients (RGPD-anonyme)
  api/login/route.ts       # POST mot de passe → cookie 'demo-access'
components/                # Composants partagés (Header, Footer, ProductCard, recherche…)
lib/
  supabase.ts              # Client Supabase + types (Category, Product) + PRODUCT_COLUMNS
  taxonomy.ts              # Arbre de catégories N1/N2/N3, slugify, RPC get_category_tree
  search.ts                # searchProducts() (RPC search_products + fallback ilike) + logSearch()
  cart.tsx                 # Contexte panier client-side
sql/                       # Migrations versionnées (à exécuter dans Supabase SQL Editor)
  01_schema_and_seed.sql   # tables, RLS, bucket Storage, seed initial 20 produits (démo)
  02_update_image_urls.sql
  03_taxonomy_and_search.sql  # colonnes category_n1/n2/n3, search_vector, RPC
  04_search_log.sql        # table search_queries (log anonyme)
product_images/            # Images produit (upload manuel → bucket Storage 'products')
middleware.ts              # Garde d'accès démo (cookie 'demo-access')
```

## 5. Modèle de données (Supabase / Postgres)

**`categories`** : `id (uuid)`, `name`, `slug (unique)`, `description`, `image_url`, `created_at`.

**`products`** : `id (uuid)`, `category_id → categories.id`, `name`, `slug (unique)`, `ref (unique)`, `price_ht numeric(10,2)`, `description`, `image_url`, `stock int`, `active bool`, `created_at`, **`category_n1` / `category_n2` / `category_n3` (text)** — taxonomie à 3 niveaux stockée à plat, + `search_vector (tsvector)` indexé GIN (non envoyé au client, cf. `PRODUCT_COLUMNS`).

**`search_queries`** : log de recherche **RGPD-anonyme** — uniquement `term`, `results_count`, `scope` (jamais d'identifiant, IP ou session).

**RPC Postgres** : `get_category_tree` (arbre N1/N2 + counts), `search_products` (full-text français accent-insensible, `ts_rank_cd` pondéré name/ref > catégorie).

**RLS** : lecture publique sur tout ; écritures `anon` autorisées (contexte démo — **à durcir** en prod réelle). Bucket Storage `products` public en lecture.

> ✅ **Socle d'appro livré (V1, EPIC-1)** — `sql/05_supply_data.sql` (joué en base) : `products.supply_type` (enum 4 typologies, nullable → fallback), `products.supplier_id` (fk), `products.force_long_delay` (+ `_at`/`_by` d'audit) ; table **`suppliers`** (seedée, curatée — seul `force_long_delay` éditable) ; table **`transit_params`** (conservée pour EPIC-6, **non lue** par le moteur V1). `PRODUCT_COLUMNS` étendu aux 3 champs de calcul (jamais les colonnes d'audit). Le reste de l'ancienne dette (lead time, origine, MOQ, fraîcheur stock) reste **hors V1** (post-MVP / EPIC-6).
> **Nuance (BRD §2.2/§2.4)** : cette dette concernait surtout le **dropshipping / sur-commande** (amont fournisseur). Pour le **stock propre Prozon**, la donnée logistique existe via **ShipUp** ; en V1 le délai `prozon_stock` est toutefois une **valeur fixe prudente (J+5 ouvrés)**, non dérivée du P90 (calibration ShipUp reportée post-MVP).

## 6. Conventions de code

- **Server Components par défaut** ; `'use client'` uniquement si interactivité (panier, recherche live).
- **Accès données** : passer par `lib/` (`searchProducts`, `getCategoryTree`, client `supabase`). Sélectionner via `PRODUCT_COLUMNS` (évite d'expédier `search_vector`).
- **Slugs** : `slugify()` de `lib/taxonomy.ts` (accent-insensible, URL-safe). Ne pas réinventer.
- **Recherche** : une seule logique partagée (`searchProducts`) pour toutes les barres de recherche ; seul le `scope` (global vs catégorie N1) change.
- **SQL** : nouvelles migrations = nouveau fichier numéroté `sql/0X_*.sql`, idempotent (`if not exists`, `on conflict`), exécuté à la main dans le SQL Editor Supabase.
- **Commits** : style Conventional (`feat:`, `fix:`…), messages en français, scopés à une feature.
- **Langue** : code/commentaires en anglais ; UI, contenu produit et docs métier en français.

## 7. Feature en cours — « Délai de livraison estimé fiable »

**Phase BMAD actuelle : Implémentation V1 livrée — EPIC-1 → EPIC-4 (affichage fiche uniquement, paramètres verrouillés J+5 / J+4→+2 / J+6→+3 ouvrés / 5–7 sem.).** Planning amont : BRD v0.5, PRD v0.13, UX v0.9, stories v0.2, test-plan v0.4.

**Code livré :** `sql/05_supply_data.sql` (socle data, joué) · `lib/delivery.ts` (`estimateDelivery()` pur + déterministe, `addBusinessDays`, gabarits FR centralisés, fériés FR 2026 injectables) · `components/DeliveryEstimate.tsx` (3 variantes, icône camion homogène) · fiche `app/product/[slug]/page.tsx` (aléatoire **supprimé**) · back-office `app/admin/produits` (bloc appro + aperçu live) & `app/admin/fournisseurs` (toggle délai long). Jeu de test QA : `sql/seed_test_delivery.sql` (`ZZ-TEST-`, `active=false`). **Hors V1 :** EPIC-5 (mesure/A-B), EPIC-6 (ShipUp dropship), affichage checkout.

- **Problème** : la fiche produit (`app/product/[slug]/page.tsx`, l.25-32) affiche « Envoi entre le {d1} et le {d2} » avec des dates **tirées au hasard à chaque rendu** (`today + 8..60 j`, fin `+ 3..14 j`) — aucun lien avec le stock ou le fournisseur, change à chaque rechargement.
- **Cible** : remplacer par un **délai estimé piloté par des règles métier**, segmenté par **typologie d'approvisionnement** (stock Prozon / dropship FR / dropship EU / Asie-sur-commande), avec un affichage **calibré à la fiabilité** (date ferme ↔ fourchette ↔ message prudent).
- **Preuves** : pilote A/B → conversion fiche produit **3 % → 10 %** sur le stock entrepôt ; historique **ShipUp** disponible (P50 3 j, P90 6 j, on-time ~91 %) pour calculer une date fiable sur le stock Prozon.
- **Périmètre MVP** : modèle de données d'appro sur `products`, moteur de calcul par typologie, composant d'affichage 3 états, remplacement de l'aléatoire. **Hors MVP** : tracking temps réel post-achat, EDI fournisseur, dernier km optimisé, retours.
- **Artefacts de planning** : [`brd-delai-livraison-estime.md`](../_bmad-output/planning-artifacts/brd-delai-livraison-estime.md) (analyse — objectifs O1–O5, typologies, contraintes C1–C5) · [`prd-delai-livraison-estime.md`](../_bmad-output/planning-artifacts/prd-delai-livraison-estime.md) (PRD v0.10 — décisions D1–D11, exigences FR1–FR18, modèle de données V1 minimal, moteur, epics, §14 ShipUp dropship) · [`ux-delai-livraison-estime.md`](../_bmad-output/planning-artifacts/ux-delai-livraison-estime.md) (UX v0.8 — 3 variantes, flux fiche/checkout D6, back-office, contrat `DeliveryEstimate`) · [`stories-delai-livraison-estime.md`](../_bmad-output/planning-artifacts/stories-delai-livraison-estime.md) (backlog US par épopée EPIC-1→6) · [`test-plan-delai-livraison-estime.md`](../_bmad-output/planning-artifacts/test-plan-delai-livraison-estime.md) (plan de test QA v0.4 — périmètre **fiche uniquement + EPIC-1→4**, paramètres de délai **verrouillés** (J+5 / J+4→+2 / J+6→+3 ouvrés, sans P90 ni cutoff), cas mappés FR1–FR18, **exigences de testabilité §10 pour l'archi**) — **lire en priorité**.

## 8. Organisation BMAD du projet

- **Module actif** : `bmm` (software-development). Sorties → `_bmad-output/` (`planning-artifacts/`, `implementation-artifacts/`). Connaissance projet → `docs/`.
- **Équipe BMAD de base** : Mary (Analyst 📊), John (PM 📋), Sally (UX 🎨), Winston (Architect 🏗️), Amelia (Dev 💻), Paige (Tech Writer 📚) + ajouts Sarah (PO 📝), Quinn (QA 🧪).
- **Personas parties prenantes** (`_bmad/custom/agents/`, team `silius-delai-livraison`) : **Lucas** (Acheteur/Supply 📦), **SinoTech** (Fournisseur dropshipping 🚢), **Sophie** (Category Manager 🗂️) — voix métier à mobiliser pour cette feature.
- **Config** : `_bmad/config.toml` (généré, lecture seule) ; overrides durables dans `_bmad/custom/config.toml`. User : Bruno, niveau intermédiaire.

## 9. État actuel & limites connues

- **Catalogue Prozon complet en base** (~5 400 produits actifs, taxonomie 7 N1 / 41 N2 / 151 N3) ; recherche full-text FR + navigation taxonomie opérationnelles. Ces données vivent **directement dans Supabase**, pas dans le SQL committé (`sql/01_*.sql` ne contient que 20 produits de démo). Le catalogue n'est donc pas reconstructible depuis le repo — **fait connu, sans impact** : la base est la source de vérité et persiste pour la durée du projet (démonstrateur). Pas de travail de seed/export prévu.
- Auth = simple mot de passe d'accès démo (cookie), pas de comptes utilisateurs réels.
- Pas de paiement (checkout vitrine). Pas de tests automatisés. RLS permissive (démo).
- Données d'approvisionnement **désormais en base** (V1, cf. §5/§7) ; catalogue réel **non encore classé** (les ~5 400 produits ont `supply_type` NULL → fallback prudent « sur commande », jamais d'aléatoire). Classification au fil de l'eau via le back-office (US-4.6).

---

*Référez-vous à ce document et au BRD avant de produire tout artefact BMAD. Mettre à jour ce fichier quand le modèle de données, la stack ou le périmètre évoluent.*
