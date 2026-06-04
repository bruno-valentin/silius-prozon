# Silius — Demo Prozon

Application e-commerce B2B pour fournitures techniques de collectivités.  
Stack : **Next.js 14 + Supabase + Vercel + Tailwind CSS**

---

## ⚡ Démarrage en 5 étapes

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer les variables d'environnement

Créer `.env.local` à la racine (déjà présent, compléter la clé) :

```env
NEXT_PUBLIC_SUPABASE_URL=https://dkdvzxtfcpldekhhiies.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<votre_clé_anon>
```

### 3. Initialiser Supabase

Aller dans le **SQL Editor** de votre dashboard Supabase :  
`https://supabase.com/dashboard/project/dkdvzxtfcpldekhhiies/sql`

**Étape 3a** — Coller et exécuter `sql/01_schema_and_seed.sql`  
→ Crée les tables, les policies RLS, le bucket Storage, et insère les 20 produits.

### 4. Uploader les images produits

Dans Supabase dashboard → **Storage → products** :  
Uploader les 20 fichiers du dossier `product_images/` :

```
panneau-00043.jpg  panneau-00104.jpg  panneau-00469.jpg
panneau-00052.jpg  panneau-00107.jpg  panneau-01379.jpg
panneau-00053.jpg  panneau-00108.jpg  panneau-01442.jpg
panneau-00062.jpg  panneau-00110.jpg  panneau-01443.jpg
panneau-00063.jpg  panneau-00146.jpg  panneau-02118.jpg
panneau-00065.jpg  panneau-00467.jpg  panneau-02123.jpg
panneau-02716.jpg  panneau-05373.jpg
```

**Étape 4b** — Retourner dans le SQL Editor, exécuter `sql/02_update_image_urls.sql`  
→ Met à jour les `image_url` de tous les produits avec les URLs publiques Supabase.

### 5. Lancer en local

```bash
npm run dev
# → http://localhost:3000
```

---

## 🚀 Déployer sur Vercel

```bash
# 1. Pusher sur GitHub
git init && git add . && git commit -m "init silius"
git remote add origin https://github.com/<user>/silius-prozon.git
git push -u origin main

# 2. Dans Vercel dashboard → New Project → importer le repo
# 3. Settings → Environment Variables → ajouter :
#    NEXT_PUBLIC_SUPABASE_URL = https://dkdvzxtfcpldekhhiies.supabase.co
#    NEXT_PUBLIC_SUPABASE_ANON_KEY = <votre_clé>
# 4. Deploy ✓
```

---

## 🗺️ Structure des pages

| URL | Description |
|-----|-------------|
| `/` | Accueil — hero + catégories |
| `/category/panneaux-signalisation-routiere` | Listing 20 produits |
| `/product/[slug]` | Fiche produit détaillée |
| `/cart` | Panier (client-side) |
| `/checkout` | Tunnel commande (sans paiement) |
| `/admin` | Back-office add/edit produits |

---

## 🗄️ Structure Supabase

```
categories        products
─────────────     ─────────────────
id (uuid)         id (uuid)
name              category_id → categories.id
slug              name, slug, ref
description       price_ht
image_url         description, image_url
created_at        stock, active
                  created_at

Storage bucket: products/
  └── panneau-{ref}.jpg
```

---

## 📦 Stack technique

- **Next.js 14** App Router + Server Components
- **Supabase** Postgres + Storage + RLS
- **Tailwind CSS** + custom Prozon design tokens
- **Vercel** déploiement continu
- Données : catalogue Prozon 02/06/2026 — réf. & prix 100% réels
