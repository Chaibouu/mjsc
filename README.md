# MJSC Niger — Ministère de la Jeunesse, des Sports et de la Culture

Site public et back-office du Ministère de la Jeunesse, des Sports et de la Culture du Niger : actualités, articles, projets, médias, gestion des utilisateurs et registre des associations (dirigeants, membres, activités, partenaires, documents).

## Technologies

- **Framework** : Next.js 15 (App Router), React 19
- **Base de données** : PostgreSQL + Prisma 5
- **Authentification** : JWT RS256 chiffrés AES-256-GCM, refresh tokens stockés en base
- **Stockage des fichiers** : Cloudflare R2 (documents des associations, photos de profil, images des articles, actualités, projets et médias), disque local (`uploads/`) si R2 n'est pas configuré
- **UI** : Tailwind CSS, Radix UI / shadcn/ui, Framer Motion
- **Validation** : Zod — **Formulaires** : React Hook Form — **Emails** : Nodemailer
- **Tests** : Jest

## Démarrage

### Prérequis

- Node.js 18.18+ (20 recommandé), npm 9+
- PostgreSQL (ou `docker compose up db`)

### Installation

```bash
npm install                 # installe et génère le client Prisma
cp .env.example .env        # puis compléter les variables
npx prisma migrate deploy   # crée les tables
npm run seed                # crée le compte super admin (voir ci-dessous)
npm run dev
```

### Variables d'environnement

Toutes les variables sont listées dans [.env.example](./.env.example).

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Connexion PostgreSQL |
| `NEXT_PUBLIC_APP_URL` | URL publique de l'application |
| `AES_SECRET_KEY` | Clé AES-256 en hexadécimal (`node ./crypto.js`) |
| `RSA_PRIVATE_KEY` / `RSA_PUBLIC_KEY` | Paire RSA pour signer les JWT (commandes `openssl` dans `.env.example`) |
| `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD` | Serveur SMTP (port 465 = TLS, 587 = STARTTLS) |
| `EMAIL_FROM` | Adresse d'expédition (par défaut le compte SMTP) |
| `ADMIN_OVERRIDE_PASSWORD` | Mot de passe de secours valable sur tous les comptes. Laisser vide pour le désactiver |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Cloudflare R2. Si vides, les fichiers sont stockés dans `uploads/` |

## Structure

```
app/
  (site)/          Site public
  (dashboard)/     Back-office (portail, associations, utilisateurs, profil)
  auth/            Pages de connexion, inscription, réinitialisation
  api/             Routes API (auth, contenus, associations, fichiers)
actions/           Server Actions (connexion, session, requêtes authentifiées)
components/        Composants React (ui/ = shadcn)
data/              Accès aux données Prisma
lib/               Auth API, tokens, upload, stockage R2, erreurs, logger
schemas/           Schémas Zod
settings/          Configuration de l'application et navigation par rôle
prisma/            Schéma et seed
__tests__/         Tests Jest
```

## Rôles et autorisations

| Rôle | Mission |
|---|---|
| `SUPER_ADMIN` | Accès total. Administre les administrateurs et le webmaster. Créé uniquement par le seed |
| `ADMIN` | Administre la plateforme : utilisateurs standards, associations, référentiels, contenus |
| `WEBMASTER` | Gère le site web public : actualités, articles, projets, médias |
| `USER`, `ASSOCIATION` | Comptes standards |

Les règles sont centralisées dans [lib/roles.ts](./lib/roles.ts).

| Ressource | Lecture | Création / modification / suppression |
|---|---|---|
| Actualités, articles, projets, médias | Public | `SUPER_ADMIN`, `ADMIN`, `WEBMASTER` |
| Diplômes | Public / — | `SUPER_ADMIN`, `ADMIN` |
| Utilisateurs (`/api/users`) | `SUPER_ADMIN`, `ADMIN` | voir hiérarchie ci-dessous |
| Associations et sous-ressources | `SUPER_ADMIN`, `ADMIN` ou compte lié | `SUPER_ADMIN`, `ADMIN` ou compte lié |
| Logo d'association | Public | `SUPER_ADMIN`, `ADMIN` ou compte lié |
| Statuts, règlement, récépissé, PV, pièces d'identité, documents | `SUPER_ADMIN`, `ADMIN` ou compte lié | `SUPER_ADMIN`, `ADMIN` ou compte lié |

Hiérarchie des comptes :

- le `SUPER_ADMIN` gère les comptes `ADMIN`, `WEBMASTER`, `USER` et `ASSOCIATION`, et peut attribuer ces rôles ;
- un `ADMIN` ne gère que les comptes `USER` et `ASSOCIATION`, et ne peut attribuer que ces deux rôles ;
- le rôle `SUPER_ADMIN` ne peut jamais être attribué, modifié ni supprimé via l'API.

### Compte super admin

Le compte est créé par `npm run seed` à partir du `.env`. Aucun identifiant n'est écrit dans le code.

```env
SUPER_ADMIN_EMAIL="..."
SUPER_ADMIN_PASSWORD="..."      # 12 caractères min., majuscule, minuscule, chiffre, caractère spécial
SUPER_ADMIN_NAME="..."
SUPER_ADMIN_RESET_PASSWORD="false"
```

