# La Décadente

Agenda collaboratif de la culture alternative à Lausanne et dans le canton de Vaud (jusqu'à Morges à l'ouest).
Next.js 16, PostgreSQL (Drizzle), Three.js pour l'easter egg, Leaflet + OpenStreetMap pour la carte.

Made with Lust by Dark Lélé.

## Lancer le site en local

Il faut Node 22 et Docker Desktop.

```bash
npm install
cp .env.example .env          # puis remplir si besoin
npm run db:up                 # base de données PostgreSQL dans Docker
npm run db:migrate            # crée les tables
npm run db:seed               # lieux, collectifs et événements de démo
npm run admin:create -- ton@email.ch "Ton pseudo"
npm run dev                   # http://localhost:3000
```

## Commandes utiles

| Commande | Effet |
|---|---|
| `npm run dev` | Site en local avec rechargement automatique |
| `npm run check` | Types, lint, tests et failles connues des dépendances |
| `npm test` | Tests seulement |
| `npm run build` puis `npm start` | Version de production |
| `npm run db:generate` puis `npm run db:migrate` | Après une modification de `src/db/schema.ts` |
| `npm run db:seed` | Met à jour les lieux et collectifs de `scripts/data.ts` et recrée les événements de démo |
| `npm run db:purge-demo` | Supprime tous les événements fictifs de démo |
| `npm run venues:geocode` | Ajoute les coordonnées (carte) aux lieux qui n'en ont pas |
| `npm run admin:create -- email "Nom"` | Crée un compte admin, ou passe un compte existant admin |

## Où est quoi

- `src/app/` : les pages (agenda `page.tsx`, `evenement/`, `lieu/`, `collectif/`, `lieux/`, `carte/`, `ajouter/`, `admin/`, `charte/`, `a-propos/`, `contact/`, `merci/`)
- `src/components/` : fenêtre, barre des tâches et menu Démarrer, apparence, trou noir (`BlackHole.tsx`), logo (`Devil.tsx`)
- `src/lib/blocklist.ts` : **les mots du filtre de modération** (à compléter au fil du temps)
- `src/lib/geocode.ts` : la zone couverte (refus à l'ouest de Morges)
- `src/lib/taxonomy.ts` : types d'événements, genres musicaux, accessibilité
- `src/db/schema.ts` : la base de données
- `scripts/data.ts` : lieux et collectifs de départ

## Modération

- Les ajouts demandent un compte et sont publiés tout de suite.
- Un filtre de mots refuse les insultes et slogans haineux (`BLOCKED`, `BLOCKED_PHRASES`) et signale à l'admin les mots souvent réappropriés (`SENSITIVE`).
- L'admin (et les personnes avec le rôle « modération ») peut supprimer depuis `/admin`. Les rôles se donnent dans `/admin`.

## Sécurité

- Mots de passe chiffrés (bcrypt), sessions en cookie `httpOnly`, limite des tentatives de connexion et des ajouts.
- Politique de contenu (CSP) stricte avec nonce, et en-têtes de sécurité dans `src/proxy.ts`.
- `npm run check` vérifie les failles connues des dépendances utilisées en production.
- `.github/workflows/ci.yml` relance tests et contrôles à chaque modification et chaque lundi, avec l'analyse CodeQL.
  `.github/dependabot.yml` propose les mises à jour de sécurité. Les deux s'activent quand le code est sur GitHub.

## Avant la mise en ligne (Infomaniak)

1. `npm run db:purge-demo` sur la base de production (ou ne jamais lancer le seed de démo en production).
2. Compléter les adresses « à compléter » dans `scripts/data.ts` ou depuis l'admin.
3. `APP_URL` = l'adresse définitive (sitemap, liens, données pour Google).
4. Changer le mot de passe admin provisoire depuis `/compte`.
5. Brancher l'envoi des messages de contact vers Gmail via la messagerie Infomaniak (SMTP), aujourd'hui ils arrivent dans `/admin`.
6. Hébergement Node.js Infomaniak + base PostgreSQL : `npm ci && npm run db:migrate && npm run build && npm start`.
