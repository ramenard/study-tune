# StudyTune

StudyTune transforme un cours (PDF ou texte libre) en musique de révision. L'utilisateur importe
un document, l'IA en tire une fiche de révision et des paroles (Mistral), puis génère une chanson
(Kie.ai / Suno). Les morceaux se rangent dans une bibliothèque et des playlists, se partagent entre
amis et s'écoutent dans un lecteur intégré avec paroles synchronisées façon karaoké.

Le projet est un monorepo npm workspaces : une API NestJS et un client Angular indépendants,
plus l'infrastructure Docker (PostgreSQL, MinIO).

## Stack

| Couche | Technologies |
|---|---|
| Frontend | Angular 21 (standalone, zoneless, signals, OnPush), Material, Tailwind 4, SDK généré (ng-openapi-gen) |
| Backend | NestJS 11, TypeORM 0.3 + migrations, PostgreSQL, MinIO, JWT, Joi, Terminus, Swagger |
| Infra | Docker Compose (PostgreSQL 16, MinIO), CI GitHub Actions |
| IA externes | Mistral (fiche + paroles + modération des entrées), Kie.ai / Suno (musique) |

## Prérequis

- Node.js 22+
- Docker et Docker Compose

## Démarrage rapide

```bash
# 1. Installer les dépendances (à la racine, workspaces)
npm install

# 2. Démarrer l'infrastructure (PostgreSQL + MinIO)
docker compose -f docker/docker-compose.yml up -d

# 3. Configurer l'API
cp api/.env.example api/.env   # puis renseigner JWT_SECRET, clés Mistral/Kie, etc.

# 4. Appliquer les migrations
npm run migration:run -w api

# 5. Lancer l'API et le client (deux terminaux)
npm run dev:api      # http://localhost:3001  (Swagger sur /docs)
npm run dev:client   # http://localhost:4200
```

## Scripts racine

| Script | Rôle |
|---|---|
| `npm run dev:api` | API NestJS en watch |
| `npm run dev:client` | Client Angular en dev |
| `npm run build` | Build API + client |
| `npm run lint` | Lint des deux workspaces |
| `npm run test` | Tests unitaires API |

## Stack complète en Docker

```bash
# Infra seule (dev local) : PostgreSQL + MinIO
docker compose -f docker/docker-compose.yml up -d

# Stack complète (démo/recette) : + API + client servi par nginx
docker compose -f docker/docker-compose.yml --profile full up --build
```

## Documentation

- [`docs/cahier-recettes.md`](docs/cahier-recettes.md) — cahier de recettes (scénarios de test)
- [`docs/plan-correction-bogues.md`](docs/plan-correction-bogues.md) — anomalies et corrections
- [`docs/manuel-deploiement.md`](docs/manuel-deploiement.md) — déploiement
- [`docs/manuel-utilisation.md`](docs/manuel-utilisation.md) — guide utilisateur
- [`docs/manuel-mise-a-jour.md`](docs/manuel-mise-a-jour.md) — montée de version
- [`docs/decisions.md`](docs/decisions.md) — décisions d'architecture et écarts Bloc 1
- [`CHANGELOG.md`](CHANGELOG.md) — historique des versions
