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
| `S3_ENDPOINT` / `S3_PORT` / `S3_USE_SSL` / `S3_REGION` / `S3_PATH_STYLE` | non | `localhost` / `9000` / `false` / `us-east-1` / `true` | Endpoint du stockage objet S3 (MinIO en local, OVH Object Storage en prod) |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` / `S3_BUCKET` / `S3_PUBLIC_URL` | non | `minioadmin` / `minioadmin` / `music` / `http://localhost:9000` | Credentials, bucket et URL publique du stockage objet |

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

## Déploiement OVH (production)

### Architecture cible

```
Internet
   │
Caddy (:443, TLS automatique Let's Encrypt)
   ├── <domaine>          → conteneur client (nginx, SPA Angular)
   └── <domaine>/api/*    → conteneur api (NestJS :3001)

Réseau Docker interne (jamais exposé) : postgres, api, client
Stockage audio : OVH Object Storage (S3, région GRA) — URLs présignées générées directement dessus
```

Front et API sur la **même origine** : aucun problème CORS. Seul Caddy publie les ports 80/443 ;
PostgreSQL et l'API ne sont joignables que sur le réseau Docker interne.

**MinIO n'existe plus en production** : il ne sert qu'au développement local. Le code est identique
des deux côtés (même API S3), seule la configuration `S3_*` change — c'est la parité dev/prod.

### Prérequis

- Un VPS OVH (Ubuntu 24.04) sécurisé : utilisateur `deploy`, SSH par clé uniquement, UFW
  autorisant seulement 22/80/443, `fail2ban` et `unattended-upgrades` installés.
- Docker et Docker Compose installés sur le VPS.
- Un nom de domaine dont l'enregistrement DNS `A` pointe vers l'IP du VPS.
- Un bucket **OVH Object Storage** (région GRA) avec le **versioning activé** et un utilisateur S3
  dédié (droits limités à ce bucket, jamais les clés admin du projet).

### Fichiers de production

| Fichier | Rôle |
|---|---|
| `docker/docker-compose.prod.yml` | Stack de production : `postgres`, `api`, `client`, `caddy` (pas de MinIO) |
| `docker/Caddyfile` | Reverse proxy + TLS automatique ; `{$DOMAIN}` est lu depuis l'environnement |
| `docker/.env.prod.example` | Modèle de configuration à copier en `docker/.env.prod` (git-ignoré) |

### Déploiement

```bash
ssh deploy@IP_VPS
git clone https://github.com/ramenard/study-tune.git && cd study-tune
cp docker/.env.prod.example docker/.env.prod
nano docker/.env.prod        # domaine, secrets, credentials S3 OVH, clés Mistral/Kie
docker compose -f docker/docker-compose.prod.yml up -d --build
```

Les secrets forts se génèrent avec `openssl rand -base64 48` (`JWT_SECRET`, `JWT_REFRESH_SECRET`,
`KIE_WEBHOOK_SECRET`, mot de passe PostgreSQL).

En production `NODE_ENV=production`, donc les **migrations s'appliquent automatiquement au
démarrage** de l'API. Pour les lancer manuellement :

```bash
docker compose -f docker/docker-compose.prod.yml exec api npm run migration:run
```

### Vérifications

```bash
curl -s https://<domaine>/api/health          # { "status": "ok", ... }
curl -s -o /dev/null -w "%{http_code}\n" https://<domaine>/docs   # 404 attendu en production
docker compose -f docker/docker-compose.prod.yml logs -f api
```

- La SPA se charge sur `https://<domaine>` avec un certificat TLS valide.
- Le webhook Kie arrive directement sur
  `https://<domaine>/api/music/webhook/kie/<KIE_WEBHOOK_SECRET>` — **plus besoin de ngrok**.
- La lecture audio passe par des URLs présignées pointant sur `https://s3.gra.io.cloud.ovh.net/...`.
  En cas de `SignatureDoesNotMatch` ou `AuthorizationHeaderMalformed`, vérifier `S3_REGION=gra` et
  `S3_PATH_STYLE` — ce sont les deux seuls réglages sensibles avec l'endpoint OVH.

### Swagger et CSP en production

`/docs` n'est monté que hors production (`NODE_ENV !== 'production'`). En contrepartie, la
Content-Security-Policy de Helmet — désactivée en développement car elle casse l'interface
Swagger — est **active en production**.

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
