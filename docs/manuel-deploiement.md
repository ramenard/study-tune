# Manuel de déploiement

## Choix technologiques et raisons

Le déploiement repose sur **Docker Compose** : PostgreSQL et MinIO sont des images officielles,
l'API et le client sont construits en images multi-stage (build puis runtime allégé — Node pour
l'API, nginx pour le client). Ce choix rend l'environnement reproductible et indépendant de la
machine hôte. Les migrations **TypeORM** (plutôt que `synchronize`) garantissent un schéma de base
versionné et rejouable. La configuration passe exclusivement par variables d'environnement,
validées au démarrage par **Joi** pour échouer tôt en cas d'oubli.

## Prérequis

- Node.js 22+ (pour les migrations et le dev)
- Docker et Docker Compose

## Variables d'environnement

Copier `api/.env.example` vers `api/.env` et renseigner les valeurs. Validation Joi au boot.

| Variable | Obligatoire | Défaut | Rôle |
|---|---|---|---|
| `NODE_ENV` | non | `development` | `development` / `production` / `test` |
| `PORT` | non | `3001` | Port d'écoute de l'API |
| `JWT_SECRET` | **oui** | — | Signature des access tokens |
| `JWT_REFRESH_SECRET` | non | = `JWT_SECRET` | Signature des refresh tokens |
| `CORS_ORIGIN` | non | `http://localhost:4200` | Origines autorisées (séparées par des virgules) |
| `APP_PUBLIC_URL` | non | — | URL publique de l'API pour le callback Kie |
| `KIE_API_KEY` | non | — | Clé API Kie.ai (génération musique) |
| `KIE_WEBHOOK_SECRET` | non | — | Secret inclus dans le path du webhook Kie |
| `MISTRAL_API_KEY` | non | — | Clé Mistral (fiche + paroles) |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | non | `localhost` / `5432` / `user` / `password` / `musicdb` | Connexion PostgreSQL |
| `MINIO_ENDPOINT` / `MINIO_PORT` / `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` / `MINIO_BUCKET` / `MINIO_PUBLIC_URL` | non | `localhost` / `9000` / `minioadmin` / `minioadmin` / `music` / `http://localhost:9000` | Connexion MinIO |

> Bien que la plupart soient optionnelles pour démarrer, les fonctionnalités correspondantes
> (génération, stockage audio) exigent les clés externes et MinIO opérationnels.

## Déploiement

### Infrastructure seule (dev local)

```bash
docker compose -f docker/docker-compose.yml up -d       # PostgreSQL + MinIO
npm run migration:run -w api
npm run dev:api
npm run dev:client
```

### Stack complète (démo / recette)

```bash
docker compose -f docker/docker-compose.yml --profile full up --build
```

Le service `client` (nginx) sert la SPA sur le port **4200** et proxifie `/api` vers l'API
(port **3001**). En production, `NODE_ENV=production` déclenche l'exécution automatique des
migrations au démarrage de l'API (`migrationsRun`). Les politiques `restart: unless-stopped`
relancent PostgreSQL, MinIO et l'API après un redémarrage de la machine.

## Migrations

```bash
npm run migration:run -w api        # applique les migrations en attente
npm run migration:revert -w api     # annule la dernière migration
```

En développement, on lance les migrations manuellement. En production (`NODE_ENV=production`),
elles s'exécutent au boot de l'API.

## Vérification

- Healthcheck : `curl http://localhost:3001/api/health` → `{ "status": "ok", ... }` (vérifie la
  connexion TypeORM).
- Swagger : `http://localhost:3001/docs`.

## Exposition du webhook Kie

Kie.ai doit pouvoir joindre l'API depuis Internet pour livrer l'audio généré. En local, exposer
l'API via un tunnel (ex. ngrok) et renseigner l'URL publique dans `APP_PUBLIC_URL` :

```bash
ngrok http 3001
# APP_PUBLIC_URL=https://<sous-domaine>.ngrok-free.app
```

Le callback envoyé à Kie est alors `${APP_PUBLIC_URL}/api/music/webhook/kie/${KIE_WEBHOOK_SECRET}`.
Si une génération reste bloquée (webhook perdu), l'endpoint `POST /api/music/:id/sync` récupère
le résultat auprès de Kie.

## Exploitation en production

Ces mesures sont d'ordre infrastructure : elles se configurent au niveau de l'hébergement et du
reverse proxy, hors code applicatif.

### TLS 1.3
La terminaison TLS se fait sur le reverse proxy (nginx ou Traefik) devant l'API et le client :
TLS 1.3 imposé, redirection HTTP→HTTPS, HSTS activé. L'API n'expose jamais de HTTP nu en production
(elle écoute en interne, joignable uniquement via le proxy).

### Chiffrement au repos
- **PostgreSQL** : chiffrement du volume/disque côté hébergeur (LUKS ou chiffrement managé du
  fournisseur cloud).
- **MinIO / S3** : chiffrement côté serveur (SSE-S3 ou SSE-KMS) activé sur le bucket audio.

### Sauvegardes
- `pg_dump` quotidien chiffré, conservé hors site ; versioning activé sur le bucket objet.
- RPO cible < 24 h.
- **Restauration testée** : restaurer le dump dans une base neuve → `npm run migration:run -w api`
  → vérifier `GET /api/health` → recâbler le bucket (ou restaurer sa version). La procédure doit
  être rejouée périodiquement pour garantir sa validité.

### Plan de reprise d'activité (PRA sommaire)
Ordre de reconstruction après incident majeur :
1. Provisionner l'infrastructure (`docker compose up -d postgres minio`).
2. Restaurer la base PostgreSQL depuis le dernier dump, puis appliquer les migrations.
3. Restaurer le bucket objet (audio) depuis la sauvegarde/versioning.
4. Redémarrer l'API puis le client (`--profile full`), vérifier `/api/health` et un parcours de
   lecture.
