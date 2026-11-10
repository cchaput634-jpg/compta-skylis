# Trésor de Skylis — Compta de la Nation du vent

Site web de comptabilité pour la Nation du vent de Skylis :
registre des citoyens, dons reçus, dépenses de la nation.
Auth Discord + rôles & permissions granulaires (comme la Bibliothèque).

Stack : Vite + React 19 + TypeScript + Tailwind v4 + Cloudflare Pages + D1.

## Développement local

1. Installer les deps : `npm install`
2. Créer la base D1 locale : `npm run db:init:local`
3. Démarrer Vite (frontend) : `npm run dev`
4. Dans un autre terminal, démarrer Wrangler Pages (API) : `npm run dev:api`
5. Ouvrir **http://127.0.0.1:8787** (pas 5178 — Wrangler est l'entrée)

Le fichier `.dev.vars` (gitignoré) contient `DISCORD_CLIENT_ID`,
`DISCORD_CLIENT_SECRET` et `APP_URL=http://127.0.0.1:8787` pour le dev local.

## Discord OAuth — Redirect URIs à configurer

Dans **https://discord.com/developers/applications** → ton app → **OAuth2**,
onglet **Redirects**, ajoute :

- `http://127.0.0.1:8787/api/auth/callback` (dev local)
- `https://skylis-compta.pages.dev/api/auth/callback` (prod — ajuste l'URL)

## Déploiement Cloudflare Pages

1. Créer la DB D1 :
   ```
   npx wrangler d1 create skylis-compta-db
   ```
   Copie le `database_id` renvoyé dans `wrangler.jsonc`.

2. Pousser le schéma :
   ```
   npm run db:init:remote
   ```

3. Poser le secret Discord :
   ```
   npx wrangler pages secret put DISCORD_CLIENT_SECRET --project-name=skylis-compta
   ```

4. Ajuster `APP_URL` dans `wrangler.jsonc` à l'URL de prod.

5. Déployer :
   ```
   npm run deploy
   ```

## Permissions

- `manage_users` — accès au panneau admin (rôles + utilisateurs)
- `citizens.view` / `citizens.edit` — registre des citoyens
- `donations.view` / `donations.edit` — dons au Trésor
- `expenses.view` / `expenses.edit` — dépenses de la nation

Le **premier utilisateur** qui se connecte est automatiquement promu
**Super Admin** (tous les droits implicitement). Après ça, il attribue
les rôles aux suivants depuis l'onglet « Administration ».

## Changer la devise

Dans `src/lib/config.ts`, modifie la constante `CURRENCY` (par défaut `Souffles`).