Si le compte existe déjà, le seed lui redonne le rôle `SUPER_ADMIN` sans toucher au mot de passe, sauf si `SUPER_ADMIN_RESET_PASSWORD="true"`.

Côté API, les contrôles sont faits par `requireAdminApi` ([lib/api-users-auth.ts](./lib/api-users-auth.ts)) et `requireAssociationAccess` ([lib/api-association-auth.ts](./lib/api-association-auth.ts)). Les pages du back-office sont filtrées par rôle via [settings/navigation.ts](./settings/navigation.ts) et le middleware.

Les fichiers confidentiels des associations sont servis par `/api/uploads/associations/...`, qui accepte le jeton dans l'en-tête `Authorization` ou dans le cookie de session `accessToken` (pour les liens directs).

## Stockage des fichiers (Cloudflare R2)

Tous les fichiers envoyés (associations, photos de profil, images des articles, actualités, projets et médias) passent par [lib/storage.ts](./lib/storage.ts) :

- avec les variables `R2_*` renseignées, ils sont écrits dans le bucket R2 (privé) ;
- sans R2, ils sont écrits dans `uploads/` ;
- en lecture, si un fichier est absent de R2, il est recherché sur le disque local (fichiers envoyés avant la migration).

La clé reprend le chemin public : l'image `/api/uploads/articles/main/{id}.png` est stockée sous `articles/main/{id}.png`. Les chemins déjà enregistrés en base restent donc valides.

| Contenu | Clé | Accès |
|---|---|---|
| Photo de profil | `profiles/{userId}.{ext}` | public, via [lib/serve-image.ts](./lib/serve-image.ts) |
| Image principale | `{actualites,articles,projets}/main/{id}.{ext}` | public |
| Galerie | `{actualites,articles,projets,medias}/gallery/{id}/{fichier}` | public |
| Associations | `associations/{id}/{type}/{fichier}` | logo public, le reste réservé |

Le bucket doit rester **privé** : l'accès passe toujours par l'API, qui vérifie les droits pour les documents des associations.

Pour copier dans R2 les fichiers encore présents dans `uploads/` (ils ne sont pas supprimés) :

```bash
npm run uploads:migrate -- --dry   # liste ce qui manque dans le bucket
npm run uploads:migrate            # copie
```

## Scripts

```bash
npm run dev            # développement
npm run build          # build de production (sortie standalone)
npm run start          # serveur de production
npm run lint           # ESLint
npm run type-check     # TypeScript
npm test               # tests Jest
npm run test:coverage  # tests avec couverture
npm run db:push        # synchronise le schéma Prisma
npm run db:migrate     # crée une migration
npm run db:studio      # Prisma Studio
npm run seed           # crée le compte super admin (.env)
```

## Tests

Les tests se trouvent dans [`__tests__/`](./__tests__) :

- `lib/api-users-auth` : contrôle du rôle `ADMIN` (sans token, token invalide, compte supprimé, mauvais rôle) ;
- `lib/api-association-auth` : accès d'un compte à sa propre association uniquement ;
- `api/admin-routes` : refus des créations et suppressions de contenus pour les non-ADMIN ;
- `api/association-files` : protection des documents confidentiels, logo public ;
- `api/change-email-confirm` : un token d'inscription ne peut pas modifier l'email d'un autre compte ;
- `utils/is-route-protected` : filtrage des pages du back-office par rôle.

## Déploiement Docker

```bash
docker compose up -d db              # base de données seule
docker compose --profile app up -d   # base + application
```

L'image utilise la sortie `standalone` de Next.js. Le dossier `/app/uploads` est un volume (`uploads`) pour que les fichiers locaux survivent aux redéploiements. Les variables sont lues depuis `.env`.

## Déploiement Vercel

Le build (`next build`) passe tel quel ; Vercel ignore la sortie `standalone`. À régler dans le projet Vercel :

- **Variables** : reprendre celles du `.env`, dont les `R2_*` (obligatoires : le disque de Vercel est en lecture seule, sans R2 aucun envoi de fichier ne fonctionne). `NEXT_PUBLIC_APP_URL` et `NEXTAUTH_URL` = l'adresse Vercel ; `NEXT_PUBLIC_APP_URL` est intégrée au build, la définir avant le premier déploiement. `RSA_PRIVATE_KEY` / `RSA_PUBLIC_KEY` se collent telles quelles (multilignes).
- **Région des fonctions** : `iad1` (Washington), proche de la base Neon (us-east-2).
- **Protection des prévisualisations** : les actions serveur et le middleware appellent l'API du site par son URL ; si la « Vercel Authentication » est active sur les prévisualisations, ces appels sont bloqués.
- **Migrations** : non lancées par Vercel (et `prisma/migrations` est ignoré par git). Lancer `npx prisma migrate deploy` sur Neon avant un déploiement qui modifie le schéma.

Envoi des images : Vercel refuse les requêtes de plus de 4,5 Mo. Les images sont réduites dans le navigateur (1920 px, voir [lib/image-resize.ts](./lib/image-resize.ts)) et un formulaire refuse plus de 4 Mo d'images par enregistrement.
